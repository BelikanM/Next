#!/bin/bash

# Configuration Appwrite
PROJECT_ID="681deee80012cf6d3e15"
ENDPOINT="https://fra.cloud.appwrite.io/v1"
DATABASE_ID="tiktok_db"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}🚀 CRÉATION COMPLÈTE DE L'APPLICATION TIKTOK CLONE${NC}"
echo -e "${CYAN}=================================================${NC}"

# Demander l'API Key
read -p "Entrez votre API Key Appwrite: " API_KEY

# Créer la structure du projet
echo -e "${YELLOW}📁 Création de la structure du projet...${NC}"

# Créer les dossiers principaux
mkdir -p tiktok-clone/{components/{Layout,UI,Video,Auth,Profile,Upload},pages/{api,profile,auth},styles,lib,hooks,store,utils,public/{icons,images}}

cd tiktok-clone

# Headers pour les requêtes API
HEADERS="Content-Type: application/json"
AUTH_HEADER="X-Appwrite-Project: $PROJECT_ID"
KEY_HEADER="X-Appwrite-Key: $API_KEY"

# Fonction pour faire des requêtes API
make_request() {
    local method=$1
    local url=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X $method \
            -H "$HEADERS" \
            -H "$AUTH_HEADER" \
            -H "$KEY_HEADER" \
            -d "$data" \
            "$ENDPOINT$url"
    else
        curl -s -X $method \
            -H "$HEADERS" \
            -H "$AUTH_HEADER" \
            -H "$KEY_HEADER" \
            "$ENDPOINT$url"
    fi
}

# 1. CRÉATION DE LA BASE DE DONNÉES
echo -e "${YELLOW}📊 Création de la base de données Appwrite...${NC}"

# Créer la base de données
make_request "POST" "/databases" '{
    "databaseId": "'$DATABASE_ID'",
    "name": "TikTok Database"
}'

sleep 2

# Collection Users
echo -e "${YELLOW}👥 Création de la collection Users...${NC}"
make_request "POST" "/databases/$DATABASE_ID/collections" '{
    "collectionId": "users",
    "name": "Users",
    "permissions": ["read(\"any\")", "create(\"users\")", "update(\"user:self\")", "delete(\"user:self\")"]
}'

sleep 1

# Attributs Users
make_request "POST" "/databases/$DATABASE_ID/collections/users/attributes/string" '{"key": "username", "size": 50, "required": true}'
make_request "POST" "/databases/$DATABASE_ID/collections/users/attributes/string" '{"key": "email", "size": 255, "required": true}'
make_request "POST" "/databases/$DATABASE_ID/collections/users/attributes/string" '{"key": "displayName", "size": 100, "required": true}'
make_request "POST" "/databases/$DATABASE_ID/collections/users/attributes/string" '{"key": "bio", "size": 500, "required": false}'
make_request "POST" "/databases/$DATABASE_ID/collections/users/attributes/string" '{"key": "profilePicture", "size": 255, "required": false}'
make_request "POST" "/databases/$DATABASE_ID/collections/users/attributes/integer" '{"key": "followersCount", "required": true, "default": 0}'
make_request "POST" "/databases/$DATABASE_ID/collections/users/attributes/integer" '{"key": "followingCount", "required": true, "default": 0}'
make_request "POST" "/databases/$DATABASE_ID/collections/users/attributes/boolean" '{"key": "isVerified", "required": true, "default": false}'

sleep 3

# Index Users
make_request "POST" "/databases/$DATABASE_ID/collections/users/indexes" '{"key": "username_index", "type": "unique", "attributes": ["username"]}'
make_request "POST" "/databases/$DATABASE_ID/collections/users/indexes" '{"key": "email_index", "type": "unique", "attributes": ["email"]}'

# Collection Videos
echo -e "${YELLOW}🎥 Création de la collection Videos...${NC}"
make_request "POST" "/databases/$DATABASE_ID/collections" '{
    "collectionId": "videos",
    "name": "Videos",
    "permissions": ["read(\"any\")", "create(\"users\")", "update(\"user:self\")", "delete(\"user:self\")"]
}'

sleep 1

