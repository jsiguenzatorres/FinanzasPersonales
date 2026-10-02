import { Resend } from 'resend';

export type ReminderTrigger = 'preventive_3d' | 'preventive_2d' | 'overdue';

export interface LoanReminderEmailInput {
  to: string;
  bcc: string;
  lenderName: string;
  personName: string;
  amount: number;
  currency: string;
  dueDate: string;
  trigger: ReminderTrigger;
  sourceLabel: 'préstamo' | 'cuota';
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-SV', { style: 'currency', currency }).format(amount);
}

function buildSubjectAndBody(input: LoanReminderEmailInput): { subject: string; html: string } {
  const amountFmt = formatMoney(input.amount, input.currency);

  if (input.trigger === 'preventive_3d' || input.trigger === 'preventive_2d') {
    const daysLeft = input.trigger === 'preventive_3d' ? 3 : 2;
    return {
      subject: `Recordatorio: tu pago a ${input.lenderName} vence en ${daysLeft} días`,
      html: `
        <p>Hola ${input.personName},</p>
        <p>Este es un recordatorio amistoso de que tienes un ${input.sourceLabel} con
        <strong>${input.lenderName}</strong> por <strong>${amountFmt}</strong>, con fecha de pago
        el <strong>${input.dueDate}</strong> (en ${daysLeft} días).</p>
        <p>¡Gracias por tu atención!</p>
      `,
    };
  }

  return {
    subject: `Pago pendiente con ${input.lenderName}`,
    html: `
      <p>Hola ${input.personName},</p>
      <p>Tu ${input.sourceLabel} con <strong>${input.lenderName}</strong> por
      <strong>${amountFmt}</strong> venció el <strong>${input.dueDate}</strong> y sigue pendiente
      de pago.</p>
      <p>Te agradecemos ponerte al día cuando puedas. Si ya pagaste, puedes ignorar este correo.</p>
    `,
  };
}

/** Envía el recordatorio vía Resend. Devuelve null si falló (y por qué). */
export async function sendLoanReminderEmail(
  input: LoanReminderEmailInput,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || apiKey === 're_placeholder' || !from) {
    return { ok: false, reason: 'RESEND_API_KEY/EMAIL_FROM no configurados' };
  }

  const { subject, html } = buildSubjectAndBody(input);
  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      bcc: input.bcc,
      subject,
      html,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'Error desconocido' };
  }
}
