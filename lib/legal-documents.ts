/**
 * Șabloane legale pe care proprietarul platformei le adaptează și le încheie cu
 * fiecare client. Sunt text simplu (nu HTML), afișate în /platform/documente,
 * unde pot fi citite, copiate și printate/salvate ca PDF.
 *
 * - Termeni și condiții: relația dintre platformă (prestator) și mirii (client).
 * - Acord de prelucrare a datelor (DPA): mirii sunt operator, platforma este
 *   persoana împuternicită care doar găzduiește datele.
 *
 * Locurile de completat sunt marcate cu paranteze drepte.
 */

export const TERMS_TEMPLATE = `TERMENI ȘI CONDIȚII DE UTILIZARE

1. Părțile
Prezentul contract se încheie între [NUME PRESTATOR / FIRMĂ], cu sediul în [ADRESĂ], CUI [CUI], email [EMAIL] („Prestatorul"), și clientul care comandă un site de invitație („Clientul").

2. Obiectul contractului
Prestatorul creează și găzduiește un site de invitație personalizat pentru nunta Clientului, la adresa [SLUG].domeniu, împreună cu o zonă de administrare pentru gestionarea invitaților, a confirmărilor și a mesei.

3. Perioada de valabilitate
Accesul se acordă pe durata aleasă la activare. La expirare, site-ul public și zona de administrare devin indisponibile. Datele pot fi șterse după o perioadă rezonabilă de la expirare, la cererea Clientului sau automat.

4. Preț și plată
Prețul este cel din nota de plată emisă pentru fiecare client. Nu se aplică TVA. Plata se face prin transfer bancar în contul indicat pe nota de plată.

5. Obligațiile Prestatorului
- Să livreze site-ul în forma convenită și să îl mențină disponibil în mod rezonabil.
- Să asigure copii de siguranță ale datelor și măsuri de securitate adecvate.
- Să nu folosească datele invitaților în alt scop decât funcționarea serviciului.

6. Obligațiile Clientului
- Să folosească serviciul în scopul nunții sale și să nu încarce conținut ilegal sau care încalcă drepturile altora.
- Să obțină acordul invitaților pentru prelucrarea datelor (vezi Acordul de prelucrare a datelor).
- Să păstreze confidențiale datele de acces la zona de administrare.

7. Conținut și drepturi de autor
Clientul răspunde pentru pozele și textele încărcate. Prestatorul poate folosi șablonul, codul și elementele grafice în alte proiecte.

8. Limitarea răspunderii
Prestatorul nu răspunde pentru întreruperi cauzate de furnizorii de găzduire sau de forță majoră. Răspunderea totală este limitată la prețul plătit.

9. Încetare
Oricare parte poate înceta contractul cu notificare scrisă. La încetare, accesul se poate închide, iar datele se șterg la cerere.

10. Legea aplicabilă
Contractul este guvernat de legea română. Neînțelegerile se rezolvă pe cale amiabilă, iar în lipsa unei soluții, de instanțele competente.

Data: [DATA]          Prestator: ____________________          Client: ____________________`;

export const DPA_TEMPLATE = `ACORD PRIVIND PRELUCRAREA DATELOR CU CARACTER PERSONAL

1. Părțile
Operator (Client): [NUME MIRI], care organizează nunta din [DATA NUNȚII].
Persoana împuternicită (Prestator): [NUME PRESTATOR / FIRMĂ], CUI [CUI], email [EMAIL].

2. Obiect
Prestatorul găzduiește site-ul de invitație și stochează, în numele Operatorului, datele transmise de invitați prin formularul de confirmare.

3. Categoriile de date
- Numele și prenumele invitatului și ale însoțitorilor.
- Confirmarea prezenței (da/nu).
- Mesajul opțional lăsat de invitat.
- Data și ora consimțământului și versiunea politicii acceptate.
Nu se colectează date de contact (telefon, adresă) și nu se folosesc cookie-uri de urmărire.

4. Scopul și durata
Datele sunt folosite exclusiv pentru organizarea nunții (locuri, meniu, mese) și se păstrează până după nuntă, dar nu mai mult decât este necesar, apoi se șterg.

5. Obligațiile Prestatorului
- Să prelucreze datele doar la instrucțiunile Operatorului.
- Să aplice măsuri tehnice de securitate (acces restricționat, conexiuni criptate).
- Să nu transfere datele altor terți, cu excepția subcontractorilor de găzduire (Supabase, Vercel), care oferă garanții adecvate.
- Să asiste Operatorul în cazul unei solicitări din partea unui invitat (acces, corectare, ștergere).
- Să notifice Operatorul fără întârziere în caz de incident de securitate.

6. Drepturile persoanelor vizate
Invitații își pot exercita drepturile scriind la adresa de contact a Operatorului: [EMAIL MIRI]. Cererile de ștergere se rezolvă în cel mult 30 de zile.

7. Subcontractanți
Găzduire bază de date: Supabase. Găzduire site: Vercel. Operatorul este informat despre orice schimbare.

8. Încetare
La încetarea colaborării, Prestatorul șterge datele la cererea Operatorului sau le păstrează doar cât impune legea.

Data: [DATA]          Operator: ____________________          Persoana împuternicită: ____________________`;

export const LEGAL_DOCUMENTS = [
  { id: "termeni", title: "Termeni și condiții", text: TERMS_TEMPLATE },
  { id: "dpa", title: "Acord de prelucrare a datelor (DPA)", text: DPA_TEMPLATE },
] as const;
