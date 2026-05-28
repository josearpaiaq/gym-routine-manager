"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Camera, ImageOff, ImageUp, PlayCircle, Upload } from "lucide-react";
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

const dropzoneClass =
  "flex flex-col items-center justify-center w-full h-52 rounded-2xl border-2 border-dashed border-border bg-card cursor-pointer hover:border-indigo-500 hover:bg-card-hover transition-colors";

export default function AnalyzeForm() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [notAMachine, setNotAMachine] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMobilePicker, setShowMobilePicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setResult(null);
    setNotAMachine(false);
    setError(null);
    setShowMobilePicker(false);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  function handleReset() {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setNotAMachine(false);
    setError(null);
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
    } else if (data.isGymMachine === false) {
      setNotAMachine(true);
    } else {
      setResult(data as unknown as AnalysisResult);
    }
    setLoading(false);
  }

  const dropzoneContent = (
    <>
      <ImageUp size={36} className="mb-3 text-text-muted" />
      <span className="text-sm font-medium text-text">Toca para subir o tomar foto</span>
      <span className="text-xs text-text-muted mt-1">JPG, PNG, WEBP — máx 10 MB</span>
    </>
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-text-muted hover:text-text transition-colors">
          <ArrowLeft size={14} />
          Volver
        </Link>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Analizar máquina</h1>
        <p className="mt-2 text-text-muted">
          Sube o toma una foto y recibe ejercicios recomendados con IA
        </p>
      </div>

      {/* Gallery input (no capture) */}
      <input
        ref={fileInputRef}
        id="file-input"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />
      {/* Camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFileChange}
      />

      {!imagePreview ? (
        <>
          {/* Desktop: label links directly to file input */}
          <label htmlFor="file-input" className={`hidden md:flex ${dropzoneClass}`}>
            {dropzoneContent}
          </label>
          {/* Mobile: button opens the source picker sheet */}
          <button
            type="button"
            onClick={() => setShowMobilePicker(true)}
            className={`md:hidden ${dropzoneClass}`}
          >
            {dropzoneContent}
          </button>
        </>
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
          {/* Desktop: label triggers file input */}
          <label
            htmlFor="file-input"
            className="absolute top-3 right-3 hidden md:inline-flex rounded-full bg-card/80 px-3 py-1 text-xs font-medium hover:bg-card-hover/80 transition-colors cursor-pointer"
          >
            Cambiar imagen
          </label>
          {/* Mobile: button opens picker */}
          <button
            onClick={() => setShowMobilePicker(true)}
            className="absolute top-3 right-3 md:hidden rounded-full bg-card/80 px-3 py-1 text-xs font-medium hover:bg-card-hover/80 transition-colors"
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

      {notAMachine && (
        <div className="mt-6">
          <Card className="border-amber-800/40">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-900/30">
                <ImageOff size={24} className="text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-amber-300">No es una máquina de gym</p>
                <p className="text-sm text-text-muted mt-1">
                  La imagen no parece ser una máquina de ejercicio. Intenta con una foto más
                  clara o desde otro ángulo.
                </p>
              </div>
              <Button onClick={handleReset} variant="secondary" className="mt-1">
                Intentar con otra imagen
              </Button>
            </CardContent>
          </Card>
        </div>
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
            <h3 className="text-xs uppercase tracking-widest text-text-muted font-semibold px-1">
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
                      <h4 className="font-semibold text-text leading-tight">{ex.name}</h4>
                      <p className="text-xs text-indigo-300 mt-0.5">{ex.targetMuscles}</p>
                    </div>
                  </div>
                  <ol className="pl-10 space-y-1.5 list-none">
                    {ex.execution.map((step, j) => (
                      <li key={j} className="flex gap-2 text-sm text-text leading-relaxed">
                        <span className="shrink-0 font-medium text-indigo-400">{j + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + " tutorial gym")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 pl-10 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                  >
                    <PlayCircle size={14} />
                    Ver tutorial en YouTube
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

      {/* Mobile source picker — bottom sheet */}
      {showMobilePicker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={() => setShowMobilePicker(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl bg-card p-6 pb-10 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-sm font-medium text-text-muted mb-4">
              ¿Cómo quieres agregar la imagen?
            </p>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-4 w-full rounded-xl bg-card-hover px-5 py-4 text-left hover:bg-card-hover/80 transition-colors"
            >
              <Camera size={22} className="text-indigo-400 shrink-0" />
              <div>
                <p className="font-semibold text-text">Tomar foto</p>
                <p className="text-xs text-text-muted">Abre la cámara del dispositivo</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-4 w-full rounded-xl bg-card-hover px-5 py-4 text-left hover:bg-card-hover/80 transition-colors"
            >
              <Upload size={22} className="text-indigo-400 shrink-0" />
              <div>
                <p className="font-semibold text-text">Subir imagen</p>
                <p className="text-xs text-text-muted">Elige desde tu galería o archivos</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setShowMobilePicker(false)}
              className="w-full mt-2 py-3 text-sm text-text-muted hover:text-text transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
