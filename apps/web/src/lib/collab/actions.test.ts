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

const mockInsertSelect = { single: vi.fn() };
const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

const { createSpaceAction, inviteMemberAction, acceptInviteAction, leaveSpaceAction } = await import(
  './actions'
);

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
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
});

describe('createSpaceAction', () => {
  it('rechaza un nombre vacío antes de llamar a Supabase', async () => {
    const url = await captureRedirect(() => createSpaceAction(formData({ name: '', kind: 'family' })));
    expect(url).toContain('/app/espacios/nuevo?error=');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('rechaza un kind fuera del enum antes de llamar a Supabase', async () => {
    const url = await captureRedirect(() =>
      createSpaceAction(formData({ name: 'Familia Pérez', kind: 'enemigos' })),
    );
    expect(url).toContain('/app/espacios/nuevo?error=');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('crea el espacio y une al creador como owner activo', async () => {
    mockInsertSelect.single.mockResolvedValue({ data: { id: 'space-1' }, error: null });
    const insertMembers = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'collab_spaces') {
        return { insert: () => ({ select: () => mockInsertSelect }) };
      }
      return { insert: insertMembers };
    });

    const url = await captureRedirect(() => createSpaceAction(formData({ name: 'Familia Pérez', kind: 'family' })));

    expect(insertMembers).toHaveBeenCalledWith(
      expect.objectContaining({ space_id: 'space-1', user_id: 'u1', role: 'owner', status: 'active' }),
    );
    expect(url).toContain('/app/espacios/space-1?message=');
  });
});

describe('inviteMemberAction', () => {
  it('rechaza un correo inválido antes de llamar a Supabase', async () => {
    const url = await captureRedirect(() =>
      inviteMemberAction(formData({ spaceId: '11111111-1111-1111-1111-111111111111', email: 'invalido' })),
    );
    expect(url).toContain('?error=');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('traduce el error de invitación duplicada', async () => {
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        error: { message: 'duplicate key value violates unique constraint "collab_members_space_id_invited_email_key"' },
      }),
    });

    const url = await captureRedirect(() =>
      inviteMemberAction(
        formData({ spaceId: '11111111-1111-1111-1111-111111111111', email: 'amigo@test.com' }),
      ),
    );

    expect(decodeURIComponent(url)).toContain('Ya invitaste a esa persona a este espacio.');
  });

  it('invita exitosamente y redirige al detalle del espacio', async () => {
    mockSupabase.from.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) });

    const url = await captureRedirect(() =>
      inviteMemberAction(
        formData({ spaceId: '11111111-1111-1111-1111-111111111111', email: 'amigo@test.com' }),
      ),
    );

    expect(url).toContain('/app/espacios/11111111-1111-1111-1111-111111111111?message=');
  });
});

describe('acceptInviteAction', () => {
  it('llama al RPC accept_collab_invite y redirige a /app/espacios', async () => {
    mockSupabase.rpc.mockResolvedValue({ error: null });

    const url = await captureRedirect(() => acceptInviteAction(formData({ memberId: 'member-1' })));

    expect(mockSupabase.rpc).toHaveBeenCalledWith('accept_collab_invite', { p_member_id: 'member-1' });
    expect(url).toContain('/app/espacios?message=');
  });

  it('redirige con el error si el RPC falla', async () => {
    mockSupabase.rpc.mockResolvedValue({ error: { message: 'Invitación no encontrada o ya no es válida.' } });

    const url = await captureRedirect(() => acceptInviteAction(formData({ memberId: 'member-1' })));

    expect(url).toContain('/app/espacios?error=');
  });
});

describe('leaveSpaceAction', () => {
  it('llama al RPC leave_collab_space con el espacio correcto', async () => {
    mockSupabase.rpc.mockResolvedValue({ error: null });

    const url = await captureRedirect(() => leaveSpaceAction(formData({ spaceId: 'space-1' })));

    expect(mockSupabase.rpc).toHaveBeenCalledWith('leave_collab_space', { p_space_id: 'space-1' });
    expect(url).toContain('/app/espacios?message=');
  });
});
