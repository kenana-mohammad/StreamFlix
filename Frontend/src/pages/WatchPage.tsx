import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, Maximize, ChevronRight, AlertCircle, Loader } from 'lucide-react';
import { useProfile } from '@/lib/profileContext';
import { useApp } from '@/store';
import { apiClient } from '@/lib/apiClient';
import type { Content } from '@/types';

interface WatchProgress {
  contentId: string;
  watchedDuration: number;
  totalDuration: number;
  completed: boolean;
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProfile } = useProfile();
  const { showToast } = useApp();

  // Video player refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  // State
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);

  let controlsHideTimer: NodeJS.Timeout;

  // تحميل البيانات
  useEffect(() => {
    if (!id) {
      setError('Invalid content ID');
      return;
    }

    loadContent();
  }, [id]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError('');

      // جلب تفاصيل المحتوى
      const contentResponse = await apiClient.getContentById(id!);
      setContent(contentResponse.data);

      // جلب التقدم السابق
      try {
        const progressResponse = await apiClient.getWatchHistory();
        const historyData = Array.isArray(progressResponse) ? progressResponse : (progressResponse?.data || progressResponse);
        const historyArray = Array.isArray(historyData) ? historyData : [];
        
        const contentHistory = historyArray.find((h: any) => {
          const hContentId = typeof h.contentId === 'object' ? h.contentId._id : h.contentId;
          return hContentId === id;
        });
        if (contentHistory && contentHistory.watchedDuration > 0) {
          setCurrentTime(contentHistory.watchedDuration);
        }
      } catch (err) {
        // لا تتوقف عند فشل جلب التقدم
        console.error('Failed to load progress:', err);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load content';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // معالجة أيقونات المتصفح
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
    if (vol === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleFullscreen = () => {
    if (playerRef.current) {
      if (!isFullscreen) {
        if (playerRef.current.requestFullscreen) {
          playerRef.current.requestFullscreen().catch((err) => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
          });
        }
        setIsFullscreen(true);
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
    }
  };

  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // أحداث الفيديو
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      if (total > 0) {
        setProgress((current / total) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      // إذا كان هناك تقدم محفوظ، انتقل إليه
      if (currentTime > 0) {
        videoRef.current.currentTime = currentTime;
      }
    }
  };

  const handleEnded = async () => {
    try {
      // حفظ التقدم النهائي
      if (content) {
        await apiClient.saveWatchProgress({
          contentId: (content as any)._id,
          watchedDuration: duration,
          totalDuration: duration,
          completed: true,
        });
      }
      showToast('Video completed!', 'success');
      setTimeout(() => navigate('/home'), 2000);
    } catch (err) {
      console.error('Failed to save completion', err);
    }
  };

  // حفظ التقدم الدوري
  useEffect(() => {
    const interval = setInterval(async () => {
      if (isPlaying && content && duration > 0) {
        try {
          await apiClient.saveWatchProgress({
            contentId: (content as any)._id,
            watchedDuration: currentTime,
            totalDuration: duration,
            completed: false,
          });
        } catch (err) {
          console.error('Failed to save progress', err);
        }
      }
    }, 10000); // حفظ كل 10 ثواني

    return () => clearInterval(interval);
  }, [isPlaying, content, currentTime, duration]);

  // إخفاء الأدوات التحكم عند عدم الحركة
  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsHideTimer);
    if (isPlaying) {
      controlsHideTimer = setTimeout(() => setShowControls(false), 3000);
    }
  };

  // تنسيق الوقت
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle size={40} className="text-error-500 mx-auto mb-4" />
          <p className="text-error-400 mb-4">{error || 'Content not found'}</p>
          <button
            onClick={() => navigate('/home')}
            className="btn-primary"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950">
      {/* فيديو بلاير */}
      <div
        ref={playerRef}
        className="relative w-full bg-black aspect-video group"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* الفيديو */}
        <video
          ref={videoRef}
          src={(content as any).videoUrl || ''}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* التحكم الأساسي (تشغيل/إيقاف الضغط على المنتصف) */}
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
        >
          <div className="bg-white/30 hover:bg-white/50 rounded-full p-4 transition-colors">
            {isPlaying ? (
              <Pause size={40} className="text-white fill-white" />
            ) : (
              <Play size={40} className="text-white fill-white" />
            )}
          </div>
        </button>

        {/* أدوات التحكم */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* شريط التقدم */}
          <div className="mb-4 flex items-center gap-2">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleProgressBarChange}
              className="flex-1 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer hover:h-2 transition-all"
              style={{
                background: `linear-gradient(to right, #d946ef 0%, #d946ef ${progress}%, #4b5563 ${progress}%, #4b5563 100%)`,
              }}
            />
          </div>

          {/* الأدوات */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* تشغيل/إيقاف */}
              <button
                onClick={handlePlayPause}
                className="text-white hover:text-brand-400 transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause size={20} className="fill-current" />
                ) : (
                  <Play size={20} className="fill-current" />
                )}
              </button>

              {/* تخطي للأمام/الخلف (10 ثواني) */}
              <button
                onClick={() => handleSkip(-10)}
                className="text-white hover:text-brand-400 transition-colors text-sm font-semibold"
                title="Back 10s"
              >
                -10s
              </button>
              <button
                onClick={() => handleSkip(10)}
                className="text-white hover:text-brand-400 transition-colors text-sm font-semibold"
                title="Forward 10s"
              >
                +10s
              </button>

              {/* الصوت */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMute}
                  className="text-white hover:text-brand-400 transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
                  title="Volume"
                />
              </div>

              {/* الوقت */}
              <span className="text-white text-sm font-semibold ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* زر ملء الشاشة */}
            <button
              onClick={handleFullscreen}
              className="text-white hover:text-brand-400 transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* معلومات المحتوى */}
      <div className="p-6 max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white transition-colors mb-6 flex items-center gap-2"
        >
          <ChevronRight size={20} className="rotate-180" />
          Back
        </button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* تفاصيل المحتوى */}
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold text-white mb-4">{content.title}</h1>

            <div className="flex items-center gap-4 mb-6 text-gray-300 text-sm flex-wrap">
              {content.year && <span>{content.year}</span>}
              {content.ageRating && (
                <span className="px-2 py-1 border border-gray-500 rounded">
                  {content.ageRating}
                </span>
              )}
              {content.averageRating && (
                <span className="flex items-center gap-1">
                  ⭐ {content.averageRating.toFixed(1)} ({(content as any).ratingsCount || 0} ratings)
                </span>
              )}
            </div>

            <p className="text-gray-300 mb-6 leading-relaxed">{content.description}</p>

            {/* الأنواع */}
            {content.genres && content.genres.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {content.genres.map((g: any) => (
                    <span key={g._id} className="px-3 py-1 bg-ink-800 text-gray-300 rounded-full text-sm">
                      {typeof g.genreId === 'object' ? g.genreId.name : g.genreId}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* الممثلون */}
            {content.cast && content.cast.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Cast</h3>
                <div className="flex flex-wrap gap-2">
                  {content.cast.slice(0, 5).map((c: any) => (
                    <span key={c._id} className="text-gray-300 text-sm">
                      {typeof c.castId === 'object' ? c.castId.name : c.castId}
                      {c.role && ` as ${c.role}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* البوستر */}
          <div>
            {content.posterUrl && (
              <img
                src={content.posterUrl}
                alt={content.title}
                className="w-full rounded-lg shadow-lg object-cover aspect-video"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
