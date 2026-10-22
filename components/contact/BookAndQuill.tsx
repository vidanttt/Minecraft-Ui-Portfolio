"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { LIMITS, validateContact, type ContactErrors, type ContactInput } from "@/lib/contact";
import { site } from "@/lib/data/site";
import { GameButton } from "@/components/game/GameButton";
import { ButtonRow, GameScreen } from "@/components/game/GameScreen";
import { useGame } from "@/components/game/GameProviders";
import { PixelIcon } from "@/components/game/PixelIcon";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; name: string }
  | { kind: "error"; message: string };

const EMPTY: ContactInput = { name: "", email: "", subject: "", message: "" };

const ERROR_COPY: Record<string, string> = {
  not_configured: "The message service isn't set up yet, so nothing was sent.",
  rate_limited: "Too many messages in a short time. Try again in a few minutes.",
  delivery_failed: "The message couldn't be delivered. Please try again.",
  validation: "Some fields need another look.",
};

export function BookAndQuill() {
  const { play, unlock } = useGame();
  const [values, setValues] = useState<ContactInput>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const sending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef(status);
  useLayoutEffect(() => {
    statusRef.current = status;
  });

  // Next keeps this screen alive when hidden; don't greet a returning visitor with a stale result.
  useLayoutEffect(() => {
    return () => {
      const s = statusRef.current;
      if (s.kind === "sent" || s.kind === "error") setStatus({ kind: "idle" });
    };
  }, []);

  const set = (key: keyof ContactInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending.current) return;
    const found = validateContact(values);
    setErrors(found);
    if (Object.keys(found).length) {
      play("error");
      const first = (Object.keys(found) as (keyof ContactInput)[])[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    sending.current = true;
    setStatus({ kind: "sending" });
    const honeypot = (formRef.current?.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: honeypot }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; errors?: ContactErrors };
      if (res.ok && data.ok) {
        play("success");
        unlock("message-sent");
        setStatus({ kind: "sent", name: values.name.trim() });
        setValues(EMPTY);
      } else {
        if (data.errors) setErrors(data.errors);
        play("error");
        setStatus({ kind: "error", message: ERROR_COPY[data.error ?? ""] ?? ERROR_COPY.delivery_failed });
      }
    } catch {
      play("error");
      setStatus({ kind: "error", message: "Couldn't reach the server. Check your connection and try again." });
    } finally {
      sending.current = false;
    }
  };

  const mailto = site.contactEmail
    ? `mailto:${site.contactEmail}?subject=${encodeURIComponent(values.subject)}&body=${encodeURIComponent(values.message)}`
    : null;

  if (status.kind === "sent") {
    return (
      <GameScreen
        title="Message Sent"
        footer={
          <ButtonRow>
            <GameButton size="mid" onClick={() => setStatus({ kind: "idle" })}>
              Write Another
            </GameButton>
            <GameButton size="mid" href="/" transition="back">
              Done
            </GameButton>
          </ButtonRow>
        }
      >
        <div className="flex flex-1 items-center justify-center px-4" data-enter>
          <BookPage>
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <PixelIcon name="book" className="size-32" />
              <p className="text-[#2b2b2b]">Signed by {status.name}</p>
              <p className="text-[#5a4a2a]">Your message is on its way. Thanks for writing!</p>
            </div>
          </BookPage>
        </div>
      </GameScreen>
    );
  }

  const busy = status.kind === "sending";
  const fieldError = (key: keyof ContactInput) =>
    errors[key] ? (
      <p id={`${key}-error`} className="mt-1 text-mc-red text-shadow-mc" style={{ ["--shadow" as string]: "#3f1515" }}>
        {errors[key]}
      </p>
    ) : null;

  return (
    <GameScreen
      title="Book and Quill"
      subtitle="Write me a message"
      bodyClassName="overflow-y-auto mc-scroll"
      footer={
        <ButtonRow>
          <GameButton size="mid" type="submit" form="contact-form" sound={null} disabled={busy}>
            {busy ? "Sending..." : "Sign and Send"}
          </GameButton>
          <GameButton size="mid" href="/" transition="back">
            Cancel
          </GameButton>
        </ButtonRow>
      }
    >
      <form
        id="contact-form"
        ref={formRef}
        noValidate
        onSubmit={submit}
        aria-busy={busy}
        className="flex flex-wrap items-start justify-center gap-4 px-4 pb-2"
      >
        <div data-enter>
          <BookPage>
            <div className="mb-2 flex justify-between text-[#5a4a2a]">
              <label htmlFor="message">Message</label>
              <span aria-hidden>
                {values.message.length}/{LIMITS.message}
              </span>
            </div>
            <textarea
              id="message"
              name="message"
              value={values.message}
              onChange={set("message")}
              maxLength={LIMITS.message}
              required
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? "message-error" : undefined}
              placeholder="Hi! I'd like to talk about..."
              className="h-[calc(var(--gui)*130)] w-full resize-none bg-transparent leading-[1.25] text-[#1d1d1d] placeholder:text-[#a8986c] focus:outline-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(transparent 0 calc(var(--gui) * 9), var(--mc-book-line) calc(var(--gui) * 9) calc(var(--gui) * 10))",
                caretColor: "#1d1d1d",
              }}
            />
          </BookPage>
          {fieldError("message")}
        </div>

        <fieldset className="mc-list flex w-[min(calc(var(--gui)*190),100%)] flex-col gap-3 px-4 py-4" data-enter>
          <legend className="sr-only">Sign your message</legend>
          <p className="text-shadow-mc text-mc-yellow" style={{ ["--shadow" as string]: "#3f3f15" }}>
            Sign the book
          </p>
          <Field label="Book title (subject)" id="subject" error={fieldError("subject")}>
            <input
              id="subject"
              name="subject"
              className="mc-input"
              value={values.subject}
              onChange={set("subject")}
              maxLength={LIMITS.subject}
              autoComplete="off"
              aria-invalid={Boolean(errors.subject)}
              aria-describedby={errors.subject ? "subject-error" : undefined}
            />
          </Field>
          <Field label="Your name" id="name" error={fieldError("name")}>
            <input
              id="name"
              name="name"
              className="mc-input"
              value={values.name}
              onChange={set("name")}
              maxLength={LIMITS.name}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </Field>
          <Field label="Your email" id="email" error={fieldError("email")}>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              className="mc-input"
              value={values.email}
              onChange={set("email")}
              maxLength={LIMITS.email}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </Field>
          {/* honeypot – hidden from people and assistive tech */}
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>
          <div role="status" aria-live="polite" className="min-h-[calc(var(--gui)*10)]">
            {status.kind === "error" && (
              <div className="flex flex-col gap-2">
                <p className="text-mc-red text-shadow-mc" style={{ ["--shadow" as string]: "#3f1515" }}>
                  {status.message}
                </p>
                {mailto && (
                  <GameButton href={mailto} external size="auto" className="w-full">
                    Email me instead
                  </GameButton>
                )}
              </div>
            )}
            {busy && <p className="mc-muted text-shadow-mc">Sending your message...</p>}
          </div>
        </fieldset>
      </form>
    </GameScreen>
  );
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mc-muted text-shadow-mc mb-1 block">
        {label}
      </label>
      {children}
      {error}
    </div>
  );
}

function BookPage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-[min(calc(var(--gui)*192),calc(100vw-var(--gui)*8))] p-[calc(var(--gui)*4)]"
      style={{
        background: "#6b3e1f",
        boxShadow: "0 0 0 var(--gui) #000, inset 0 0 0 var(--gui) #8a5a32",
      }}
    >
      <div
        className="min-h-[calc(var(--gui)*160)] px-4 py-3"
        style={{
          background: "var(--mc-book)",
          boxShadow: "inset calc(var(--gui) * 2) 0 0 #e2d6b0, inset 0 calc(var(--gui) * -2) 0 #e2d6b0",
          color: "var(--mc-book-ink)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
