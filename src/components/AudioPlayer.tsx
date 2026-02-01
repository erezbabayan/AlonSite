import { useState, useEffect, useRef } from 'react';
import styles from './AudioPlayer.module.css';

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasAttemptedPlay = useRef(false);

  const playAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.volume = 0.7;
      await audio.play();
      setIsPlaying(true);
      setShowNotice(false);
    } catch {
      setIsPlaying(false);
      setShowNotice(true);
      setTimeout(() => setShowNotice(false), 6000);
    }
  };

  useEffect(() => {
    if (hasAttemptedPlay.current) return;
    hasAttemptedPlay.current = true;

    playAudio();
    const t1 = setTimeout(playAudio, 500);
    const t2 = setTimeout(playAudio, 1500);

    const enableOnInteraction = () => {
      playAudio();
      document.removeEventListener('click', enableOnInteraction);
      document.removeEventListener('keydown', enableOnInteraction);
      document.removeEventListener('touchstart', enableOnInteraction);
    };

    document.addEventListener('click', enableOnInteraction);
    document.addEventListener('keydown', enableOnInteraction);
    document.addEventListener('touchstart', enableOnInteraction);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.removeEventListener('click', enableOnInteraction);
      document.removeEventListener('keydown', enableOnInteraction);
      document.removeEventListener('touchstart', enableOnInteraction);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <div id="audio-player" className={styles.audioPlayer}>
      <audio ref={audioRef} loop preload="auto">
        <source src="/memorial-audio.mp3" type="audio/mpeg" />
        <source src="/memorial-audio.mp3" type="audio/mp3" />
      </audio>

      <div id="audio-controls" className={styles.audioControls}>
        <button
          type="button"
          id="play-pause-btn"
          className={styles.audioBtn}
          onClick={togglePlay}
          aria-label={isPlaying ? 'השהה' : 'הפעל'}
        >
          <span className={styles.playIcon} style={{ display: isPlaying ? 'none' : 'inline' }}>
            🔊
          </span>
          <span className={styles.pauseIcon} style={{ display: isPlaying ? 'inline' : 'none' }}>
            🔇
          </span>
        </button>
        <span className={styles.audioLabel}>מוזיקת רקע</span>
      </div>

      <div
        id="audio-notice"
        className={`${styles.audioNotice} ${showNotice ? styles.show : ''}`}
      >
        <p>לחץ כדי להפעיל מוזיקת זיכרון</p>
      </div>
    </div>
  );
}
