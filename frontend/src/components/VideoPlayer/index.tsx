import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import videojs from 'video.js'

// 导入 video.js 样式
import 'video.js/dist/video-js.css'

/**
 * VideoPlayer 组件接口定义
 */
export interface VideoMetadata {
  duration: number
  videoWidth: number
  videoHeight: number
}

export interface VideoPlayerRef {
  getPlayer: () => any | null
  getVideoElement: () => HTMLVideoElement | null
  play: () => void
  pause: () => void
  setCurrentTime: (time: number) => void
  getCurrentTime: () => number
}

export interface VideoPlayerProps {
  taskId: string
  onTimeUpdate?: (currentTime: number) => void
  onLoadedMetadata?: (metadata: VideoMetadata) => void
  onError?: (error: string) => void
  onLoadStart?: () => void
  onCanPlay?: () => void
  fps?: number
}

/**
 * VideoPlayer 组件 - 基于 video.js 的视频播放器
 * 在 src/components/VideoPlayer/index.tsx 中集成 video.js
 */
const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ taskId, onTimeUpdate, onLoadedMetadata, onError, onLoadStart, onCanPlay, fps = 30 }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const playerRef = useRef<any>(null)

    /**
     * 初始化 video.js 播放器
     */
    useEffect(() => {
      if (!videoRef.current) return

      // 初始化 video.js 播放器
      const player = videojs(videoRef.current, {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: false, // 禁用fluid以保持自定义尺寸
        responsive: true,
        playbackRates: [1, 2], // 支持1x和2x倍速
        sources: [{
          src: `/videos/${taskId}`,
          type: 'video/mp4'
        }],
        // 自定义控制栏
        controlBar: {
          volumePanel: {
            inline: false
          },
          pictureInPictureToggle: false, // 隐藏画中画按钮
          remainingTimeDisplay: true
        },
        // 禁用不需要的按钮
        bigPlayButton: true,
        textTrackDisplay: false,
        posterImage: false,
        errorDisplay: true,
        loadingSpinner: true
      })

      playerRef.current = player

      // 实现与/videos/{task_id}接口对接的成功/失败基础逻辑
      player.on('loadstart', () => {
        if (onLoadStart) {
          onLoadStart()
        }
      })

      player.on('canplay', () => {
        if (onCanPlay) {
          onCanPlay()
        }
      })

      player.on('error', () => {
        const error = player.error()
        let errorMessage = '视频加载失败'

        if (error) {
          switch (error.code) {
            case 1:
              errorMessage = '视频加载被中止'
              break
            case 2:
              errorMessage = '网络错误导致视频加载失败'
              break
            case 3:
              errorMessage = '视频解码失败'
              break
            case 4:
              errorMessage = `视频格式不支持或视频文件不可用 (${error.message})`
              break
            default:
              errorMessage = `视频播放出错: ${error.message || '未知错误'}`
          }
        }

        if (onError) {
          onError(errorMessage)
        }
      })

      // 绑定timeupdate事件，精确传递当前播放时间给父组件
      player.on('timeupdate', () => {
        if (onTimeUpdate) {
          const currentTime = player.currentTime()
          onTimeUpdate(currentTime)
        }
      })

      // 监听元数据加载完成事件
      player.on('loadedmetadata', () => {
        if (onLoadedMetadata) {
          onLoadedMetadata({
            duration: player.duration(),
            videoWidth: player.videoWidth(),
            videoHeight: player.videoHeight()
          })
        }
      })

      // 监听全屏变化
      player.on('fullscreenchange', () => {
        // 触发父组件的全屏处理逻辑
        document.dispatchEvent(new Event('fullscreenchange'))
      })

      // 清理函数
      return () => {
        if (player) {
          player.dispose()
          playerRef.current = null
        }
      }
    }, [taskId, onTimeUpdate, onLoadedMetadata, onError, onLoadStart, onCanPlay])

    /**
     * 暴露给父组件的方法
     */
    useImperativeHandle(ref, () => ({
      getPlayer: () => playerRef.current,
      getVideoElement: () => videoRef.current,
      play: () => {
        if (playerRef.current) {
          playerRef.current.play()
        }
      },
      pause: () => {
        if (playerRef.current) {
          playerRef.current.pause()
        }
      },
      setCurrentTime: (time: number) => {
        if (playerRef.current) {
          playerRef.current.currentTime(time)
        }
      },
      getCurrentTime: () => {
        return playerRef.current ? playerRef.current.currentTime() : 0
      }
    }), [])

    return (
      <div className="video-player w-full h-full">
        <video
          ref={videoRef}
          className="video-js vjs-default-skin w-full h-full"
          data-setup='{"fluid": true}'
        />
      </div>
    )
  }
)

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer