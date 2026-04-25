import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import critters from 'astro-critters';

export default defineConfig({
  site: 'https://ballaconsulting.com',
  output: 'server',
  adapter: cloudflare({ imageService: 'compile' }),
  build: {
    format: 'file',
  },
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/deals'),
    }),
    critters(),
  ],
});
