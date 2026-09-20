"use client";

import { useEffect, useRef, useState } from "react";
import {
  CARDS,
  COACH_HINT,
  LINKS,
  QUESTIONS,
  ROLES,
  closerFor,
  messageFor,
  type CardKey,
  type Track,
} from "@/lib/survey";

type Stage = "cover" | "role" | "q" | "contact" | "thanks";

function Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 150 40" role="img" aria-label="Proven">
      <rect x="2" y="4" width="32" height="32" rx="9" fill="none" stroke="#e9e9e9" strokeWidth="3.5" />
      <path
        d="M10 20.5l6 6 12-13"
        fill="none"
        stroke="#ffc000"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="44" y="29" fill="#e9e9e9" fontSize="25" fontWeight="700" fontFamily="inherit">
        Proven
      </text>
    </svg>
  );
}

function Card({ cardKey }: { cardKey: CardKey }) {
  const { headline, line } = CARDS[cardKey];
  return (
    <div className="card">
      <p className="headline">{headline}</p>
      <div className="rule" />
      <p className="line">{line}</p>
      <Logo className="logo" />
    </div>
  );
}

async function postJson(url: string, body: unknown): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) return true;
      if (res.status === 400) return false;
    } catch {
      // network hiccup at the venue: retry once
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

export default function Survey() {
  const [stage, setStage] = useState<Stage>("cover");
  const [roleId, setRoleId] = useState("");
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [message, setMessage] = useState<CardKey>("trust");
  const [isTest, setIsTest] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [contactError, setContactError] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    setIsTest(new URLSearchParams(window.location.search).get("test") === "1");
  }, []);

  const role = ROLES.find((r) => r.id === roleId);
  const track: Track = role?.track ?? "b2b";
  const questions = QUESTIONS[track];

  const step = { cover: 0, role: 1, q: 2 + qi, contact: 6, thanks: 7 }[stage];
  const progress = Math.min(step / 7, 1) * 100;
  const canGoBack = stage === "role" || stage === "q";

  function goBack() {
    if (stage === "role") setStage("cover");
    else if (stage === "q") {
      if (qi === 0) setStage("role");
      else {
        setQi(qi - 1);
        setAnswers(answers.slice(0, -1));
      }
    }
  }

  function chooseRole(id: string) {
    setPicked(ROLES.findIndex((r) => r.id === id));
    setTimeout(() => {
      setRoleId(id);
      setQi(0);
      setAnswers([]);
      setPicked(null);
      setStage("q");
    }, 140);
  }

  function chooseAnswer(index: number) {
    setPicked(index);
    setTimeout(() => {
      const next = [...answers, index];
      setPicked(null);
      if (qi < questions.length - 1) {
        setAnswers(next);
        setQi(qi + 1);
        return;
      }
      setAnswers(next);
      const msg = messageFor(track, next);
      setMessage(msg);
      if (!submitted.current) {
        submitted.current = true;
        void postJson("/api/response", { role: roleId, answers: next, isTest });
      }
      setStage("contact");
    }, 140);
  }

  async function sendContact(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setContactError(false);
    const ok = await postJson("/api/contact", { name, email, company, consent, website });
    setSending(false);
    if (ok) setStage("thanks");
    else setContactError(true);
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSend = name.trim().length > 0 && emailOk && consent && !sending;

  return (
    <main className="app">
      {stage !== "cover" && stage !== "thanks" && (
        <div className="topbar">
          {canGoBack ? (
            <button className="back" onClick={goBack} aria-label="Back">
              ‹
            </button>
          ) : (
            <span style={{ width: 44 }} />
          )}
          <div className="progress" aria-hidden>
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {stage === "cover" && (
        <section className="screen">
          <Logo className="brandmark" />
          <h1>AI has changed recruitment. What is your take?</h1>
          <p className="lead">4 quick taps. Anonymous. Your personal result is waiting at the end.</p>
          <button className="btn primary" onClick={() => setStage("role")}>
            Start
          </button>
        </section>
      )}

      {stage === "role" && (
        <section className="screen">
          <h2>In which capacity are you answering?</h2>
          <div className="options">
            {ROLES.map((r, i) => (
              <button
                key={r.id}
                className={`btn${picked === i ? " picked" : ""}`}
                onClick={() => chooseRole(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {stage === "q" && (
        <section className="screen" key={`${track}-${qi}`}>
          <p className="eyebrow">
            Question {qi + 1} of {questions.length}
          </p>
          <h2>{questions[qi].title}</h2>
          {roleId === "career_advisor" && <p className="hint">{COACH_HINT}</p>}
          <div className="options">
            {questions[qi].options.map((opt, i) => (
              <button
                key={opt}
                className={`btn${picked === i ? " picked" : ""}`}
                onClick={() => chooseAnswer(i)}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>
      )}

      {stage === "contact" && (
        <section className="screen">
          <h2>Thank you. Want us to keep in touch?</h2>
          <p className="lead">
            Leave your details to remain in touch with more news about PROVEN. Your survey answers stay
            anonymous and are never linked to your name.
          </p>
          <form className="form" onSubmit={sendContact}>
            <input
              className="trap"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              name="website"
            />
            <input
              className="field"
              placeholder="Name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="field"
              placeholder="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="field"
              placeholder="Company (optional)"
              autoComplete="organization"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <label className="check">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>
                Yes, keep me updated with news about PROVEN. I can unsubscribe at any time. See
                the <a href={LINKS.privacy} target="_blank" rel="noopener noreferrer">privacy policy</a>.
              </span>
            </label>
            {contactError && <p className="err">Something went wrong. Please try again.</p>}
            <button className="btn primary" type="submit" disabled={!canSend}>
              {sending ? "Sending…" : "Send and see my result"}
            </button>
            <button className="btn ghost" type="button" onClick={() => setStage("thanks")}>
              Skip
            </button>
          </form>
        </section>
      )}

      {stage === "thanks" && (
        <section className="screen">
          <Card cardKey={message} />
          <p className="closer">{closerFor(track, roleId)}</p>
          <div className="options">
            {track === "b2c" ? (
              <a className="btn primary" href={LINKS.learnMore} target="_blank" rel="noopener noreferrer">
                Get validated today
              </a>
            ) : (
              <>
                <a className="btn primary" href={LINKS.bookCall} target="_blank" rel="noopener noreferrer">
                  Book a call with us
                </a>
                <a className="btn" style={{ justifyContent: "center" }} href={LINKS.learnMore} target="_blank" rel="noopener noreferrer">
                  Want to know more?
                </a>
              </>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
