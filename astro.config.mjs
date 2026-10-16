import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.pension48.cz',
  output: 'static',
  // Testovací nasazení do podsložky: SITE_BASE=/test npm run build (viz README)
  base: process.env.SITE_BASE || '/',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'cs', locales: { cs: 'cs', en: 'en', de: 'de' } },
      filter: (page) => !page.includes('/404'),
    }),
  ],
});