# Attributs Videos
make_request "POST" "/databases/$DATABASE_ID/collections/videos/attributes/string" '{"key": "userId", "size": 36, "required": true}'
make_request "POST" "/databases/$DATABASE_ID/collections/videos/attributes/string" '{"key": "title", "size": 200, "required": false}'
make_request "POST" "/databases/$DATABASE_ID/collections/videos/attributes/string" '{"key": "description", "size": 2000, "required": false}'
make_request "POST" "/databases/$DATABASE_ID/collections/videos/attributes/string" '{"key": "videoUrl", "size": 255, "required": true}'
make_request "POST" "/databases/$DATABASE_ID/collections/videos/attributes/string" '{"key": "thumbnailUrl", "size": 255, "required": false}'
make_request "POST" "/databases/$DATABASE_ID/collections/videos/attributes/integer" '{"key": "duration", "required": true}'
make_request "POST" "/databases/$DATABASE_ID/collections/videos/attributes/integer" '{"key": "likesCount", "required": true, "default": 0}'
make_request "POST" "/databases/$DATABASE_ID/collections/videos/attributes/integer" '{"key": "commentsCount", "required": true, "default": 0}'
make_request "POST" "/databases/$DATABASE_ID/collections/videos/attributes/integer" '{"key": "viewsCount", "required": true, "default": 0}'
make_request "POST" "/databases/$DATABASE_ID/collections/videos/attributes/string" '{"key": "hashtags", "size": 100, "required": false, "array": true}'

sleep 3

# Index Videos
make_request "POST" "/databases/$DATABASE_ID/collections/videos/indexes" '{"key": "userId_index", "type": "key", "attributes": ["userId"]}'
make_request "POST" "/databases/$DATABASE_ID/collections/videos/indexes" '{"key": "created_index", "type": "key", "attributes": ["$createdAt"]}'

# Collection Comments
echo -e "${YELLOW}💬 Création de la collection Comments...${NC}"
make_request "POST" "/databases/$DATABASE_ID/collections" '{
    "collectionId": "comments",
    "name": "Comments",
    "permissions": ["read(\"any\")", "create(\"users\")", "update(\"user:self\")", "delete(\"user:self\")"]
}'

sleep 1

make_request "POST" "/databases/$DATABASE_ID/collections/comments/attributes/string" '{"key": "userId", "size": 36, "required": true}'
make_request "POST" "/databases/$DATABASE_ID/collections/comments/attributes/string" '{"key": "videoId", "size": 36, "required": true}'
make_request "POST" "/databases/$DATABASE_ID/collections/comments/attributes/string" '{"key": "content", "size": 500, "required": true}'
make_request "POST" "/databases/$DATABASE_ID/collections/comments/attributes/integer" '{"key": "likesCount", "required": true, "default": 0}'

sleep 3

make_request "POST" "/databases/$DATABASE_ID/collections/comments/indexes" '{"key": "videoId_index", "type": "key", "attributes": ["videoId"]}'

# Collection Likes
echo -e "${YELLOW}❤️ Création de la collection Likes...${NC}"
make_request "POST" "/databases/$DATABASE_ID/collections" '{
    "collectionId": "likes",
    "name": "Likes",
    "permissions": ["read(\"any\")", "create(\"users\")", "delete(\"user:self\")"]
}'

sleep 1

make_request "POST" "/databases/$DATABASE_ID/collections/likes/attributes/string" '{"key": "userId", "size": 36, "required": true}'
make_request "POST" "/databases/$DATABASE_ID/collections/likes/attributes/string" '{"key": "targetId", "size": 36, "required": true}'
make_request "POST" "/databases/$DATABASE_ID/collections/likes/attributes/enum" '{"key": "targetType", "elements": ["video", "comment"], "required": true}'

sleep 3

make_request "POST" "/databases/$DATABASE_ID/collections/likes/indexes" '{"key": "user_target_index", "type": "unique", "attributes": ["userId", "targetId", "targetType"]}'

# Collection Follows
echo -e "${YELLOW}👥 Création de la collection Follows...${NC}"
make_request "POST" "/databases/$DATABASE_ID/collections" '{
    "collectionId": "follows",
    "name": "Follows",
    "permissions": ["read(\"any\")", "create(\"users\")", "delete(\"user:self\")"]
}'

sleep 1

make_request "POST" "/databases/$DATABASE_ID/collections/follows/attributes/string" '{"key": "followerId", "size": 36, "required": true}'
make_request "POST" "/databases/$DATABASE_ID/collections/follows/attributes/string" '{"key": "followingId", "size": 36, "required": true}'

sleep 3

make_request "POST" "/databases/$DATABASE_ID/collections/follows/indexes" '{"key": "follow_unique_index", "type": "unique", "attributes": ["followerId", "followingId"]}'

echo -e "${GREEN}✅ Base de données créée avec succès !${NC}"

