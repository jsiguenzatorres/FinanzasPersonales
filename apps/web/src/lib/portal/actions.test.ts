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

const mockSupabase = {
  auth: {
    signInWithOtp: vi.fn(),
    signOut: vi.fn(),
  },
};

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

const { requestPortalAccessAction, portalSignOutAction } = await import('./actions');

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
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
});

describe('requestPortalAccessAction', () => {
  it('rechaza un correo inválido antes de llamar a Supabase', async () => {
    const url = await captureRedirect(() => requestPortalAccessAction(formData({ email: 'invalido' })));
    expect(url).toContain('/portal?error=');
    expect(mockSupabase.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it('marca la sesión como portal_guest y redirige al mensaje de éxito', async () => {
    mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null });

    const url = await captureRedirect(() =>
      requestPortalAccessAction(formData({ email: 'deudor@test.com' })),
    );

    expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'deudor@test.com',
        options: expect.objectContaining({
          shouldCreateUser: true,
          data: { portal_guest: true },
          emailRedirectTo: expect.stringContaining('/auth/callback?next=/portal/dashboard'),
        }),
      }),
    );
    expect(url).toContain('/portal?message=');
  });

  it('redirige con error si Supabase falla al enviar el enlace', async () => {
    mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: { message: 'fail' } });

    const url = await captureRedirect(() =>
      requestPortalAccessAction(formData({ email: 'deudor@test.com' })),
    );

    expect(url).toContain('/portal?error=');
  });
});

describe('portalSignOutAction', () => {
  it('cierra sesión y redirige a /portal', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    const url = await captureRedirect(() => portalSignOutAction());

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(url).toBe('/portal');
  });
});
