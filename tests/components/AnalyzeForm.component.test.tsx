// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("img", { src: props.src as string, alt: props.alt as string }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href }, children),
}));

// URL.createObjectURL is not implemented in jsdom
Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: vi.fn(() => "blob:test-url"),
});

import AnalyzeForm from "@/app/analyze/AnalyzeForm";

function makeImageFile(name = "machine.jpg"): File {
  return new File(["fake-image-data"], name, { type: "image/jpeg" });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AnalyzeForm", () => {
  it("renders the upload zone initially", () => {
    render(<AnalyzeForm />);
    expect(screen.getByText(/toca para subir/i)).toBeInTheDocument();
  });

  it("shows analyze button after image is selected", async () => {
    render(<AnalyzeForm />);
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeImageFile()] } });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /analizar máquina/i })).toBeInTheDocument();
    });
  });

  it("shows the 'not a machine' card when API returns isGymMachine: false", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ isGymMachine: false }), { status: 200 })
    );
    render(<AnalyzeForm />);
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeImageFile()] } });
    fireEvent.click(screen.getByRole("button", { name: /analizar máquina/i }));
    await waitFor(() => {
      expect(screen.getByText(/no es una máquina de gym/i)).toBeInTheDocument();
    });
  });

  it("shows result card when API returns a valid machine", async () => {
    const mockResult = {
      isGymMachine: true,
      machineName: "Cable Crossover",
      muscleGroups: ["Pecho"],
      exercises: [
        {
          name: "Cruce de cables",
          targetMuscles: "Pecho mayor",
          execution: ["Paso 1", "Paso 2"],
        },
      ],
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockResult), { status: 200 })
    );
    render(<AnalyzeForm />);
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeImageFile()] } });
    fireEvent.click(screen.getByRole("button", { name: /analizar máquina/i }));
    await waitFor(() => {
      expect(screen.getByText("Cable Crossover")).toBeInTheDocument();
      expect(screen.getByText("Cruce de cables")).toBeInTheDocument();
    });
  });

  it("shows error alert on non-ok API response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Error al analizar la imagen" }), { status: 500 })
    );
    render(<AnalyzeForm />);
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeImageFile()] } });
    fireEvent.click(screen.getByRole("button", { name: /analizar máquina/i }));
    await waitFor(() => {
      expect(screen.getByText(/error al analizar la imagen/i)).toBeInTheDocument();
    });
  });

  it("resets to initial state when 'Limpiar' is clicked", async () => {
    render(<AnalyzeForm />);
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeImageFile()] } });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /limpiar/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /limpiar/i }));
    await waitFor(() => {
      expect(screen.getByText(/toca para subir/i)).toBeInTheDocument();
    });
  });
});
