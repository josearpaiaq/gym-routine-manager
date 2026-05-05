"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Exercise {
  name: string;
  targetMuscles: string;
  execution: string[];
}

interface AnalysisResult {
  machineName: string;
  muscleGroups: string[];
  exercises: Exercise[];
}

export default function AnalyzeForm() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setResult(null);
    setError(null);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleReset() {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAnalyze() {
    if (!imageFile) return;
    let data: Record<string, unknown>;
    let res: Response;
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const formData = new FormData();
      formData.append("image", imageFile);
      res = await fetch("/api/analyze", { method: "POST", body: formData });
      data = await res.json();
    } catch (error) {
      console.error(error);
      setError("Error del servidor — respuesta inválida");
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setError((data.error as string) ?? "Error al analizar la imagen");
    } else {
      setResult(data as unknown as AnalysisResult);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="mb-6">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-300 px-0"
          >
            <Link href="/">← Volver</Link>
          </Button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Analizar máquina</h1>
          <p className="mt-2 text-gray-400">
            Sube o toma una foto y recibe ejercicios recomendados con IA
          </p>
        </div>

        <input
          id="image-upload"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleFileChange}
        />

        {!imagePreview ? (
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center w-full h-52 rounded-2xl border-2 border-dashed border-gray-600 bg-gray-900 cursor-pointer hover:border-indigo-500 hover:bg-gray-800 transition-colors"
          >
            <span className="text-4xl mb-3">📷</span>
            <span className="text-sm font-medium text-gray-300">Toca para subir o tomar foto</span>
            <span className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP — máx 10 MB</span>
          </label>
        ) : (
          <div className="relative rounded-2xl overflow-hidden">
            <Image
              src={imagePreview}
              alt="Máquina seleccionada"
              width={500}
              height={300}
              className="w-full object-cover max-h-72"
              unoptimized
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute top-3 right-3 rounded-full bg-gray-900/80 px-3 py-1 text-xs font-medium hover:bg-gray-700 transition-colors"
            >
              Cambiar imagen
            </button>
          </div>
        )}

        {imagePreview && !result && (
          <div className="mt-4 flex gap-3">
            <Button onClick={handleAnalyze} disabled={loading} className="flex-1" size="lg">
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analizando...
                </>
              ) : (
                "Analizar máquina"
              )}
            </Button>
            <Button onClick={handleReset} variant="secondary" size="lg">
              Limpiar
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="mt-6 space-y-5">
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-1">
                  Máquina identificada
                </p>
                <h2 className="text-2xl font-bold">{result.machineName}</h2>
                {result.muscleGroups?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.muscleGroups.map((muscle) => (
                      <Badge key={muscle}>{muscle}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-widest text-gray-400 font-semibold px-1">
                Ejercicios recomendados
              </h3>
              {result.exercises.map((ex, i) => (
                <Card key={i}>
                  <CardContent className="pt-5 space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white leading-tight">{ex.name}</h4>
                        <p className="text-xs text-indigo-300 mt-0.5">{ex.targetMuscles}</p>
                      </div>
                    </div>
                    <ol className="pl-10 space-y-1.5 list-none">
                      {ex.execution.map((step, j) => (
                        <li key={j} className="flex gap-2 text-sm text-gray-300 leading-relaxed">
                          <span className="shrink-0 font-medium text-indigo-400">{j + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + " tutorial gym")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 pl-10 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <span aria-hidden="true">▶</span>
                      Ver tutorial
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button onClick={handleReset} variant="secondary" className="w-full">
              Analizar otra máquina
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
