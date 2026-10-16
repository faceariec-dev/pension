import cs from './cs';
import en from './en';
import de from './de';
import type { Lang } from '../config/site';

export const dict = { cs, en, de };
export const t = (lang: Lang) => dict[lang];

/** Recenze hostů z Googlu (původní znění česky). via = jazyk originálu, pokud šlo o překlad. */
export const quotes: { name: string; via?: 'en' | 'de' | 'sk'; text: string }[] = [
  { name: 'Jiřina S.', text: 'Vřele doporučuji. Soukromí, od stolu rovnou do přírody, kuchyňka vybavená, absolutní klid, domácí prostředí. Je zde vše pro odpočinek. Proto sem jezdím s vnoučaty již několik let.' },
  { name: 'Dominika N.', via: 'en', text: 'Krásný penzion v klidné oblasti, ideální poloha pro pěší turistiku a procházky do lyžařských areálů Svatý Petr a Stoh. Místo je velmi čisté a útulné a majitelé jsou velmi milí, vřele doporučuji!' },
  { name: 'Diana', via: 'de', text: 'Byli jsme zde potřetí na dva týdny. Tak se nám tu líbilo, že si to zarezervujeme znovu i příští rok. Skvělé ubytování a milá rodina.' },
  { name: 'Kristýna V.', text: 'Útulný a čistý pension, kde najdete vše, co potřebujete ke spokojenému pobytu. Vybavená kuchyňka, sociální zařízení na pokoji, soukromí a krásné výhledy z okna.' },
  { name: 'Roland O.', via: 'sk', text: 'Pěkný a útulný penzion, super pokoje s vlastními WC a sprchami, lze opékat či zapůjčit gril, pěkný výhled na okolní přírodu.' },
  { name: 'Miroslav Š.', text: 'Klidný penzion rodinného typu uprostřed Svatého Petra, obsluha na výbornou.' },
];
