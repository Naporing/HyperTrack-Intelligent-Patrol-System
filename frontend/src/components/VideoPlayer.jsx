import React, { useEffect, useRef, useState } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

function VideoPlayer({ taskId, onTimeUpdate, onLoadedMetadata }) {
  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!videoRef.current || playerRef.current) return

    const player = videojs(videoRef.current, {
      controls: true,
      autoplay: false,
      preload: 'auto',
      playbackRates: [1, 2],
      fluid: true,
      responsive: true,
      html5: {
        vhs: {
          overrideNative: true,
        },
      },
    })

    playerRef.current = player

    player.ready(() => {
      setIsReady(true)
    })

    player.on('loadedmetadata', () => {
      const videoEl = player.el().querySelector('video')
      if (videoEl && onLoadedMetadata) {
        onLoadedMetadata({
          fps: 30, // 默认值，实际应该从后端获取
          width: videoEl.videoWidth,
          height: videoEl.videoHeight,
          duration: videoEl.duration
        })
      }
    })

    player.on('timeupdate', () => {
      if (onTimeUpdate) {
        onTimeUpdate(player.currentTime())
      }
    })

    player.on('error', (e) => {
      console.error('Video player error:', e)
    })

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (isReady && taskId) {
      playerRef.current.src({
        type: 'video/mp4',
        src: `/videos/${taskId}`
      })
    }
  }, [isReady, taskId])

  return (
    <div className="relative video-container">
      <div
        data-vjs-player
        className="relative bg-black rounded-lg overflow-hidden"
      >
        <video
          ref={videoRef}
          className="video-js vjs-default-skin"
          playsInline
        />
      </div>
    </div>
  )
}

export default VideoPlayer