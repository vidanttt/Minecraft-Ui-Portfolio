import { validateContact, type ContactInput } from "@/lib/contact";

/**
 * Delivers contact messages. Configure ONE of these in .env.local:
 *   RESEND_API_KEY + CONTACT_TO_EMAIL (+ optional CONTACT_FROM_EMAIL)  – sends an email via Resend
 *   CONTACT_WEBHOOK_URL                                                 – POSTs JSON to a webhook (Discord, Slack, Zapier…)
 * With neither set, the route answers 503 and the form tells the visitor honestly.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_PER_WINDOW;
}

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function deliver(input: ContactInput): Promise<"sent" | "not_configured" | "failed"> {
  const text = `From: ${input.name} <${input.email}>\nSubject: ${input.subject}\n\n${input.message}`;
  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (resendKey && to) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL ?? "Portfolio <onboarding@resend.dev>",
        to: [to],
        reply_to: input.email,
        subject: `[Portfolio] ${input.subject}`,
        text,
      }),
    });
    return res.ok ? "sent" : "failed";
  }
  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // `content` suits Discord, `text` suits Slack; the fields suit everything else
      body: JSON.stringify({ content: text.slice(0, 1900), text, ...input }),
    });
    return res.ok ? "sent" : "failed";
  }
  return "not_configured";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }
  if (!body || typeof body !== "object") return json(400, { error: "invalid_body" });
  const b = body as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");

  // honeypot: real visitors never fill this hidden field
  if (str(b.website)) return json(200, { ok: true });

  const input: ContactInput = {
    name: str(b.name).trim(),
    email: str(b.email).trim(),
    subject: str(b.subject).trim(),
    message: str(b.message).trim(),
  };
  const errors = validateContact(input);
  if (Object.keys(errors).length) return json(422, { error: "validation", errors });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return json(429, { error: "rate_limited" });

  try {
    const result = await deliver(input);
    if (result === "sent") return json(200, { ok: true });
    if (result === "not_configured") return json(503, { error: "not_configured" });
    return json(502, { error: "delivery_failed" });
  } catch {
    return json(502, { error: "delivery_failed" });
  }
}
