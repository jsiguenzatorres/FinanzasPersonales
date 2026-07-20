import { describe, it, expect, vi, beforeEach } from 'vitest';

class RedirectSignal extends Error {
  constructor(public url: string) {
    super(`REDIRECT:${url}`);
  }
}

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectSignal(url);
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const insertMock = vi.fn();
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({ insert: insertMock })),
};

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

const { createExpenseAction } = await import('./actions');

const VALID_ACCOUNT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

function validExpenseFields(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    amount: '45.50',
    currency: 'USD',
    transaction_date: '2026-07-20',
    payment_method: 'account',
    account_id: VALID_ACCOUNT_ID,
    merchant_name: 'Super Selectos',
    ...overrides,
  };
}

async function captureRedirect(fn: () => Promise<void>): Promise<string> {
  try {
    await fn();
  } catch (err) {
    if (err instanceof RedirectSignal) return err.url;
    throw err;
  }
  throw new Error('Se esperaba un redirect y no ocurrió');
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
  insertMock.mockResolvedValue({ error: null });
});

describe('createExpenseAction', () => {
  it('rechaza un monto negativo antes de tocar la base de datos', async () => {
    const url = await captureRedirect(() =>
      createExpenseAction(formData(validExpenseFields({ amount: '-10' }))),
    );
    expect(url).toContain('/app/gastos/nuevo?error=');
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando no se selecciona ni cuenta ni tarjeta', async () => {
    const url = await captureRedirect(() =>
      createExpenseAction(formData(validExpenseFields({ account_id: '' }))),
    );
    expect(url).toContain('/app/gastos/nuevo?error=');
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('redirige a /login si no hay sesión activa', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const url = await captureRedirect(() => createExpenseAction(formData(validExpenseFields())));

    expect(url).toBe('/login');
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('inserta la transacción con kind "expense" cuando se paga con cuenta', async () => {
    const url = await captureRedirect(() => createExpenseAction(formData(validExpenseFields())));

    expect(url).toBe('/app/gastos');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER_ID,
        account_id: VALID_ACCOUNT_ID,
        card_id: null,
        kind: 'expense',
        amount: 45.5,
        currency: 'USD',
        capture_source: 'manual',
      }),
    );
  });

  it('inserta la transacción con kind "cc_charge" cuando se paga con tarjeta', async () => {
    const cardId = '33333333-3333-3333-3333-333333333333';
    const url = await captureRedirect(() =>
      createExpenseAction(
        formData(validExpenseFields({ payment_method: 'card', account_id: '', card_id: cardId })),
      ),
    );

    expect(url).toBe('/app/gastos');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'cc_charge', card_id: cardId, account_id: null }),
    );
  });

  it('marca capture_source como ocr_receipt cuando viene de un recibo escaneado', async () => {
    await captureRedirect(() =>
      createExpenseAction(formData(validExpenseFields({ receipt_url: 'attachments/foo.jpg' }))),
    );

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ capture_source: 'ocr_receipt', receipt_url: 'attachments/foo.jpg' }),
    );
  });

  it('redirige con el error de Supabase si la inserción falla', async () => {
    insertMock.mockResolvedValue({ error: { message: 'constraint violation' } });

    const url = await captureRedirect(() => createExpenseAction(formData(validExpenseFields())));

    expect(url).toContain('/app/gastos/nuevo?error=');
    expect(decodeURIComponent(url)).toContain('constraint violation');
  });
});
