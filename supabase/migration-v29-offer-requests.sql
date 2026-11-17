-- v29: cererile de ofertă, ca să poți răspunde din platformă.
--
-- Până acum formularul public transforma cererea într-un email și atât: în bază
-- rămânea doar metadatalogul din `mail_log`, fără mesaj, deci panoul nu avea ce
-- afișa și nici de unde lua adresa ca să răspundă. Cererea se scrie acum și aici,
-- înainte de trimiterea notificării, ca să nu se piardă dacă emailul pică.
--
-- `mail_message_id` este Message-ID-ul notificării: răspunsul trimis din panou
-- îl pune în `In-Reply-To`, iar conversația rămâne un singur fir în Gmail.
--
-- Doar `service_role` citește și scrie: tabelul nu are politici RLS, iar panoul
-- îl atinge numai după verificarea de owner.

create table if not exists public.offer_requests (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  period text,
  message text not null,
  mail_message_id text,
  status text not null default 'nou' check (status in ('nou', 'raspuns', 'inchis')),
  replied_at timestamptz,
  reply_count integer not null default 0
);

create index if not exists offer_requests_at_idx on public.offer_requests (at desc);
create index if not exists offer_requests_status_idx on public.offer_requests (status, at desc);

alter table public.offer_requests enable row level security;
grant all on public.offer_requests to service_role;

-- Jurnalul de emailuri capătă tipul „răspuns”, ca replicile scrise din panou să
-- apară în `/platform/emailuri` alături de cereri și facturi.
alter table public.mail_log drop constraint if exists mail_log_kind_check;
alter table public.mail_log add constraint mail_log_kind_check
  check (kind in ('oferta', 'factura', 'cheie', 'raspuns'));
