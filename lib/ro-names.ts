// Ordered roughly by how common the name is. On a tie the more common name wins.
// Add your own guests' names here to make the correction smarter.
const split = (s: string) => s.split(/\s+/).filter(Boolean);

export const FIRST_NAMES = split(`
Andrei Alexandru Ion Ionuț Mihai Daniel Gabriel Cristian Marian Florin Adrian Constantin Nicolae Vasile
Gheorghe Ștefan Bogdan Cătălin Marius Răzvan Sorin Dan Radu Octavian Vlad Dumitru Liviu Lucian Mircea Emil
Ovidiu Paul Sebastian Tudor Victor Valentin Cosmin Costin Cezar Claudiu Ciprian Darius Denis Eduard Eugen
Horia Iulian Laurențiu Leonard Nicușor Petru Robert Rareș Silviu Teodor Tiberiu Traian Virgil Alin Aurel
Cornel Doru Dorin Gelu Ilie Lazăr Marcel Mădălin Remus Viorel Vladimir Zoltán Antonio Alex Mario Cristi
Ionel Ioan Iosif Attila Balázs László István József János Gyula Sándor Zsolt
Maria Elena Ioana Andreea Alexandra Ana Anamaria Daniela Mihaela Cristina Simona Raluca Georgiana Gabriela
Alina Roxana Laura Diana Monica Carmen Oana Irina Camelia Claudia Larisa Adriana Bianca Corina Cătălina
Denisa Elisabeta Eliza Emilia Mădălina Nicoleta Paula Ramona Sabina Sânziana Ștefania Teodora Valentina
Viorica Alexia Antonia Anca Florentina Luminița Lavinia Mirela Ruxandra Sofia Sonia Ileana Iulia Andra
Delia Flavia Ligia Livia Lidia Magdalena Margareta Rodica Rebeca Natalia Nadia Petronela Veronica Ilinca
Karina Tamara Tania Patricia Miruna Mara Maia Eva Ema Sara Rita Kinga Réka Enikő
`);

export const SURNAMES = split(`
Popescu Ionescu Popa Pop Radu Dumitru Stan Stoica Gheorghe Matei Constantin Marin Mihai Șerban Ștefan Dinu
Dobre Barbu Florea Diaconu Tudor Munteanu Moldovan Ilie Lazăr Preda Nistor Oprea Neagu Cristea Georgescu
Constantinescu Stanciu Rusu Ardeleanu Tănase Mocanu Vasile Sandu Dragomir Niculescu Lungu Avram Ciobanu
Crăciun Enache Manole Păun Toma Cojocaru Moraru Anghel Apostol Paraschiv Voicu Dima Coman Bălan Bucur
Chiriac Ene Iordache Luca Grigore Albu Burlacu Roman Pavel Alexandru Petre Sima Vlad Zamfir Bran Drăgan
Dragu Mărgineanu Baciu Tomescu Cazacu Nedelcu Ungureanu Vasilescu Teodorescu Anton
`);
