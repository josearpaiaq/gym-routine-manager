// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ChangePasswordForm from "@/app/(main)/profile/ChangePasswordForm";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ChangePasswordForm", () => {
  it("renders all three password fields and submit button", () => {
    render(<ChangePasswordForm />);
    expect(screen.getByLabelText("Contraseña actual")).toBeInTheDocument();
    expect(screen.getByLabelText("Nueva contraseña")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar nueva contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cambiar contraseña/i })).toBeInTheDocument();
  });

  it("shows error when new passwords don't match", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);
    await user.type(screen.getByLabelText("Contraseña actual"), "oldpass123");
    await user.type(screen.getByLabelText("Nueva contraseña"), "newpass123");
    await user.type(screen.getByLabelText("Confirmar nueva contraseña"), "different123");
    fireEvent.submit(screen.getByRole("button", { name: /cambiar contraseña/i }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByText(/no coinciden/i)).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows success message on successful password change", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    render(<ChangePasswordForm />);
    await user.type(screen.getByLabelText("Contraseña actual"), "oldpass123");
    await user.type(screen.getByLabelText("Nueva contraseña"), "newpass123");
    await user.type(screen.getByLabelText("Confirmar nueva contraseña"), "newpass123");
    fireEvent.submit(screen.getByRole("button", { name: /cambiar contraseña/i }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByText(/actualizada correctamente/i)).toBeInTheDocument();
    });
  });

  it("shows API error message on failed request", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "La contraseña actual es incorrecta" }), { status: 401 })
    );
    render(<ChangePasswordForm />);
    await user.type(screen.getByLabelText("Contraseña actual"), "wrongpass");
    await user.type(screen.getByLabelText("Nueva contraseña"), "newpass123");
    await user.type(screen.getByLabelText("Confirmar nueva contraseña"), "newpass123");
    fireEvent.submit(screen.getByRole("button", { name: /cambiar contraseña/i }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByText(/contraseña actual es incorrecta/i)).toBeInTheDocument();
    });
  });

  it("clears fields after successful change", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    render(<ChangePasswordForm />);
    const currentField = screen.getByLabelText("Contraseña actual") as HTMLInputElement;
    await user.type(currentField, "oldpass123");
    await user.type(screen.getByLabelText("Nueva contraseña"), "newpass123");
    await user.type(screen.getByLabelText("Confirmar nueva contraseña"), "newpass123");
    fireEvent.submit(screen.getByRole("button", { name: /cambiar contraseña/i }).closest("form")!);
    await waitFor(() => {
      expect(currentField.value).toBe("");
    });
  });
});
