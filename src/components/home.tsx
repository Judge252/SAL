"use client";
import { useState } from "react";
import Link from "next/link";
import { Arrow, Brand, DoctorCard } from "./ui";
import { useClinic } from "./provider";
import { doctors, specialties, cities } from "@/lib/data";
import { CareSearch } from "./care-search";
import { SpecialtySelector } from "./specialties";
import { ConsultationFeature } from "./online";
import { CalendarDays, Video } from "lucide-react";
export function HomePage() {
  const { t, locale } = useClinic();
  const [care, setCare] = useState("all");
  const selectedDoctors = doctors
    .filter(
      (d) =>
        care === "all" ||
        (care === "video"
          ? d.consultations.includes("video")
          : d.cityId === care),
    )
    .slice(0, 2);
  return (
    <>
      <section className="care-opening">
        <div className="container">
          <div className="opening-heading">
            <div>
              <p className="section-kicker">
                {t(
                  "The Clinic · رعاية أقرب إليك",
                  "THE CLINIC · FIND YOUR CARE",
                  "THE CLINIC · הטיפול שלך",
                )}
              </p>
              <h1>
                {t("ابحث عن طبيب.", "Find your doctor.", "מצאו את הרופא שלכם.")}
                <br />
                {t(
                  "وخذ خطوتك بثقة.",
                  "Know your next step.",
                  "דעו מה הצעד הבא.",
                )}
              </h1>
            </div>
            <p className="opening-description">
              {t(
                "أطباء، تخصصات، ومواعيد تناسبك. ابحث مباشرة، أو دع SAL يساعدك في ترتيب أسئلتك قبل الزيارة.",
                "Doctors, specialties, and appointments that work for you. Search directly, or let SAL help organize your questions before a visit.",
                "רופאים, התמחויות ותורים שמתאימים לכם. חפשו ישירות, או תנו ל־SAL לעזור לארגן את השאלות לפני הביקור.",
              )}
            </p>
          </div>
          <CareSearch />
          <div className="popular-specialties">
            <span>
              {t("تخصصات شائعة", "Popular specialties", "התמחויות נפוצות")}
            </span>
            {(
              ["family", "pediatrics", "dermatology", "gynecology"] as const
            ).map((key) => (
              <Link href={`/doctors?specialty=${key}`} key={key}>
                {specialties[key][locale]}
                <Arrow diagonal />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <div className="container product-shortcuts">
        <Link href="/specialties">
          <span>
            <b>
              {t("اختر حسب التخصص", "Browse by specialty", "חיפוש לפי התמחות")}
            </b>
            <small>
              {t(
                "من طب العائلة إلى الرعاية المتخصصة",
                "From family medicine to specialist care",
                "מרפואת משפחה ועד מומחים",
              )}
            </small>
          </span>
          <Arrow />
        </Link>
        <Link href="/sal" className="sal-shortcut">
          <Brand sal />
          <span>
            <b>
              {t(
                "مش متأكد من أين تبدأ؟",
                "Not sure where to start?",
                "לא בטוחים היכן להתחיל?",
              )}
            </b>
            <small>
              {t(
                "رتّب خطوتك مع SAL",
                "Talk it through with SAL",
                "חשבו על זה יחד עם SAL",
              )}
            </small>
          </span>
          <Arrow />
        </Link>
        <Link href="/dashboard">
          <CalendarDays />
          <span>
            <b>
              {t(
                "مواعيدك في مكان واحد",
                "Your appointments, together",
                "התורים שלך במקום אחד",
              )}
            </b>
            <small>
              {t(
                "راجع حجوزاتك والأطباء المحفوظين",
                "Manage visits and saved doctors",
                "ניהול ביקורים ורופאים שמורים",
              )}
            </small>
          </span>
          <Arrow />
        </Link>
      </div>
      <section className="container section discovery-home">
        <div className="section-heading">
          <div>
            <span className="section-kicker">
              {t("دليل الأطباء", "DOCTOR DIRECTORY", "מדריך רופאים")}
            </span>
            <h2>
              {t(
                "الاختيار لك. التفاصيل واضحة.",
                "Your choice. A clearer picture.",
                "הבחירה שלך. תמונה ברורה.",
              )}
            </h2>
          </div>
          <Link href="/doctors" className="text-link">
            {t("جميع الأطباء", "All doctors", "כל הרופאים")}
            <Arrow />
          </Link>
        </div>
        <div className="directory-toolbar">
          <div
            className="filter-buttons"
            role="group"
            aria-label={t("تصفية الأطباء", "Filter doctors", "סינון רופאים")}
          >
            {[
              {
                id: "all",
                label: t("كل الأطباء", "All doctors", "כל הרופאים"),
              },
              { id: "haifa", label: t("حيفا", "Haifa", "חיפה") },
              { id: "nazareth", label: t("الناصرة", "Nazareth", "נצרת") },
              { id: "video", label: t("أونلاين", "Online", "אונליין") },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setCare(item.id)}
                aria-pressed={care === item.id}
              >
                {item.id === "video" && <Video size={17} />} {item.label}
              </button>
            ))}
          </div>
          <span className="demo-label">
            {t(
              "ملفات توضيحية، وليست أطباء موثّقين",
              "Demo profiles, not verified clinicians",
              "פרופילים להמחשה, לא רופאים מאומתים",
            )}
          </span>
        </div>
        <div className="home-directory-layout">
          <div className="doctor-grid">
            {selectedDoctors.map((d) => (
              <DoctorCard
                key={d.id}
                doctor={d}
                mode={care === "video" ? "video" : "clinic"}
              />
            ))}
          </div>
          <aside className="nearby-care">
            <h3>
              {t("الرعاية في مدينتك", "Care in your city", "טיפול בעיר שלכם")}
            </h3>
            <p>
              {t(
                "اختر موقع الزيارة، ثم قارن الأطباء المتاحين.",
                "Choose your location, then compare available clinicians.",
                "בחרו מיקום ואז השוו בין הרופאים הזמינים.",
              )}
            </p>
            {Object.entries(cities).map(([key, label]) => (
              <Link key={key} href={`/doctors?city=${key}`}>
                <span>{label[locale]}</span>
                <Arrow />
              </Link>
            ))}
            <div>
              <Video size={23} />
              <h3>
                {t(
                  "تفضّل زيارة عن بُعد؟",
                  "Prefer a remote visit?",
                  "מעדיפים ביקור מרחוק?",
                )}
              </h3>
              <Link className="text-link" href="/online">
                {t(
                  "أطباء استشارات الفيديو",
                  "Video consultation doctors",
                  "רופאים בייעוץ וידאו",
                )}
                <Arrow />
              </Link>
            </div>
          </aside>
        </div>
      </section>
      <section className="specialty-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                {t("مجالات الرعاية", "AREAS OF CARE", "תחומי טיפול")}
              </span>
              <h2>
                {t(
                  "لكل احتياج، وجهة.",
                  "Find your area of care.",
                  "מצאו את תחום הטיפול שלכם.",
                )}
              </h2>
            </div>
            <Link href="/specialties" className="text-link">
              {t("دليل التخصصات", "Specialty directory", "מדריך ההתמחויות")}
              <Arrow />
            </Link>
          </div>
          <SpecialtySelector />
        </div>
      </section>
      <section className="container section">
        <ConsultationFeature />
      </section>
      <section className="sal-editorial">
        <div className="container sal-editorial-inner">
          <div className="sal-editorial-intro">
            <div className="sal-lockup">
              <Brand sal />
              <span>SAL</span>
            </div>
            <h2>
              {t(
                "عندما لا تعرف\nمن أين تبدأ.",
                "When you don’t know\nwhere to start.",
                "כשלא יודעים\nמאיפה להתחיל.",
              )}
            </h2>
            <p>
              {t(
                "مساعدك لفهم خيارات الرعاية. يساعدك على تنظيم ما تشعر به، وتجهيز أسئلتك، واستكشاف الأطباء. القرار الطبي يبقى مع الطبيب.",
                "Your guide to care options. Organize what you’re experiencing, prepare your questions, and explore doctors. Medical decisions stay with your clinician.",
                "המדריך שלך לאפשרויות טיפול. ארגנו את מה שאתם חווים, הכינו שאלות וגלו רופאים. החלטות רפואיות נשארות עם הרופא.",
              )}
            </p>
            <Link href="/sal" className="button light">
              {t(
                "ابدأ محادثة مع SAL",
                "Start a conversation with SAL",
                "התחילו שיחה עם SAL",
              )}
              <Arrow />
            </Link>
          </div>
          <div className="sal-path">
            <span className="section-kicker">
              {t(
                "محادثة لها خطوة تالية",
                "A CONVERSATION WITH A NEXT STEP",
                "שיחה שמובילה לצעד הבא",
              )}
            </span>
            <ol>
              {[
                {
                  title: t(
                    "صف ما يشغلك",
                    "Describe your concern",
                    "תארו מה מטריד אתכם",
                  ),
                  text: t(
                    "بكلماتك، من غير مصطلحات طبية.",
                    "In your words, without medical jargon.",
                    "במילים שלכם, ללא מונחים רפואיים.",
                  ),
                },
                {
                  title: t(
                    "رتّب التفاصيل المهمة",
                    "Organize the important details",
                    "ארגנו את הפרטים החשובים",
                  ),
                  text: t(
                    "منذ متى؟ وما الأسئلة التي تريد طرحها؟",
                    "How long? What would you like to ask?",
                    "כמה זמן? מה תרצו לשאול?",
                  ),
                },
                {
                  title: t(
                    "انتقل إلى اختيار الطبيب",
                    "Move on to finding a doctor",
                    "המשיכו למציאת רופא",
                  ),
                  text: t(
                    "ملخص واضح تحمله معك إلى الزيارة.",
                    "A clear summary to take to your visit.",
                    "סיכום ברור שתוכלו לקחת לביקור.",
                  ),
                },
              ].map((step, i) => (
                <li key={step.title}>
                  <span>{i + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="sal-boundary">
              {t(
                "SAL ليس طبيبًا ولا يقدم تشخيصًا. هذه النسخة تستخدم محادثة إرشادية تجريبية.",
                "SAL is not a doctor and does not diagnose. This version uses a guided demo conversation.",
                "SAL אינו רופא ואינו מאבחן. גרסה זו משתמשת בשיחת הדגמה מודרכת.",
              )}
            </p>
          </div>
        </div>
      </section>
      <section className="container section care-information">
        <div>
          <span className="section-kicker">
            {t("قبل أن تحجز", "BEFORE YOU BOOK", "לפני שקובעים")}
          </span>
          <h2>
            {t(
              "تعرف ما الذي\nتحجزه بالضبط.",
              "Know what\nyou’re booking.",
              "דעו בדיוק\nמה אתם מזמינים.",
            )}
          </h2>
          <p>
            {t(
              "معلومات واضحة تساعدك على الاختيار، من أول بحث حتى تأكيد الموعد.",
              "Clear information to help you choose, from your first search to appointment confirmation.",
              "מידע ברור שעוזר לבחור, מהחיפוש הראשון ועד אישור התור.",
            )}
          </p>
        </div>
        <div className="care-questions">
          {[
            {
              title: t(
                "هل الزيارة في العيادة أم بالفيديو؟",
                "Is the visit in person or by video?",
                "האם הביקור במרפאה או בווידאו?",
              ),
              text: t(
                "يظهر نوع الاستشارة في ملف الطبيب، ويمكنك تأكيد اختيارك قبل الحجز.",
                "Consultation types are shown on each profile. Confirm your selection before booking.",
                "סוגי הייעוץ מוצגים בכל פרופיל. אשרו את הבחירה לפני ההזמנה.",
              ),
            },
            {
              title: t(
                "كيف أستعد للزيارة؟",
                "How do I prepare for a visit?",
                "איך מתכוננים לביקור?",
              ),
              text: t(
                "دوّن أسئلتك وجهّز أي تقارير تريد مناقشتها مع الطبيب. في النسخة التجريبية استخدم بيانات وهمية فقط.",
                "Write down your questions and gather any reports you want to discuss. Use fictional data only in this prototype.",
                "רשמו שאלות והכינו דוחות שתרצו לדון בהם. באב הטיפוס השתמשו בנתונים בדיוניים בלבד.",
              ),
            },
            {
              title: t(
                "هل يتم تأكيد موعد حقيقي هنا؟",
                "Will this create a real appointment?",
                "האם ייווצר תור אמיתי?",
              ),
              text: t(
                "هذه تجربة للواجهة. لا تُرسل بياناتك إلى عيادة ولا تُنشأ حجوزات أو مكالمات حقيقية.",
                "This is a frontend prototype. No data is sent to a clinic, and no real bookings or calls are created.",
                "זהו אב טיפוס. לא נשלחים נתונים למרפאה ולא נוצרים תורים או שיחות אמיתיים.",
              ),
            },
          ].map((q) => (
            <details key={q.title}>
              <summary>
                {q.title}
                <span>+</span>
              </summary>
              <p>{q.text}</p>
            </details>
          ))}
        </div>
      </section>
      <div className="container partner-bar">
        <div>
          <h3>{t("هل أنت طبيب؟", "Are you a clinician?", "עוסקים ברפואה?")}</h3>
          <p>
            {t(
              "استكشف إدارة المواعيد والطلبات في مساحة الطبيب.",
              "Explore appointment and request management in the doctor workspace.",
              "גלו ניהול תורים ובקשות במרחב לרופא.",
            )}
          </p>
        </div>
        <Link href="/doctor-dashboard" className="button outline">
          {t("افتح مساحة الطبيب", "Open doctor workspace", "למרחב הרופא")}
          <Arrow />
        </Link>
      </div>
    </>
  );
}
