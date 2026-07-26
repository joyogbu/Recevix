// import modules
import { useEffect } from 'react';
import { useSwitchChain, useAccount } from 'wagmi';
import { arcTestnet } from '../arcTestnet.jsx';

//declare function to check wallet chain
function WalletChecker() {
	const {isConnected, chainId} = useAccount();
	const {switchChainAsync} = useSwitchChain();
	useEffect(() => {
		//if no wallet connected, do nothing
		if (!isConnected) return;
		
		//if user is not on Arc, switch chain
		if (chainId !== 1) {
			switchChainAsync({chainId: 1,}).catch((err) => {
				console.log("Switch error:", err);
		
			});
		}
	}, [isConnected, chainId, switchChainAsync])

	//return null;
}

export default WalletChecker;
