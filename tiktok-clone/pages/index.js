import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import VideoPlayer from '../components/Video/VideoPlayer';
import CommentsModal from '../components/Video/CommentsModal';
import useVideoStore from '../store/videoStore';
import useAuthStore from '../store/authStore';

const HomePage = () => {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showComments, setShowComments] = useState(false);
  
  const { fetchVideos, loading } = useVideoStore();
  const { user } = useAuthStore();
  
  useEffect(() => {
    loadVideos();
  }, []);
  
  const loadVideos = async () => {
    const videosData = await fetchVideos();
    
    // Mock data si pas de vidéos
    if (videosData.length === 0) {
      const mockVideos = [
        {
          $id: '1',
          title: 'Danse incroyable',
          description: 'Nouvelle chorégraphie sur cette musique incroyable ! 🔥 #dance #viral',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          likesCount: 12500,
          commentsCount: 234,
          viewsCount: 45600,
          hashtags: ['dance', 'viral', 'trending'],
          user: {
            username: 'alice_dance',
            displayName: 'Alice',
            profilePicture: null,
            isVerified: true
          },
          $createdAt: new Date().toISOString()
        },
        {
          $id: '2',
          title: 'Recette rapide',
          description: 'Recette rapide de pâtes carbonara en 60 secondes ⏰ #cooking #recipe',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          likesCount: 8900,
          commentsCount: 156,
          viewsCount: 23400,
          hashtags: ['cooking', 'recipe', 'food'],
          user: {
            username: 'chef_mike',
            displayName: 'Chef Mike',
            profilePicture: null,
            isVerified: false
          },
          $createdAt: new Date().toISOString()
        },
        {
          $id: '3',
          title: 'Paysage magnifique',
          description: 'Coucher de soleil incroyable capturé hier soir 🌅 #nature #sunset',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          likesCount: 15600,
          commentsCount: 89,
          viewsCount: 67800,
          hashtags: ['nature', 'sunset', 'beautiful'],
          user: {
            username: 'nature_lover',
            displayName: 'Nature Lover',
            profilePicture: null,
            isVerified: true
          },
          $createdAt: new Date().toISOString()
        }
      ];
      setVideos(mockVideos);
    } else {
      setVideos(videosData);
    }
  };
  
  const handleOpenComments = (video) => {
    setSelectedVideo(video);
    setShowComments(true);
  };
  
  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedVideo(null);
  };
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }
  
  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory">
      {videos.map((video, index) => (
        <div key={video.$id} className="snap-start">
          <VideoPlayer
            video={video}
            onOpenComments={handleOpenComments}
          />
        </div>
      ))}
      
      <CommentsModal
        video={selectedVideo}
        isOpen={showComments}
        onClose={handleCloseComments}
      />
    </div>
  );
};

export default HomePage;
