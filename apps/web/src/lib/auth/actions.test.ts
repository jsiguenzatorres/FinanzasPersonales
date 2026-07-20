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
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
};

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

const { signInAction, signUpAction, signOutAction } = await import('./actions');

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

describe('signInAction', () => {
  it('rechaza credenciales con formato inválido antes de llamar a Supabase', async () => {
    const url = await captureRedirect(() =>
      signInAction(formData({ email: 'no-es-un-correo', password: '123' })),
    );
    expect(url).toContain('/login?error=');
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('traduce el error de Supabase a un mensaje en español', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });

    const url = await captureRedirect(() =>
      signInAction(formData({ email: 'user@test.com', password: 'password123' })),
    );

    expect(url).toContain('/login?error=');
    expect(decodeURIComponent(url)).toContain('Correo o contraseña incorrectos');
  });

  it('redirige a /app cuando el login es exitoso', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });

    const url = await captureRedirect(() =>
      signInAction(formData({ email: 'user@test.com', password: 'password123' })),
    );

    expect(url).toBe('/app');
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'password123',
    });
  });
});

describe('signUpAction', () => {
  it('rechaza una contraseña demasiado corta antes de llamar a Supabase', async () => {
    const url = await captureRedirect(() =>
      signUpAction(formData({ email: 'user@test.com', password: '123', displayName: 'Juan' })),
    );
    expect(url).toContain('/signup?error=');
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('rechaza un correo con formato inválido antes de llamar a Supabase', async () => {
    const url = await captureRedirect(() =>
      signUpAction(formData({ email: 'invalido', password: 'password123', displayName: 'Juan' })),
    );
    expect(url).toContain('/signup?error=');
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('crea la cuenta con display_name y redirige a login con el mensaje de confirmación', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ error: null });

    const url = await captureRedirect(() =>
      signUpAction(formData({ email: 'user@test.com', password: 'password123', displayName: 'Juan Pérez' })),
    );

    expect(url).toContain('/login?message=');
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@test.com',
        password: 'password123',
        options: expect.objectContaining({ data: { display_name: 'Juan Pérez' } }),
      }),
    );
  });
});

describe('signOutAction', () => {
  it('cierra la sesión en Supabase y redirige a /login', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    const url = await captureRedirect(() => signOutAction());

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(url).toBe('/login');
  });
});
