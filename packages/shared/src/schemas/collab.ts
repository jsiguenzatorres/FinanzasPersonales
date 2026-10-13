import { z } from 'zod';

export const collabKinds = ['couple', 'family', 'roommates', 'business', 'other'] as const;

export const createSpaceSchema = z.object({
  name: z.string().min(1, 'Ingresa un nombre').max(100),
  kind: z.enum(collabKinds),
});

export const inviteMemberSchema = z.object({
  spaceId: z.string().uuid(),
  email: z.string().email('Correo inválido'),
});

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
