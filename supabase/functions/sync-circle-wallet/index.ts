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
                        .select("circle_user_id, wallet_status")
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

                const userToken = circleData.data.userToken;
                const encryptionKey = circleData.data.encryptionKey;


		const walletResponse = await fetch("https://api.circle.com/v1/w3s/wallets?pageSize=10&order=DESC", {
			method: "GET",
			headers: {
				Authorization: `Bearer ${Deno.env.get("CIRCLE_API_KEY")}`,
				"X-User-Token": userToken,
			},
		});

		const walletData = await walletResponse.json();
		console.log(walletData);

		if (!walletResponse.ok) {
			console.error("Failed to fetch wallets:", walletData);
			return Response.json(walletData, {
				status: walletResponse.status,
				headers: corsHeaders,
			});
		}

		const wallet = walletData.data.wallets[0];

		const { error: updateError } = await supabase
		.from("merchants")
		.update({
			circle_wallet_id: wallet.id,
			circle_wallet_address: wallet.address,
			circle_wallet_set_id: wallet.walletSetId,
			wallet_status: "created",
		})
		.eq("merchant_id", user.id);
		
		if (updateError) {
			return Response.json(
				{
					error: updateError.message,
				},
				{
					status: 500,
					headers: corsHeaders,
				}
			);
		}

		return Response.json({
			success: true,
		},
		{
			headers: corsHeaders,
		});

	} catch(error) {
		console.error("sync-circle-wallet error:", error);
		return Response.json({
			error: error.message,
		},
		{
			status: 500,
			headers: corsHeaders,
		});
	}
});
