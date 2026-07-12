import React, { useRef, useState, useEffect } from 'react';
import './Timeline.css';

const Timeline = ({ videoRef }) => {
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef(null);

  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!isDragging && video.duration) {
        const percent = (video.currentTime / video.duration) * 100;
        setProgress(percent);
      }
    };

    const handleLoadedMetadata = () => {
      // Сброс прогресса при загрузке нового видео
      setProgress(0);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoRef, isDragging]);

  // Обработка клика по таймлайну для перемотки
  const handleTimelineClick = (e) => {
    const video = videoRef?.current;
    if (!video || !video.duration) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percent = Math.max(0, Math.min(100, (x / width) * 100));
    
    const newTime = (percent / 100) * video.duration;
    video.currentTime = newTime;
    setProgress(percent);
  };

  // Обработка начала перетаскивания
  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleTimelineClick(e);
  };

  // Обработка перетаскивания
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleTimelineClick(e);
  };

  // Обработка окончания перетаскивания
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Обработка касаний для мобильных устройств
  const handleTouchStart = (e) => {
    setIsDragging(true);
    handleTimelineClick(e.touches[0]);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    handleTimelineClick(e.touches[0]);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Добавляем глобальные обработчики для перетаскивания
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div 
      className="time-line"
      ref={timelineRef}
      onClick={handleTimelineClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div 
        className="time-line-progress" 
        style={{ width: `${progress}%` }}
      >
        <div className="time-line-handle"></div>
      </div>
    </div>
  );
};

export default Timeline;