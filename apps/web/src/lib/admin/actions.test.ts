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

const mockServerSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => Promise.resolve(mockServerSupabase)),
}));

const mockAdminUpdate = { eq: vi.fn() };
const mockAdminSupabase = {
  auth: { admin: { createUser: vi.fn() } },
  from: vi.fn(() => ({ update: vi.fn(() => mockAdminUpdate) })),
};

vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(() => mockAdminSupabase),
}));

const { createUserAction } = await import('./actions');

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

function mockProfile(isSuperadmin: boolean) {
  mockServerSupabase.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: { is_superadmin: isSuperadmin } }),
      }),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAdminUpdate.eq.mockResolvedValue({ error: null });
  mockAdminSupabase.from.mockReturnValue({ update: vi.fn(() => mockAdminUpdate) });
});

describe('createUserAction', () => {
  it('rechaza a un usuario que no es superadmin antes de crear nada', async () => {
    mockServerSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockProfile(false);

    const url = await captureRedirect(() =>
      createUserAction(
        formData({ email: 'nuevo@test.com', password: 'password123', displayName: 'Nuevo' }),
      ),
    );

    expect(url).toBe('/app');
    expect(mockAdminSupabase.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it('rechaza datos inválidos antes de llamar al admin client', async () => {
    mockServerSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin1' } } });
    mockProfile(true);

    const url = await captureRedirect(() =>
      createUserAction(formData({ email: 'invalido', password: '123', displayName: '' })),
    );

    expect(url).toContain('/app/admin/nuevo?error=');
    expect(mockAdminSupabase.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it('crea la cuenta con el correo confirmado y redirige a /app/admin', async () => {
    mockServerSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin1' } } });
    mockProfile(true);
    mockAdminSupabase.auth.admin.createUser.mockResolvedValue({ data: { user: { id: 'new-user-1' } }, error: null });

    const url = await captureRedirect(() =>
      createUserAction(
        formData({ email: 'nuevo@test.com', password: 'password123', displayName: 'Nuevo Usuario' }),
      ),
    );

    expect(mockAdminSupabase.auth.admin.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'nuevo@test.com',
        password: 'password123',
        email_confirm: true,
        user_metadata: { display_name: 'Nuevo Usuario' },
      }),
    );
    expect(url).toContain('/app/admin?message=');
  });

  it('promueve a superadmin solo cuando se marca el checkbox', async () => {
    mockServerSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin1' } } });
    mockProfile(true);
    mockAdminSupabase.auth.admin.createUser.mockResolvedValue({ data: { user: { id: 'new-user-1' } }, error: null });

    await captureRedirect(() =>
      createUserAction(
        formData({
          email: 'nuevo@test.com',
          password: 'password123',
          displayName: 'Nuevo Usuario',
          isSuperadmin: 'on',
        }),
      ),
    );

    expect(mockAdminSupabase.from).toHaveBeenCalledWith('users');
    expect(mockAdminUpdate.eq).toHaveBeenCalledWith('id', 'new-user-1');
  });

  it('traduce el error de correo duplicado y redirige con el mensaje', async () => {
    mockServerSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin1' } } });
    mockProfile(true);
    mockAdminSupabase.auth.admin.createUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'A user with this email address has already been registered' },
    });

    const url = await captureRedirect(() =>
      createUserAction(
        formData({ email: 'repetido@test.com', password: 'password123', displayName: 'Repetido' }),
      ),
    );

    expect(url).toContain('/app/admin/nuevo?error=');
    expect(decodeURIComponent(url)).toContain('Ya existe una cuenta con ese correo');
  });
});
