import React from 'react';
import './App.css';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';
import Footer from './components/Footer';

function App() {
  return (
    <div className="main">
      <Header />
      <VideoPlayer />
      <Timeline />
      <Footer />
    </div>
  );
}

export default App;