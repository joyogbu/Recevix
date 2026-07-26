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

	console.log("Just getting started");
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


		//read request body
		const { challengeId } = await req.json();
		if (!challengeId) {
			return Response.json(
				{
					error: "Challenge ID is required.",
				},
				{
					status: 400,
					headers: corsHeaders,
				}
			);
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

		//get user token
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

		console.log("SENDING THE CHALLENGE ID NOW");

		//get the transfer challenge
		const challengeResponse = await fetch(`https://api.circle.com/v1/w3s/user/challenges/${challengeId}`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${Deno.env.get("CIRCLE_API_KEY")}`,
				"X-User-Token": userToken,
			},
		});

		const challengeData = await challengeResponse.json();
		
		if (!challengeResponse.ok) {
			return Response.json(challengeData, {
				status: challengeResponse.status,
				headers: corsHeaders,
			});
		}

		const challenge = challengeData.data.challenge;
		console.log("Challenge status:", challenge.status);
		console.log("Challenge:", challenge);

		// Challenge failed
		if (challenge.status !== "COMPLETE") {
			/*await supabase
				.from("transactions")
				.update({status: "failed",
				})
				.eq("challenge_id", challengeId);*/
			return Response.json({
				success: false,
				challenge: challenge,
				status: challenge.status,
			},
			{
				headers: corsHeaders,
			});
		}
		
		//get transaction id
		const transactionId = challenge.correlationIds?.[0];
		console.log(challenge.correlationIds);	
		if (!transactionId) {
			return Response.json({
				error: "Transaction ID not found.",
			},
			{
				status: 500,
				headers: corsHeaders,
			});
		}

		//get transaction details
		const transactionResponse = await fetch(`https://api.circle.com/v1/w3s/transactions/${transactionId}`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${Deno.env.get("CIRCLE_API_KEY")}`,
				"X-User-Token": userToken,
			},
		});
		
		const transactionData = await transactionResponse.json();
		
		if (!transactionResponse.ok) {
			return Response.json(transactionData, {
				status: transactionResponse.status,
				headers: corsHeaders,
			});
		}

		const tx = transactionData.data.transaction;
		console.log("tx:", tx);


		let appStatus = "pending";
		switch (tx.state) {
			case "CONFIRMED":
				case "COMPLETE":
				appStatus = "completed";
			break;
			
			case "FAILED":
				case "DENIED":
				case "CANCELLED":
				appStatus = "failed";
			break;
			default:
				appStatus = "pending";
		}




		//update transaction record if only transaction reached a terminal state
		
		if(appStatus !== "pending") {
			const { error: updateError } = await supabase
				.from("transactions")
				.update({
					status: appStatus,
					tx_hash: tx.txHash ?? null,	
					circle_transaction_id: transactionId,
					from_address: tx.sourceAddress ?? null,
				})
				.eq("challenge_id", challengeId);
		
			
			if (updateError) {
				return Response.json({
					error: updateError.message,
				},
				{
					status: 500,
					headers: corsHeaders,
				});
			}
		}

		return Response.json({
			success: true,
			appStatus,
			transactionId,
			txHash: tx.txHash ?? null,
			status: tx.state,
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


