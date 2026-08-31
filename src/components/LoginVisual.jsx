import React from 'react'
import bgVideo from '../assets/login-bg.mp4'
import bgPoster from '../assets/login-bg.jpeg'

export default function LoginVisual() {
  return (
    <div className="admin-login-visual">
      <video
        className="admin-login-visual-canvas"
        src={bgVideo}
        poster={bgPoster}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
      <div className="admin-login-visual-overlay" />
    </div>
  )
}
