export const site = {
  name: 'Pension 48',
  url: 'https://www.pension48.cz',
  phone1: '+420 499 523 318',
  phone2: '+420 607 280 711',
  email: 'pension48@centrum.cz',
  street: 'Svatý Petr 48',
  zip: '543 51',
  city: 'Špindlerův Mlýn',
  operator: 'Vratislav Cink',
  ico: '656 99 254',
  lat: 50.72334,
  lon: 15.62615,
  mapy: 'https://mapy.cz/zakladni?x=15.62615&y=50.72334&z=15',
  /** Odkazy na profily penzionu na portálech. Doplní majitel, do té doby '#'. */
  reviewLinks: {
    google: '#',
    booking: '#',
    tripadvisor: '#',
    echalupy: '#',
  },
} as const;

export const tel = (n: string) => 'tel:' + n.replace(/\s/g, '');

export const langs = {
  cs: { path: '/', label: 'CZ', hreflang: 'cs' },
  en: { path: '/en/', label: 'EN', hreflang: 'en' },
  de: { path: '/de/', label: 'DE', hreflang: 'de' },
} as const;
export type Lang = keyof typeof langs;
