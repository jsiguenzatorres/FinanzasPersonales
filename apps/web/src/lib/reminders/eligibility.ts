export type ReminderTrigger = 'preventive_3d' | 'preventive_2d' | 'overdue';

const OVERDUE_REPEAT_DAYS = 5;

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso + 'T00:00:00Z').getTime();
  const to = new Date(toIso + 'T00:00:00Z').getTime();
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

/**
 * Decide si hoy corresponde enviar un recordatorio para un préstamo, y de qué
 * tipo — ver docs/modules/feature-recordatorios-cobro.md §4. `pastTriggers`
 * son los disparos ya registrados en `notifications` para este préstamo
 * (trigger + fecha en que se creó la notificación, 'YYYY-MM-DD').
 */
export function getEligibleTrigger(
  dueDate: string,
  today: string,
  pastTriggers: Array<{ trigger: ReminderTrigger; sentOn: string }>,
): ReminderTrigger | null {
  const daysUntil = daysBetween(today, dueDate);

  const alreadySentToday = (trigger: ReminderTrigger) =>
    pastTriggers.some((p) => p.trigger === trigger && p.sentOn === today);

  if (daysUntil === 3 && !alreadySentToday('preventive_3d')) return 'preventive_3d';
  if (daysUntil === 2 && !alreadySentToday('preventive_2d')) return 'preventive_2d';

  if (daysUntil <= 0) {
    const lastOverdue = pastTriggers
      .filter((p) => p.trigger === 'overdue')
      .sort((a, b) => (a.sentOn < b.sentOn ? 1 : -1))[0];

    if (!lastOverdue) return 'overdue';
    if (daysBetween(lastOverdue.sentOn, today) >= OVERDUE_REPEAT_DAYS) return 'overdue';
  }

  return null;
}
