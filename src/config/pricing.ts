/**
 * Ceny a pravidla kalkulačky. Stačí upravit tady a znovu nasadit web.
 * Ceny jsou v Kč. Tabulka v ceníku i kalkulačka čerpají odsud.
 */
export const pricing = {
  /** Zimní sezóna: měsíce (1 = leden). Zbytek roku je letní sezóna. */
  winterMonths: [12, 1, 2, 3],
  winter: { min: 550, max: 1000 }, // Kč za osobu a noc
  summer: { min: 500, max: 750 },
  /** Dítě (2–10 let) platí (1 − sleva), jen když jsou na pokoji alespoň 2 platící dospělí. */
  childDiscount: 0.4,
  childDiscountMinAdults: 2,
  /** Městský poplatek za noc za osobu od 18 let (dospělí). */
  cityTax: 40,
  /** Pes za noc. */
  dog: { small: 100, large: 200 },
  /** Minimální počet nocí. */
  minNights: 2,
  /** Vánoce a Silvestr: noci od 23. 12. do 1. 1. (formát MM-DD), tam platí individuální ceny. */
  holidayFrom: '12-23',
  holidayTo: '01-01',
  maxAdults: 18,
  maxKids: 14,
} as const;

export type Pricing = typeof pricing;
