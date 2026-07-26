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

		//get the merchant data
		const { data: merchant, error: merchantError } = await supabase
			.from("merchants")
			.select("circle_user_id, merchant_id, merchant_name, wallet_status")
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

		//send a circle API call
		const response = await fetch("https://api.circle.com/v1/w3s/users/token",
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

		const circleData = await response.json();

		if (!response.ok) {
			return Response.json(circleData, {
				status: response.status,
				headers: corsHeaders,
			});
		}

		//return data
		/*return Response.json(
			{
				userToken: circleData.data.userToken,
				encryptionKey: circleData.data.encryptionKey,
			},
			{
				headers: corsHeaders,
			}
		);*/

		
		const userToken = circleData.data.userToken;
		const encryptionKey = circleData.data.encryptionKey;

		//check if wallet has been created
		if (merchant.wallet_status === "created") {
			return Response.json(
				{
					userToken,
					encryptionKey,
				},
				{
					headers: corsHeaders,
				}
			);
		}




		const userResponse = await fetch(`https://api.circle.com/v1/w3s/users/${merchant.circle_user_id}`, 
						 {
			method: "GET",
			headers: {
				Authorization: `Bearer ${Deno.env.get("CIRCLE_API_KEY")}`,
				"Content-Type": "application/json",
			},
		});
							const userData = await userResponse.json();
		
							// check if user is initialized
		if (!userResponse.ok) {
			return Response.json(circleData, {
				status: response.status,
				headers:  corsHeaders,
			});
		}
		
		if (userData.data.user.status === "ENABLED" && userData.data.pinStatus === "ENABLED") {
								return Response.json(
									{
										userToken,
										encryptionKey,
										initialized: true,
									},
									{
										headers: corsHeaders,
									}
								);
							}





		//if no wallet exists, create an initialization challenge
	
		const challengeResponse = await fetch("https://api.circle.com/v1/w3s/user/initialize",				     	{
			method: "POST",
			headers: {
				Authorization: `Bearer ${Deno.env.get("CIRCLE_API_KEY")}`,
				"X-User-Token": userToken,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				idempotencyKey: crypto.randomUUID(),
				blockchains: ["ARC-TESTNET"],
				metadata: [{
					name: `${merchant.merchant_name} wallet`,
					refId: merchant.merchant_id, 
				}],
			}),
		});
			
		const challengeData = await challengeResponse.json();

		console.log("Initialize API response:", challengeData);

		
		if (!challengeResponse.ok) {
			return Response.json({
				status: challengeResponse.status,
				challengeData,
			},
			{
				headers: corsHeaders,
			});
		}
		
		return Response.json(
							     {
								     userToken,
								     encryptionKey,
								     challengeId: challengeData.data.challengeId,
							     },
							     {
								     headers: corsHeaders,
							     }
						     );

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
