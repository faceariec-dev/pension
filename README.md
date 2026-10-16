# Pension 48 – web (pension48.cz)

Statický jednostránkový web (Astro) ve třech jazycích: `/` (CZ), `/en/`, `/de/`. Formulář odesílá malý PHP skript `poptavka.php` přes SMTP. Hosting: Forpsi (PHP), nasazení přes GitHub Actions + rsync po SSH.

## Lokální spuštění

```bash
npm ci
npm run dev        # vývoj na http://localhost:4321
npm run build      # statický výstup do dist/
npm run preview    # náhled sestaveného webu (PHP formulář lokálně nefunguje)
```

## Co kde změnit

| Co | Kde |
|---|---|
| **Ceny a pravidla kalkulačky** (sezóny, rozpětí, sleva dětí, městský poplatek, pes, minimum nocí, Vánoce/Silvestr) | `src/config/pricing.ts` – ceník na webu i kalkulačka čerpají odsud |
| **Texty** (CZ/EN/DE) | `src/i18n/cs.ts`, `en.ts`, `de.ts` (stejná struktura) |
| **Recenze hostů** | `quotes` v `src/i18n/index.ts` |
| **Kontakty, odkazy na portály s hodnocením** | `src/config/site.ts` (`reviewLinks`, zatím `#`) |
| **Fotky** | `src/assets/photos/` (názvy se používají v `src/components/Page.astro`). Astro je převede na AVIF/WebP se `srcset`. |
| **Staré adresy WordPressu → nové** | `public/.htaccess` |
| **OG obrázek a ikony** | `npm run assets` (generuje `public/og.jpg`, favicony) |

Ve „Častých dotazech“ jsou odpovědi se štítkem **doplnit** (`todo: true` v `cs/en/de.ts`). Po doplnění odpovědi štítek smažte (`todo: true` odstranit).

## Formulář (`public/poptavka.php`)

Validace, honeypot, časová pojistka (rychlé odeslání < 3 s se ignoruje), odeslání přes SMTP (PHPMailer v `public/_mail/`).

SMTP heslo **není v repozitáři**. Postup:
1. Ve Forpsi založte schránku např. `web@pension48.cz`.
2. Zkopírujte `server/poptavka-config.example.php` jako `poptavka-config.php`, vyplňte údaje (host, port, uživatel, heslo).
3. Nahrajte ho **jednou ručně přes WinSCP** do stejné složky jako `poptavka.php` (nebo o úroveň výš, mimo veřejnou složku – skript hledá oba případy). `.htaccess` ho před přímým stažením chrání, nasazení ho nepřepíše ani nesmaže.
4. Vyzkoušejte odeslání poptávky z webu.

## Automatické nasazení (GitHub Actions)

Workflow `.github/workflows/deploy.yml` se spustí při každém pushi do `main` (nebo ručně: Actions → *Deploy na Forpsi* → *Run workflow*): `npm ci` → `npm run build` → `rsync` složky `dist/` na server po SSH.

- `rsync` běží **bez `--delete`** pro celý web, takže nic cizího (WordPress, `poptavka-config.php`) nesmaže ani nepřepíše. Pouze složka `_astro/` (hashované soubory webu) se synchronizuje se smazáním starých verzí.
- Pokud by na serveru `rsync` nebyl, nahraďte krok nasazení SFTP (např. akce `SamKirkland/FTP-Deploy-Action` s protokolem sftp, případně `lftp`).

### Nejdřív testovací nasazení na test.pension48.cz

1. Ve Forpsi vytvořte subdoménu `test.pension48.cz` s vlastní složkou a zapněte pro ni HTTPS (certifikát). Poznamenejte si cestu k její složce.
2. Secret `DEPLOY_PATH` nastavte na tuto složku. Proměnnou `SITE_BASE` **nenastavujte** (ta je jen pro variantu s podsložkou).
3. Spusťte nasazení (push do `main` nebo *Run workflow*). `.htaccess` na subdoméně neindexuje web (`X-Robots-Tag: noindex`) a nepřesměrovává ji na `www`.
4. `poptavka-config.php` nahrajte do složky subdomény (nebo o úroveň výš).
5. **Ostrý provoz:** `DEPLOY_PATH` přepněte na kořen hlavního webu a nasaďte znovu. Subdoménu pak můžete zrušit. WordPress mažte až po kontrole.

