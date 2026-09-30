"use client";
import { useSearchParams } from "next/navigation";
import { SALConversation } from "./sal/sal-conversation";
export function Sal() {
  const params = useSearchParams();
  return (
    <div className="sal-product-page">
      <div className="container">
        <SALConversation
          fullPage
          historyId={params.get("conversation") || undefined}
        />
      </div>
    </div>
  );
}
export const SAL = Sal;
