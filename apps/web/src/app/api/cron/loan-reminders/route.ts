import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getEligibleTrigger, type ReminderTrigger } from '@/lib/reminders/eligibility';
import { sendLoanReminderEmail } from '@/lib/reminders/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface ReminderCandidate {
  relatedEntityId: string;
  relatedEntityType: 'family_loan' | 'loan_portfolio';
  userId: string;
  personName: string;
  personEmail: string;
  dueDate: string;
  amount: number;
  currency: string;
  sourceLabel: 'préstamo' | 'cuota';
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function collectFamilyLoanCandidates(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
): Promise<ReminderCandidate[]> {
  const { data } = await supabase
    .from('family_loans')
    .select('id, user_id, person_name, person_email, agreed_payment_date, balance, currency')
    .eq('status', 'active')
    .not('person_email', 'is', null)
    .not('agreed_payment_date', 'is', null);

  return (data ?? []).map((loan) => ({
    relatedEntityId: loan.id,
    relatedEntityType: 'family_loan' as const,
    userId: loan.user_id,
    personName: loan.person_name,
    personEmail: loan.person_email!,
    dueDate: loan.agreed_payment_date!,
    amount: loan.balance,
    currency: loan.currency,
    sourceLabel: 'préstamo' as const,
  }));
}

async function collectLoanPortfolioCandidates(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
): Promise<ReminderCandidate[]> {
  const { data: loans } = await supabase
    .from('loan_portfolio')
    .select('id, user_id, borrower_name, borrower_email, amortization')
    .eq('status', 'active')
    .is('deleted_at', null)
    .not('borrower_email', 'is', null);

  if (!loans || loans.length === 0) return [];

  const { data: payments } = await supabase
    .from('loan_payments')
    .select('loan_id')
    .in(
      'loan_id',
      loans.map((l) => l.id),
    );

  const paidCountByLoan = new Map<string, number>();
  for (const p of payments ?? []) {
    paidCountByLoan.set(p.loan_id, (paidCountByLoan.get(p.loan_id) ?? 0) + 1);
  }

  const candidates: ReminderCandidate[] = [];
  for (const loan of loans) {
    const schedule =
      (loan.amortization as unknown as Array<{ scheduled_date: string; payment: number }>) ?? [];
    const nextInstallment = schedule[paidCountByLoan.get(loan.id) ?? 0];
    if (!nextInstallment) continue;

    candidates.push({
      relatedEntityId: loan.id,
      relatedEntityType: 'loan_portfolio',
      userId: loan.user_id,
      personName: loan.borrower_name,
      personEmail: loan.borrower_email!,
      dueDate: nextInstallment.scheduled_date,
      amount: nextInstallment.payment,
      currency: 'USD',
      sourceLabel: 'cuota',
    });
  }
  return candidates;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const today = todayIso();

  const [familyLoanCandidates, loanPortfolioCandidates] = await Promise.all([
    collectFamilyLoanCandidates(supabase),
    collectLoanPortfolioCandidates(supabase),
  ]);
  const candidates = [...familyLoanCandidates, ...loanPortfolioCandidates];

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const { data: pastNotifications } = await supabase
      .from('notifications')
      .select('metadata, created_at')
      .eq('related_entity_id', candidate.relatedEntityId)
      .eq('related_entity_type', candidate.relatedEntityType)
      .eq('kind', 'loan_overdue');

    const pastTriggers = (pastNotifications ?? [])
      .map((n) => {
        const meta = n.metadata as { trigger?: ReminderTrigger } | null;
        return meta?.trigger ? { trigger: meta.trigger, sentOn: n.created_at.slice(0, 10) } : null;
      })
      .filter((t): t is { trigger: ReminderTrigger; sentOn: string } => !!t);

    const trigger = getEligibleTrigger(candidate.dueDate, today, pastTriggers);
    if (!trigger) {
      skipped++;
      continue;
    }

    const { data: owner } = await supabase
      .from('users')
      .select('email, display_name')
      .eq('id', candidate.userId)
      .single();

    if (!owner) {
      skipped++;
      continue;
    }

    const title =
      trigger === 'overdue'
        ? `Recordatorio enviado a ${candidate.personName}: ${candidate.sourceLabel} vencido`
        : `Recordatorio preventivo enviado a ${candidate.personName}`;

    const { data: notification } = await supabase
      .from('notifications')
      .insert({
        user_id: candidate.userId,
        channel: 'email',
        kind: 'loan_overdue',
        severity: trigger === 'overdue' ? 'warning' : 'info',
        status: 'pending',
        title,
        body: `${candidate.sourceLabel} por ${candidate.amount} ${candidate.currency}, vence ${candidate.dueDate}.`,
        related_entity_id: candidate.relatedEntityId,
        related_entity_type: candidate.relatedEntityType,
        scheduled_for: new Date().toISOString(),
        metadata: { trigger },
      })
      .select('id')
      .single();

    if (!notification) {
      failed++;
      continue;
    }

    const result = await sendLoanReminderEmail({
      to: candidate.personEmail,
      bcc: owner.email,
      lenderName: owner.display_name,
      personName: candidate.personName,
      amount: candidate.amount,
      currency: candidate.currency,
      dueDate: candidate.dueDate,
      trigger,
      sourceLabel: candidate.sourceLabel,
    });

    if (result.ok) {
      await supabase
        .from('notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', notification.id);
      sent++;
    } else {
      await supabase
        .from('notifications')
        .update({ status: 'failed', failed_reason: result.reason })
        .eq('id', notification.id);
      failed++;
    }
  }

  return NextResponse.json({ evaluated: candidates.length, sent, failed, skipped });
}