*Varianta podsložky* (`www.pension48.cz/test/`): repozitářová proměnná `SITE_BASE=/test` (Settings → Secrets and variables → Actions → Variables), `DEPLOY_PATH` na podsložku; kořenový `.htaccess` se pak nenahrává. Lokálně: `SITE_BASE=/test npm run build`.

### 1) SSH klíč jen pro nasazení

Na svém počítači (ne na serveru):
```bash
ssh-keygen -t ed25519 -f pension48-deploy -C "github-deploy-pension48" -N ""
```
Vznikne `pension48-deploy` (soukromý) a `pension48-deploy.pub` (veřejný).

### 2) Veřejný klíč na Forpsi

V administraci Forpsi (webhosting → *SSH přístup* / *FTP a SSH*) zapněte SSH a případně klíč vložte přímo tam. Jinak se přihlaste (SSH heslem nebo WinSCP/terminál) a doplňte řádek z `pension48-deploy.pub`:
```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo 'ssh-ed25519 AAAA… github-deploy-pension48' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```
Ověřte `ssh -i pension48-deploy -p PORT UZIVATEL@SERVER` a že na serveru funguje `rsync --version`. Po ověření zvažte vypnutí přihlášení heslem, pokud to Forpsi dovolí.

### 3) Otisk serveru (`known_hosts`)

Z vlastního počítače:
```bash
ssh-keyscan -p PORT SERVER
```
Otisk porovnejte s hodnotou v administraci Forpsi (nebo `ssh-keygen -lf` nad získaným klíčem) a celý řádek(y) uložte do secretu `SSH_KNOWN_HOSTS`. Workflow používá `StrictHostKeyChecking=yes`.

### 4) GitHub Secrets

Repozitář → *Settings → Secrets and variables → Actions → New repository secret*:

| Secret | Obsah |
|---|---|
| `SSH_HOST` | adresa SSH serveru z administrace Forpsi |
| `SSH_PORT` | port SSH (z administrace; často 22) |
| `SSH_USER` | uživatel SSH / FTP účtu |
| `SSH_PRIVATE_KEY` | celý obsah souboru `pension48-deploy` včetně řádků `BEGIN/END` |
| `SSH_KNOWN_HOSTS` | výstup `ssh-keyscan` (viz výše) |
| `DEPLOY_PATH` | cílová složka webu na serveru, např. `/www/domains/pension48.cz/www` – **zkontrolujte přesnou cestu v administraci Forpsi** |

Doporučení: nejdřív nasaďte do testovací podsložky (viz výše), ověřte web a až pak přepněte na kořen.

## Přechod z WordPressu

1. **Záloha WordPressu**: soubory (celá složka webu přes WinSCP/SSH) a databáze (phpMyAdmin → Export, nebo `mysqldump`). Uložte mimo hosting.
2. Seznam starých adres (sitemapa WordPressu) porovnejte s přesměrováními v `public/.htaccess` a doplňte, co chybí.
3. Nahrajte `poptavka-config.php` (viz výše) a otestujte nasazení do testovací podsložky.
4. Nasazení do kořene: `.htaccess` z nového webu nahradí WordPress `.htaccess`. Stará složka WordPressu zůstává na disku, ale web ji nezobrazuje (`DirectoryIndex index.html` je před `index.php`).
5. **Kontrola**: všechny 3 jazyky, formulář (doručení e-mailu), `tel:`/`mailto:` odkazy, staré adresy (301), HTTPS a přesměrování na `www`, `sitemap-index.xml`, `robots.txt`.
6. Po několika dnech bez problémů **smažte WordPress** (soubory `wp-*`, `index.php`, …) a jeho MySQL databázi. Do té doby ho nemažte.
7. V Google Search Console odešlete `https://www.pension48.cz/sitemap-index.xml`.

## Doplnit před spuštěním

- Odpovědi v častých dotazech (příjezd/odjezd, povlečení a ručníky, storno, zimní příjezd autem).
- Odkazy na profily penzionu na Google, Booking.com, Tripadvisor, e-chalupy.cz (`src/config/site.ts`).
- Potvrzení poplatku za psa (100/200 Kč za noc, `pricing.ts` a texty).
- Údaje SMTP (`poptavka-config.php`).
