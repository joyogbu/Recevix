import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useWallet } from '../Wallet.jsx';
import { supabase } from '../lib/supabase.js';
import { escrowAbi } from "../abi/escrowAbi";

function Receipt() {
	const { handleConnect, address, isConnected, disconnect, chainId } = useWallet();

	let shortAddress;
        if (address) {
                shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
        }

	const { writeContractAsync } = useWriteContract();

	const [releaseHash, setReleaseHash] = useState(null);
	
	const [searchParams] = useSearchParams();
	const invoiceId = searchParams.get("invoiceId");
	const txHash = searchParams.get("txHash");


	const [receipt, setReceipt] = useState(null);
	console.log(invoiceId);
	console.log(txHash);

	useEffect(() => {
	    const loadReceipt = async () => {
		const { data, error } = await supabase
		    .from("invoices")
		    .select("*")
		    .eq("invoice_id", invoiceId)
		    .single();

		    if(error) {
			    return (
				    <>
				    <p>Unable to generate receipt</p>
				    </>
			    );
		    }
		    setReceipt(data);
	    }
	    loadReceipt();
	}, [invoiceId]);

	const reconnectWallet = async() => {
		e.preventdefault();
		return;
	}
		

	const ESCROW_ADDRESS = import.meta.env.VITE_ESCROW_ADDRESS;

	const releaseFunds = async () => {
		if (!isConnected) {
			alert("Please connect your wallet.");
			return;
		}

		try {
			const hash = await writeContractAsync({
				address: ESCROW_ADDRESS,
				abi: escrowAbi,
				functionName: "release",
				args: [invoiceId]
			});
			console.log("Release Tx:", hash);
			setReleaseHash(hash);
		} catch (error) {

			console.log(error);
		}
	};

	const { isSuccess: releaseSuccess } = useWaitForTransactionReceipt({
		hash: releaseHash,
	});


	useEffect(() => {
		if (!releaseSuccess || !releaseHash) return;

		const updateInvoice = async () => {
			const { error } = await supabase
				.from("invoices")
				.update({
					status: "Paid",
					tx_hash: releaseHash,
					released_at: new Date().toISOString()
				})
				.eq("invoice_id", invoiceId);
			if (error) {
				console.log(error);
				return;
			}
			
			alert("Funds released successfully!");
		};
		updateInvoice();
	}, [releaseSuccess, releaseHash, invoiceId
	]);

	/*if(error) {
		return (
			<>
				<p>Unable to generate receipt</p>
			</>
		);
	}*/

	return (
		<div className="receipt_body">
			<div className="receipt_div">
				<h2>Transaction Receipt</h2>
				<span>🎉</span>	
				<h3>Payment Sent!</h3>
				<p>Your payment has been deposited into escrow. The merchant will receive funds after you confirm that the goods or services has been delivered.</p>
				<div className="receipt_details">
					<p><span>Transaction Date:  </span><span className="data_details">{receipt?.tx_hash ? new Date(receipt?.paid_at).toLocaleString() : ""}</span></p>
					<p><span>Recipient Wallet:  </span><span className="data_details">{receipt?.merchant_wallet}</span></p>
					<p><span>Recipient:  </span><span className="data_details">{receipt?.merchant_name}</span></p>
					<p><span>Amount:  </span><span className="data_details">{receipt?.amount}  USDC</span></p>
					<p><span>Description:  </span><span className="data_details">{receipt?.description}</span></p>
					<p><span>Status:  </span><span className="data_details">{receipt?.status}</span></p>
					<p><span>Reference:  </span><span className="data_details">   <a target="_blank" href={`https://testnet.arcscan.app/tx/${txHash}`}> {txHash ? `${ txHash.slice(0, 6)}...${txHash.slice(-4)}` : ""}</a></span></p>
					<p><span>Reference:  </span><span className="data_details">   <a target="_blank" href={`https://testnet.arcscan.app/tx/${releaseHash}`}> {releaseHash ? `${ releaseHash.slice(0, 6)}...${releaseHash.slice(-4)}` : ""}</a></span></p>
					<hr /><br />
				</div>
				<br /><br />
				<button id="release_usdc_btn" onClick={releaseFunds} disabled={releaseSuccess || receipt?.status==="Paid"}> {receipt?.status === "Paid" ? "Funds Released" : "Release Funds"}</button>
				<br />
				{!isConnected && (
					<div className="wallet_warning">Wallet disconnected. Please reconnect the same wallet to continue.
					</div>
				)}

				<button type="button" className="reconnect_wallet" onClick={handleConnect}>{isConnected ? shortAddress : "Connect"}</button>
				<br />
				<br />
			</div>
		</div>
	);
}

export default Receipt;
