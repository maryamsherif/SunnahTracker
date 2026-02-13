import { defineConfig, gemini } from 'wuchale';
import { adapter as jsx } from '@wuchale/jsx';

export default defineConfig({
  locales: ['en', 'ar'],
  ai: gemini({ apiKey: 'env', batchSize: 100, parallel: 1 }),
  adapters: {
    main: jsx({
      loader: 'custom',
      files: {
        include: ['src/**/*.{ts,tsx}'],
        ignore: ['**/*.d.ts'],
      },
      localesDir: './src/locales',
    }),
  },
});
