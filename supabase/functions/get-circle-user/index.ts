import { createClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client
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

    // Get authenticated user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    // Circle API Key
    const circleApiKey = Deno.env.get("CIRCLE_API_KEY");

    if (!circleApiKey) {
      return Response.json(
        {
          error: "Circle API key not found",
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // External user ID used when creating the Circle user
    const circleExternalUserId = `supabase_${user.id}`;

    // Retrieve user from Circle
    const response = await fetch(
      `https://api.circle.com/v1/w3s/users/${circleExternalUserId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${circleApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const circleData = await response.json();

    console.log(
      "Circle User:",
      JSON.stringify(circleData, null, 2)
    );

    return Response.json(
      {
        success: response.ok,
        status: response.status,
        circle: circleData,
      },
      {
        status: response.status,
        headers: corsHeaders,
      }
    );
  } catch (err) {
    console.error(err);

    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
