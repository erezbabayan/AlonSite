import { NavLink } from 'react-router-dom';
import styles from './Navigation.module.css';

export default function Navigation() {
  return (
    <nav id="navigation" className={styles.navigation}>
      <div className={styles.navContainer}>
        <div className={styles.navLogo}>
          <span className={styles.memorialStar}>🕯️</span>
          <span className={styles.navTitle}>יהי זכרו ברוך</span>
        </div>

        <div className={styles.navLinks}>
          <NavLink to="/" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.active}` : styles.navLink)}>
            דף הבית
          </NavLink>
          <NavLink to="/gallery" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.active}` : styles.navLink)}>
            גלריה
          </NavLink>
          <NavLink to="/letters" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.active}` : styles.navLink)}>
            מכתבים
          </NavLink>
          <NavLink to="/articles" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.active}` : styles.navLink)}>
            כתבות
          </NavLink>
        </div>

        <div className={styles.navToggle} aria-label="תפריט">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
  );
}
