import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "./env";
import { createSupabaseServerClient } from "./server";

function bearerToken(request: Request) {
  const header = request.headers.get("authorization");
  const [scheme, token] = header?.split(" ") ?? [];
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export async function createSupabaseRouteContext(request: Request) {
  const token = bearerToken(request);
  if (token) {
    const env = getPublicSupabaseEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      },
    );
    const { data: { user } } = await supabase.auth.getUser(token);
    return { supabase, user };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}
