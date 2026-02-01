import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './Gallery.module.css';

const SLIDES = [
  { img: 'https://images.pexels.com/photos/1586960/pexels-photo-1586960.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop', title: 'שירות צבאי', desc: 'בתחילת הדרך הצבאית' },
  { img: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop', title: 'אימונים', desc: 'התכונות למשימות קשות' },
  { img: 'https://images.pexels.com/photos/1174775/pexels-photo-1174775.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop', title: 'אחווה', desc: 'קשרים עמוקים עם חברי היחידה' },
  { img: 'https://images.pexels.com/photos/1545698/pexels-photo-1545698.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop', title: 'מנהיגות', desc: 'הובלת חברים במשימות' },
  { img: 'https://images.pexels.com/photos/1557652/pexels-photo-1557652.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop', title: 'מסירות', desc: 'הקדשה מלאה למשימה' },
  { img: 'https://images.pexels.com/photos/1422286/pexels-photo-1422286.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop', title: 'כבוד', desc: 'רגעי גאווה ושמחה' },
  { img: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop', title: 'זכרון נצחי', desc: 'יהי זכרו ברוך לעד' },
];

const GALLERY_ITEMS = [
  { img: 'https://images.pexels.com/photos/1586960/pexels-photo-1586960.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', title: 'שירות צבאי', date: '2013' },
  { img: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', title: 'אימונים', date: '2014' },
  { img: 'https://images.pexels.com/photos/1174775/pexels-photo-1174775.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', title: 'אחווה', date: '2015' },
  { img: 'https://images.pexels.com/photos/1545698/pexels-photo-1545698.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', title: 'מנהיגות', date: '2016' },
  { img: 'https://images.pexels.com/photos/1557652/pexels-photo-1557652.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', title: 'מסירות', date: '2017' },
  { img: 'https://images.pexels.com/photos/1422286/pexels-photo-1422286.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop', title: 'כבוד', date: '2018' },
];

export default function Gallery() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideshowRef = useRef<HTMLDivElement>(null);

  const totalSlides = SLIDES.length;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const startAutoSlide = () => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    autoSlideRef.current = setInterval(nextSlide, 4000);
  };

  const stopAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
      autoSlideRef.current = null;
    }
  };

  useEffect(() => {
    if (!isPaused) {
      startAutoSlide();
    }
    return () => stopAutoSlide();
  }, [isPaused, currentSlide]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    stopAutoSlide();
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <section id="gallery" className={styles.gallery}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.memorialIcon}>📷</div>
          <h2>גלריית זכרונות</h2>
          <div className={styles.sectionDivider} />
          <p className={styles.sectionDescription}>
            אוסף תמונות יקרות מחיי החייל הגיבור - מילדות ועד לשירות הצבאי
          </p>
        </div>

        <div className={styles.slideshowSection}>
          <h3>מצגת זכרונות</h3>
          <div
            className={styles.photoSlideshow}
            ref={slideshowRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className={styles.slideshowContainer}>
              <div
                className={styles.slidesTrack}
                style={{ transform: `translateX(${-currentSlide * (100 / totalSlides)}%)` }}
              >
                {SLIDES.map((slide, i) => (
                  <div key={i} className={styles.slide}>
                    <img src={slide.img} alt={slide.title} />
                    <div className={styles.slideCaption}>
                      <h4>{slide.title}</h4>
                      <p>{slide.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.slideshowControls}>
              <button type="button" className={styles.controlBtn} onClick={() => { stopAutoSlide(); prevSlide(); startAutoSlide(); }}>
                ‹
              </button>
              <div className={styles.slideIndicators}>
                {SLIDES.map((_, i) => (
                  <span
                    key={i}
                    className={`${styles.indicator} ${i === currentSlide ? styles.active : ''}`}
                    onClick={() => { stopAutoSlide(); goToSlide(i); startAutoSlide(); }}
                    onKeyDown={(e) => e.key === 'Enter' && goToSlide(i)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
              <button type="button" className={styles.controlBtn} onClick={() => { stopAutoSlide(); nextSlide(); startAutoSlide(); }}>
                ›
              </button>
            </div>
          </div>
        </div>

        <div className={styles.galleryGridSection}>
          <h3>גלריית תמונות</h3>
          <div className={styles.galleryGrid}>
            {GALLERY_ITEMS.map((item, i) => (
              <div key={i} className={styles.galleryItem}>
                <img src={item.img} alt={item.title} />
                <div className={styles.overlay}>
                  <h4>{item.title}</h4>
                  <span className={styles.date}>{item.date}</span>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.galleryActions}>
            <Link to="/gallery" className={styles.viewAllBtn}>
              צפה בכל התמונות
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
