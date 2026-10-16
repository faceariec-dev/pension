type Cfg = {
  pricing: {
    winterMonths: number[];
    winter: { min: number; max: number };
    summer: { min: number; max: number };
    childDiscount: number;
    childDiscountMinAdults: number;
    cityTax: number;
    dog: { small: number; large: number };
    minNights: number;
    holidayFrom: string;
    holidayTo: string;
  };
  calc: Record<string, any>;
  form: Record<string, string>;
  interested: string;
  lang: 'cs' | 'en' | 'de';
};

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const cfg: Cfg = JSON.parse($('cfg').textContent || '{}');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- menu ---------- */
const mb = $('menu-btn');
const mn = $('mnav');
function menu(open: boolean) {
  mb.setAttribute('aria-expanded', String(open));
  mn.hidden = !open;
}
mb.addEventListener('click', () => menu(mn.hidden));
mn.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => menu(false)));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !mn.hidden) {
    menu(false);
    mb.focus();
  }
});
matchMedia('(min-width:1101px)').addEventListener('change', (e) => e.matches && menu(false));

/* ---------- scroll spy ---------- */
const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('nav a.lnk')];
const secs = ['o-nas', 'ubytovani', 'galerie', 'okoli', 'nabidky', 'cenik', 'kontakt'].map((id) => $(id));
let ticking = false;
function spy() {
  ticking = false;
  const y = window.scrollY + window.innerHeight * 0.35;
  let cur: string | null = null;
  secs.forEach((s) => {
    if (s.offsetTop <= y) cur = s.id;
  });
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = 'kontakt';
  navLinks.forEach((a) => {
    if (a.getAttribute('href') === '#' + cur) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
}
const onScroll = () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(spy);
  }
};
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
spy();

/* ---------- back to top ---------- */
const totop = $('totop');
const toggleTop = () => {
  totop.hidden = window.scrollY < 700;
};
window.addEventListener('scroll', toggleTop, { passive: true });
totop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  setTimeout(() => $('menu-btn').focus({ preventScroll: true }), reduced ? 0 : 400);
});
toggleTop();

/* ---------- gallery lightbox ---------- */
const G = [...document.querySelectorAll<HTMLButtonElement>('.g[data-g]')];
const lb = $('lb');
const lbImg = $<HTMLImageElement>('lb-img');
let gi = 0;
let opener: HTMLElement | null = null;
function lbShow(i: number) {
  gi = (i + G.length) % G.length;
  const g = G[gi];
  lbImg.src = g.dataset.full || '';
  lbImg.alt = g.dataset.cap || '';
  $('lb-cap').textContent = g.dataset.cap || '';
  lb.hidden = false;
  document.body.style.overflow = 'hidden';
  // preload neighbours
  [gi - 1, gi + 1].forEach((n) => (new Image().src = G[(n + G.length) % G.length].dataset.full || ''));
}
function lbClose() {
  lb.hidden = true;
  document.body.style.overflow = '';
  opener?.focus();
}
G.forEach((g, i) =>
  g.addEventListener('click', () => {
    opener = g;
    lbShow(i);
    $('lb-x').focus();
  }),
);
$('lb-x').addEventListener('click', lbClose);
$('lb-prev').addEventListener('click', () => lbShow(gi - 1));
$('lb-next').addEventListener('click', () => lbShow(gi + 1));
lb.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).id === 'lb') lbClose();
});
document.addEventListener('keydown', (e) => {
  if (lb.hidden) return;
  if (e.key === 'Escape') lbClose();
  else if (e.key === 'ArrowLeft') lbShow(gi - 1);
  else if (e.key === 'ArrowRight') lbShow(gi + 1);
  else if (e.key === 'Tab') {
    const f = [...lb.querySelectorAll<HTMLElement>('button')];
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
let sx = 0;
let sy = 0;
lb.addEventListener('touchstart', (e) => {
  sx = e.touches[0].clientX;
  sy = e.touches[0].clientY;
}, { passive: true });
lb.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - sx;
  const dy = e.changedTouches[0].clientY - sy;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) lbShow(gi + (dx < 0 ? 1 : -1));
}, { passive: true });

/* ---------- offers -> form ---------- */
document.querySelectorAll<HTMLButtonElement>('[data-offer]').forEach((b) =>
  b.addEventListener('click', () => {
    ($('f-msg') as HTMLTextAreaElement).value = cfg.interested + b.dataset.offer;
    $('kontakt').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    setTimeout(() => $('f-from').focus({ preventScroll: true }), reduced ? 0 : 500);
  }),
);

