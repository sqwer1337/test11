import React, { useRef, useState, useEffect, useCallback } from 'react';
import './VideoPlayer.css';
import Info from './Info';
import Timeline from './Timeline';
import videos from '../data/videos';

const VideoPlayer = () => {
  // Refs для управления анимацией
  const feedRef = useRef(null);
  const windowRef = useRef(null);
  const videoRefs = useRef([]);
  const currentVideoRef = useRef(null);
  
  // Refs для свайпа
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const touchStartTime = useRef(0);
  const isDragging = useRef(false);
  const isAnimating = useRef(false);
  const velocity = useRef(0);
  const lastMoveTime = useRef(0);
  
  // Состояния
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isUserInteracted, setIsUserInteracted] = useState(false);

  const currentVideo = videos[currentVideoIndex];
  const totalVideos = videos.length;

  // Получение высоты окна
  const getWindowHeight = useCallback(() => {
    return window.innerHeight;
  }, []);

  // Обновление позиции feed
  const updateFeedPosition = useCallback((index, offset = 0, animate = false) => {
    if (!feedRef.current) return;
    
    const height = getWindowHeight();
    const translateY = -index * height + offset;
    
    if (animate) {
      feedRef.current.style.transition = 'transform 0.38s cubic-bezier(0.22, 0.61, 0.36, 1)';
    } else {
      feedRef.current.style.transition = 'none';
    }
    
    feedRef.current.style.transform = `translate3d(0, ${translateY}px, 0)`;
  }, [getWindowHeight]);

  // Синхронизация позиции при изменении индекса
  useEffect(() => {
    if (!isDragging.current && !isAnimating.current) {
      updateFeedPosition(currentVideoIndex, 0, true);
    }
  }, [currentVideoIndex, updateFeedPosition]);

  // Загрузка видео при смене индекса - ОБНОВЛЕНО
  useEffect(() => {
    const video = videoRefs.current[currentVideoIndex];
    if (video) {
      // Обновляем ref для Timeline
      currentVideoRef.current = video;
      video.muted = false;
      
      if (isUserInteracted) {
        video.play().catch(() => {});
        setIsPlaying(true);
      }
      
      // Пауза остальных видео
      videoRefs.current.forEach((v, i) => {
        if (i !== currentVideoIndex && v) {
          v.pause();
          v.currentTime = 0;
        }
      });
    }
  }, [currentVideoIndex, isUserInteracted]);

  // Обработка клика по видео
  const handleVideoClick = useCallback(() => {
    const video = videoRefs.current[currentVideoIndex];
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [currentVideoIndex]);

  // Переключение видео
  const goToVideo = useCallback((index) => {
    if (isAnimating.current) return;
    if (index === currentVideoIndex) return;
    
    const newIndex = Math.max(0, Math.min(index, totalVideos - 1));
    if (newIndex === currentVideoIndex) return;
    
    isAnimating.current = true;
    
    // Мгновенно переключаем индекс
    setCurrentVideoIndex(newIndex);
    
    // Анимируем переход
    if (feedRef.current) {
      const height = getWindowHeight();
      const targetOffset = -newIndex * height;
      feedRef.current.style.transition = 'transform 0.38s cubic-bezier(0.22, 0.61, 0.36, 1)';
      feedRef.current.style.transform = `translate3d(0, ${targetOffset}px, 0)`;
    }
    
    setTimeout(() => {
      isAnimating.current = false;
    }, 400);
  }, [currentVideoIndex, totalVideos, getWindowHeight]);

  // Следующее видео
  const nextVideo = useCallback(() => {
    goToVideo(currentVideoIndex + 1);
  }, [currentVideoIndex, goToVideo]);

  // Предыдущее видео
  const prevVideo = useCallback(() => {
    goToVideo(currentVideoIndex - 1);
  }, [currentVideoIndex, goToVideo]);

  // Обработка свайпа
  const handleTouchStart = useCallback((e) => {
    if (isAnimating.current) return;
    
    isDragging.current = true;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = touchStartY.current;
    touchStartTime.current = Date.now();
    lastMoveTime.current = Date.now();
    velocity.current = 0;
    
    if (feedRef.current) {
      feedRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current || isAnimating.current) return;
    
    e.preventDefault();
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    const height = getWindowHeight();
    
    // Сопротивление на границах
    let limitedDiff = diff;
    if (currentVideoIndex === 0 && diff > 0) {
      limitedDiff = diff * 0.3;
    } else if (currentVideoIndex === totalVideos - 1 && diff < 0) {
      limitedDiff = diff * 0.3;
    }
    
    // Обновляем позицию
    const translateY = -currentVideoIndex * height + limitedDiff;
    if (feedRef.current) {
      feedRef.current.style.transform = `translate3d(0, ${translateY}px, 0)`;
    }
    
    // Вычисляем скорость
    const now = Date.now();
    const timeDiff = now - lastMoveTime.current;
    if (timeDiff > 0) {
      const currentDiff = currentY - touchCurrentY.current;
      velocity.current = currentDiff / timeDiff;
    }
    
    touchCurrentY.current = currentY;
    lastMoveTime.current = now;
  }, [currentVideoIndex, totalVideos, getWindowHeight]);

  const handleTouchEnd = useCallback((e) => {
    if (!isDragging.current || isAnimating.current) {
      isDragging.current = false;
      return;
    }
    
    isDragging.current = false;
    
    const diff = touchCurrentY.current - touchStartY.current;
    const absDiff = Math.abs(diff);
    const absVelocity = Math.abs(velocity.current);
    
    let shouldSwitch = false;
    let direction = 0;
    
    if (absVelocity > 0.8) {
      shouldSwitch = true;
      direction = velocity.current < 0 ? 1 : -1;
    } else if (absDiff > 80) {
      shouldSwitch = true;
      direction = diff < 0 ? 1 : -1;
    }
    
    if (shouldSwitch) {
      const newIndex = currentVideoIndex + direction;
      if (newIndex >= 0 && newIndex < totalVideos) {
        goToVideo(newIndex);
        return;
      }
    }
    
    // Возвращаем на текущее видео
    updateFeedPosition(currentVideoIndex, 0, true);
  }, [currentVideoIndex, totalVideos, goToVideo, updateFeedPosition]);

  // Обработка колесика мыши
  const handleWheel = useCallback((e) => {
    if (isAnimating.current) return;
    
    if (e.deltaY > 30) {
      nextVideo();
    } else if (e.deltaY < -30) {
      prevVideo();
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
  }, [prevVideo, nextVideo, handleVideoClick]);

  // Обработка первого взаимодействия
  useEffect(() => {
    const handleInteraction = () => {
      if (!isUserInteracted) {
        setIsUserInteracted(true);
        const video = videoRefs.current[currentVideoIndex];
        if (video) {
          video.muted = false;
          video.play().catch(() => {});
        }
      }
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [currentVideoIndex, isUserInteracted]);

  // Обработка изменения размера окна
  useEffect(() => {
    const handleResize = () => {
      updateFeedPosition(currentVideoIndex, 0, false);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentVideoIndex, updateFeedPosition]);

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
      ref={windowRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div className="feed" ref={feedRef}>
        {videos.map((video, index) => (
          <div className="slide" key={index}>
            <video
              ref={el => videoRefs.current[index] = el}
              src={video.url}
              playsInline
              loop
              muted={index !== currentVideoIndex}
              onClick={handleVideoClick}
              onPause={() => {
                if (index === currentVideoIndex) {
                  setIsPlaying(false);
                }
              }}
              onPlay={() => {
                if (index === currentVideoIndex) {
                  setIsPlaying(true);
                }
              }}
              onError={(e) => console.error('Video error:', e)}
              className="video-player"
            />
          </div>
        ))}
      </div>

      {/* Кнопки навигации */}
      <div className="nav-buttons">
        <button
          className="nav-btn nav-up"
          onClick={prevVideo}
          disabled={isAnimating.current || currentVideoIndex === 0}
          title="Предыдущее видео (↑)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
            <path d="M440-320h80v-168l64 64 56-56-160-160-160 160 56 56 64-64v168Zm40 240q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
          </svg>
        </button>
        <button
          className="nav-btn nav-down"
          onClick={nextVideo}
          disabled={isAnimating.current || currentVideoIndex === totalVideos - 1}
          title="Следующее видео (↓)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 8H11V12.2L9.4 10.6L8 12L12 16L16 12L14.6 10.6L13 12.2V8ZM12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2ZM12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4Z" fill="#E3E3E3" />
          </svg>
        </button>
      </div>

      {/* Иконка паузы */}
      <div className={`icon-stop ${!isPlaying ? 'show' : ''}`}>
        <svg width="53" height="60" viewBox="0 0 53 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 55.1135C0 58.1938 3.3355 60.1182 6.00216 58.5763L50.0332 33.1183C52.692 31.581 52.6982 27.745 50.0445 26.1991L6.01342 0.549691C3.34678 -1.00371 0 0.919916 0 4.00601V55.1135Z" fill="white" fillOpacity="0.3"/>
        </svg>
      </div>

      <Info
        user={currentVideo.user}
        description={currentVideo.description}
        likes={currentVideo.likes}
        comments={currentVideo.comments}
        shares={currentVideo.shares}
      />

      {/* Передаем сам ref, а не объект */}
      <Timeline videoRef={currentVideoRef} />
    </div>
  );
};

export default VideoPlayer;