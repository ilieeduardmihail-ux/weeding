# Registru de prelucrări (art. 30 GDPR)

Operator: `NEXT_PUBLIC_OPERATOR_NAME`, `NEXT_PUBLIC_OPERATOR_ADDRESS`,
`NEXT_PUBLIC_OPERATOR_CUI`. Responsabil: proprietarul platformei. Actualizat: 14.11.2026.

## 1. Găzduirea invitațiilor și panoul mirilor

- **Scop:** publicarea invitației digitale și administrarea nunții.
- **Temei:** art. 6(1)(b) — executarea contractului cu mirii.
- **Categorii de date:** date de cont (email, parolă criptată), datele nunții (nume, dată,
  locații, program), fotografii încărcate de miri.
- **Persoane vizate:** mirii, persoanele din conținutul invitației.
- **Destinatari:** Vercel (găzduire), Supabase (bază de date, autentificare).
- **Transfer:** SUA pentru Vercel, sub DPF; Supabase în UE.
- **Retenție:** cât timp contractul este activ; apoi ștergere la cerere sau la expirare.
- **Măsuri:** HTTPS, RLS în PostgreSQL, parole criptate de Supabase Auth, acces pe roluri.

## 2. Confirmările de prezență (RSVP)

- **Scop:** organizarea nunții — locuri, meniu, mese, raport pentru restaurant.
- **Temei:** art. 6(1)(a) — consimțământul invitatului, bifat în formular.
- **Operator:** mirii. **Împuternicit:** platforma.
- **Categorii de date:** nume, prezență, nume de însoțitori, mesaj opțional, hash de IP,
  momentul consimțământului, versiunea politicii.
- **Persoane vizate:** invitații.
- **Destinatari:** mirii, Supabase, Vercel. Restaurantul primește doar rapoarte agregate de mese,
  nu lista brută, dacă mirii nu aleg altfel.
- **Retenție:** 6 luni după data nunții, apoi ștergere.
- **Măsuri:** rate limiting, hash cu cheie secretă (`RATE_LIMIT_SALT`), acces doar prin RLS,
  token de nuntă semnat pentru fiecare formular.

## 3. Buget, facturi și contabilitate

- **Scop:** evidența costurilor nunții și facturarea serviciului.
- **Temei:** art. 6(1)(c) — obligație legală (Legea 82/1991), plus art. 6(1)(b) pentru buget.
- **Categorii:** furnizori, sume, monede, facturi, date de facturare ale clientului.
- **Retenție:** 10 ani pentru documentele contabile; bugetul se șterge cu nunta.

## 4. Corespondență și oferte

- **Scop:** răspuns la cereri, ofertă, suport.
- **Temei:** art. 6(1)(b) dacă duce la contract; altfel art. 6(1)(f) — interes legitim.
- **Categorii:** nume, email, conținutul mesajului, detaliile nunții.
- **Destinatari:** Gmail (Google Ireland), prin contul `contact.necasatorim@gmail.com`.
- **Retenție:** 3 ani de la ultimul contact, dacă nu se încheie contract.

## 5. Jurnale tehnice și securitate

- **Scop:** funcționare, depanare, prevenirea abuzului.
- **Temei:** art. 6(1)(f) — interes legitim.
- **Categorii:** IP, user-agent, pagini cerute, coduri de eroare.
- **Destinatari:** Vercel.
- **Retenție:** 30 de zile, apoi rotație automată.
- **Măsuri:** acces limitat, fără corelare cu identitatea vizitatorului.

## 6. Statistici de trafic

- **Scop:** numărul agregat de vizite, pentru a ști dacă invitația este folosită.
- **Temei:** art. 6(1)(f); nu se folosesc cookie-uri.
- **Categorii:** vizite agregat, țară, dispozitiv — fără identificator persistent.
- **Destinatari:** Vercel Analytics.
- **Retenție:** conform Vercel; nu exportăm date individuale.

## 7. Hărți Google (opțional, la click)

- **Scop:** afișarea locației evenimentului.
- **Temei:** art. 6(1)(a) — click-ul explicit; cookie-uri sub Legea 506/2004, art. 4(5).
- **Categorii:** IP, date tehnice, cookie-uri Google.
- **Destinatari:** Google Ireland / Google LLC (DPF).
- **Retenție:** stabilită de Google.
- **Măsuri:** `iframe`-ul nu există în DOM până la click; link alternativ către Maps.

## Ce nu prelucrăm

Nu prelucrăm date sensibile (art. 9), nu facem profilare comercială, nu vindem date și nu folosim
pixeli de publicitate. Dacă apar, se adaugă aici înainte de activare.
