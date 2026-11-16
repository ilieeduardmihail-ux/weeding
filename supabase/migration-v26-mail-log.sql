-- v26: jurnalul emailurilor trimise de platformă.
--
-- Doar metadate: cui, ce subiect, când, dacă a plecat și ce eroare a fost.
-- Conținutul mesajelor nu se stochează (cererile de ofertă rămân doar în Gmail),
-- ca să nu adăugăm date personale într-un loc nou.
--
-- Doar `service_role` citește și scrie: tabelul nu are politici RLS, deci cheia
-- publică nu vede nimic, iar panoul îl citește numai după verificarea de owner.

create table if not exists public.mail_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  kind text not null check (kind in ('oferta', 'factura', 'cheie')),
  to_address text not null,
  subject text not null,
  reply_to text,
  tenant_id uuid references public.tenants(id) on delete set null,
  ok boolean not null,
  error text,
  message_id text
);

create index if not exists mail_log_at_idx on public.mail_log (at desc);
create index if not exists mail_log_tenant_idx on public.mail_log (tenant_id, at desc);

alter table public.mail_log enable row level security;

grant all on public.mail_log to service_role;
