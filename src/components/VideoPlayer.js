import React, { useRef, useState, useEffect, useCallback } from 'react';
import './VideoPlayer.css';
import Info from './Info';
import Timeline from './Timeline'; // Импортируем Timeline
import videos from '../data/videos';

const VideoPlayer = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState("next");
  const [touchStartY, setTouchStartY] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const videoRef = useRef(null);
  const videoRefs = useRef([]);
  const containerRef = useRef(null);
  const [isUserInteracted, setIsUserInteracted] = useState(false);
  const [currentVideoRef, setCurrentVideoRef] = useState(null); // Для Timeline

  const currentVideo = videos[currentVideoIndex];

  // Функция для безопасного воспроизведения видео
  const safePlayVideo = useCallback(async (video) => {
    if (!video) return;
    
    try {
      await video.play();
      setIsPlaying(true);
    } catch (error) {
      console.log('Autoplay prevented:', error.message);
      setIsPlaying(false);
    }
  }, []);

  // Функция для безопасной паузы видео
  const safePauseVideo = useCallback((video) => {
    if (!video) return;
    try {
      video.pause();
      setIsPlaying(false);
    } catch (error) {
      console.log('Pause error:', error.message);
    }
  }, []);

  // Загрузка видео при смене индекса
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === currentVideoIndex) {
        // Убеждаемся, что звук включен
        video.muted = false;
        // Устанавливаем текущий видео-реф для Timeline
        setCurrentVideoRef(video);
        // Пытаемся воспроизвести видео
        safePlayVideo(video);
      } else {
        safePauseVideo(video);
        video.currentTime = 0;
      }
    });
  }, [currentVideoIndex, safePlayVideo, safePauseVideo]);

  // Обработка первого взаимодействия пользователя
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!isUserInteracted) {
        setIsUserInteracted(true);
        const video = videoRefs.current[currentVideoIndex];
        if (video) {
          video.muted = false;
          safePlayVideo(video);
        }
      }
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [currentVideoIndex, isUserInteracted, safePlayVideo]);

  // Обработка клика по видео (пауза/воспроизведение)
  const handleVideoClick = useCallback(() => {
    const video = videoRefs.current[currentVideoIndex];
    if (!video) return;

    video.muted = false;

    if (video.paused) {
      safePlayVideo(video);
    } else {
      safePauseVideo(video);
    }
  }, [currentVideoIndex, safePlayVideo, safePauseVideo]);

  const nextVideo = useCallback(() => {
    setCurrentVideoIndex(prev =>
      Math.min(prev + 1, videos.length - 1)
    );
  }, []);

  const prevVideo = useCallback(() => {
    setCurrentVideoIndex(prev =>
      Math.max(prev - 1, 0)
    );
  }, []);

  // Обработка свайпа вверх/вниз
  const handleTouchStart = useCallback((e) => {
    setTouchStartY(e.touches[0].clientY);
    setIsSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isSwiping) return;
    const touchEndY = e.touches[0].clientY;
    const diff = touchStartY - touchEndY;

    const videoElement = videoRef.current;
    if (videoElement) {
      const translateY = diff * 0.3;
      videoElement.style.transform = `translateY(${translateY}px)`;
      videoElement.style.transition = 'none';
    }
  }, [isSwiping, touchStartY]);

  const handleTouchEnd = useCallback((e) => {
    if (!isSwiping) return;
    setIsSwiping(false);

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.style.transition = 'transform 0.3s ease';
      videoElement.style.transform = 'translateY(0)';
    }

    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextVideo();
      } else {
        prevVideo();
      }
    }
  }, [isSwiping, touchStartY, nextVideo, prevVideo]);

  // Обработка колесика мыши
  const handleWheel = useCallback((e) => {
    if (Math.abs(e.deltaY) > 50) {
      if (e.deltaY > 0) {
        nextVideo();
      } else {
        prevVideo();
      }
    }
  }, [nextVideo, prevVideo]);

  // Обработка клавиш
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        prevVideo();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nextVideo();
      } else if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        handleVideoClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextVideo, prevVideo, handleVideoClick]);

  // Индикатор загрузки
  if (isLoading) {
    return (
      <div className="video-window">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="video-window"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div
        className="feed"
        style={{
          transform: `translateY(-${currentVideoIndex * 100}vh)`
        }}
      >
        {videos.map((video, index) => (
          <div className="slide" key={index}>
            <video
              ref={el => videoRefs.current[index] = el}
              src={video.url}
              playsInline
              loop
              onClick={handleVideoClick}
              onPause={() => {
                const currentVideo = videoRefs.current[currentVideoIndex];
                if (currentVideo && currentVideo.paused) {
                  setIsPlaying(false);
                }
              }}
              onPlay={() => {
                setIsPlaying(true);
              }}
              onError={(e) => console.error('Video error:', e)}
              className="video-player"
            />
            {/* Добавляем Timeline только для текущего видео */}
            {index === currentVideoIndex && (
              <Timeline videoRef={{ current: currentVideoRef }} />
            )}
          </div>
        ))}
      </div>

      {/* Кнопки навигации (для десктопа) */}
      <div className="nav-buttons">
        <button
          className="nav-btn nav-up"
          onClick={prevVideo}
          title="Предыдущее видео (↑)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
            <path d="M440-320h80v-168l64 64 56-56-160-160-160 160 56 56 64-64v168Zm40 240q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
          </svg>
        </button>
        <button
          className="nav-btn nav-down"
          onClick={nextVideo}
          title="Следующее видео (↓)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 8H11V12.2L9.4 10.6L8 12L12 16L16 12L14.6 10.6L13 12.2V8ZM12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2ZM12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4Z" fill="#E3E3E3" />
          </svg>
        </button>
      </div>

      {/* Иконка паузы */}
      {!isPlaying && (
        <div className="icon-stop show">
          <svg width="53" height="60" viewBox="0 0 53 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 55.1135C0 58.1938 3.3355 60.1182 6.00216 58.5763L50.0332 33.1183C52.692 31.581 52.6982 27.745 50.0445 26.1991L6.01342 0.549691C3.34678 -1.00371 0 0.919916 0 4.00601V55.1135Z" fill="white" fillOpacity="0.3"/>
          </svg>
        </div>
      )}

      <Info
        user={currentVideo.user}
        description={currentVideo.description}
        likes={currentVideo.likes}
        comments={currentVideo.comments}
        shares={currentVideo.shares}
      />
    </div>
  );
};

export default VideoPlayer;