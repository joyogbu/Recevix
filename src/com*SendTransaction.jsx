import { useState } from 'react';
import {supabase} from '../lib/supabase.js';
import { FaLink, FaRegClone } from 'react-icons/fa';

function SendTransaction({closeUsdc}) {
	const [usdcformData, setUsdcFormData] = useState({
		send_address: "",
		send_amount: "",
	});

	const handleTransaction = (e) => {
		const name = e.target.name;
		const value = e.target.value;
		setUsdcFormData(prevData => ({...prevData, [name]: value}));
	}

	function sendUsdc(e) {
		e.preventDefault();
	}

	return (
		<div className="modal_overlay">
			<div className="modal_box">
				<h1>Send USDC</h1>
				<p>Address</p>
				<p><span className="wallet_balance_amount">Balance:</span><span className="wallet_balance_token"></span></p>
				<form onSubmit={sendUsdc}>
					<label>Send To:</label><br />
					<input name="send_address" placeholder="Enter the recipient wallet address" value={usdcformData.send_address} type="text" onChange={handleTransaction} /><br />
					<label>Amount (USDC)</label><br />
					<input name="send_amount" placeholder="Enter Amount to send" value={usdcformData.send_amount} type="number" min="0" step="0.01" onChange={handleTransaction} required /><br /><br />
					<button value="Send" type="submit" id="send_usdc_btn">Send<FaLink /></button><br /><br />
				</form>
			</div>
		</div>
	);
}

export default SendTransaction;