/* ---------- price calculator ---------- */
const P = cfg.pricing;
const L = cfg.calc;
const iso = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const parse = (v: string) => {
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const fmt = (n: number) => Math.round(n).toLocaleString('cs-CZ').replace(/\s/g, ' ') + ' Kč';
const nightsWord = (n: number) => (n === 1 ? L.nights.one : n < 5 ? L.nights.few : L.nights.many);
const val = (id: string) => ($(id) as HTMLInputElement).value;

function nightsOf(): string[] | null {
  const a = val('f-from');
  const b = val('f-to');
  if (!a || !b) return null;
  const out: string[] = [];
  for (let d = parse(a); iso(d) < b && out.length < 400; d.setDate(d.getDate() + 1)) out.push(iso(d));
  return out;
}
const isHoliday = (k: string) => {
  const md = k.slice(5);
  return md >= P.holidayFrom || md <= P.holidayTo;
};

function sum() {
  const el = $('calc');
  const ns = nightsOf();
  const est = $('f-estimate') as HTMLInputElement;
  if (!ns || !ns.length) {
    el.innerHTML = `<div class="ct">${L.ct}</div><p class="warn">${L.bad}</p>`;
    est.value = '';
    return;
  }
  const n = ns.length;
  const A = Math.max(1, Math.floor(+val('f-adults')) || 1);
  const K = Math.max(0, Math.floor(+val('f-kids')) || 0);
  const dogKey = val('f-dog') as 'none' | 'small' | 'large';
  const dogNight = dogKey === 'none' ? 0 : P.dog[dogKey];
  const kr = A >= P.childDiscountMinAdults ? 1 - P.childDiscount : 1;
  let lo = 0;
  let hi = 0;
  let w = 0;
  ns.forEach((k) => {
    const win = P.winterMonths.includes(+k.slice(5, 7));
    if (win) w++;
    const r = win ? P.winter : P.summer;
    lo += r.min * (A + K * kr);
    hi += r.max * (A + K * kr);
  });
  const tax = P.cityTax * A * n;
  const dg = dogNight * n;
  const sea = w === n ? L.w : w === 0 ? L.s : L.ws;
  const xm = ns.some(isHoliday);
  let warn = xm ? `<p class="warn">${L.xmas}</p>` : '';
  if (n < P.minNights) warn += `<p class="warn">${L.min}</p>`;
  const who = `${A} ${L.ad}${K ? ` + ${K} ${L.kd}` : ''}`;
  const totalTxt = `${fmt(lo + tax + dg)} – ${fmt(hi + tax + dg)}`;
  el.innerHTML = `<div class="ct">${L.ct}</div>
   <div class="row"><span>${n} ${nightsWord(n)} · ${sea}</span><span></span></div>
   <div class="row"><span>${L.acc} (${who})</span><span>${fmt(lo)} – ${fmt(hi)}</span></div>
   <div class="row"><span>${L.tax}</span><span>${fmt(tax)}</span></div>
   ${dg ? `<div class="row"><span>${L.dog}</span><span>${fmt(dg)}</span></div>` : ''}
   <div class="total"><span>${L.tot}${xm ? ' *' : ''}</span><span>${totalTxt}</span></div>
   ${warn}<p class="note">${L.note}</p>`;
  est.value = `${n} ${nightsWord(n)}, ${who}: ${totalTxt}${xm ? ' (Vánoce/Silvestr: individuální ceny)' : ''}`;
}
['f-from', 'f-to', 'f-adults', 'f-kids', 'f-dog'].forEach((id) => $(id).addEventListener('input', sum));

// date constraints
const today = iso(new Date());
($('f-from') as HTMLInputElement).min = today;
($('f-to') as HTMLInputElement).min = today;
$('f-from').addEventListener('change', () => {
  const a = val('f-from');
  if (!a) return;
  const next = parse(a);
  next.setDate(next.getDate() + 1);
  ($('f-to') as HTMLInputElement).min = iso(next);
  if (val('f-to') && val('f-to') <= a) {
    ($('f-to') as HTMLInputElement).value = '';
    sum();
  }
});
sum();

/* ---------- form submit ---------- */
const form = $<HTMLFormElement>('enq');
($('f-ts') as HTMLInputElement).value = String(Date.now());
const errEl = $('f-err');
const btn = $<HTMLButtonElement>('f-submit');
function showErr(msg: string, fields: string[] = []) {
  errEl.textContent = msg;
  errEl.hidden = !msg;
  ['f-from', 'f-to', 'f-fn', 'f-tel', 'f-mail'].forEach((id) => $(id).removeAttribute('aria-invalid'));
  fields.forEach((id) => $(id).setAttribute('aria-invalid', 'true'));
  if (msg && fields.length) $(fields[0]).focus();
}
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const bad: string[] = [];
  if (!val('f-from')) bad.push('f-from');
  if (!val('f-to')) bad.push('f-to');
  if (!val('f-fn').trim()) bad.push('f-fn');
  if (!val('f-mail').trim() && !val('f-tel').trim()) bad.push('f-mail', 'f-tel');
  if (val('f-mail').trim() && !($('f-mail') as HTMLInputElement).validity.valid) bad.push('f-mail');
  if (bad.length) return showErr(cfg.form.invalid, bad);
  if (val('f-to') <= val('f-from')) return showErr(cfg.form.order, ['f-to']);
  showErr('');
  btn.disabled = true;
  btn.textContent = cfg.form.sending;
  try {
    const r = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'X-Requested-With': 'fetch', Accept: 'application/json' },
    });
    const j = await r.json().catch(() => null);
    if (r.ok && j && j.ok) {
      form.querySelectorAll<HTMLElement>('label, .calc, .frow, .err').forEach((x) => (x.hidden = true));
      const done = $('f-done');
      done.hidden = false;
      done.focus();
      return;
    }
    showErr((j && j.error) || cfg.form.err);
  } catch {
    showErr(cfg.form.err);
  }
  btn.disabled = false;
  btn.textContent = cfg.form.send;
});
