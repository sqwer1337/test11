import React, { useState } from 'react';
import './Info.css';

const Info = ({ user, description, audio, likes, comments, shares }) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(likes || 0);

  const handleLike = () => {
    if (liked) {
      setLikesCount(likesCount - 1);
    } else {
      setLikesCount(likesCount + 1);
    }
    setLiked(!liked);
  };

  return (
    <div className="info">
      <div className="login">{user}</div>
      <div className="desc">
        <div>
          <p>{description}</p>
          <p>
            <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#ffffff">
              <path d="M287-167q-47-47-47-113t47-113q47-47 113-47 23 0 42.5 5.5T480-418v-422h240v160H560v400q0 66-47 113t-113 47q-66 0-113-47Z"/>
            </svg>
            Unknown audio recording
          </p>
        </div>
      </div>
    </div>
  );
};

export default Info;