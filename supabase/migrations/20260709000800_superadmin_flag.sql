-- ===========================================================================
-- FlowFinance — 32 · Bandera de superadmin
-- ===========================================================================
-- No existía ningún mecanismo de rol/admin en el schema — todo el control de
-- acceso era vía `plan`. Se agrega `is_superadmin` como bypass explícito para
-- cuentas de soporte/QA que necesitan operar sin los límites de cuota por plan
-- (OCR, adjuntos, mensajes FINN, etc.), sin construir un sistema de roles
-- completo que no hace falta todavía.
-- ===========================================================================

alter table public.users
  add column is_superadmin boolean not null default false;

-- Solo se otorga manualmente vía SQL/dashboard — nunca autoservicio.
comment on column public.users.is_superadmin is
  'Bypass de cuotas por plan para cuentas de soporte/QA. Se otorga manualmente, nunca vía app.';
