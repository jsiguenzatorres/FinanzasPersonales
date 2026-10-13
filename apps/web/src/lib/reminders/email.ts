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

/**
 * Préstamo familiar (sin interés, sourceLabel 'préstamo') = tono cálido y
 * breve. Cuota de Mi Cartera (con interés, 'cuota') = cordial pero más
 * neutral — suele ser un préstamo más formal. Ambos lo más cortos posible.
 */
function buildSubjectAndBody(input: LoanReminderEmailInput): { subject: string; html: string } {
  const amountFmt = formatMoney(input.amount, input.currency);
  const isFamily = input.sourceLabel === 'préstamo';

  if (input.trigger === 'preventive_3d' || input.trigger === 'preventive_2d') {
    const daysLeft = input.trigger === 'preventive_3d' ? 3 : 2;

    if (isFamily) {
      return {
        subject: `${input.lenderName} te manda un recordatorio con cariño`,
        html: `
          <p>Hola ${input.personName} 💛</p>
          <p>Con cariño, un empujoncito: tienes <strong>${amountFmt}</strong> pendientes con
          <strong>${input.lenderName}</strong> — vence <strong>${input.dueDate}</strong> (en ${daysLeft} días).</p>
          <p>¡Gracias!</p>
        `,
      };
    }

    return {
      subject: `Recordatorio: cuota con ${input.lenderName} vence en ${daysLeft} días`,
      html: `
        <p>Hola ${input.personName},</p>
        <p>Tienes una cuota de <strong>${amountFmt}</strong> con <strong>${input.lenderName}</strong>,
        vence el <strong>${input.dueDate}</strong> (en ${daysLeft} días).</p>
        <p>Gracias.</p>
      `,
    };
  }

  if (isFamily) {
    return {
      subject: `${input.lenderName}: tu pago sigue pendiente`,
      html: `
        <p>Hola ${input.personName},</p>
        <p>Tu pago de <strong>${amountFmt}</strong> a <strong>${input.lenderName}</strong> venció el
        <strong>${input.dueDate}</strong>. Cuando puedas, ponte al día 🙏</p>
        <p>¿Ya pagaste? Ignora este mensaje.</p>
      `,
    };
  }

  return {
    subject: `Cuota pendiente con ${input.lenderName}`,
    html: `
      <p>Hola ${input.personName},</p>
      <p>Tu cuota de <strong>${amountFmt}</strong> con <strong>${input.lenderName}</strong> venció el
      <strong>${input.dueDate}</strong> y sigue pendiente.</p>
      <p>Te agradecemos ponerte al día. Si ya pagaste, ignora este correo.</p>
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
