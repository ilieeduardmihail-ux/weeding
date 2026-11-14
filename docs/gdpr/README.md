# GDPR — dosarul intern al platformei

Documentele de aici sunt pentru operator (noi), nu pentru public. Paginile publice sunt
`/confidentialitate`, `/cookies`, `/termeni` și `/subprocesatori`; acestea trebuie să rămână
în acord cu ce scrie aici.

> Nu este consultanță juridică. Structura urmează Regulamentul (UE) 2016/679, Legea 190/2018 și
> ghidurile ANSPDCP/EDPB, dar o verificare a unui avocat înainte de lansarea comercială rămâne
> recomandată.

## Ce conține dosarul

| Document | Ce acoperă | Obligație |
| --- | --- | --- |
| [registru-prelucrari.md](registru-prelucrari.md) | Evidența prelucrărilor, scopuri, temeiuri, destinatari | art. 30 GDPR |
| [procedura-drepturi.md](procedura-drepturi.md) | Fluxul pentru cereri de acces/ștergere/rectificare | art. 12–22 |
| [procedura-breach.md](procedura-breach.md) | Detectare, evaluare, notificare în 72 h | art. 33–34 |
| [retentie.md](retentie.md) | Perioadele de păstrare și curățenia | art. 5 alin. 1 lit. e |
| [subprocesatori.md](subprocesatori.md) | Furnizorii, transferurile, verificarea lor | art. 28, cap. V |
| [dpo-si-dpia.md](dpo-si-dpia.md) | De ce nu avem DPO și de ce nu pare necesară o DPIA | art. 37, art. 35 |

## Starea la 14 noiembrie 2026

- Operatorul publică identitatea din variabilele `NEXT_PUBLIC_OPERATOR_*`. **Cât timp lipsesc,
  paginile afișează placeholdere între paranteze drepte** și nu trebuie considerate finalizate.
- Google Maps se încarcă numai după click; nu există cookie-uri de urmărire, deci nu există banner.
- Vercel Analytics este fără cookie-uri; nu este nevoie de consimțământ pentru el.
- Consimțământul RSVP este obligatoriu, cu dată și versiune (`2026-11-14`).
- Documentele publicate în `/platform/documente` (termeni + DPA) trebuie să folosească aceleași
  date de operator ca `lib/legal.ts`.

## Ce mai trebuie făcut înainte de vânzare

1. Completează identitatea operatorului în Vercel (Environment Variables) și redesenează.
2. Semnează DPA-ul cu fiecare client; păstrează o copie în dosarul nunții.
3. Rulează curățenia de retenție (manual la început, apoi script) și notează data.
4. Verifică lista de subprocesatori la fiecare schimbare de furnizor.
5. Ține un registru al incidentelor, chiar dacă e gol.
