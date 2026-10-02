import { describe, expect, it } from 'vitest';
import { getEligibleTrigger } from './eligibility';

describe('getEligibleTrigger', () => {
  it('returns preventive_3d exactly 3 days before the due date', () => {
    expect(getEligibleTrigger('2026-10-10', '2026-10-07', [])).toBe('preventive_3d');
  });

  it('returns preventive_2d exactly 2 days before the due date', () => {
    expect(getEligibleTrigger('2026-10-10', '2026-10-08', [])).toBe('preventive_2d');
  });

  it('returns null outside the preventive window and before the due date', () => {
    expect(getEligibleTrigger('2026-10-10', '2026-10-05', [])).toBeNull();
    expect(getEligibleTrigger('2026-10-10', '2026-10-09', [])).toBeNull();
  });

  it('does not resend a preventive trigger already sent today', () => {
    expect(
      getEligibleTrigger('2026-10-10', '2026-10-07', [{ trigger: 'preventive_3d', sentOn: '2026-10-07' }]),
    ).toBeNull();
  });

  it('returns overdue on the due date itself and while still unpaid', () => {
    expect(getEligibleTrigger('2026-10-10', '2026-10-10', [])).toBe('overdue');
    expect(getEligibleTrigger('2026-10-10', '2026-10-15', [])).toBe('overdue');
  });

  it('does not repeat overdue before 5 days have passed since the last one', () => {
    expect(
      getEligibleTrigger('2026-10-10', '2026-10-13', [{ trigger: 'overdue', sentOn: '2026-10-10' }]),
    ).toBeNull();
  });

  it('repeats overdue once 5 days have passed since the last one', () => {
    expect(
      getEligibleTrigger('2026-10-10', '2026-10-15', [{ trigger: 'overdue', sentOn: '2026-10-10' }]),
    ).toBe('overdue');
  });

  it('picks the most recent overdue trigger when there are several', () => {
    // La última fue el 16; del 16 al 21 pasaron exactos 5 días, así que toca de nuevo
    // (si tomara la más antigua, el 10, también cumpliría — la prueba real está abajo).
    expect(
      getEligibleTrigger('2026-10-10', '2026-10-21', [
        { trigger: 'overdue', sentOn: '2026-10-10' },
        { trigger: 'overdue', sentOn: '2026-10-16' },
      ]),
    ).toBe('overdue');
  });

  it('uses the most recent overdue date, not the oldest, to gate the next send', () => {
    // Del 16 al 20 solo pasaron 4 días — no debe reenviar, aunque la primera
    // notificación (el 10) ya tenga más de 5 días.
    expect(
      getEligibleTrigger('2026-10-10', '2026-10-20', [
        { trigger: 'overdue', sentOn: '2026-10-10' },
        { trigger: 'overdue', sentOn: '2026-10-16' },
      ]),
    ).toBeNull();
  });
});
