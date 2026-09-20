import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { CONSENT_VERSION } from "@/lib/survey";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Honeypot: real users never fill this hidden field.
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  const company = typeof body.company === "string" ? body.company.trim().slice(0, 200) : "";

  if (!name || !EMAIL.test(email) || body.consent !== true) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await sql()`
      insert into contacts (name, email, company, newsletter_consent, consent_version)
      values (${name}, ${email}, ${company || null}, true, ${CONSENT_VERSION})
      on conflict (email) do nothing
    `;
  } catch (e) {
    console.error("contact insert failed", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
