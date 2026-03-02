import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = '8a236a779df8d18db0e04bbb35e5d708'; // Get free from walletconnect.com

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [injected(), walletConnect({ projectId })],
  transports: { [baseSepolia.id]: http() },
});
