import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { CARDS, ROLES, SURVEY_VERSION, messageFor, type Track } from "@/lib/survey";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const role = ROLES.find((r) => r.id === body.role);
  const answers = body.answers;
  const valid =
    role &&
    Array.isArray(answers) &&
    answers.length === 4 &&
    answers.every((a) => Number.isInteger(a) && a >= 0 && a <= 3);
  if (!valid) return NextResponse.json({ ok: false }, { status: 400 });

  const track: Track = role.track;
  const message = messageFor(track, answers as number[]);
  if (!(message in CARDS)) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await sql()`
      insert into responses (survey_version, track, role, answers, message, is_test)
      values (${SURVEY_VERSION}, ${track}, ${role.id}, ${answers as number[]}, ${message}, ${body.isTest === true})
    `;
  } catch (e) {
    console.error("response insert failed", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
