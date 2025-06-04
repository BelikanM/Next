import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart } from 'lucide-react';
import Avatar from '../UI/Avatar';
import Button from '../UI/Button';
import useVideoStore from '../../store/videoStore';
import useAuthStore from '../../store/authStore';

const CommentsModal = ({ video, isOpen, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuthStore();
  const { getComments, addComment } = useVideoStore();
  
  useEffect(() => {
    if (isOpen && video) {
      loadComments();
    }
  }, [isOpen, video]);
  
  const loadComments = async () => {
    if (!video) return;
    setLoading(true);
    const commentsData = await getComments(video.$id);
    setComments(commentsData);
    setLoading(false);
  };
  
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    const result = await addComment(video.$id, user.$id, newComment.trim());
    if (result.success) {
      setNewComment('');
      loadComments(); // Recharger les commentaires
    }
  };
  
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}j`;
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl max-h-[80vh] flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Commentaires ({comments.length})
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun commentaire pour le moment
                </div>
              ) : (
                comments.map((comment) => (
                  <motion.div
                    key={comment.$id}
                    className="flex space-x-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Avatar
                      src={comment.user?.profilePicture}
                      alt={comment.user?.displayName || 'User'}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          @{comment.user?.username || 'user'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(comment.$createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {comment.content}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                          <Heart className="w-4 h-4" />
                          <span className="text-xs">{comment.likesCount || 0}</span>
                        </button>
                        <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                          Répondre
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            {/* Comment Input */}
            {user && (
              <form onSubmit={handleSubmitComment} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-3">
                  <Avatar
                    src={user.profilePicture}
                    alt={user.displayName}
                    size="sm"
                  />
                  <div className="flex-1 flex space-x-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      maxLength={500}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!newComment.trim()}
                      className="rounded-full px-4"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommentsModal;
