import type { Metadata } from "next";
import { BookAndQuill } from "@/components/contact/BookAndQuill";

export const metadata: Metadata = {
  title: "Book and Quill",
  description: "Send a message.",
};

export default function ContactPage() {
  return <BookAndQuill />;
}
