import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import {arcTestnet} from './config/arcTestnet.jsx'
import {baseSepolia} from 'wagmi/chains'

export function useWallet() {
	const {address, isConnected} = useAccount();
	const { connectAsync } = useConnect();
	const { disconnect } = useDisconnect();
	const { switchChainAsync } = useSwitchChain();
        const { chainId } = useAccount();
	//const { status } = useAccount();
	async function handleConnect() {
		if (isConnected) {
			return 
		}
		try {
			await connectAsync({connector: injected(), });

			if (chainId !== arcTestnet.id) {
				await switchChainAsync ({chainId: arcTestnet.id, }
);
			}
		} catch (error) {
			console.log(error);
		}
	}
	return {
		handleConnect,
		address,
		isConnected,
		disconnect,
		chainId
	};
}
