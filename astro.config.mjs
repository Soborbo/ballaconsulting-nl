import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ballaconsulting.com',
  output: 'static',
  build: {
    format: 'file',
  },
  vite: {
    build: {
      cssMinify: false,
    },
  },
});
