import { useState } from 'react';
import { isAddress } from "viem";
import { FaLink } from 'react-icons/fa';
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import { supabase } from '../lib/supabase.js';
import { MerchantProvider, useMerchant } from '../auth/MerchantContext.jsx';
function SendTransaction({ closeUsdc }) {

    const sdk = new W3SSdk({
	appSettings: {
	    appId: import.meta.env.VITE_CIRCLE_APP_ID,
	},
    });

    const [usdcformData, setUsdcFormData] = useState({
        send_address: "",
        send_amount: "",
    });

    const [sendStatus, setSendStatus] = useState(null);
    const [sendStatusType, setSendStatusType] = useState("");
    const [isBusy, setIsBusy] = useState(false);
    const [buttonState, setButtonstate] = useState("Send");
    const [txHash, setTxHash] = useState("");
    
    //get merchants data
    const {merchant, walletBalance, loadWalletBalance} = useMerchant();
    const walletAddress = merchant?.circle_wallet_address;
    const trimAddress = walletAddress ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}` : "";

    const handleTransaction = (e) => {
        const name = e.target.name;
        const value = e.target.value;

        setUsdcFormData(prevData => ({...prevData, [name]: value, }));
    };

    async function sendUsdc(e) {
        e.preventDefault();
	setIsBusy(true);
	setButtonstate("Loading...");
	//check form inputs
	if(!usdcformData.send_address.trim() || !usdcformData.send_amount) {
	    setSendStatus("Please enter the recipient address and amount");
	    setSendStatusType("error");
	    return;
	}

	if (!isAddress(usdcformData.send_address)) {
		setSendStatus("Enter a valid wallet address.");
		setSendStatusType("error");
		setIsBusy(false);
		setButtonstate("Send");
		return;
	}

	const { data, error } = await supabase.functions.invoke("send-usdc", {
            body: {
		destinationAddress: usdcformData.send_address,
		amount: usdcformData.send_amount,
	    },
	});

	if (error) {
	    console.log(data);
	    console.log(error);

	    if (data?.error === "Insufficient USDC balance.") {
	    	setSendStatus("Insufficient USDC balance");
		setSendStatusType("error");
		setIsBusy(false);
		setButtonstate("Send");
	    	return;
	    }
	    setSendStatus(data?.error || "Insufficient USDC balance.");
	    setSendStatusType("error");
	    setIsBusy(false);
	    setButtonstate("Send");
		
    	    return;
	}

	/*if (data.success === false) {
		setSendStatus("Insufficent USDC Balance");
		return;
	}*/
	console.log("send usdc data:", data);

	sdk.setAuthentication({
	    userToken: data.userToken,
	    encryptionKey: data.encryptionKey,
	});

	sdk.execute(data.challengeId, async (error, result) => {
	    if (error) {
                console.error(error);
		setSendStatus("Transaction Cancelled");
		setSendStatusType("error");
		setIsBusy(false);
		setButtonstate("Send");
                return;
            }
	    setButtonstate("Processing...");

            console.log("Transfer Successful:", result);

	    if (result.status === "COMPLETE") {
		    setSendStatus("Confirming Transaction...");
		    setSendStatusType("pending");
		    await pollTransfer(data.challengeId);
	    }
        });
    }

    async function pollTransfer(challengeId) {
	setButtonstate("Confirming...");
	console.log("starting polling");
	console.log("challenge id:", challengeId);
        const { data, error } = await supabase.functions.invoke("confirm-usdc-transfer", {
            body: {
		    challengeId,
            },
        });

	if(error) {
		setSendStatus("Unable to confirm transaction");
		setSendStatusType("error");
		console.log("unable to confirm:", error);
		return;
	}
	console.log("poll data:", data);
	console.log("poll error:", error);
	if(data.status === "COMPLETE") {
		setSendStatus("Transfer Successful!");
		setSendStatusType("success");
		setButtonstate("Send");
		setTxHash(data.txHash);
		//refresh wallet balance
		await loadWalletBalance();
		//await closeUsdc();
		return;
	}

	if (data.status === "failed") {
	    setSendStatus("Transfer failed.");
	    setSendStatusType("error");
	    setButtonstate("Send");
	    return;
	}

	//still pending
	setTimeout(() => {
		pollTransfer(challengeId);
	}, 2000);

    }

    return (
        <div className="modal_overlay">
            <div className="modal_box">

	    <button type="button" onClick={closeUsdc}>X</button>
                <h3>{trimAddress}</h3>
	        <h1>{Number(walletBalance).toFixed(2) ?? "0"} USDC</h1>

                <form onSubmit={sendUsdc}>
	    	    <p className={`send_status ${sendStatusType}`}>{sendStatus}</p>
	    	    {txHash && <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" >View Transaction</a>}
	    	    <br />
                    <label>Send To:</label>
                    <br />
		    <br />

                    <input
                        name="send_address"
                        placeholder="Enter the recipient wallet address"
                        value={usdcformData.send_address}
                        type="text"
                        onChange={handleTransaction}
                        required
                    />

                    <br />
	    	    <br />

                    <label>Amount (USDC)</label>
	    	    <br />
                    <br />

                    <input
                        name="send_amount"
                        placeholder="0"
                        value={usdcformData.send_amount}
                        type="number"
                        min="0"
                        step="0.01"
                        onChange={handleTransaction}
                        required
                    />

                    <br />
                    <br />

                    <button
                        value="Send"
                        type="submit"
                        id="send_usdc_btn"
	    		disabled ={isBusy}
                    >
	    		{buttonState} 
                    </button>

                    <br />
                    <br />
                </form>
            </div>
        </div>
    );
}

export default SendTransaction;
