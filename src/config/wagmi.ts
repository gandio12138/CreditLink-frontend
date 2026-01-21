import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, baseSepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '';

// 构建连接器列表，只有配置了 projectId 才启用 WalletConnect
const connectors = projectId
  ? [injected(), walletConnect({ projectId })]
  : [injected()];

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, baseSepolia],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
});
