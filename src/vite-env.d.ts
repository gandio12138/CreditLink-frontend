/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WALLET_CONNECT_PROJECT_ID?: string;
  readonly VITE_SEPOLIA_LENDING_POOL_ADDRESS?: string;
  readonly VITE_SEPOLIA_RISK_REGISTRY_ADDRESS?: string;
  readonly VITE_SEPOLIA_PRICE_ORACLE_ADDRESS?: string;
  readonly VITE_SEPOLIA_INCENTIVE_CONTROLLER_ADDRESS?: string;
  readonly VITE_SEPOLIA_TREASURY_ADDRESS?: string;
  readonly VITE_SEPOLIA_USDT_ADDRESS?: string;
  readonly VITE_SEPOLIA_USDC_ADDRESS?: string;
  readonly VITE_SEPOLIA_WETH_ADDRESS?: string;
  readonly VITE_SEPOLIA_WBTC_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
