"use client";
import Image from "next/image";
import { useClinic } from "../provider";
import waving from "../../../public/images/sal/waving.png";
import listening from "../../../public/images/sal/listening.png";
import thinking from "../../../public/images/sal/thinking.png";
import explaining from "../../../public/images/sal/explaining.png";
import booking from "../../../public/images/sal/booking.png";

export type SALState =
  "idle" | "listening" | "thinking" | "responding" | "recommendation";

const poses = { idle: waving, listening, thinking, responding: explaining, recommendation: booking };
export function SALCharacter({
  state,
  compact = false,
}: {
  state: SALState;
  compact?: boolean;
}) {
  const { t } = useClinic();
  const labels = {
    recommendation: t(
      "هذه خياراتك، لنراجعها معًا",
      "Your options. Let’s explore them together",
      "אלה האפשרויות, נבחן אותן יחד",
    ),
    idle: t("معك، خطوة بخطوة", "With you, step by step", "איתכם, צעד אחר צעד"),
    listening: t(
      "خذ وقتك، أنا أستمع",
      "Take your time. I’m listening",
      "קחו את הזמן, אני מקשיב",
    ),
    thinking: t(
      "أراجع رسالتك",
      "Considering your message",
      "בודק את ההודעה שלכם",
    ),
    responding: t(
      "لنرتّب خطوتك التالية",
      "Let’s find your next step",
      "נמצא יחד את הצעד הבא",
    ),
  };
  return (
    <div
      className={`sal-character ${compact ? "is-compact" : ""}`}
      data-state={state}
    >
      <div className="sal-character-stage" aria-hidden="true">
        <span className="sal-character-aura" />
        <span className="sal-character-ring" />
        <div className="sal-character-art">
          <Image
            src={poses[state]}
            fill
            alt=""
            loading={compact ? "lazy" : "eager"}
            sizes={compact ? "110px" : "(max-width: 760px) 220px, 480px"}
          />
        </div>
      </div>
      {!compact && (
        <div className="sal-character-status" role="status">
          <span aria-hidden="true" />
          {labels[state]}
        </div>
      )}
    </div>
  );
}
