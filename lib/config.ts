export const MAX_GUESTS = 6;

const maps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

// Names, date, time, city and the RSVP cutoff live in `event_settings`
// (edited from /admin/settings). Only the schedule, map and FAQ are code.
export const wedding = {
  events: [
    { time: "16:00", title: "Civil ceremony", place: "Conservatória do Registo Civil", address: "Rua do Século 1, Lisbon" },
    { time: "17:30", title: "Religious service", place: "Igreja de São Roque", address: "Largo Trindade Coelho, Lisbon" },
    { time: "20:00", title: "Reception", place: "Palácio do Grilo", address: "Calçada do Grilo 142, Lisbon" },
  ].map((e) => ({ ...e, mapsUrl: maps(`${e.place}, ${e.address}`) })),
  receptionEmbed: "https://www.google.com/maps?q=Palácio+do+Grilo+Lisbon&output=embed",
  faq: [
    { q: "Where can we park?", a: "The reception venue has 40 free spaces. Parking near the church is limited, so we recommend a taxi or the 28 tram." },
    { q: "What is the dress code?", a: "Formal. Think cocktail dresses and suits. The garden is gravel, so block heels may be easier than stilettos." },
    { q: "Where should we stay?", a: "Hotel Avenida (10 min walk from the church) holds a block of rooms under “Ana & Marco”. Book by 12 April." },
    { q: "Can we bring children?", a: "Yes. Add them as guests in the RSVP form and mark them as children so we can plan seating and meals." },
  ],
};
