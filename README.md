# כתב שנראה קצת אחרת

הטרמה חווייתית למפגש מורים: כמה דקות, אות אחת (א בכתב רש״י), הצלחה אחת, רפלקציה אחת — ופאנל מנחה שהופך את התשובות לחומר גלם לדיון על המסך.

> "לא נסביר למורים איך מרגישה למידה טובה. ניתן להם לחוות אותה — ואז נדבר עליה."

## מה יש כאן

| נתיב | מה זה |
|---|---|
| `/` | מסע הלמידה של המשתתפים (מובייל תחילה, RTL, אנונימי לחלוטין) |
| `/admin` | כניסת מנחה (קוד גישה) → דשבורד בזמן אמת, קיר מחשבות, מצב הקרנה, תשובה אחת, ענן מילים, מפגשים |
| `supabase/schema.sql` | הטבלאות, מדיניות RLS, וטריגר ה-Realtime |

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres + Realtime).

## הפעלה בשלושה שלבים

### 1. Supabase

1. פותחים פרויקט חדש ב-[supabase.com](https://supabase.com).
2. **SQL Editor → New query** — מדביקים את כל התוכן של `supabase/schema.sql` ומריצים. הקובץ בטוח להרצה חוזרת.
3. **Project Settings → API** — מעתיקים את `Project URL`, את המפתח `anon` ואת המפתח `service_role`.

### 2. משתני סביבה

מעתיקים את `.env.example` ל-`.env.local` (או למשתני הסביבה ב-Vercel) וממלאים:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # שרת בלבד — לעולם לא NEXT_PUBLIC_
ADMIN_CODE=2274                    # קוד המנחה, נבדק בצד השרת
ADMIN_SESSION_SECRET=...           # מחרוזת אקראית ארוכה, למשל: openssl rand -base64 32
```

### 3. הרצה / פריסה

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

לפריסה ב-Vercel: מייבאים את הריפו, מוסיפים את חמשת משתני הסביבה, Deploy. את הכתובת שמתקבלת הופכים ל-QR למפגש.

## איך זה עובד (בקצרה)

**המשתתפים** נכנסים בלי חשבון. נוצר להם `session_id` אנונימי ואקראי, וההתקדמות נשמרת מקומית בדפדפן — רענון לא מחזיר להתחלה. בלחיצה על "שיתוף" שלוש התשובות נשמרות ב-`teacher_reflections` דרך המפתח הציבורי (anon). אם השמירה נכשלת, התשובות נשארות בדפדפן ומוצע "ניסיון נוסף". אחרי שמירה מוצלחת ה-session מסומן כ-completed, וגם אינדקס ייחודי על `session_id` מונע שליחה כפולה.

**RLS:** למשתמש anon יש הרשאת INSERT בלבד על `teacher_reflections`. אין לו SELECT / UPDATE / DELETE, ואין לו שום גישה ל-`sessions`. הפאנל אף פעם לא קורא נתונים מהדפדפן — כל הקריאות עוברות דרך route handlers בשרת שמשתמשים במפתח ה-service_role.

**קוד המנחה** נבדק ב-`/api/admin/login` מול `ADMIN_CODE` (השוואה timing-safe, הגבלת ניסיונות). אחרי כניסה מוצלחת נוצר cookie חתום ב-HMAC (HttpOnly, 12 שעות). הקוד לא מופיע בשום קובץ JavaScript שנשלח לדפדפן.

**זמן אמת:** טריגר ב-Postgres שולח "פינג" ב-Supabase Realtime (Broadcast) בכל הוספת רפלקציה — הפינג לא מכיל טקסט תשובות. הדשבורד מאזין ומרענן דרך ה-API המאובטח. במקביל יש polling עדין כגיבוי (כל 20 שניות כשהחיבור חי, כל 5 שניות אם לא), כך שהפאנל מתעדכן גם אם ה-Realtime לא זמין.

**מפגשים:** "התחלת מפגש חדש" סוגר את המפגש הפתוח ופותח חדש. שום דבר לא נמחק. משתתפים חדשים מקושרים אוטומטית למפגש הפתוח, והמנחה יכול לחזור למפגשים קודמים מהתפריט.

## מקלדת במצב הקרנה

| מקש | פעולה |
|---|---|
| ← / → | שאלה הבאה / הקודמת (במצב "תשובה אחת": תשובה הבאה / הקודמת) |
| ↑ / ↓ | שאלה הקודמת / הבאה |
| 1 · 2 · 3 | קפיצה לשאלה |
| W · S · C | קיר · תשובה אחת · ענן מילים |
| Esc | יציאה ממצב הקרנה |

הכפתורים במצב הקרנה מופיעים רק כשמזיזים את העכבר.

## מבנה הקוד

```
src/
  app/
    page.tsx                 # החוויה
    admin/page.tsx           # מנחה (השרת מחליט: כניסה או דשבורד)
    api/session/current      # איזה מפגש פתוח (למשתתפים)
    api/admin/login|logout   # אימות קוד + cookie חתום
    api/admin/reflections    # קריאת תשובות (מנחה בלבד)
    api/admin/sessions       # רשימת מפגשים / מפגש חדש
  components/
    journey/                 # LearningIntro, FirstGuess, RevealLetter, RecognitionRound,
                             # SuccessMoment, Transition, ReflectionStep, Sharing, CompletionScreen
    admin/                   # AdminLogin, AdminDashboard, ProjectionMode, WordCloud, pieces
  lib/
    letters.ts               # תוכן המסע: האות, הסבבים, ערבוב דטרמיניסטי
    storage.ts               # שמירת מצב מקומית
    text.ts                  # טוקניזציה עברית, מילות עצירה, שכיחויות
    admin-auth.ts            # אימות מנחה (שרת בלבד)
    supabase/                # client (anon) / admin (service role, שרת בלבד)
public/fonts/                # Noto Rashi Hebrew, Heebo, Frank Ruhl Libre (OFL)
supabase/schema.sql
```

## פונטים

האות בכתב רש״י מוצגת בפונט **Noto Rashi Hebrew** (Google/Noto, רישיון SIL OFL) — גליפים אותנטיים של כתב רש״י, לא פונט עברי רגיל. ממשק: Heebo; כותרות: Frank Ruhl Libre. כל הפונטים מאוחסנים מקומית ב-`public/fonts`.

## הערות

- `attempts_identification` = סך הלחיצות בארבע משימות הזיהוי (4 = בלי אף טעות). הדשבורד מציג את הממוצע.
- מסך ה-"היום" בפאנל מחושב לפי שעון המחשב של המנחה.
- הודעות שגיאה למשתמשים הן תמיד בעברית פשוטה; פרטים טכניים לא מוצגים.
