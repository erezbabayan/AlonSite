import styles from './Hero.module.css';

const CAROUSEL_IMAGES = [
  { src: 'https://images.pexels.com/photos/1586960/pexels-photo-1586960.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop', alt: 'Military Service' },
  { src: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop', alt: 'Training Together' },
  { src: 'https://images.pexels.com/photos/1174775/pexels-photo-1174775.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop', alt: 'Brotherhood' },
  { src: 'https://images.pexels.com/photos/1422286/pexels-photo-1422286.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop', alt: 'Family Moments' },
  { src: 'https://images.pexels.com/photos/1545698/pexels-photo-1545698.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop', alt: 'Leadership' },
  { src: 'https://images.pexels.com/photos/1557652/pexels-photo-1557652.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop', alt: 'Dedication' },
  { src: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop', alt: 'Final Honor' },
];

export default function Hero() {
  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.memorialOverlay} />
      <div className={styles.photoCarousel}>
        <div className={styles.carouselTrack}>
          {CAROUSEL_IMAGES.map((img) => (
            <div key={img.alt} className={styles.photoSlide}>
              <img src={img.src} alt={img.alt} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.heroContent}>
        <div className={styles.heroMain}>
          <div className={styles.heroImageSection}>
            <div className={styles.memorialPhotoPlaceholder}>
              <div className={styles.photoFrame}>
                <img
                  src="https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop"
                  alt='אלון אברהם חי בביאן ז"ל'
                />
              </div>
            </div>
          </div>

          <div className={styles.heroText}>
            <div className={styles.memorialTitle}>
              <h1>לזכרו הנצחי</h1>
              <div className={styles.titleDivider} />
            </div>
            <div className={styles.serviceInfo}>
              <div className={styles.namePlate}>
                <p className={styles.name}>אלון אברהם חי בביאן ז&quot;ל</p>
              </div>
              <div className={styles.serviceDetails}>
                <p className={styles.service}>חיל האוויר - טייס</p>
                <p className={styles.dates}>תשל&quot;ח - תשנ&quot;ז</p>
                <p className={styles.age}>בן 19</p>
                <p className={styles.incident}>נפל באסון המסוקים • 4 בפברואר 1997</p>
              </div>
            </div>
            <div className={styles.heroQuote}>
              <div className={styles.quoteMark}>&quot;</div>
              <p className={styles.quoteText}>&quot;נפל יחד עם 72 חבריו באסון המסוקים הטרגי&quot;</p>
              <div className={styles.quoteAttribution}>יהי זכרו ברוך</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
