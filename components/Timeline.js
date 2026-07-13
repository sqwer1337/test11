import React, { useRef, useState, useEffect } from 'react';
import './Timeline.css';

const Timeline = ({ videoRef }) => {
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const video = videoRef?.current;
    if (!video) {
      setProgress(0);
      return;
    }

    const updateProgress = () => {
      if (!isDragging && video.duration) {
        const percent = (video.currentTime / video.duration) * 100;
        setProgress(percent);
      }
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    const handleLoadedMetadata = () => {
      setProgress(0);
    };

    // Запускаем обновление
    animationFrameRef.current = requestAnimationFrame(updateProgress);
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoRef, isDragging]);

  const updateVideoTime = (clientX) => {
    const video = videoRef?.current;
    if (!video || !video.duration || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    const percent = Math.max(0, Math.min(100, (x / width) * 100));
    
    const newTime = (percent / 100) * video.duration;
    video.currentTime = newTime;
    setProgress(percent);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateVideoTime(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updateVideoTime(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    updateVideoTime(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDragging) return;
    updateVideoTime(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div className="timeline-wrapper">
      <div className="timeline-container">
        <div 
          className="time-line"
          ref={timelineRef}
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
      </div>
    </div>
  );
};

export default Timeline;