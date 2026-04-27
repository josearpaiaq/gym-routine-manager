import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import mockResponse from "../.././../fixtures/cable-crossover.json";

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
      "execution": "descripción paso a paso de cómo ejecutar correctamente el ejercicio"
    }
  ]
}

Incluye entre 3 y 4 ejercicios. Si la imagen no muestra claramente una máquina de gimnasio, usa "machineName": "No identificada" y explica en el primer ejercicio.`;

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

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: "Analiza esta máquina de gimnasio y devuelve la información en el formato JSON indicado.",
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Sin respuesta del modelo" }, { status: 500 });
    }

    const raw = textBlock.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "No se pudo procesar la respuesta del servidor" }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[analyze]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
