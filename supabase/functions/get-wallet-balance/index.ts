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

	//get merchant from database
	const {data: merchant, error: merchantError} = await supabase
                .from("merchants")
                .select("circle_user_id, circle_wallet_id")
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

	if (!merchant.circle_user_id || !merchant.circle_wallet_id) {
		return Response.json({
			error: "Wallet setup is incomplete.",
		},
		{
			status: 400,
			headers: corsHeaders,
		});
	}


	//generate new user token
	const tokenResponse = await fetch("https://api.circle.com/v1/w3s/users/token", {
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


	const walletResponse = await fetch(`https://api.circle.com/v1/w3s/wallets/${merchant.circle_wallet_id}/balances`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${Deno.env.get("CIRCLE_API_KEY")}`,
			"Content-Type": "application/json",
			"X-User-Token": userToken,
		},
	});
	
	if (!walletResponse.ok) {
		const text = await walletResponse.text();
		
		return Response.json(
			{ error: text },
			{
				status: walletResponse.status,
				headers: corsHeaders,
			}
		);
	}

	const walletData = await walletResponse.json();

	const usdc = walletData.data.tokenBalances.find(
		token => token.token.symbol === "USDC");

	return Response.json(
		{
			success: true,
			balance: usdc?.amount ?? "0",
			token: usdc?.token.symbol ?? "USDC",
		},
		{
			headers: corsHeaders,
		}
	);
});
