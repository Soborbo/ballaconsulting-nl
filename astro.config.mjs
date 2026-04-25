import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import critters from 'astro-critters';

export default defineConfig({
  site: 'https://ballaconsulting.com',
  output: 'static',
  build: {
    format: 'file',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/deals'),
    }),
    critters(),
  ],
});
