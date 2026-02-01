import styles from './ArticlesPage.module.css';

const ARTICLES = [
  {
    featured: true,
    img: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    source: 'ידיעות אחרונות',
    date: '20 במאי 2024',
    title: 'גיבור שנפל בשירות המדינה: סיפורו של חייל אמיץ',
    content: 'כתבה מקיפה על חייו ושירותו הצבאי של החייל הגיבור. מסיפור הילדות ועד לרגעים האחרונים, דיוקן של אדם שהקדיש את חייו למען המדינה ואזרחיה.',
    contentEn: 'A comprehensive article about the life and military service of the brave soldier. From childhood stories to the final moments, a portrait of a man who dedicated his life to the country and its citizens.',
  },
  {
    featured: false,
    img: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
    source: 'מעריב',
    date: '18 במאי 2024',
    title: 'מפקדיו מספרים: "חייל מופתי שהיה דוגמה לכולנו"',
    content: 'עדויות מרגשות ממפקדים וחברים ליחידה על אישיותו המיוחדת ותרומתו לביטחון המדינה.',
    contentEn: 'Moving testimonies from commanders and unit members about his special personality and contribution to national security.',
  },
  {
    featured: false,
    img: 'https://images.pexels.com/photos/1174775/pexels-photo-1174775.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
    source: 'הארץ',
    date: '15 במאי 2024',
    title: 'אחווה שלא תישכח: חברי היחידה נפרדים',
    content: 'סיפורים אישיים מחברי היחידה על הקשרים העמוקים והאחווה שרווחה ביניהם.',
    contentEn: 'Personal stories from unit members about the deep bonds and brotherhood that existed between them.',
  },
  {
    featured: false,
    img: 'https://images.pexels.com/photos/1422286/pexels-photo-1422286.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
    source: 'ישראל היום',
    date: '12 במאי 2024',
    title: 'המשפחה מספרת: "הוא תמיד חלם להגן על המדינה"',
    content: 'ראיון מרגש עם בני המשפחה על הילד שגדל להיות גיבור ועל החלום שהוביל אותו לשירות הצבאי.',
    contentEn: 'A moving interview with family members about the child who grew up to be a hero and the dream that led him to military service.',
  },
  {
    featured: false,
    img: 'https://images.pexels.com/photos/1545698/pexels-photo-1545698.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
    source: 'כלכליסט',
    date: '10 במאי 2024',
    title: 'מנהיגות בשדה הקרב: כיצד הוביל את חבריו ברגעים הקשים',
    content: 'ניתוח מעמיק של כישורי המנהיגות שהפגין בזמן השירות ובמבצעים שונים.',
    contentEn: 'An in-depth analysis of the leadership skills he demonstrated during service and various operations.',
  },
  {
    featured: false,
    img: 'https://images.pexels.com/photos/1557652/pexels-photo-1557652.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
    source: 'וואלה',
    date: '8 במאי 2024',
    title: 'טקס הזיכרון: מאות הגיעו לכבד את זכרו',
    content: 'תיאור מרגש מטקס הזיכרון שנערך לכבודו, בהשתתפות מאות אנשים שבאו להוקיר את זכרו.',
    contentEn: 'A moving description of the memorial ceremony held in his honor, attended by hundreds who came to honor his memory.',
  },
];

export default function ArticlesPage() {
  return (
    <main id="articles-page" className={styles.articlesPage}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1>כתבות • Articles</h1>
          <p>כתבות עיתונאיות ומאמרים על החייל הגיבור</p>
          <p>News articles and stories about the brave soldier</p>
        </div>

        <div className={styles.articlesGrid}>
          {ARTICLES.map((article, i) => (
            <article key={i} className={`${styles.articleCard} ${article.featured ? styles.featured : ''}`}>
              <div className={styles.articleImage}>
                <img src={article.img} alt={article.title} />
                {article.featured && <div className={styles.articleBadge}>כתבה ראשית</div>}
              </div>
              <div className={styles.articleContent}>
                <div className={styles.articleMeta}>
                  <span className={styles.source}>{article.source}</span>
                  <span className={styles.date}>{article.date}</span>
                </div>
                {article.featured ? (
                  <h2>{article.title}</h2>
                ) : (
                  <h3>{article.title}</h3>
                )}
                <p>{article.content}</p>
                <p className={styles.english}>{article.contentEn}</p>
                <a href="#" className={styles.readMore}>
                  קרא עוד
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.loadMoreSection}>
          <button type="button" className={styles.loadMoreBtn}>
            טען עוד כתבות
          </button>
        </div>
      </div>
    </main>
  );
}
