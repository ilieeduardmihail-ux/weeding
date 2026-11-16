-- v28: de ce a fost aruncată o confirmare.
--
-- Formularul public returnează „trimis" și nu salvează nimic când e completat
-- câmpul-capcană sau când este trimis în mai puțin de 2,5 secunde. Până acum
-- acele cazuri nu lăsau nicio urmă, așa că „am completat și nu apare" nu putea
-- fi verificat. Coloana spune motivul: `honeypot` sau `too_fast`.

alter table public.rsvp_log add column if not exists drop_reason text;

comment on column public.rsvp_log.drop_reason is
  'Nul pentru confirmările salvate; altfel motivul pentru care trimiterea a fost ignorată (honeypot, too_fast).';
