import { useState } from 'react';
import styles from './GalleryPage.module.css';

const GALLERY_ITEMS = [
  { img: 'https://images.pexels.com/photos/1586960/pexels-photo-1586960.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop', title: 'שירות צבאי', titleEn: 'Military Service', date: '2013', category: 'military' },
  { img: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop', title: 'אימונים', titleEn: 'Training', date: '2014', category: 'military' },
  { img: 'https://images.pexels.com/photos/1174775/pexels-photo-1174775.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop', title: 'אחווה', titleEn: 'Brotherhood', date: '2015', category: 'friends' },
  { img: 'https://images.pexels.com/photos/1545698/pexels-photo-1545698.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop', title: 'מנהיגות', titleEn: 'Leadership', date: '2016', category: 'military' },
  { img: 'https://images.pexels.com/photos/1557652/pexels-photo-1557652.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop', title: 'ילדות', titleEn: 'Childhood', date: '2005', category: 'childhood' },
  { img: 'https://images.pexels.com/photos/1422286/pexels-photo-1422286.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop', title: 'משפחה', titleEn: 'Family', date: '2010', category: 'family' },
  { img: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop', title: 'חברים', titleEn: 'Friends', date: '2012', category: 'friends' },
  { img: 'https://images.pexels.com/photos/1181346/pexels-photo-1181346.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop', title: 'טקס', titleEn: 'Ceremony', date: '2017', category: 'military' },
  { img: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop', title: 'בית ספר', titleEn: 'School', date: '2008', category: 'childhood' },
  { img: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop', title: 'מפגש משפחתי', titleEn: 'Family Gathering', date: '2018', category: 'family' },
  { img: 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop', title: 'כבוד', titleEn: 'Honor', date: '2019', category: 'military' },
  { img: 'https://images.pexels.com/photos/1181712/pexels-photo-1181712.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop', title: 'חגיגה', titleEn: 'Celebration', date: '2020', category: 'friends' },
];

type Filter = 'all' | 'childhood' | 'military' | 'family' | 'friends';

export default function GalleryPage() {
  const [filter, setFilter] = useState<Filter>('all');

  const filteredItems = filter === 'all'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter((item) => item.category === filter);

  return (
    <main id="gallery-page" className={styles.galleryPage}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1>גלריית תמונות • Photo Gallery</h1>
          <p>אוסף תמונות יקרות מחיי החייל הגיבור</p>
          <p>A precious collection of photos from the brave soldier&apos;s life</p>
        </div>

        <div className={styles.galleryFilters}>
          <button type="button" className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`} onClick={() => setFilter('all')}>
            הכל
          </button>
          <button type="button" className={`${styles.filterBtn} ${filter === 'childhood' ? styles.active : ''}`} onClick={() => setFilter('childhood')}>
            ילדות
          </button>
          <button type="button" className={`${styles.filterBtn} ${filter === 'military' ? styles.active : ''}`} onClick={() => setFilter('military')}>
            צבא
          </button>
          <button type="button" className={`${styles.filterBtn} ${filter === 'family' ? styles.active : ''}`} onClick={() => setFilter('family')}>
            משפחה
          </button>
          <button type="button" className={`${styles.filterBtn} ${filter === 'friends' ? styles.active : ''}`} onClick={() => setFilter('friends')}>
            חברים
          </button>
        </div>

        <div className={styles.galleryGrid}>
          {filteredItems.map((item, i) => (
            <div key={i} className={styles.galleryItem}>
              <img src={item.img} alt={item.title} />
              <div className={styles.overlay}>
                <h3>{item.title}</h3>
                <p>{item.titleEn}</p>
                <span className={styles.date}>{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
