import { createHash } from "node:crypto";

/** Midnight UTC medal ceremony — assign gold/silver/bronze for yesterday */
Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10);

  // Fetch top 3 attempts for yesterday
  const res = await fetch(
    `${supabaseUrl}/rest/v1/attempts?date=eq.${dateStr}&is_practice=eq.false&valid=eq.true&order=score_mad.asc&limit=3&select=user_id,score_mad`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  );

  const attempts = await res.json();
  const medalTypes = ["gold", "silver", "bronze"] as const;

  for (let i = 0; i < Math.min(3, attempts.length); i++) {
    const attempt = attempts[i];
    await fetch(`${supabaseUrl}/rest/v1/medals`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates",
      },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        user_id: attempt.user_id,
        date: dateStr,
        medal_type: medalTypes[i],
      }),
    });
  }

  return new Response(
    JSON.stringify({ date: dateStr, medalsAssigned: Math.min(3, attempts.length) }),
    { headers: { "Content-Type": "application/json" } },
  );
});
