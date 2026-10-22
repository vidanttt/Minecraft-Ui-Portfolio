/** Contact form validation shared by the client form and the API route. */

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

export const LIMITS = {
  name: 80,
  email: 254,
  subject: 120,
  message: 4000,
  messageMin: 10,
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const subject = input.subject.trim();
  const message = input.message.trim();
  if (!name) errors.name = "Enter your name.";
  else if (name.length > LIMITS.name) errors.name = `Keep your name under ${LIMITS.name} characters.`;
  if (!email) errors.email = "Enter your email so I can reply.";
  else if (email.length > LIMITS.email || !EMAIL.test(email)) errors.email = "That email doesn't look right.";
  if (!subject) errors.subject = "Give your message a title.";
  else if (subject.length > LIMITS.subject) errors.subject = `Keep the title under ${LIMITS.subject} characters.`;
  if (message.length < LIMITS.messageMin) errors.message = `Write at least ${LIMITS.messageMin} characters.`;
  else if (message.length > LIMITS.message) errors.message = `Keep it under ${LIMITS.message} characters.`;
  return errors;
}
