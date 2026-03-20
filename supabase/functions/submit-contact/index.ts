import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const rateLimitStore = new Map<string, number[]>();

function isRateLimited(ip: string): { limited: boolean; retryAfter?: number } {
  const now = Date.now();
  const attempts = rateLimitStore.get(ip) || [];
  const recentAttempts = attempts.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitStore.set(ip, recentAttempts);
  if (recentAttempts.length >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - recentAttempts[0])) / 1000);
    return { limited: true, retryAfter };
  }
  return { limited: false };
}

function recordAttempt(ip: string): void {
  const attempts = rateLimitStore.get(ip) || [];
  attempts.push(Date.now());
  rateLimitStore.set(ip, attempts);
}

async function sendEmailNotification(
  ownerEmail: string,
  ownerName: string,
  contact: { name: string; email: string; phone: string; subject: string; message: string }
): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.log("[submit-contact] RESEND_API_KEY not set, skipping email notification");
    return;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <div style="background: #0f172a; padding: 24px 32px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">New Contact Message</h1>
        <p style="color: #94a3b8; margin: 4px 0 0; font-size: 14px;">Received via your portfolio contact form</p>
      </div>
      <div style="background: #f8fafc; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; width: 120px; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">From</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 15px;">${contact.name}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Email</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 15px;"><a href="mailto:${contact.email}" style="color: #1d4ed8;">${contact.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Phone</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 15px;">${contact.phone}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Subject</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 15px;">${contact.subject}</td>
          </tr>
        </table>
        <div style="margin-top: 24px;">
          <p style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px;">Message</p>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${contact.message}</div>
        </div>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <a href="mailto:${contact.email}?subject=Re: ${encodeURIComponent(contact.subject)}" style="display: inline-block; background: #1d4ed8; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">Reply to ${contact.name}</a>
        </div>
      </div>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Portfolio Contact <onboarding@resend.dev>",
      to: [ownerEmail],
      reply_to: contact.email,
      subject: `New message from ${contact.name}: ${contact.subject}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[submit-contact] Resend error:", err);
  } else {
    console.log(`[submit-contact] Email notification sent to ${ownerEmail}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    const { limited, retryAfter } = isRateLimited(ip);
    if (limited) {
      return new Response(
        JSON.stringify({ error: "Too many submissions. Please try again later.", retryAfter }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(retryAfter) } }
      );
    }

    const body = await req.json();
    const { userId, name, email, phone, subject, message } = body;

    if (!userId || !name || !email || !phone || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (name.length > 100 || email.length > 255 || phone.length > 30 || subject.length > 200 || message.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Field length exceeds maximum allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: insertError } = await supabase.from("contacts").insert({
      user_id: userId,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    if (insertError) {
      console.error("[submit-contact] Database error:", insertError.message);
      return new Response(
        JSON.stringify({ error: "Failed to submit message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (profileData?.email) {
      await sendEmailNotification(
        profileData.email,
        profileData.full_name || "Portfolio Owner",
        { name: name.trim(), email: email.trim(), phone: phone.trim(), subject: subject.trim(), message: message.trim() }
      );
    }

    recordAttempt(ip);
    console.log(`[submit-contact] Successfully submitted contact from ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[submit-contact] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
