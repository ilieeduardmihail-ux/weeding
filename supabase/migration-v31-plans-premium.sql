-- migration-v31-plans-premium.sql
-- Pachete (Standard / Premium) și câmpurile cerute de funcționalitățile noi:
--   * planul nunții, ca panoul să poată arăta sau bloca modulele Premium;
--   * alergiile / preferințele alimentare primite de la invitați;
--   * împărțirea restului de plată al unei cheltuieli (înainte de nuntă / în ziua nunții).
--
-- Toate modificările sunt aditive: datele existente rămân pe loc, iar nunțile
-- de prezentare primesc Premium ca să arate toate modulele în demo.

alter table public.tenants
  add column if not exists plan text not null default 'standard';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tenants_plan_check'
      and conrelid = 'public.tenants'::regclass
  ) then
    alter table public.tenants
      add constraint tenants_plan_check check (plan in ('standard', 'premium'));
  end if;
end $$;

alter table public.rsvps
  add column if not exists allergies text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'rsvps_allergies_length'
      and conrelid = 'public.rsvps'::regclass
  ) then
    alter table public.rsvps
      add constraint rsvps_allergies_length
      check (allergies is null or char_length(allergies) <= 500);
  end if;
end $$;

-- Restul de plată poate fi împărțit în două momente. `amount_paid` rămâne avansul
-- deja plătit; `due_before` și `due_after` descriu restul, fără a modifica totalul.
alter table public.expenses
  add column if not exists due_before numeric(12, 2) not null default 0;
alter table public.expenses
  add column if not exists due_after numeric(12, 2) not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'expenses_due_nonnegative'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
      add constraint expenses_due_nonnegative
      check (due_before >= 0 and due_after >= 0);
  end if;
end $$;

-- Nunta de prezentare și demo-ul arată tot ce ține de Premium.
update public.tenants
   set plan = 'premium'
 where slug in ('ana-si-stefan', 'demo')
   and plan = 'standard';

comment on column public.tenants.plan is
  'standard = RSVP, invitați, mese, export; premium = buget, furnizori, planificator, calculator dar.';
comment on column public.rsvps.allergies is
  'Alergii sau preferințe alimentare scrise de invitat (max. 500 caractere).';
comment on column public.expenses.due_before is
  'Rest de plată scadent înainte de nuntă.';
comment on column public.expenses.due_after is
  'Rest de plată scadent în ziua nunții sau după.';
