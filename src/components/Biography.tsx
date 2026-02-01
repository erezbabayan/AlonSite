import styles from './Biography.module.css';

export default function Biography() {
  return (
    <section id="biography" className={styles.biography}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.memorialIcon}>📖</div>
          <h2>סיפור חייו</h2>
          <div className={styles.sectionDivider} />
        </div>
        <div className={styles.bioContent}>
          <div className={styles.bioText}>
            <div className={styles.section}>
              <h3>🌱 ילדות ונעורים</h3>
              <p>
                נולד בשנת תשל&quot;ח (1978) ברמת גן, שם בילה את ילדותו המאושרת בחיק משפחה אוהבת ותומכת.
                כבר מגיל צעיר הפגין תכונות מנהיגות יוצאות דופן, אומץ לב והתמדה שהיו לאות לעתידו הגדול.
                אהב ספורט, במיוחד כדורסל וטניס, וכבר אז חלם להיות טייס ולהגן על מדינתו מהאוויר.
              </p>
            </div>

            <div className={styles.section}>
              <h3>🎖️ שירות צבאי</h3>
              <p>
                התגייס בשנת תשנ&quot;ו (1996) לחיל האוויר, שם עבר הכשרה מתקדמת כטייס קרב.
                היה מוערך ואהוב על ידי מפקדיו וחבריו כחייל מסור, אמין ובעל רוח לחימה גבוהה.
                השתתף בטיסות אימון ומשימות ביטחון שוטפות, תמיד במקום הראשון ובמסירות מוחלטת לביטחון המדינה.
              </p>
            </div>

            <div className={styles.section}>
              <h3>❤️ ערכים ואישיות</h3>
              <p>
                היה אדם חם, אוהב ונדיב לב, שתמיד דאג לאחרים ושם את הזולת לפני עצמו.
                הפגין אומץ לב יוצא מן הכלל, נאמנות בלתי מתפשרת לחבריו ואהבת מולדת עמוקה ואמיתית.
                האמין בכל ליבו בחשיבות השירות הציבורי והקדיש את חייו הקצרים אך המלאים להגנה על המדינה, אזרחיה וערכיה.
              </p>
            </div>

            <div className={styles.section}>
              <h3>🚁 אסון המסוקים</h3>
              <p>
                ב-4 בפברואר 1997, בשעות הערב המוקדמות, התרחש אחד האסונות הקשים ביותר בתולדות צה&quot;ל.
                שני מסוקי &quot;יסעור&quot; התנגשו באוויר מעל שטח צפון ישראל בזמן טיסה שגרתית.
                באסון נהרגו 73 חיילים וקצינים, רובם לוחמים צעירים שיצאו לשירות מילואים בדרום לבנון.
                אלון אברהם חי בביאן היה אחד מהנופלים הצעירים באסון הטרגי הזה.
              </p>
            </div>

            <div className={styles.section}>
              <h3>💔 הקרבה אישית</h3>
              <p>
                אלון אברהם חי בביאן, בן 19, היה אחד מ-73 הנופלים באסון המסוקים הטרגי.
                כטייס צעיר בחיל האוויר, יצא למשימה שגרתית שהפכה לאחת הטרגדיות הגדולות בתולדות צה&quot;ל.
                חלומו להיות טייס קרב התגשם, אך נקטף בטרם עת יחד עם חבריו הטייסים.
              </p>
            </div>

            <div className={styles.section}>
              <h3>🌟 הנצחה לאומית</h3>
              <p>
                זכר נופלי אסון המסוקים מונצח במקומות רבים ברחבי הארץ.
                הוקמו אנדרטאות זיכרון, נקראו רחובות על שמם, ומדי שנה נערכים טקסי זיכרון מיוחדים.
                המדינה והעם זוכרים את קרבנם ומכבדים את זכרם של הגיבורים שנפלו באסון.
              </p>
            </div>

            <div className={`${styles.section} ${styles.finalTribute}`}>
              <h3>🕯️ מורשתו הנצחית</h3>
              <p>
                נפל יחד עם 72 חבריו באסון המסוקים, כשהוא נאמן לערכיו ולשליחותו עד הרגע האחרון.
                זכרו וזכר כל הנופלים יהיה נר תמיד לכל מי שהכיר אותם, ומורשתם תמשיך לחיות בלבות חבריהם, משפחותיהם ועם ישראל כולו.
              </p>
              <div className={styles.tributeSignature}>
                <p>יהי זכרם ברוך לעד ועולמים</p>
              </div>
            </div>
          </div>

          <div className={styles.bioHighlights}>
            <div className={styles.quoteCard}>
              <div className={styles.quoteIcon}>&quot;</div>
              <p className={styles.quoteText}>&quot;הטיסה היא החלום שלי, ולהגן על המדינה מהאוויר זה הכבוד הגדול ביותר&quot;</p>
              <p className={styles.quoteAuthor}>- מתוך שיחה עם המשפחה</p>
            </div>

            <div className={styles.quoteCard}>
              <div className={styles.quoteIcon}>&quot;</div>
              <p className={styles.quoteText}>&quot;כל טיסה היא הזדמנות חדשה להיות טוב יותר ולהגן טוב יותר&quot;</p>
              <p className={styles.quoteAuthor}>- מתוך יומן הטיסה</p>
            </div>

            <div className={styles.quoteCard}>
              <div className={styles.quoteIcon}>&quot;</div>
              <p className={styles.quoteText}>&quot;השמיים של ישראל הם הבית שלי, ואני אשמור עליהם&quot;</p>
              <p className={styles.quoteAuthor}>- לפני טיסת אימון</p>
            </div>

            <div className={styles.quoteCard}>
              <div className={styles.quoteIcon}>&quot;</div>
              <p className={styles.quoteText}>&quot;הטייסים הם משפחה, אנחנו תמיד שומרים אחד על השני&quot;</p>
              <p className={styles.quoteAuthor}>- על חברות בין טייסים</p>
            </div>

            <div className={`${styles.quoteCard} ${styles.memorialCard}`}>
              <div className={styles.quoteIcon}>&quot;</div>
              <p className={styles.quoteText}>&quot;אם משהו יקרה לי בשמיים, תזכרו שטסתי בגאווה ובאהבה למדינה&quot;</p>
              <p className={styles.quoteAuthor}>- מכתב לבני המשפחה</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
