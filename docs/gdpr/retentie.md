# Retenție și curățenie

Perioadele de mai jos sunt cele promise public în `/confidentialitate` și în politica fiecărei
nunți. Orice modificare se face întâi în `lib/legal.ts`, apoi aici, apoi în pagini.

| Date | Termen | Ce se șterge |
| --- | --- | --- |
| Confirmări, însoțitori, mesaje | 6 luni după data nunții | rândurile din `rsvps`, `rsvp_guests`, mesajele nunții |
| Invitație, locații, temă, buget | cât timp nunta e activă + 6 luni | tot ce ține de tenant, prin ștergerea nunții |
| Contul mirilor | la încetarea contractului | utilizatorul Supabase Auth și rândurile din `tenant_admins` |
| Corespondență fără contract | 3 ani de la ultimul contact | firele din Gmail, notate cu `gdpr-corespondenta` |
| Facturi și documente contabile | 10 ani | **nu** se șterg: obligație Legea 82/1991 |
| Jurnale tehnice Vercel | 30 de zile | rotație automată a furnizorului |
| Copii de siguranță | 30 de zile | rotație automată |

## Cum se aplică

1. **Manual, acum:** în `/platform`, exportă ce trebuie păstrat și șterge nunțile expirate.
   Notează data și lista în registrul de curățenie.
2. **Automat, recomandat:** un job lunar (Vercel Cron sau un script local) care:
   - găsește nunțile cu `event_date < today - 6 months`;
   - trimite un email de avertizare mirilor cu 30 de zile înainte;
   - șterge datele la termen, păstrând doar factura.

## Ce nu se șterge automat

- Facturile și înregistrările contabile.
- Dovezile unui incident de securitate, până la închiderea dosarului.
- Datele aflate sub o cerere de restricționare sau un litigiu.

## Verificare

La fiecare curățenie: numără câte nunți au fost șterse, confirmă că fișierele din storage au
dispărut și că backupul nu mai conține rândurile după 30 de zile. Un test simplu: caută în Supabase
un nume șters; trebuie să nu apară.
