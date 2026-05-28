import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── CONFIGURACIÓN EVOLUTION API ─────────────────────────────────────────────
const EVOLUTION_API_URL = "https://evo.fronterasexpress.com";
const EVOLUTION_API_TOKEN = "09E9CD3A83B3-4037-A8F7-D72CB62827B3";
const EVOLUTION_INSTANCE = "pruebaRC";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ─── HORA EN COLOMBIA (UTC-5) ─────────────────────────────────────────────
    const nowUtcMs = Date.now();
    const colombiaMs = nowUtcMs + (-5 * 60 * 60 * 1000);
    const colombiaDate = new Date(colombiaMs);
    const colombiaHour = colombiaDate.getUTCHours();
    const today = colombiaDate.toISOString().split("T")[0];

    console.log(`Colombia time — Hour: ${colombiaHour} | Date: ${today}`);

    // ─── GUARDIA DE HORA: solo entre 7:00 y 7:59 AM Colombia ─────────────────
    if (colombiaHour !== 7) {
      console.log(`Outside 7 AM window (hour: ${colombiaHour}). Skipping.`);
      return new Response(
        JSON.stringify({ success: true, processed: 0, skipped: true, reason: `Hour ${colombiaHour} is outside 7 AM window` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ─── ATOMIC CLAIM: marcar como sent ANTES de enviar ──────────────────────
    const { data: claimed, error: claimError } = await supabase
      .from("training_reminders")
      .update({ sent: true, sent_at: new Date(nowUtcMs).toISOString() })
      .eq("scheduled_date", today)
      .eq("sent", false)
      .select("*");

    if (claimError) throw claimError;

    if (!claimed || claimed.length === 0) {
      console.log("No pending reminders for today.");
      return new Response(
        JSON.stringify({ success: true, processed: 0, results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Claimed ${claimed.length} reminder(s) — sending now`);

    const results = [];

    for (const reminder of claimed) {
      try {
        let phone = reminder.phone as string;
        if (phone.startsWith("+")) {
          phone = phone.substring(1) + "@s.whatsapp.net";
        } else if (!phone.includes("@s.whatsapp.net")) {
          phone = phone + "@s.whatsapp.net";
        }

        const response = await fetch(
          `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: EVOLUTION_API_TOKEN,
            },
            body: JSON.stringify({
              number: phone,
              textMessage: { text: reminder.message },
              options: { delay: 1200, presence: "composing" },
            }),
          }
        );

        if (!response.ok) {
          const err = await response.text();
          // Revertir el claim si el envío falla
          await supabase
            .from("training_reminders")
            .update({ sent: false, sent_at: null })
            .eq("id", reminder.id);
          throw new Error(`Evolution API error ${response.status}: ${err}`);
        }

        console.log(`✅ Sent to ${reminder.phone}`);
        results.push({ id: reminder.id, phone: reminder.phone, success: true });
      } catch (err: any) {
        console.error(`❌ Failed for ${reminder.id}:`, err.message);
        results.push({ id: reminder.id, phone: reminder.phone, success: false, error: err.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Fatal error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
