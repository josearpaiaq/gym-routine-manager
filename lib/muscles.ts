export const MUSCLE_GROUPS = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Antebrazos",
  "Abdominales",
  "Oblicuos",
  "Cuádriceps",
  "Isquiotibiales",
  "Glúteos",
  "Pantorrillas",
  "Trapecio",
  "Deltoides anterior",
  "Deltoides lateral",
  "Deltoides posterior",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
