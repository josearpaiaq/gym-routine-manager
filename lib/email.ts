import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  await resend.emails.send({
    from: "Gym Manager <onboarding@gym-manager.lat/>",
    to: email,
    subject: "Tu código de verificación",
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px">
        <h2 style="margin:0 0 8px">Verifica tu cuenta</h2>
        <p style="color:#6b7280;margin:0 0 24px">Ingresa este código en la app para completar tu registro.</p>
        <div style="background:#1f2937;border-radius:12px;padding:24px;text-align:center">
          <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#fff">${code}</span>
        </div>
        <p style="color:#9ca3af;font-size:12px;margin:16px 0 0">Expira en 10 minutos. Si no creaste una cuenta, ignora este email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, code: string): Promise<void> {
  await resend.emails.send({
    from: "Gym Manager <onboarding@gym-manager.lat/>",
    to: email,
    subject: "Restablece tu contraseña",
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px">
        <h2 style="margin:0 0 8px">Restablece tu contraseña</h2>
        <p style="color:#6b7280;margin:0 0 24px">Ingresa este código en la app para crear una nueva contraseña.</p>
        <div style="background:#1f2937;border-radius:12px;padding:24px;text-align:center">
          <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#fff">${code}</span>
        </div>
        <p style="color:#9ca3af;font-size:12px;margin:16px 0 0">Expira en 10 minutos. Si no solicitaste restablecer tu contraseña, ignora este email.</p>
      </div>
    `,
  });
}
