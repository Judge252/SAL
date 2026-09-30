"use client";
import { useClinic } from "../provider";
import { SALCharacter, type SALState } from "./sal-character";
export function SALHero({
  state,
  started,
}: {
  state: SALState;
  started: boolean;
}) {
  const { t } = useClinic();
  return (
    <div className={`sal-session-stage ${started ? "is-active" : ""}`}>
      <span className="sal-session-eyebrow">
        {t(
          "مساحة لك، مع SAL",
          "A MOMENT FOR YOU, WITH SAL",
          "רגע בשבילכם, עם SAL",
        )}
      </span>
      <SALCharacter state={state} />
      <h1 id="sal-intro-heading">
        {started
          ? t(
              "أنا معك. نكمل معًا.",
              "I’m here. Let’s work through it.",
              "אני כאן. נמשיך יחד.",
            )
          : t("أهلًا، أنا SAL.", "Hi, I’m SAL.", "היי, אני SAL.")}
      </h1>
      {!started && (
        <p>
          {t(
            "احكِ لي كيف تشعر. سأساعدك في الوصول للطبيب المناسب.",
            "Tell me how you’re feeling. I’ll help you find the right doctor.",
            "ספרו לי איך אתם מרגישים. אעזור למצוא את הרופא המתאים.",
          )}
        </p>
      )}
    </div>
  );
}
