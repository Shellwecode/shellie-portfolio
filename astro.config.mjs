// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { createLogger } from 'vite';

import react from '@astrojs/react';
import copyEditor from './src/dev/copy-editor.mjs';

// Browsers abort video range requests constantly (hover-video cards, the
// greeting webm), which the dev server logs as ECONNRESET — harmless noise.
const logger = createLogger();
const originalError = logger.error;
logger.error = (msg, options) => {
  if (msg.includes('ECONNRESET') || msg.includes('EPIPE')) return;
  originalError(msg, options);
};

// https://astro.build/config
export default defineConfig({
  site: 'https://www.shelliehxx.com',
  integrations: [mdx(), sitemap(), react(), copyEditor()],
  vite: {
    plugins: [tailwindcss()],
    customLogger: logger,
    // Pre-bundle the animation deps at boot — discovering them mid-session
    // (the door's `motion`, a director's `dialkit`) re-runs the optimizer
    // and the dev server 503s those modules until the next restart.
    optimizeDeps: { include: ['motion', 'dialkit', 'react', 'react-dom'] },
  },
  markdown: {
    shikiConfig: {
      // Soft, warm-leaning syntax theme for any code you embed
      theme: 'vitesse-light',
      wrap: true,
    },
  },
});