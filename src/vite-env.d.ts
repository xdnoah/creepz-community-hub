/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // Optional NFT API keys
  readonly VITE_OPENSEA_API_KEY?: string
  readonly VITE_RESERVOIR_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
