import { create } from 'zustand';
import { databases, DATABASE_ID, COLLECTION_VIDEOS, COLLECTION_LIKES, COLLECTION_COMMENTS, Query } from '../lib/appwrite';

const useVideoStore = create((set, get) => ({
  videos: [],
  currentVideo: null,
  loading: false,
  
  // Récupérer les vidéos
  fetchVideos: async (limit = 10, offset = 0) => {
    try {
      set({ loading: true });
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_VIDEOS,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );
      
      const videos = response.documents;
      set({ videos, loading: false });
      return videos;
    } catch (error) {
      set({ loading: false });
      console.error('Erreur lors du chargement des vidéos:', error);
      return [];
    }
  },
  
  // Liker une vidéo
  likeVideo: async (videoId, userId) => {
    try {
      // Vérifier si déjà liké
      const existingLike = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_LIKES,
        [
          Query.equal('userId', userId),
          Query.equal('targetId', videoId),
          Query.equal('targetType', 'video')
        ]
      );
      
      if (existingLike.documents.length > 0) {
        // Supprimer le like
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTION_LIKES,
          existingLike.documents[0].$id
        );
        
        // Décrémenter le compteur
        const video = await databases.getDocument(DATABASE_ID, COLLECTION_VIDEOS, videoId);
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_VIDEOS,
          videoId,
          { likesCount: Math.max(0, video.likesCount - 1) }
        );
        
        return { liked: false };
      } else {
        // Ajouter le like
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_LIKES,
          'unique()',
          {
            userId,
            targetId: videoId,
            targetType: 'video'
          }
        );
        
        // Incrémenter le compteur
        const video = await databases.getDocument(DATABASE_ID, COLLECTION_VIDEOS, videoId);
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_VIDEOS,
          videoId,
          { likesCount: video.likesCount + 1 }
        );
        
        return { liked: true };
      }
    } catch (error) {
      console.error('Erreur lors du like:', error);
      return { error: error.message };
    }
  },
  
  // Ajouter un commentaire
  addComment: async (videoId, userId, content) => {
    try {
      const comment = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_COMMENTS,
        'unique()',
        {
          videoId,
          userId,
          content,
          likesCount: 0
        }
      );
      
      // Incrémenter le compteur de commentaires
      const video = await databases.getDocument(DATABASE_ID, COLLECTION_VIDEOS, videoId);
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_VIDEOS,
        videoId,
        { commentsCount: video.commentsCount + 1 }
      );
      
      return { success: true, comment };
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Récupérer les commentaires d'une vidéo
  getComments: async (videoId) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_COMMENTS,
        [
          Query.equal('videoId', videoId),
          Query.orderDesc('$createdAt')
        ]
      );
      return response.documents;
    } catch (error) {
      console.error('Erreur lors du chargement des commentaires:', error);
      return [];
    }
  }
}));

export default useVideoStore;
