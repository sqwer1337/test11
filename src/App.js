import React from 'react';
import './App.css';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import Footer from './components/Footer';

function App() {
  return (
    <div className="main">
      <Header />
      <VideoPlayer />
      <Footer />
    </div>
  );
}

export default App;