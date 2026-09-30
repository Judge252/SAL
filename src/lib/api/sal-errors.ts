import { ApiError } from "./client";

type Translate = (ar: string, en: string, he: string) => string;

export function salErrorMessage(error: unknown, t: Translate, signedIn: boolean) {
  const code = error instanceof ApiError ? error.detail?.code : undefined;
  let message: string;
  switch (code) {
    case "BACKEND_UNAVAILABLE":
      message = t("تعذّر الاتصال بخادم العيادة. حاول بعد قليل.", "The Clinic server could not be reached. Please try again shortly.", "לא ניתן להתחבר לשרת המרפאה. נסו שוב בקרוב.");
      break;
    case "AI_UNAVAILABLE":
      message = t("خدمة الذكاء الاصطناعي مشغولة أو غير متاحة مؤقتًا. حاول بعد قليل.", "The AI service is busy or temporarily unavailable. Please try again shortly.", "שירות הבינה המלאכותית עמוס או אינו זמין זמנית. נסו שוב בקרוב.");
      break;
    case "AI_RATE_LIMITED":
      message = t("بلغت خدمة SAL حد الاستخدام. حاول لاحقًا.", "SAL has reached its AI service limit. Please try again later.", "SAL הגיע למגבלת השימוש בשירות. נסו שוב מאוחר יותר.");
      break;
    case "AI_CONFIGURATION":
      message = t("تحتاج خدمة SAL إلى مراجعة إعداداتها من فريق الدعم.", "SAL needs an AI configuration check by the support team.", "צוות התמיכה צריך לבדוק את הגדרות שירות SAL.");
      break;
    case "AI_INVALID_RESPONSE":
      message = t("وصل رد غير مكتمل من SAL. حاول مجددًا.", "SAL received an incomplete response. Please try again.", "SAL קיבל תשובה לא שלמה. נסו שוב.");
      break;
    case "RAG_UNAVAILABLE":
      message = t("تعذّر الوصول إلى مصادر معرفة SAL. حاول بعد قليل.", "SAL could not access its knowledge service. Please try again shortly.", "SAL לא הצליח לגשת למקורות המידע. נסו שוב בקרוב.");
      break;
    case "CATALOG_UNAVAILABLE":
      message = t("دليل الأطباء غير متاح مؤقتًا. حاول بعد قليل.", "The doctor directory is temporarily unavailable. Please try again shortly.", "מדריך הרופאים אינו זמין זמנית. נסו שוב בקרוב.");
      break;
    case "CONVERSATION_SAVE_FAILED":
    case "CONVERSATION_UNAVAILABLE":
      message = t("تعذّر تحميل المحادثة أو حفظها. راجع سجل المحادثات قبل الإرسال مجددًا.", "Your conversation could not be loaded or saved. Check its history before sending again.", "לא ניתן לטעון או לשמור את השיחה. בדקו את ההיסטוריה לפני שליחה נוספת.");
      break;
    default:
      message = error instanceof TypeError
        ? t("تعذّر الاتصال. تحقق من اتصالك بالإنترنت.", "Connection failed. Please check your internet connection.", "החיבור נכשל. בדקו את חיבור האינטרנט.")
        : t("تعذّر الحصول على رد من SAL. حاول مجددًا.", "SAL could not complete the reply. Please try again.", "SAL לא הצליח להשלים את התשובה. נסו שוב.");
  }
  const saved = error instanceof ApiError && error.detail?.message_saved;
  return `${message} ${saved
    ? t("تم حفظ رسالتك. راجع سجل المحادثة قبل إعادة إرسالها.", "Your message was saved. Review conversation history before resending it.", "ההודעה נשמרה. בדקו את היסטוריית השיחה לפני שליחה חוזרת.")
    : signedIn
      ? t("المسودة ما زالت هنا. راجع السجل إذا انقطع الاتصال أثناء الحفظ.", "Your draft is still here. Check history if the connection failed during saving.", "הטיוטה עדיין כאן. בדקו את ההיסטוריה אם החיבור נקטע במהלך השמירה.")
      : t("رسالتك ما زالت هنا.", "Your draft is still here.", "הטיוטה עדיין כאן.")}`;
}
