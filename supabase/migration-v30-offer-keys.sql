-- v30: cheia de acces poate pleca odată cu răspunsul la cererea de ofertă.
--
-- Răspunsul din `/platform/mesaje` poate include acum cheia, pașii de activare
-- și linkurile utile, într-un singur email, în același fir cu cererea. Cheia are
-- nevoie de o nuntă (`access_keys.tenant_id` e obligatoriu), deci prima dată
-- clientul se creează din datele cererii.
--
-- `tenant_id` ține minte ce client a fost creat pentru cerere: o a doua trimitere
-- refolosește aceeași nuntă în loc să mai facă una. `key_sent_at` marchează
-- momentul în care cheia a plecat, ca panoul să arate „cheie trimisă".
--
-- Ca și la v29, doar `service_role` atinge tabelul (RLS activă, fără politici).

alter table public.offer_requests
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null,
  add column if not exists key_sent_at timestamptz;
