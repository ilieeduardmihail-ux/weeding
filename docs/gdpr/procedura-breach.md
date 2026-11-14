# Procedura de încălcare a securității datelor (art. 33–34 GDPR)

O „încălcare” înseamnă acces, divulgare, modificare sau pierdere neautorizată de date personale:
o scurgere de chei, un backup expus, un cont compromis, o ștergere accidentală fără backup.

## 1. Detectare și izolare (0–4 h)

1. Oprește vectorul: rotește cheile Supabase/Vercel/Gmail, revocă sesiunile, suspendă endpointul.
2. Nu șterge dovezi: păstrează jurnalele, capturi, ora și acțiunile făcute.
3. Anunță proprietarul platformei. O singură persoană coordonează răspunsul.

## 2. Evaluare (aceeași zi)

Notează:

- ce date au fost afectate (confirmări? conturi? facturi?);
- câți vizati și dacă sunt minori;
- dacă datele erau criptate sau pseudonimizate;
- dacă există risc de discriminare, fraudă, pierdere financiară sau reputațională;
- dacă mirii trebuie anunțați (sunt operatorii confirmărilor).

Riscul se notează ca **scăzut / mediu / ridicat**. Dacă există risc pentru drepturi, notificarea
ANSPDCP este obligatorie, chiar dacă nu ești sigur de amploare — termenul curge de la momentul
în care ai aflat.

## 3. Notificare ANSPDCP (maxim 72 h)

Notificarea se face la `anspdcp@dataprotection.ro`, folosind formularul din Decizia ANSPDCP
128/2018 (disponibil pe dataprotection.ro). Include:

- natura încălcării și categoriile de date;
- numărul aproximativ de persoane și de înregistrări;
- datele de contact ale operatorului;
- consecințele probabile;
- măsurile luate și cele propuse.

Dacă nu ai toate informațiile în 72 h, trimiți notificarea parțială și o completezi în faze.

## 4. Informarea persoanelor (fără întârziere)

Dacă riscul este ridicat, scrie-le clar: ce s-a întâmplat, ce date, ce pot face, ce am făcut noi.
Nu folosi limbaj tehnic și nu promite ce nu poți verifica. Pentru invitați, mirii trimit mesajul,
cu textul pregătit de noi.

## 5. După incident

- Completează registrul incidentelor: dată, cauză, impact, măsuri, lecții.
- Repară cauza (permisiuni, chei, validări) și adaugă un test care ar fi prins problema.
- Dacă a fost o eroare de proces, actualizează această procedură.
- Păstrează documentele 5 ani, ca dovadă a conformității.

## Contacte utile

- ANSPDCP: `anspdcp@dataprotection.ro`, +40 318 059 211, B-dul G-ral. Gheorghe Magheru 28-30,
  Sector 1, București.
- Furnizori: panoul Vercel (incidente), status.supabase.com, Google Workspace admin.
