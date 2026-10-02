-- Agrega correo de contacto a préstamos familiares, para recordatorios de cobro
-- automáticos (feature-recordatorios-cobro.md). loan_portfolio ya tenía
-- borrower_email/borrower_phone desde que se creó.

alter table public.family_loans
  add column if not exists person_email text;
