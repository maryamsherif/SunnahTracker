declare module './.wuchale/main.proxy.js' {
  import type { CatalogModule } from 'wuchale/runtime';

  export const loadIDs: string[];
  export const key: string;
  export function loadCatalog(loadID: string, locale: string): CatalogModule;
}