# 2. CRÉATION DES FICHIERS DE CONFIGURATION
echo -e "${YELLOW}⚙️ Création des fichiers de configuration...${NC}"

# package.json
cat > package.json << 'EOF'
{
  "name": "tiktok-clone",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "appwrite": "^13.0.0",
    "lucide-react": "^0.292.0",
    "framer-motion": "^10.16.0",
    "react-hot-toast": "^2.4.1",
    "zustand": "^4.4.0",
    "react-intersection-observer": "^9.5.2",
    "react-player": "^2.13.0"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.16",
    "eslint": "^8.52.0",
    "eslint-config-next": "14.0.0",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5"
  }
}
EOF

# .env
cat > .env << EOF
NEXT_PUBLIC_APPWRITE_ENDPOINT=$ENDPOINT
NEXT_PUBLIC_APPWRITE_PROJECT_ID=$PROJECT_ID
NEXT_PUBLIC_APPWRITE_DATABASE_ID=$DATABASE_ID
APPWRITE_API_KEY=$API_KEY

NEXT_PUBLIC_COLLECTION_USERS=users
NEXT_PUBLIC_COLLECTION_VIDEOS=videos
NEXT_PUBLIC_COLLECTION_COMMENTS=comments
NEXT_PUBLIC_COLLECTION_LIKES=likes
NEXT_PUBLIC_COLLECTION_FOLLOWS=follows

NEXT_PUBLIC_BUCKET_VIDEOS=videos_bucket
NEXT_PUBLIC_BUCKET_IMAGES=images_bucket
EOF

# tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        dark: {
          100: '#1f1f23',
          200: '#18181b',
          300: '#161618',
          400: '#0f0f10',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
EOF

# postcss.config.js
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# next.config.js
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cloud.appwrite.io'],
  },
  experimental: {
    appDir: false,
  },
}

module.exports = nextConfig
EOF

# .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
.next/
out/
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock
EOF

# 3. STYLES GLOBAUX
echo -e "${YELLOW}🎨 Création des styles...${NC}"

cat > styles/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
  font-family: 'Inter', sans-serif;
}

body {
  color: rgb(var(--foreground-rgb));
  background: #000;
}

a {
  color: inherit;
  text-decoration: none;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #1f1f23;
}

