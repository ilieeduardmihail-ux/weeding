# Procedura pentru cererile persoanelor vizate

Termen legal: **o lună** de la primirea cererii, prelungibil cu două luni dacă e complexă
(art. 12 alin. 3 GDPR). Cererile sunt gratuite. Nu cerem motivul, dar putem cere o dovadă de
identitate dacă este nevoie să nu divulgăm datele altcuiva.

## Canal

Orice cerere care ajunge la `contact.necasatorim@gmail.com`, în panoul unei nunți sau pe alte
canale intră în același flux. Se etichetează în Gmail cu `gdpr-cerere` și se notează într-un
registru simplu (dată primire, nume, tip cerere, termen, cine răspunde).

## Pași

1. **Confirmă primirea** în 2 zile lucrătoare și spune termenul.
2. **Identifică datele.** Caută în Supabase după email/nume și în fișierele nunții. Pentru un
   invitat, cere mirilor contextul; nu îi implica în decizie dacă cererea e simplă.
3. **Clasifică cererea:**
   - acces → copie a datelor, în format lizibil (CSV/PDF);
   - rectificare → corectează și confirmă;
   - ștergere → șterge din tabelele aplicației și din stocarea de fișiere;
   - restricționare → marchează rândul și oprește folosirea până la soluționare;
   - portabilitate → export CSV din panoul nunții;
   - opoziție → încetează prelucrarea pe interes legitim, dacă nu există motive imperioase;
   - retragere consimțământ → șterge confirmarea, dacă nu există obligație legală.
4. **Execută și notează** ce s-a șters, unde și când. Nu șterge copiile de siguranță manual:
   se rotesc în 30 de zile.
5. **Răspunde** clar, în scris, cu ce s-a făcut. Dacă refuzi (de exemplu, există o obligație
   legală de păstrare), explică temeiul și dreptul de plângere la ANSPDCP.

## Ștergerea unui invitat

- Șterge rândul din `rsvps` și din `rsvp_guests` (sau folosește funcția de administrare).
- Nu păstra numele în mesaje sau rapoarte exportate.
- Dacă mirii au nevoie de dovada ștergerii, emite o confirmare fără datele propriu-zise.

## Ștergerea unei nunți

Se face din `/platform` (ștergere definitivă, cu confirmare pe slug). Include invitația, tema,
locațiile, confirmările, mesajele, bugetul și fișierele încărcate. Facturile emise rămân în
evidența contabilă, fără datele invitaților.

## Escaladare

Dacă cererea implică o încălcare de securitate sau o posibilă discriminare, urmează
[procedura-breach.md](procedura-breach.md) și anunță operatorul în aceeași zi.
