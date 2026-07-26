import { createClient } from "npm:@supabase/supabase-js@2"

export const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
}


Deno.serve(async (req) => {
	if(req.method === "OPTIONS") {
		return new Response("ok", {headers: corsHeaders,
		});
	}

	// create a client
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
	const {data: { user }, error, } = await supabase.auth.getUser();

	if (error || !user) {
		return Response.json(
			{
				error: "Unauthorized",
			},
			{
				status: 401,
				headers: corsHeaders
			}
		);
	}


	const {data: merchant, error: merchantError} = await supabase
		.from("merchants")
		.select("circle_user_id, wallet_status")
		.eq("merchant_id", user.id)
		.single();
	
	if(merchantError) {
		return Response.json(
			{
				error: "merchant profile not found",
			},
			{
				headers: corsHeaders,
				status: 404,
			}
		);
	}

	//check if user already has a wallet and return if.
	if(merchant.wallet_status === "created") {
		return Response.json({
			success: true,
			walletStatus: "created",
		},
		{
			headers: corsHeaders,
		});
	}

	//No wallet? check if user is already a circle user
	if(merchant.circle_user_id) {
		return Response.json(
			{
				success: true,
				existing: true,
				circle_user_id: merchant.circle_user_id,
			},
			{
				headers: corsHeaders,
			}
		);
	}



	const circleApiKey = Deno.env.get("CIRCLE_API_KEY");
                                                 if(!circleApiKey) {
							 return Response.json(
								 {
									error: "Circle Api key not founnd",
                        },
			{
				status: 500,
				headers:
corsHeaders,
			}
							 );
						 }



	const externalUserId = `supabase_${user.id}`;
	const getUserResponse = await fetch(
		`https://api.circle.com/v1/w3s/users/${externalUserId}`,
			{
			method: "GET",
			headers: {
				Authorization: `Bearer ${circleApiKey}`,
				"Content-Type": "application/json",
			},
		}
	);

	if (getUserResponse.ok) {
		const existingUser = await getUserResponse.json();
		const circleUserId = existingUser.data.user.id;
		// Sync the database in case it wasn't saved previously
		const { error: updateError } = await supabase
		.from("merchants")
		.update({
			circle_user_id: circleUserId,
		})
		.eq("merchant_id", user.id)
		.select();


		if (updateError) {
			return Response.json(
				{
					success: false,
					error: updateError.message,
				},
				{
					status: 500,
					headers: corsHeaders,
				}
			);
		}


		return Response.json(
			{
				success: true,
				existing: true,
				circle_user_id: circleUserId,
			},
			{
				headers: corsHeaders,
			}
		);
	}


	//if any other error
	if (getUserResponse.status !== 404) {
		const errorText = await getUserResponse.text();
		return Response.json(
			{
				success: false,
				error: "Failed to query Circle user",
				details: errorText,
			},
			{
				status: getUserResponse.status,
				headers: corsHeaders,
			}
		);
	}





	const response = await fetch("https://api.circle.com/v1/w3s/users",{
	       	method: "POST",
		headers: {
			Authorization: `Bearer ${circleApiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			userId: `supabase_${user.id}`,
		}),
	});

	if(!response.ok) {
		const errorText = await response.text();
		return Response.json(
			//{
			//	Error: "Failed to create circle user",
			
			{
				success: false,
				statusText: response.statusText,
				status: response.status,
				circleError: errorText,
			},
			{
				status: response.status,
				headers: corsHeaders,
			}
		);
	}


	const circleData = await response.json();

	if(!circleData?.data?.user?.id) {
		return Response.json(
			{
				error: "Circle did not return a user iD",
			},
			{
				//status: 500,
				headers: corsHeaders,
			}
		);
	}

	const circleUserId = circleData.data.user.id;


	const { data: updatedMerchant, error: updateError } = await supabase
		.from("merchants")
		.update({circle_user_id: circleUserId,})
		.eq("merchant_id", user.id)
		.select();

	if(updateError) {
		console.error("Failed to save circle user ID", updateError);

		return Response.json(
			{
				success: false,
				message: "Failed to save circle user",
				circleUserId,
				//error: updateError.message,
			},
			{
				//status: 500,
				headers: corsHeaders,
			}
		);
	}
	
	console.log("Authenticated user:", user.id);
	console.log("circle user id:", circleUserId);
	console.log("updated merchant:", updatedMerchant);
	console.log("update error:", updateError);



	return Response.json(
		{
			success: true,
			//success: false,
			status: response.status,
			circle: circleUserId,
			statusText: response.statusText,
		},
		{
			status: response.status,
			headers: corsHeaders,
		}
	);



});
