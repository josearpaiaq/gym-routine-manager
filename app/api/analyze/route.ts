import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import mockResponse from "@/fixtures/cable-crossover.json";
import { getMachineByNormalizedName, saveMachine, getUserById } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { uploadImageToR2 } from "@/lib/r2";

const client = new Anthropic();

const SYSTEM_PROMPT = `Eres un experto entrenador personal y especialista en equipamiento de gimnasio.
Cuando recibas una imagen de una máquina de gym, analízala y responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin bloques de código) con esta estructura exacta:

{
  "machineName": "nombre de la máquina en español",
  "muscleGroups": ["músculo1", "músculo2", "músculo3"],
  "exercises": [
    {
      "name": "nombre del ejercicio",
      "targetMuscles": "músculos principales que trabaja",
      "execution": ["paso 1", "paso 2", "paso 3"]
    }
  ]
}

Incluye entre 3 y 4 ejercicios. Si la imagen no muestra claramente una máquina de gimnasio, usa "machineName": "No identificada" y explica en el primer ejercicio.`;

const NAME_ONLY_PROMPT = `Eres un experto en equipamiento de gimnasio.
Observa la imagen y responde ÚNICAMENTE con un objeto JSON (sin markdown):
{"machineName": "nombre exacto de la máquina en español"}
Si no reconoces ninguna máquina, usa {"machineName": "No identificada"}.`;

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}


export async function POST(request: NextRequest) {
  if (process.env.MOCK_ANALYZE === "true") {
    return NextResponse.json(mockResponse);
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const user = await getUserById(session.userId);
  if (!user || !user.analyzerEnabled) {
    return NextResponse.json({ error: "Función no habilitada para tu cuenta" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "No se recibió ninguna imagen" }, { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const ext = imageFile.name.split(".").pop()?.toLowerCase() ?? "jpeg";
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    const mediaType = (mimeMap[ext] ?? imageFile.type ?? "image/jpeg") as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";

    const imageContent = [
      { type: "image" as const, source: { type: "base64" as const, media_type: mediaType, data: base64 } },
    ];

    // Phase 1: identify machine name only (cheap call)
    const phase1 = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 50,
      system: NAME_ONLY_PROMPT,
      messages: [{
        role: "user",
        content: [
          ...imageContent,
          { type: "text", text: "¿Qué máquina de gimnasio aparece en la imagen?" },
        ],
      }],
    });

    const nameBlock = phase1.content.find((b) => b.type === "text");
    if (!nameBlock || nameBlock.type !== "text") {
      return NextResponse.json({ error: "Sin respuesta del modelo" }, { status: 500 });
    }

    let nameOnly: { machineName: string };
    try {
      nameOnly = JSON.parse(stripFences(nameBlock.text)) as { machineName: string };
    } catch {
      console.error("[analyze] Phase 1 parse failed:", nameBlock.text);
      return NextResponse.json({ error: "No se pudo procesar la respuesta del servidor" }, { status: 500 });
    }

    const normalizedKey = normalizeName(nameOnly.machineName);

    // Cache check — return existing analysis without re-saving image
    const cached = await getMachineByNormalizedName(normalizedKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Phase 2: full analysis (cache miss only)
    const phase2 = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: [
          ...imageContent,
          { type: "text", text: "Analiza esta máquina de gimnasio y devuelve la información en el formato JSON indicado." },
        ],
      }],
    });

    const textBlock = phase2.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Sin respuesta del modelo" }, { status: 500 });
    }

    let parsed: { machineName: string; muscleGroups: string[]; exercises: Array<{ name: string; targetMuscles: string; execution: string[] }> };
    try {
      parsed = JSON.parse(stripFences(textBlock.text));
    } catch {
      return NextResponse.json({ error: "No se pudo procesar la respuesta del servidor" }, { status: 500 });
    }

    // Upload image to R2 and persist machine with public URL
    const imagePath = await uploadImageToR2(imageFile, normalizedKey);
    await saveMachine(normalizedKey, parsed, imagePath);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[analyze]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
