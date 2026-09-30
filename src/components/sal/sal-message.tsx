"use client";
import type { SalMessage } from "@/lib/api/sal";
import { useClinic } from "../provider";

export function SALMessage({ message }: { message: SalMessage }) {
  const { t } = useClinic();
  return (
    <article className={`sal-entry sal-entry-${message.role}`}>
      <span className="sal-entry-speaker">
        {message.role === "assistant" ? "SAL" : t("أنت", "You", "אתם")}
      </span>
      <p dir="auto">{message.content}</p>
    </article>
  );
}
