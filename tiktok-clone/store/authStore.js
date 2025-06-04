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
