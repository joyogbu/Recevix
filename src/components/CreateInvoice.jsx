import {supabase} from '../lib/supabase.js';

export const createInvoice = async () => {
	const { data, error } = await supabase
		.from('invoices')
		.insert([
			{
				merchant_name: "Jotech Business Solutions",
				merchant_wallet: "0x48b72670b3bAc294C8f1002Aeb52732a2EA93028",
				amount: 250,
				description: "for website design",
				tx_hash: "thisismytxntestinghash"
			}
		])
		.select()
	console.log("Error:", error)
	console.log("Data:", data)

	return data
}
