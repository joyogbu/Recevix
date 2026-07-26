import { createClient } from "npm:@supabase/supabase-js@2"

export const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
}

// start the function
Deno.serve(async (req) => {
        if (req.method === "OPTIONS") {
                return new Response("ok", {
                        headers: corsHeaders,
                });
        }


	try {
                //create supabase client
                const supabase = createClient(
                        Deno.env.get("SUPABASE_URL")!,
                        Deno.env.get("SUPABASE_ANON_KEY")!,
                        {
                                global: {
                                      headers: {
                                      Authorization: req.headers.get("Authorization")!,
                                      },
                                },
                        }
                );

		//get the authenticated user
                const {data: { user }, error: authError, } = await supabase.auth.getUser();
                if (authError || !user) {
                        return Response.json(
                                {
                                      error: "Unauthorized"
                                },
                                {
                                      status: 401,
                                      headers: corsHeaders,
                                }
                        );
                }



		// Read request body
		const { destinationAddress, amount } = await req.json();
		if (!destinationAddress || !amount) {
			return Response.json({
				error: "Destination address and amount are required.",
			},
			{
				status: 400,
				headers: corsHeaders,
			});
		}

		//get the merchant data
                const { data: merchant, error: merchantError } = await supabase
                        .from("merchants")
                        .select("*")
                        .eq("merchant_id", user.id)
                        .single();


                if (merchantError || !merchant?.circle_user_id) {
                        return Response.json(
                                {
                                      error: "Circle user not found",
                                },
                                {
                                      status: 404,
                                      headers: corsHeaders,
                                }
                        );
                }

		
		//check if amount is 0 or negative
		if (amount <= 0) {
			return Response.json({
				error: "Amount must be greater than zero.",
			},
			{
				status: 400,
				headers: corsHeaders,
			});
		}


		//ger user token
                const tokenResponse = await fetch("https://api.circle.com/v1/w3s/users/token",
                {
                        method: "POST",
                        headers: {
                                Authorization: `Bearer ${Deno.env.get("CIRCLE_API_KEY")}`,
                                "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                                userId: merchant.circle_user_id,
                        }),
                });

                const tokenData = await tokenResponse.json();

                if (!tokenResponse.ok) {
                        return Response.json(tokenData, {
                                status: tokenResponse.status,
                                headers: corsHeaders,
                        });
                }

		const userToken = tokenData.data.userToken;
		const encryptionKey = tokenData.data.encryptionKey;

		
		//Check wallet balance
		const walletResponse = await fetch(`https://api.circle.com/v1/w3s/wallets/${merchant.circle_wallet_id}/balances`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${Deno.env.get("CIRCLE_API_KEY")}`,
				"Content-Type": "application/json",
				"X-User-Token": userToken,
			},
		});

		const walletData = await walletResponse.json();
		const usdc = walletData.data.tokenBalances.find((token) => token.token.symbol === "USDC");
		
		const walletBalance = Number(usdc?.amount ?? 0);
		const sendAmount = Number(amount);

		if (walletBalance < sendAmount) {
			return Response.json({
				success: false,
				error: "Insufficient USDC balance.",
				balance: walletBalance,
			},
			{
				status: 400,
				headers: corsHeaders,
			});
		}


		//create transfer challenge
		const transferResponse = await fetch("https://api.circle.com/v1/w3s/user/transactions/transfer", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${Deno.env.get("CIRCLE_API_KEY")}`,
				"Content-Type": "application/json",
				"X-User-Token": userToken,
			},
			body: JSON.stringify({
				idempotencyKey: crypto.randomUUID(),
				walletId: merchant.circle_wallet_id,
				destinationAddress,
				amounts: [amount],
				feeLevel: "MEDIUM",
				tokenId: "ef87c8c3-85de-598a-af50-c5135eecfa74",
			}),
		});

		const transferData = await transferResponse.json();
		
		if (!transferResponse.ok) {
			return Response.json(transferData, {
				status: transferResponse.status,
				headers: corsHeaders,
			});
		}

		const challengeId = transferData.data.challengeId;

		// Save pending transaction
		const {data: transaction, error: transactionError,} = await supabase
			.from("transactions")
			.insert({
				merchant_id: user.id,
				invoice_id: null,
				to_address:destinationAddress,
				type: "withdrawal",
				status: "pending",
				amount,
				token: "USDC",
				network: "ARC-TESTNET",
				challenge_id: challengeId,
			})
			.select()
			.single();

		if (transactionError) {
			return Response.json({
				error: transactionError.message,
			},
			{
				status: 500,
				headers: corsHeaders,
			});
		}


		return Response.json({
			success: true,
			challengeId: transferData.data.challengeId,
			userToken,
			encryptionKey,
			transactionId: transaction.id,
		},
		{
			headers: corsHeaders,
		});

	} catch (err) {
                return Response.json(
                        {
                                error: err.message,
                        },
                        {
                                status: 500,
                                headers: corsHeaders,
                        }
                );
        }
});
						   


