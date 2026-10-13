-- ===========================================================================
-- FlowFinance — Activar/desactivar recordatorios de cobro por persona
-- ===========================================================================
-- El cron de recordatorios (lib/reminders) hasta ahora era todo o nada: si
-- la persona tenía correo registrado, le llegaban recordatorios sí o sí. No
-- había forma de agregarle el correo para tenerlo a mano sin que la app le
-- escriba automáticamente a cobrarle. Se agrega un toggle explícito,
-- encendido por defecto (preserva el comportamiento actual).
-- ===========================================================================

alter table public.family_loans
  add column reminders_enabled boolean not null default true;

alter table public.loan_portfolio
  add column reminders_enabled boolean not null default true;
