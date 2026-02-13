import { defineConfig, gemini } from 'wuchale';
import { adapter as jsx } from '@wuchale/jsx';

export default defineConfig({
  locales: ['en', 'ar'],
  ai: gemini({ apiKey: 'env' }),
  adapters: {
    main: jsx({
      loader: 'react',
      files: {
        include: ['src/**/*.{ts,tsx}'],
        ignore: ['**/*.d.ts'],
      },
      localesDir: './src/locales',
    }),
  },
});
