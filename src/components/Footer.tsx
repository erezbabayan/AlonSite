import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer id="footer" className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.memorialHeader}>
          <div className={styles.memorialSymbol}>🕯️</div>
          <h2>לזכרו הנצחי</h2>
          <div className={styles.memorialLine} />
        </div>

        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3>זיכרון נצחי</h3>
            <div className={styles.memorialQuote}>
              <div className={styles.quoteHebrew}>&quot;יהי זכרו ברוך לעד ועולמים&quot;</div>
              <div className={styles.quoteDate}>תש&quot;נ - תשפ&quot;ג</div>
            </div>
          </div>

          <div className={styles.footerSection}>
            <h3>דפי הזיכרון</h3>
            <ul>
              <li><Link to="/">דף הבית</Link></li>
              <li><Link to="/gallery">גלריה</Link></li>
              <li><Link to="/letters">מכתבים</Link></li>
              <li><Link to="/articles">כתבות</Link></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h3>הנצחה ותמיכה</h3>
            <div className={styles.supportText}>
              <p>לתרומות ותמיכה למשפחה השכולה</p>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.bottomMemorial}>
            <div className={styles.memorialFlames}>
              <div className={styles.smallFlame} />
              <div className={styles.smallFlame} />
              <div className={styles.smallFlame} />
            </div>
            <div className={styles.memorialText}>
              <p>נשמתו צרורה בצרור החיים</p>
              <p>&copy; 2024 אתר זיכרון - נוצר באהבה ובכבוד</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
