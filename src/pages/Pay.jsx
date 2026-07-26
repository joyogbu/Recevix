import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import Footer from '../components/Footer.jsx';
import image4 from '../images/image4.png';
import { useWallet } from '../Wallet.jsx';
import { usdcAbi } from '../abi/usdcabi';

import logo from '../images/logo.png';

function PayInvoice() {
	const {invoiceId} = useParams();
	
	const [invoice, setInvoice] = useState(null);
	const [error, setError] = useState(null);
	const [checked, setChecked] =useState(false);
	const { writeContractAsync } = useWriteContract();
	const [txHash, setTxHash] = useState(null);
	const [isClicked, setIsClicked] = useState(false);

	const navigate = useNavigate();

	useEffect(() => {
		const fetchInvoice = async () => {
			const { data, error } = await supabase
				.from('invoices')
				.select("*")
				.eq("invoice_id", invoiceId)
				.single();

			if(error) {
				setError(error);
			} else {
				setInvoice(data);
			}
			console.log("data:", data)
			
		};
		fetchInvoice();
		}, [invoiceId]
	)
	

	const { handleConnect, address, isConnected, disconnect, chainId } = useWallet();
	let shortAddress;
	if (address) {
		shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	const [isOpen, setIsOpen] = useState(false);
	function toggle() {
		setIsOpen(!isOpen);
	}
	
	//check if invoice has already been paid on page reload
	useEffect(() => {
		if(invoice?.tx_hash) {
			setTxHash(invoice.tx_hash);
		}
	}, [invoice])

	//const USDC_ADDRESS =
 // "0x3600000000000000000000000000000000000000"
	const USDC_ADDRESS = import.meta.env.VITE_ARC_USDC_ADDRESS;

	const payInvoice = async (e) => 
	{
		e.preventDefault();
		try {
			const hash = await writeContractAsync({
				address: USDC_ADDRESS,
				abi: usdcAbi,	
				functionName: "transfer",
				args: [
					invoice.merchant_wallet,
					parseUnits(invoice.amount.toString(), 6)
				]
			});
			console.log("Tx_Ha", hash);
			setTxHash(hash);

		} catch(error) {
			console.log("Paymet error:", error);
		}
	}
	
	const { isLoading, isSuccess } = useWaitForTransactionReceipt({
		hash: txHash,
	});

	useEffect(() => {
		const updateInvoice = async () => {
			if(!isSuccess && !txHash) return
			if(invoice.status === "Paid") return
			
			const {error} = await supabase.from('invoices').update({
				status: 'Paid',
				tx_hash: txHash,
				paid_at: new Date().toISOString()
			})
			.eq('invoice_id', invoiceId);
			if(error) {
				console.log("update error:", error);
			}

			console.log("Paymentbsuccessful");

			//navigate to receipt page
			setTimeout(() => {
				navigate(`/pay/receipt?invoiceId=${invoiceId}&txHash=${txHash}`);
			}, 2000);
		}
		updateInvoice();
	}, [txHash, isSuccess, invoiceId])

	const buttonStyle = {
		backgroundColor: isClicked ? 'lightblue' : 'Cornflowerblue',
		cursor:'pointer',
	}

	if(!invoice) {
		return (
			<p id="loading_invoice">Loading Invoice...</p>
		);
	}

	


	return (
		<div className="pay_div">
			<div className="pay_div_image"><img id="pay_div_logo" src ={logo} /></div>
			<div className="pay_floated_right">
				<span id="conn_wallet"><button id="pay_connect_btn" onClick= { handleConnect }>{isConnected ? shortAddress : "Connect Wallet" }</button></span>
			</div>		
			<div className={isOpen ? "sidemenu open" : "floated"}>
				<button onClick={ toggle } id="pay_menu_btn">{isOpen ? "X" : "☰" }</button>
				<br />
				{isOpen && <div>
					<p>View History</p>
					<p>Settings</p>
					<div class="wallet_balance"><p>Wallet Balance</p><p>23,000 USDC</p></div>
					<br /><br />
					<p><button id="_disconnect" type="button" onClick={disconnect} >Disconnect</button></p>
				</div>}
			</div>
			

			<div id ="pay_invoice_details">
				<img src={image4} id="usdc_img_b" />
				<h2>Welcome to JoPay</h2>
				<h3>Send USDC instantly</h3>
				<p>Your Invoice</p>
				<p>chain: {chainId}</p>
				<p>txhash: {txHash} </p>
				<form onSubmit={ payInvoice }> 
					<input name="id" type="text" value={invoiceId} readOnly/>
					<label>Amount</label><br />
					<input type="number" name="invoice_amount" value={ invoice.amount } readOnly /><br /><br />
					<label>Description</label><br />
					<input readOnly name="invoice_description" value={ invoice.description } /><br /><br />
					<label>Receiver</label><br />
					<input name="invoice_merchant_name" readOnly value={ invoice.merchant_name } /><br /><br />
					<label>Receiver Wallet</label><br />
					<input name="merchant_wallet_address" readOnly value={ invoice.merchant_wallet } /><br /><br />
					<label>Network</label><br />
					<input value="Arc testnet" readOnly /><br />
					<br />
					<input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
					<span id="_agreement">I agree with JoPay <a href="#">Terms and conditions</a></span><br /><br />
					<button id ="pay_btn" type="submit" disabled={!isConnected || !checked || !!txHash || isLoading} onClick={() => setIsClicked(!isClicked)}> {isSuccess ? "Invoice Paid"
						: isLoading ? "Pocessing..." 
						: txHash
						? "...Waiting for confirmation"
						: "Pay with USDC"}</button><br />
					<p id="_note">All the transactions are performed on the Arc Testnet Network</p>
	
				</form>
			</div>
			
			<Footer />
		</div>
	);
}

export default PayInvoice
