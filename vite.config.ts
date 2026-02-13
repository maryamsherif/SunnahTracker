import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { wuchale } from '@wuchale/vite-plugin';

export default defineConfig({
  plugins: [wuchale(), react()],
});
