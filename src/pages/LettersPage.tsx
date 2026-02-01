import { useState } from 'react';
import styles from './LettersPage.module.css';

type Section = 'all' | 'family' | 'friends' | 'military';

interface Letter {
  type: Section;
  avatar: string;
  author: string;
  date: string;
  content: string;
  signature: string;
}

const LETTERS: Letter[] = [
  { type: 'family', avatar: '👨‍👩‍👧‍👦', author: 'ההורים', date: '15 במאי 2024', content: 'אלון היקר, אין מילים שיכולות לתאר את הגעגועים שלנו אליך. היית הגאווה שלנו, הילד שתמיד חלם לטוס ונתן מעצמו לכולם. החלום שלך להיות טייס התגשם, וזכרך יהיה נצחי בלבותינו.', signature: 'באהבה נצחית, אמא ואבא' },
  { type: 'family', avatar: '👫', author: 'האחים', date: '12 במאי 2024', content: 'אח יקר, היית לנו דמות לחיקוי ומקור השראה. תמיד הגנת עלינו ודאגת לנו. נמשיך בדרכך ונזכור את הערכים שלימדת אותנו.', signature: 'אחיך לנצח' },
  { type: 'friends', avatar: '👫', author: 'חברי ילדות', date: '10 במאי 2024', content: 'חבר הילדות הכי טוב שיכולנו לבקש. זכרונות יפים מהשכונה, מהמשחקים ומההרפתקאות. תמיד נזכור את החיוך שלך.', signature: 'חברי הילדות' },
  { type: 'friends', avatar: '⚽', author: 'חברי הקבוצה', date: '8 במאי 2024', content: 'שחקן מעולה ובעיקר חבר נפלא. תמיד עודד את כולנו ולא ויתר לעולם. הרוח הספורטיבית שלו תמשיך להשפיע עלינו.', signature: 'קבוצת הכדורגל' },
  { type: 'military', avatar: '👨‍💼', author: 'מפקד היחידה', date: '12 במאי 2024', content: 'חייל מופתי שהיה דוגמה לכולנו. מנהיג טבעי שידע להוביל את חבריו גם ברגעים הקשים ביותר. הקרבתו לא תישכח לעולם.', signature: 'בכבוד רב, אל"מ דוד כהן' },
  { type: 'military', avatar: '👥', author: 'חברי הפלוגה', date: '10 במאי 2024', content: 'אח יקר, היית הלב הפועם של הפלוגה. תמיד דאגת לכולנו, תמיד היית שם כשהיינו צריכים. המורשת שלך תמשיך לחיות בנו.', signature: 'חבריך לנצח' },
];

const STORIES = [
  { avatar: '🕯️', title: 'טקס זיכרון 2024', date: '4 בפברואר 2024', content: 'בטקס הזיכרון השנתי לנופלי אסון המסוקים התכנסו מאות אנשים לכבד את זכרם. המשפחות, החברים וחברי היחידות שירתו יחד הדליקו נרות זיכרון ושיתפו זכרונות.' },
  { avatar: '🌹', title: 'ביקור באנדרטה', date: '1 בינואר 2024', content: 'בתחילת השנה החדשה, משפחות הנופלים התכנסו באנדרטת הזיכרון לטקס קטן ואינטימי. כל משפחה הניחה זר פרחים והקריאה מכתב אישי לזכר יקיריהם.' },
];

export default function LettersPage() {
  const [section, setSection] = useState<Section>('all');

  const filteredLetters = section === 'all' ? LETTERS : LETTERS.filter((l) => l.type === section);

  return (
    <main id="letters-page" className={styles.lettersPage}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1>מכתבים</h1>
          <p>מכתבים אישיים ומחוות לב מהמשפחה, חברים וחברי היחידה</p>
        </div>

        <div className={styles.sectionFilters}>
          <button type="button" className={`${styles.sectionBtn} ${section === 'all' ? styles.active : ''}`} onClick={() => setSection('all')}>
            הכל
          </button>
          <button type="button" className={`${styles.sectionBtn} ${section === 'family' ? styles.active : ''}`} onClick={() => setSection('family')}>
            👨‍👩‍👧‍👦 משפחה
          </button>
          <button type="button" className={`${styles.sectionBtn} ${section === 'friends' ? styles.active : ''}`} onClick={() => setSection('friends')}>
            👥 חברים
          </button>
          <button type="button" className={`${styles.sectionBtn} ${section === 'military' ? styles.active : ''}`} onClick={() => setSection('military')}>
            🎖️ צבא
          </button>
        </div>

        <div className={styles.lettersGrid}>
          {filteredLetters.map((letter, i) => (
            <div key={i} className={styles.letterCard}>
              <div className={styles.letterHeader}>
                <div className={styles.authorInfo}>
                  <div className={styles.authorAvatar}>{letter.avatar}</div>
                  <div className={styles.authorDetails}>
                    <h3>{letter.author}</h3>
                    <span className={styles.date}>{letter.date}</span>
                  </div>
                </div>
              </div>
              <div className={styles.letterContent}>
                <p>{letter.content}</p>
                <div className={styles.letterSignature}>
                  <p>{letter.signature}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {section === 'all' && (
          <div className={styles.memorialStoriesSection}>
            <h2>סיפורים מיום הזיכרון</h2>
            <p className={styles.sectionDescription}>סיפורים חדשים ועדכונים מטקסי הזיכרון השנתיים</p>
            {STORIES.map((story, i) => (
              <div key={i} className={styles.storyCard}>
                <div className={styles.letterHeader}>
                  <div className={styles.authorInfo}>
                    <div className={styles.authorAvatar}>{story.avatar}</div>
                    <div className={styles.authorDetails}>
                      <h3>{story.title}</h3>
                      <span className={styles.date}>{story.date}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.letterContent}>
                  <p>{story.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.addLetterSection}>
          <h2>הוסף מכתב</h2>
          <p>רוצה לשתף זיכרון או מחווה? הוסף את המכתב שלך</p>
          <button type="button" className={styles.addLetterBtn}>
            כתוב מכתב
          </button>
        </div>
      </div>
    </main>
  );
}
