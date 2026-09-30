"use client";
import { useRef, type FormEvent } from "react";
import { Arrow } from "../ui";
import { Mic, Paperclip } from "lucide-react";
import { useClinic } from "../provider";

export function SALInput({
  value,
  onChange,
  onSubmit,
  onFocusChange,
  busy,
  disabled,
  started,
  inputId,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onFocusChange: (focused: boolean) => void;
  busy: boolean;
  disabled: boolean;
  started: boolean;
  inputId: string;
}) {
  const { t } = useClinic();
  const input = useRef<HTMLTextAreaElement>(null);
  const starters = [
    {
      label: t("أعراض تتكرر", "Recurring symptoms", "תסמינים חוזרים"),
      text: t(
        "لدي أعراض تتكرر وأريد معرفة الطبيب المناسب.",
        "I have recurring symptoms and would like help finding a doctor.",
        "יש לי תסמינים חוזרים ואשמח לעזרה במציאת רופא.",
      ),
    },
    {
      label: t("زيارة متابعة", "A follow-up visit", "ביקור מעקב"),
      text: t(
        "أحتاج إلى تنظيم زيارة متابعة مع طبيب.",
        "I need help arranging a follow-up visit with a clinician.",
        "אני צריך עזרה בתיאום ביקור מעקב אצל רופא.",
      ),
    },
    {
      label: t(
        "لا أعرف من أين أبدأ",
        "Not sure where to start",
        "לא בטוחים איפה להתחיל",
      ),
      text: t(
        "لست متأكدًا من التخصص الذي أحتاجه. هل تساعدني؟",
        "I’m not sure which specialty I need. Can you help me get started?",
        "אני לא בטוח לאיזו התמחות לפנות. אפשר לעזור לי להתחיל?",
      ),
    },
  ];
  return (
    <form className="sal-input-area" onSubmit={onSubmit}>
      {!started && (
        <div
          className="sal-starters"
          aria-label={t(
            "ساعدني في البداية",
            "Help me get started",
            "עזרו לי להתחיל",
          )}
        >
          {starters.map((item) => (
            <button
              type="button"
              key={item.label}
              disabled={busy}
              onClick={() => {
                onChange(item.text);
                input.current?.focus();
              }}
            >
              {item.label}
              <span aria-hidden="true">+</span>
            </button>
          ))}
        </div>
      )}
      <div className="sal-writing-desk">
        <label htmlFor={inputId}>
          {started
            ? t(
                "ماذا تريد أن تضيف؟",
                "What would you like to add?",
                "מה תרצו להוסיף?",
              )
            : t(
                "احكِ لي ما يشغلك",
                "Tell me what’s on your mind",
                "ספרו לי מה מטריד אתכם",
              )}
        </label>
        <textarea
          id={inputId}
          ref={input}
          aria-label={t(
            "رسالتك إلى SAL",
            "Your message to SAL",
            "ההודעה שלכם ל־SAL",
          )}
          placeholder={t(
            "اكتب بطريقتك. لا تحتاج إلى مصطلحات طبية…",
            "In your own words. No medical terms needed…",
            "במילים שלכם. אין צורך במונחים רפואיים…",
          )}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          maxLength={4000}
          rows={2}
          required
          disabled={busy}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter")
              event.currentTarget.form?.requestSubmit();
          }}
        />
        <div className="sal-input-actions">
          <div className="sal-composer-tools">
            <button type="button" className="sal-tool" disabled aria-label={t("المرفقات — قريبًا", "Attachments — coming soon", "קבצים — בקרוב")} title={t("المرفقات — قريبًا", "Attachments — coming soon", "קבצים — בקרוב")}><Paperclip size={19} /></button>
            <button type="button" className="sal-tool" disabled aria-label={t("الصوت — قريبًا", "Voice input — coming soon", "קול — בקרוב")} title={t("الصوت — قريبًا", "Voice input — coming soon", "קול — בקרוב")}><Mic size={19} /></button>
            <span>{t("قريبًا", "Soon", "בקרוב")}</span>
          </div>
          <button
            type="submit"
            className="button sal-send"
            disabled={disabled || busy || !value.trim()}
          >
            {busy
              ? t("أراجع رسالتك…", "Considering…", "בודק את ההודעה…")
              : started
                ? t("أرسل إلى SAL", "Send to SAL", "שליחה ל־SAL")
                : t("ابدأ مع SAL", "Start with SAL", "מתחילים עם SAL")}
            <Arrow />
          </button>
        </div>
      </div>
    </form>
  );
}
