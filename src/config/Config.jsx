import { createConfig, http } from 'wagmi';
import { arcTestnet } from './arcTestnet.jsx';
import { injected } from 'wagmi/connectors';
import { mainnet, sepolia, baseSepolia } from 'wagmi/chains';

export const config = createConfig({
	chains: [arcTestnet],

	transports: {
		[arcTestnet.id]: http("https://rpc.testnet.arc.network"),
	},
})
