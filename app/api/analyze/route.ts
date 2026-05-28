import Groq from "groq-sdk";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import mockResponse from "@/fixtures/cable-crossover.json";
import { getMachineByNormalizedName, saveMachine } from "@/services/machines";
import { getUserById } from "@/services/users";
import { getSession } from "@/lib/auth";
import { uploadImageToR2 } from "@/lib/r2";
import { normalizeName, stripFences } from "@/lib/analyze-utils";

const client = new Groq();

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const TEXT_MODEL = "llama-3.3-70b-versatile";

const NAME_ONLY_PROMPT = `Eres un experto en equipamiento de gimnasio.
Observa la imagen y responde ÚNICAMENTE con un objeto JSON (sin markdown):
{"machineName": "nombre exacto de la máquina en español", "isGymMachine": true}
Si la imagen NO muestra una máquina de ejercicio de gym, responde:
{"machineName": "No identificada", "isGymMachine": false}`;

const buildAnalysisPrompt = (machineName: string) =>
  `Eres un experto entrenador personal y especialista en equipamiento de gimnasio.
Genera información detallada sobre la máquina de gym: "${machineName}".
Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin bloques de código) con esta estructura exacta:

{
  "isGymMachine": true,
  "machineName": "${machineName}",
  "muscleGroups": ["músculo1", "músculo2", "músculo3"],
  "exercises": [
    {
      "name": "nombre del ejercicio",
      "targetMuscles": "músculos principales que trabaja",
      "execution": ["paso 1", "paso 2", "paso 3"]
    }
  ]
}

Incluye entre 3 y 4 ejercicios.`;

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
    const resized = await sharp(Buffer.from(arrayBuffer))
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const base64 = resized.toString("base64");
    const imageUrl = `data:image/jpeg;base64,${base64}`;

    // Phase 1: identify machine name via Groq Vision
    const phase1 = await client.chat.completions.create({
      model: VISION_MODEL,
      max_tokens: 100,
      messages: [
        {
          role: "system",
          content: NAME_ONLY_PROMPT,
        },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
            { type: "text", text: "¿Qué máquina de gimnasio aparece en la imagen?" },
          ],
        },
      ],
    });

    const nameText = phase1.choices[0]?.message?.content ?? "";
    let nameOnly: { machineName: string; isGymMachine: boolean };
    try {
      nameOnly = JSON.parse(stripFences(nameText)) as {
        machineName: string;
        isGymMachine: boolean;
      };
    } catch {
      console.error("[analyze] Phase 1 parse failed:", nameText);
      return NextResponse.json(
        { error: "No se pudo procesar la respuesta del servidor" },
        { status: 500 }
      );
    }

    if (!nameOnly.isGymMachine) {
      return NextResponse.json({ isGymMachine: false }, { status: 200 });
    }

    const normalizedKey = normalizeName(nameOnly.machineName);

    // Cache check — return existing analysis without re-saving image
    const cached = await getMachineByNormalizedName(normalizedKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Phase 2: full analysis via Groq LLM (text only, no image)
    const phase2 = await client.chat.completions.create({
      model: TEXT_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: buildAnalysisPrompt(nameOnly.machineName),
        },
      ],
    });

    const analysisText = phase2.choices[0]?.message?.content ?? "";
    let parsed: {
      isGymMachine: boolean;
      machineName: string;
      muscleGroups: string[];
      exercises: Array<{ name: string; targetMuscles: string; execution: string[] }>;
    };
    try {
      parsed = JSON.parse(stripFences(analysisText));
    } catch {
      return NextResponse.json(
        { error: "No se pudo procesar la respuesta del servidor" },
        { status: 500 }
      );
    }

    if (!parsed.isGymMachine) {
      return NextResponse.json({ isGymMachine: false }, { status: 200 });
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
