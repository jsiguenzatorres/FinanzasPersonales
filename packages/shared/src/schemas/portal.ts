import { z } from 'zod';

export const portalAccessRequestSchema = z.object({
  email: z.string().email('Correo inválido'),
});

export type PortalAccessRequestInput = z.infer<typeof portalAccessRequestSchema>;
