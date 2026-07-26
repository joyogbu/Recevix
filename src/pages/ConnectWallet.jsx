import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import {arcTestnet} from '../config/arcTestnet.jsx';
import {baseSepolia} from 'wagmi/chains';

//function ConnectWallet() {
//const injectedConnector = injected();
function ConnectWallet() {
	const {address, isConnected} = useAccount();
	const { connectAsync } = useConnect();
	const { disconnect } = useDisconnect();
	const { switchChainAsync } = useSwitchChain();
	const { chainId } = useAccount();
	const { status } = useAccount();
	
	if (isConnected) {
		
		return (
			<div id="disconnect_wallet">
				<p>{address}</p>
				<p>{chainId}</p>
				<button onClick = { disconnect } >Disconnect wallet</button>
			</div>
		);
		console.log("connection status:", isConnected);
		console.log("is it connected:", isConnected)
	}

	async function handleConnect() {
		try {
			await connectAsync({connector: injected(), });
			if ((chainId === undefined) || (chainId !== arcTestnet.id)) {
				await switchChainAsync ({chainId: arcTestnet.id, });
			}
			console.log("Connected:", isConnected);
			console.log("chainid:", chainId);
			console.log("status:", status);
		} catch (error) {
			console.log(error);
		}
	}
        return (
		<div className="modal_overlay">
			<div className="connect_wallet_modal">
				<h1>Welcome to JoPay</h1>
				<p>Thank you for verifying your email address. please connect your wallet</p>
				<button id="wallet_connect" onClick= { handleConnect }>Connect Wallet</button>
			</div>
		</div>
	);
}

export default ConnectWallet;
