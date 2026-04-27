import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import mockResponse from "@/fixtures/cable-crossover.json";

const client = new Anthropic();

interface AnalysisResult {
  machineName: string;
  muscleGroups: string[];
  exercises: Array<{ name: string; targetMuscles: string; execution: string }>;
}

const SYSTEM_PROMPT = `Eres un experto entrenador personal y especialista en equipamiento de gimnasio.
Cuando recibas una imagen de una máquina de gym, analízala y responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin bloques de código) con esta estructura exacta:

{
  "machineName": "nombre de la máquina en español",
  "muscleGroups": ["músculo1", "músculo2", "músculo3"],
  "exercises": [
    {
      "name": "nombre del ejercicio",
      "targetMuscles": "músculos principales que trabaja",
      "execution": "descripción paso a paso de cómo ejecutar correctamente el ejercicio"
    }
  ]
}

Incluye entre 3 y 4 ejercicios. Si la imagen no muestra claramente una máquina de gimnasio, usa "machineName": "No identificada" y explica en el primer ejercicio.`;

const NAME_ONLY_PROMPT = `Eres un experto en equipamiento de gimnasio.
Observa la imagen y responde ÚNICAMENTE con un objeto JSON (sin markdown):
{"machineName": "nombre exacto de la máquina en español"}
Si no reconoces ninguna máquina, usa {"machineName": "No identificada"}.`;

const CACHE_PATH = path.join(process.cwd(), "cache", "machine-responses.json");

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function readCache(): Record<string, AnalysisResult> {
  try {
    if (!fs.existsSync(CACHE_PATH)) return {};
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8")) as Record<string, AnalysisResult>;
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, AnalysisResult>): void {
  const dir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
}

function stripFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

export async function POST(request: NextRequest) {
  if (process.env.MOCK_ANALYZE === "true") {
    return NextResponse.json(mockResponse);
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

    // Cache check
    const cache = readCache();
    if (cache[normalizedKey]) {
      return NextResponse.json(cache[normalizedKey]);
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

    let parsed: AnalysisResult;
    try {
      parsed = JSON.parse(stripFences(textBlock.text)) as AnalysisResult;
    } catch {
      return NextResponse.json({ error: "No se pudo procesar la respuesta del servidor" }, { status: 500 });
    }

    cache[normalizedKey] = parsed;
    writeCache(cache);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[analyze]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