::-webkit-scrollbar-thumb {
  background: #404040;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

/* Glass effect */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-dark {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Video container */
.video-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .video-container {
    height: calc(100vh - 60px);
  }
}
EOF

# 4. CONFIGURATION APPWRITE
echo -e "${YELLOW}🔧 Configuration Appwrite...${NC}"

cat > lib/appwrite.js << 'EOF'
import { Client, Account, Databases, Storage, Query } from 'appwrite';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
export const COLLECTION_USERS = process.env.NEXT_PUBLIC_COLLECTION_USERS;
export const COLLECTION_VIDEOS = process.env.NEXT_PUBLIC_COLLECTION_VIDEOS;
export const COLLECTION_COMMENTS = process.env.NEXT_PUBLIC_COLLECTION_COMMENTS;
export const COLLECTION_LIKES = process.env.NEXT_PUBLIC_COLLECTION_LIKES;
export const COLLECTION_FOLLOWS = process.env.NEXT_PUBLIC_COLLECTION_FOLLOWS;

export { Query };
export default client;
EOF

# 5. STORE ZUSTAND
echo -e "${YELLOW}🗄️ Création du store...${NC}"

cat > store/authStore.js << 'EOF'
import { create } from 'zustand';
import { account, databases, DATABASE_ID, COLLECTION_USERS } from '../lib/appwrite';

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  
  // Initialiser l'authentification
  init: async () => {
    try {
      const session = await account.get();
      if (session) {
        const userDoc = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_USERS,
          session.$id
        );
        set({ user: userDoc, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch (error) {
      set({ user: null, loading: false });
    }
  },
  
  // Connexion
  login: async (email, password) => {
    try {
      await account.createEmailSession(email, password);
      const session = await account.get();
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_USERS,
        session.$id
      );
      set({ user: userDoc });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Inscription
  register: async (email, password, username, displayName) => {
    try {
      const response = await account.create('unique()', email, password, displayName);
      
      // Créer le document utilisateur
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_USERS,
        response.$id,
        {
          username,
          email,
          displayName,
          bio: '',
          profilePicture: '',
          followersCount: 0,
          followingCount: 0,
          isVerified: false
        }
      );
      
      // Se connecter automatiquement
      await account.createEmailSession(email, password);
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_USERS,
        response.$id
      );
      
      set({ user: userDoc });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Déconnexion
  logout: async () => {
    try {
      await account.deleteSession('current');
      set({ user: null });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Mettre à jour le profil
  updateProfile: async (data) => {
    try {
      const user = get().user;
      const updatedUser = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_USERS,
        user.$id,
        data
      );
      set({ user: updatedUser });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}));

export default useAuthStore;
EOF

cat > store/videoStore.js << 'EOF'
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
EOF

# 6. COMPOSANTS UI
echo -e "${YELLOW}🧩 Création des composants UI...${NC}"

cat > components/UI/Button.jsx << 'EOF'
import { forwardRef } from 'react';
import { motion } from 'framer-motion';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  loading = false,
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-gray-500',
    ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <motion.button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
EOF

cat > components/UI/Avatar.jsx << 'EOF'
import { useState } from 'react';
import { motion } from 'framer-motion';

const Avatar = ({ 
  src, 
  alt = 'Avatar', 
  size = 'md', 
  className = '',
  online = false,
  verified = false 
}) => {
  const [imageError, setImageError] = useState(false);
  
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
  };
  
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <div className={`relative inline-block ${className}`}>
      <motion.div
        className={`${sizes[size]} rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center`}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-white font-semibold text-sm">
            {getInitials(alt)}
          </span>
        )}
      </motion.div>
      
      {online && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
      )}
      
      {verified && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default Avatar;
EOF

# 7. COMPOSANT VIDÉO
echo -e "${YELLOW}🎬 Création du composant vidéo...${NC}"

cat > components/Video/VideoPlayer.jsx << 'EOF'
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
EOF

# 8. COMPOSANT COMMENTAIRES
echo -e "${YELLOW}💬 Création du composant commentaires...${NC}"

cat > components/Video/CommentsModal.jsx << 'EOF'
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
EOF

# 9. LAYOUT PRINCIPAL
echo -e "${YELLOW}🏗️ Création du layout...${NC}"

cat > components/Layout/Layout.jsx << 'EOF'
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const Layout = ({ children }) => {
  const { init } = useAuthStore();
  
  useEffect(() => {
    init();
  }, [init]);
  
  return (
    <div className="min-h-screen bg-black text-white">
      <main className="relative">
        {children}
      </main>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f1f23',
            color: '#fff',
            border: '1px solid #404040',
          },
        }}
      />
    </div>
  );
};

export default Layout;
EOF

# 10. PAGES PRINCIPALES
echo -e "${YELLOW}📄 Création des pages...${NC}"

cat > pages/_app.js << 'EOF'
import '../styles/globals.css';
import Layout from '../components/Layout/Layout';

export default function App({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
EOF

cat > pages/index.js << 'EOF'
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
EOF

cat > pages/auth/login.js << 'EOF'
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import Button from '../../components/UI/Button';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { login } = useAuthStore();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      toast.success('Connexion réussie !');
      router.push('/');
    } else {
      toast.error(result.error || 'Erreur de connexion');
    }
    
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Connexion
          </h1>
          <p className="text-gray-400">
            Connectez-vous à votre compte TikTok
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="votre@email.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            Se connecter
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-primary-500 hover:text-primary-400 font-medium">
              S'inscrire
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
EOF

cat > pages/auth/register.js << 'EOF'
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import Button from '../../components/UI/Button';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { register } = useAuthStore();
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (formData.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    setLoading(true);
    
    const result = await register(
      formData.email,
      formData.password,
      formData.username,
      formData.displayName
    );
    
    if (result.success) {
      toast.success('Inscription réussie !');
      router.push('/');
    } else {
      toast.error(result.error || 'Erreur lors de l\'inscription');
    }
    
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Inscription
          </h1>
          <p className="text-gray-400">
            Créez votre compte TikTok
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="@username"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom d'affichage
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Votre nom"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="votre@email.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            S'inscrire
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-primary-500 hover:text-primary-400 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
EOF

# 11. FINALISATION
echo -e "${YELLOW}🔧 Finalisation du projet...${NC}"

# README.md
cat > README.md << 'EOF'
# TikTok Clone

Une application TikTok clone construite avec Next.js et Appwrite.

## Fonctionnalités

- ✅ Authentification utilisateur
- ✅ Lecture de vidéos en plein écran
- ✅ Système de likes et commentaires
- ✅ Interface responsive
- ✅ Animations fluides
- ✅ Backend Appwrite intégré

## Installation

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev
