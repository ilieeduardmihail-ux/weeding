-- migration-v21-invoices.sql
-- Faza 10 (facturare). Notă de plată simplă, fără TVA: valoarea se scrie liber
-- pe fiecare factură, iar datele emitentului se completează mai târziu din
-- panoul de platformă (tabelul `platform_settings`, un singur rând).
--
-- Facturile sunt înregistrări de platformă: păstrează o copie a numelui
-- clientului, ca să rămână citibile chiar dacă nunta este ștearsă mai târziu
-- (`tenant_id` devine NULL la ștergere, nu duce factura cu el).

create sequence if not exists public.invoice_number_seq start 1;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  number bigint not null default nextval('public.invoice_number_seq'),
  issued_at date not null default current_date,
  client_name text not null,
  client_email text,
  client_slug text,
  tenant_id uuid references public.tenants(id) on delete set null,
  description text not null default 'Acces site invitație nuntă',
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'RON',
  paid boolean not null default false,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter sequence public.invoice_number_seq owned by public.invoices.number;
create index if not exists invoices_issued_at_idx on public.invoices (issued_at desc, number desc);
create index if not exists invoices_tenant_idx on public.invoices (tenant_id);

create table if not exists public.platform_settings (
  id smallint primary key default 1 check (id = 1),
  issuer_name text,
  issuer_address text,
  issuer_email text,
  issuer_phone text,
  issuer_tax_id text,
  issuer_bank text,
  issuer_iban text,
  currency text not null default 'RON',
  footer_note text,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id) values (1) on conflict (id) do nothing;

-- RLS: doar proprietarul platformei vede sau modifică facturile și setările.
alter table public.invoices enable row level security;
alter table public.platform_settings enable row level security;

drop policy if exists "owners manage invoices" on public.invoices;
create policy "owners manage invoices" on public.invoices
  for all to authenticated using (is_platform_owner()) with check (is_platform_owner());

drop policy if exists "owners manage platform settings" on public.platform_settings;
create policy "owners manage platform settings" on public.platform_settings
  for all to authenticated using (is_platform_owner()) with check (is_platform_owner());

grant select, insert, update, delete on public.invoices to authenticated, service_role;
grant select, insert, update, delete on public.platform_settings to authenticated, service_role;
grant usage, select on sequence public.invoice_number_seq to authenticated, service_role;
