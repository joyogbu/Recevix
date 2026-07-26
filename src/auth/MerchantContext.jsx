import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const MerchantContext = createContext();
export function MerchantProvider({ children }) {
	const [merchant, setMerchant] = useState(null);
	const [walletBalance, setWalletBalance] = useState(null);
	const [loading, setLoading] = useState(true);
	const [invoiceStats, setInvoiceStats] = useState({
		totalInvoices: 0,
		totalVolume: 0,
		paidInvoices: 0,
		receivables: 0,
	});

	const [invoices, setInvoices] = useState([]);
	
	async function loadWalletBalance() {
		const { data, error } = await supabase.functions.invoke("get-wallet-balance");

		if (error) {
			console.log(error);
			return;
		}
		console.log("balance:", data);
		setWalletBalance(data.balance);
	}


	//load invoice statistics
	async function loadInvoiceStats(merchantId) {
		const { data, error } = await supabase
			.from("invoices")
			.select("amount, status")
			.eq("merchant_id", merchantId);

		if (error) return;
		//const totalTransactions = data.length;
		//const totalVolume = data.reduce((sum, tx) => sum + Number(tx.amount), 0 );

		let totalInvoices = 0;
		let paidInvoices = 0;
		let totalVolume = 0;
		let receivables = 0;

		data.forEach((invoice) => {
			totalInvoices++;
			if (invoice.status === "Paid") {
				paidInvoices++;
            totalVolume += Number(invoice.amount);
			}

			if (invoice.status === "pending") {
				receivables += Number(invoice.amount);
			}
		});
		setInvoiceStats({
			totalInvoices,
			paidInvoices,
			totalVolume,
			receivables,
		});
	}


	//load invoices
	async function loadInvoices(merchantId) {
		const { data, error } = await supabase
			.from("invoices")
			.select("*")
			.eq("merchant_id", merchantId)
			.order("created_at", { ascending: false });
		if (error) {
			console.log(error);
			console.log(data);
			return;
		}
		setInvoices(data)
	}


	useEffect(() => {
		async function loadMerchant() {
			const {data: result, error: resultError} = await supabase.auth.getUser();
			const user = result.user;
			if(!result || resultError) {
				setLoading("false");
				return
			}

			const {data, error} = await supabase
				.from("merchants")
				.select("*")
				.eq("merchant_id", user?.id)
				.single();
			if (!error) {
				setMerchant(data);

				if (data.wallet_status === "created") {
					await loadWalletBalance();
				}
				await loadInvoiceStats(user?.id);
				await loadInvoices(user?.id);
			}
			setLoading(false)
		}
		loadMerchant();
	}, []);

	return (
		<MerchantContext.Provider
			value = {{merchant, setMerchant, walletBalance, loading, loadWalletBalance, invoiceStats, invoices, loadInvoices }}>

		{children}
		</MerchantContext.Provider>
	);
}

export function useMerchant() {
	return useContext(MerchantContext);
}
