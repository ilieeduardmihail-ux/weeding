# Subprocesatori și transferuri

Lista publică este în `lib/legal.ts` (`SUB_PROCESSORS`) și pe `/subprocesatori`. Aici sunt
detalii pentru dosar.

## Vercel Inc. — găzduire și CDN

- Date: tot ce servește site-ul (invitații, panou, jurnale de acces).
- Locație: SUA, cu edge în UE.
- Transfer: certificare EU-US Data Privacy Framework; DPA cu clauze contractuale standard.
- Verificare: `vercel.com/legal/dpa`, Trust Center (`security.vercel.com`).
- Analytics: fără cookie-uri, fără identificatori persistenți.

## Supabase Inc. — baza de date și autentificare

- Date: toate tabelele aplicației, conturile mirilor, fișierele încărcate.
- Locație: proiectul este în regiunea **Frankfurt (UE)**.
- Transfer: datele rămân în UE; accesul de suport din afara UE este acoperit de SCC.
- Verificare: `supabase.com/legal/dpa`, setările proiectului (regiune, backup, RLS).

## Google Ireland Limited — Maps și Gmail

- Maps: se încarcă doar după click; fără request înainte. Cookie-uri sub Legea 506/2004.
- Gmail: corespondența cu mirii și cererile GDPR.
- Transfer: DPF pentru Google LLC.
- Verificare: `business.safety.google/adsprocessorterms`, setările contului Gmail (2FA).

## Reguli pentru un furnizor nou

1. Verifică DPA-ul, locația datelor și certificarea de transfer.
2. Actualizează `SUB_PROCESSORS`, `/subprocesatori` și registrul de prelucrări.
3. Anunță mirii activi pe email **înainte** de activare.
4. Dacă prelucrează date sensibile sau volum mare, cere o evaluare scrisă de securitate.
5. Notează în dosar data verificării și persoana care a făcut-o.

## Ce nu acceptăm

- furnizori care nu oferă DPA sau nu spun unde stau datele;
- instrumente de publicitate, pixeli sociali sau „session replay”;
- transferuri pe baza unor clauze vagi, fără analiză de impact.

## La încetarea relației

Cere ștergerea datelor și o confirmare scrisă; exportă ce trebuie păstrat (facturi) înainte.
