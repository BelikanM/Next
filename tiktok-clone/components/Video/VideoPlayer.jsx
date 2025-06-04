import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import Avatar from '../UI/Avatar';
import useVideoStore from '../../store/videoStore';
import useAuthStore from '../../store/authStore';

const VideoPlayer = ({ video, onOpenComments }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likesCount || 0);
  
  const { user } = useAuthStore();
  const { likeVideo } = useVideoStore();
  
  const { ref, inView } = useInView({
    threshold: 0.5,
  });
  
  useEffect(() => {
    if (videoRef.current) {
      if (inView) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [inView]);
  
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const handleLike = async () => {
    if (!user) return;
    
    const result = await likeVideo(video.$id, user.$id);
    if (result.liked !== undefined) {
      setIsLiked(result.liked);
      setLikesCount(prev => result.liked ? prev + 1 : prev - 1);
    }
  };
  
  const formatCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };
  
  return (
    <div ref={ref} className="relative w-full h-screen bg-black flex items-center justify-center">
      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        src={video.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
      />
      
      {/* Play/Pause Overlay */}
      <div 
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={togglePlay}
      >
        {!isPlaying && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="w-20 h-20 bg-black bg-opacity-50 rounded-full flex items-center justify-center"
          >
            <Play className="w-10 h-10 text-white ml-1" />
          </motion.div>
        )}
      </div>
      
      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-20 text-white">
        {/* User Info */}
        <div className="flex items-center space-x-3 mb-3">
          <Avatar
            src={video.user?.profilePicture}
            alt={video.user?.displayName || 'User'}
            size="md"
            verified={video.user?.isVerified}
          />
          <div>
            <h3 className="font-semibold">@{video.user?.username || 'user'}</h3>
            <p className="text-sm opacity-80">{video.user?.displayName || 'User Name'}</p>
          </div>
          <button className="ml-4 px-6 py-1 border border-white rounded-md text-sm font-medium hover:bg-white hover:text-black transition-colors">
            Suivre
          </button>
        </div>
        
        {/* Description */}
        <p className="text-sm mb-2 max-w-xs">
          {video.description || 'Description de la vidéo...'}
        </p>
        
        {/* Hashtags */}
        {video.hashtags && video.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {video.hashtags.map((tag, index) => (
              <span key={index} className="text-sm text-blue-300">
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Music */}
        <div className="flex items-center space-x-2 text-sm opacity-80">
          <span>🎵</span>
          <span>Son original - @{video.user?.username || 'user'}</span>
        </div>
      </div>
      
      {/* Right Actions */}
      <div className="absolute right-4 bottom-20 flex flex-col space-y-6">
        {/* Like */}
        <motion.button
          onClick={handleLike}
          className="flex flex-col items-center space-y-1"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isLiked ? 'bg-red-500' : 'bg-gray-800 bg-opacity-50'
          }`}>
            <Heart className={`w-6 h-6 ${isLiked ? 'text-white fill-current' : 'text-white'}`} />
          </div>
          <span className="text-white text-xs font-medium">
            {formatCount(likesCount)}
          </span>
        </motion.button>
        
        {/* Comment */}
        <motion.button
          onClick={() => onOpenComments(video)}
          className="flex flex-col items-center space-y-1"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <div className="w-12 h-12 bg-gray-800 bg-opacity-50 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium">
            {formatCount(video.commentsCount || 0)}
          </span>
        </motion.button>
        
        {/* Share */}
        <motion.button
          className="flex flex-col items-center space-y-1"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <div className="w-12 h-12 bg-gray-800 bg-opacity-50 rounded-full flex items-center justify-center">
            <Share className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium">Partager</span>
        </motion.button>
        
        {/* More */}
        <motion.button
          className="flex flex-col items-center space-y-1"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <div className="w-12 h-12 bg-gray-800 bg-opacity-50 rounded-full flex items-center justify-center">
            <MoreHorizontal className="w-6 h-6 text-white" />
          </div>
        </motion.button>
      </div>
      
      {/* Volume Control */}
      <motion.button
        onClick={toggleMute}
        className="absolute top-4 right-4 w-10 h-10 bg-gray-800 bg-opacity-50 rounded-full flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-white" />
        ) : (
          <Volume2 className="w-5 h-5 text-white" />
        )}
      </motion.button>
    </div>
  );
};

export default VideoPlayer;
