// MOCK DATA — placeholder Hebrew letters for the letters section (sections.html,
// letters.html). These are illustrative examples only, not real correspondence.
// Replace the entries below with real letters (scanned images can go in
// media/letters/) once they are available. Built for a few dozen entries.
//
// Categories: every letter belongs to exactly one category via `category`,
// matching a key in LETTERS_DATA.categories. "story" is reserved for the
// biographical narrative that runs through the printed book between the
// letters (told in the father's voice) — those entries may omit `to`.
window.LETTERS_DATA = {
  categories: [
    { key: "family", label: "משפחה" },
    { key: "extended-family", label: "משפחה מורחבת" },
    { key: "friends", label: "חברים" },
    { key: "army", label: "צבא" },
    { key: "articles", label: "מאמרים" },
    { key: "writings", label: "דברים שכתב" },
    { key: "story", label: "הסיפור" }
  ],
  letters: [
    {
      id: "letter-mock-1",
      title: "מכתב מטקס ההשבעה",
      date: "1994-08-01",
      from: "אלון",
      to: "המשפחה",
      category: "family",
      body:
        "שלום לכולם, רק רציתי לכתוב כמה מילים אחרי הטקס. היה מרגש לראות אתכם שם, וההרגשה שהתחלתי משהו חדש עדיין לא ממש שקעה אצלי. מתגעגע כבר עכשיו, אבל יודע שזו הדרך הנכונה בשבילי. אכתוב שוב בקרוב.",
      signature: "שלכם, אלון"
    },
    {
      id: "letter-mock-3",
      title: "מכתב מאמא",
      date: "1995-03-02",
      from: "אמא",
      to: "אלון",
      category: "family",
      body:
        "אלון יקר, מקווה שהאוכל שם סביר ושאתה ישן מספיק. כאן הכל כרגיל, מתגעגעים אליך מאוד. תתקשר כשיוצא לך, גם רק לכמה דקות.",
      signature: "אוהבת אותך, אמא"
    },
    {
      id: "letter-mock-5",
      title: "מכתב מהאחות",
      date: "1996-09-05",
      from: "אחותו",
      to: "אלון",
      category: "family",
      body:
        "אח שלי, מזל טוב על הדרגה! כולם כאן גאים בך מאוד, גם אם אתה לא תמיד אומר כמה. תשמור על עצמך שם, ותבוא לבקר כשאתה יכול.",
      signature: "אוהבת אותך, אחותך"
    },
    {
      id: "letter-mock-6",
      title: "מכתב מיום העצמאות",
      date: "1996-04-24",
      from: "אלון",
      to: "המשפחה",
      category: "family",
      body:
        "חג שמח לכולם. חבל שלא הצלחתי להגיע השנה, אבל המחשבות איתכם. מקווה שהצלחתם ליהנות מהברביקיו בלעדיי, ושמרתם לי משהו.",
      signature: "מתגעגע, אלון"
    },
    {
      id: "letter-mock-8",
      title: "מכתב מקורס קצינים",
      date: "1996-05-14",
      from: "אלון",
      to: "המשפחה",
      category: "family",
      body:
        "שלום לכולם, הקורס דורש הרבה, אבל אני מרגיש שאני לומד המון על עצמי ועל מה שחשוב לי באמת בפיקוד. תודה שאתם תמיד שם בשבילי גם כשהזמן קצר והשיחות קצרות. מקווה לספר לכם הכל כשניפגש.",
      signature: "אוהב אתכם, אלון"
    },
    {
      id: "letter-mock-9",
      title: "מכתב לקראת חופשה",
      date: "1996-06-02",
      from: "אלון",
      to: "המשפחה",
      category: "family",
      body:
        "שלום לכולם, סוף סוף מסתמן חופש בסוף החודש, אני כבר מחכה. תגידו לי מה קורה איתכם, ומה הייתם רוצים שנעשה יחד כשאני בבית.",
      signature: "מתגעגע, אלון"
    },
    {
      id: "letter-mock-10",
      title: "מכתב מהדוד",
      date: "1995-01-18",
      from: "דוד",
      to: "אלון",
      category: "extended-family",
      body:
        "אלון היקר, שמעתי מסבתא שהתמנית לתפקיד חדש, מזל טוב! כל המשפחה עוקבת אחריך בגאווה. אם תצטרך משהו כשאתה בחופש, אתה תמיד מוזמן אלינו.",
      signature: "דודך"
    },
    {
      id: "letter-mock-11",
      title: "מכתב מסבתא",
      date: "1996-02-27",
      from: "סבתא",
      to: "אלון",
      category: "extended-family",
      body:
        "נכד יקר, מתפללת בשבילך כל יום. תזכור לאכול טוב ולהתלבש חם, ותבוא לבקר את סבתא כשתוכל, מתגעגעת לחיבוקים שלך.",
      signature: "סבתא אוהבת"
    },
    {
      id: "letter-mock-2",
      title: "מכתב מחבר למכינה",
      date: "1994-11-20",
      from: "חבר ממכינת עצמונה",
      to: "אלון",
      category: "friends",
      body:
        "היי אלון, מה נשמע אצלכם בגולני? כאן במכינה ממשיכים כרגיל, אבל חסר את המקום שהיה לך תמיד להגיד משהו שמצחיק את כולם. תעדכן איך הולך, ותשתדל לבוא לביקור כשיוצא לך חופש.",
      signature: "שלך"
    },
    {
      id: "letter-mock-4",
      title: "מכתב לחבר ילדות",
      date: "1995-07-19",
      from: "אלון",
      to: "חבר ילדות",
      category: "friends",
      body:
        "מה נשמע אצלך? כאן עמוס אבל טוב, מכיר המון אנשים חדשים ולומד המון. מקווה שנתפוס זמן להיפגש בחופשה הקרובה, יש לי המון לספר.",
      signature: "אלון"
    },
    {
      id: "letter-mock-7",
      title: "מכתב מחבר מהיחידה",
      date: "1996-12-10",
      from: "חבר מהיחידה",
      to: "אלון",
      category: "army",
      body:
        "אחי, איזה כיף היה השבוע שעבר. אתה תמיד יודע איך להוריד את המתח מהאנשים גם ברגעים הכי לחוצים. שנמשיך ככה.",
      signature: "שלך"
    },
    {
      id: "letter-mock-12",
      title: "מכתב מהמפקד",
      date: "1996-08-09",
      from: "מפקד הפלוגה",
      to: "אלון",
      category: "army",
      body:
        "סגן אלון, רציתי לציין בפניך את העבודה הטובה שנעשתה השבוע בתרגיל. האנשים שלך סומכים עליך, וזה ניכר. המשך כך.",
      signature: "מפקד הפלוגה"
    },
    {
      id: "article-mock-1",
      title: "מאמר: על מנהיגות ואחריות בשטח",
      date: "1996-10-01",
      from: "אלון",
      to: "",
      category: "articles",
      body:
        "מנהיגות בשטח נבחנת לא ברגעים הגדולים אלא בפרטים הקטנים — איך מתייחסים לחייל שעייף, איך מחלקים משימה לא נעימה בצורה הוגנת. מפקד טוב הוא מי שהאנשים שלו יודעים שהוא איתם, גם כשהוא לא צריך להוכיח את זה.",
      signature: "אלון"
    },
    {
      id: "writing-mock-1",
      title: "מחברת אישית: מחשבה לפני שינה",
      date: "1996-11-15",
      from: "אלון",
      to: "",
      category: "writings",
      body:
        "לפעמים קשה להסביר למה בוחרים בדרך הזאת. זו לא רק שאלה של תפקיד, זו הרגשה שיש משהו שצריך לשמור עליו, ושאני רוצה להיות חלק ממי ששומר. אני מקווה שיום אחד אדע להסביר את זה במילים טובות יותר.",
      signature: ""
    },
    {
      id: "story-mock-1",
      title: "פרק מהספר: הדרך לגולני",
      date: "1994-07-01",
      from: "מהספר, מספר אבא",
      to: "",
      category: "story",
      body:
        "כשאלון עלה על האוטובוס בבוקר הגיוס, הוא הביט אחורה פעם אחת בלבד — לא מתוך היסוס, אלא כמי שרוצה לזכור בדיוק איך זה נראה. ידעתי כבר אז שהוא לא יסתפק בלהיות עוד חייל בשורה. הוא תמיד היה כזה: קודם מקשיב, אחר כך מחליט, ולבסוף עושה בלי להסתכל אחורה.",
      signature: "אבא"
    }
  ]
};
