import React, { useEffect, useState, useRef } from "react";
import { Client, Account, Databases, Storage, ID, Query } from "appwrite";

const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("681deee80012cf6d3e15");

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = "tiktok_db";
const MUSIC_COLLECTION_ID = "music";
const USERS_COLLECTION_ID = "users";
const SUBSCRIPTIONS_COLLECTION_ID = "subscriptions";
const BUCKET_ID = "6827864200044d72309a";

const SpotifyApp = () => {
  // États principaux
  const [user, setUser] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [activeTab, setActiveTab] = useState("library");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [sortBy, setSortBy] = useState("$createdAt");
  
  // États du formulaire d'upload
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    album: "",
    genre: "",
    year: "",
    trackNumber: "",
    description: "",
    lyrics: "",
    tags: "",
    mood: "",
    bpm: "",
    musicalKey: "",
    energy: "",
    isExplicit: false
  });
  const [audioFile, setAudioFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // États du lecteur audio
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState("none");
  
  // États pour la navigation fluide
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("library");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // 🔥 NOUVEAUX ÉTATS pour les artistes et abonnements
  const [allUsers, setAllUsers] = useState([]); // Tous les utilisateurs d'Appwrite
  const [artists, setArtists] = useState([]); // Artistes avec leurs stats
  const [subscriptions, setSubscriptions] = useState([]); // Mes abonnements
  const [followedTracks, setFollowedTracks] = useState([]); // Musiques des artistes suivis
  const [searchArtistQuery, setSearchArtistQuery] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  
  // États pour le profil
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
    socialLinks: {
      instagram: "",
      twitter: "",
      youtube: "",
      spotify: ""
    },
    isArtist: true,
    artistName: "",
    genre: ""
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  const audioRef = useRef(null);
  const mainContentRef = useRef(null);

  // Genres disponibles
  const genres = [
    "Pop", "Rock", "Hip-Hop", "R&B", "Jazz", "Classical", "Electronic", 
    "Country", "Folk", "Reggae", "Blues", "Funk", "Soul", "Disco",
    "House", "Techno", "Dubstep", "Ambient", "Indie", "Alternative"
  ];

  // Clés musicales
  const musicalKeys = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
    "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"
  ];

  // Moods disponibles
  const moods = [
    "Happy", "Sad", "Energetic", "Calm", "Romantic", "Aggressive", 
    "Melancholic", "Uplifting", "Dark", "Peaceful", "Intense", "Dreamy"
  ];

  // Détection de la taille d'écran
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation fluide avec scroll
  const scrollToSection = (sectionId) => {
    setActiveTab(sectionId);
    setActiveSection(sectionId);
    
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Détection du scroll pour l'effet header
  useEffect(() => {
    const handleScroll = () => {
      if (mainContentRef.current) {
        setIsScrolled(mainContentRef.current.scrollTop > 20);
      }
    };

    const mainContent = mainContentRef.current;
    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll);
      return () => mainContent.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Authentification
  const loginWithGoogle = () => {
    account.createOAuth2Session("google", window.location.href);
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
      setCurrentTrack(null);
      setIsPlaying(false);
    } catch (err) {
      console.error("Erreur déconnexion:", err);
    }
  };

  // 🔥 FONCTION AMÉLIORÉE : Créer ou mettre à jour le profil utilisateur
  const createOrUpdateUserProfile = async (userData) => {
    try {
      let existingProfile = null;
      try {
        const profiles = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          [Query.equal("userId", userData.$id)]
        );
        existingProfile = profiles.documents[0];
      } catch (err) {
        console.log("Aucun profil existant trouvé");
      }

      const profileData = {
        userId: userData.$id,
        name: userData.name,
        email: userData.email,
        avatar: userData.prefs?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=10b981&color=fff`,
        bio: userData.prefs?.bio || "",
        location: userData.prefs?.location || "",
        website: userData.prefs?.website || "",
        socialLinks: userData.prefs?.socialLinks || {
          instagram: "",
          twitter: "",
          youtube: "",
          spotify: ""
        },
        isArtist: userData.prefs?.isArtist !== false,
        artistName: userData.prefs?.artistName || userData.name,
        genre: userData.prefs?.genre || "",
        tracksCount: 0,
        followersCount: 0,
        totalPlays: 0,
        joinedAt: new Date().toISOString()
      };

      if (existingProfile) {
        const updatedProfile = await databases.updateDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          existingProfile.$id,
          {
            ...profileData,
            tracksCount: existingProfile.tracksCount || 0,
            followersCount: existingProfile.followersCount || 0,
            totalPlays: existingProfile.totalPlays || 0,
            joinedAt: existingProfile.joinedAt || new Date().toISOString()
          }
        );
        setUserProfile(updatedProfile);
      } else {
        const newProfile = await databases.createDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          ID.unique(),
          profileData
        );
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.error("Erreur création/mise à jour profil:", err);
    }
  };

  const fetchUser = async () => {
    try {
      const userData = await account.get();
      setUser(userData);
      
      await createOrUpdateUserProfile(userData);
      
      setProfileData({
        name: userData.name || "",
        bio: userData.prefs?.bio || "",
        location: userData.prefs?.location || "",
        website: userData.prefs?.website || "",
        socialLinks: userData.prefs?.socialLinks || {
          instagram: "",
          twitter: "",
          youtube: "",
          spotify: ""
        },
        isArtist: userData.prefs?.isArtist !== false,
        artistName: userData.prefs?.artistName || userData.name,
        genre: userData.prefs?.genre || ""
      });
      
      fetchTracks();
      fetchAllUsers();
      fetchSubscriptions();
    } catch (err) {
      console.error("Erreur récupération utilisateur:", err);
      setUser(null);
    }
  };

  // 🔥 FONCTION CORRIGÉE : Récupération des musiques avec filtres
  const fetchTracks = async () => {
    try {
      setLoading(true);
      const queries = [];
      
      if (selectedGenre) {
        queries.push(Query.equal("genre", selectedGenre));
      }

      const orderType = sortBy.startsWith("-") ? Query.orderDesc : Query.orderAsc;
      const orderField = sortBy.replace("-", "");
      
      const res = await databases.listDocuments(
        DATABASE_ID, 
        MUSIC_COLLECTION_ID,
        [
          ...queries,
          orderType(orderField),
          Query.limit(100)
        ]
      );
      
      let filteredTracks = res.documents;
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredTracks = filteredTracks.filter(track => 
          track.title?.toLowerCase().includes(query) ||
          track.artist?.toLowerCase().includes(query) ||
          track.album?.toLowerCase().includes(query) ||
          track.tags?.toLowerCase().includes(query) ||
          track.description?.toLowerCase().includes(query)
        );
      }
      
      setTracks(filteredTracks);
    } catch (err) {
      console.error("Erreur récupération musiques:", err);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NOUVELLE FONCTION : Récupérer tous les utilisateurs d'Appwrite
  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les profils utilisateurs
      const usersRes = await databases.listDocuments(
        DATABASE_ID, 
        USERS_COLLECTION_ID,
        [
          Query.orderDesc("$createdAt"),
          Query.limit(1000)
        ]
      );
      
      // Récupérer toutes les musiques
      const allTracksRes = await databases.listDocuments(
        DATABASE_ID,
        MUSIC_COLLECTION_ID,
        [Query.limit(1000)]
      );
      
      // Récupérer tous les abonnements
      const allSubscriptionsRes = await databases.listDocuments(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        [Query.limit(1000)]
      );
      
      let filteredUsers = usersRes.documents;
      
      // Filtrage côté client pour la recherche d'artistes
      if (searchArtistQuery.trim()) {
        const query = searchArtistQuery.toLowerCase().trim();
        filteredUsers = filteredUsers.filter(artist => 
          artist.name?.toLowerCase().includes(query) ||
          artist.artistName?.toLowerCase().includes(query) ||
          artist.genre?.toLowerCase().includes(query) ||
          artist.bio?.toLowerCase().includes(query) ||
          artist.location?.toLowerCase().includes(query)
        );
      }
      
      // Calculer les statistiques pour chaque utilisateur
      const usersWithStats = filteredUsers.map((userItem) => {
        const userTracks = allTracksRes.documents.filter(
          track => track.uploadedBy === userItem.userId
        );
        
        const totalPlays = userTracks.reduce(
          (sum, track) => sum + (track.playsCount || 0), 0
        );
        
        const followers = allSubscriptionsRes.documents.filter(
          sub => sub.artistId === userItem.userId
        );
        
        return {
          ...userItem,
          tracksCount: userTracks.length,
          totalPlays: totalPlays,
          followersCount: followers.length,
          tracks: userTracks
        };
      });
      
      setAllUsers(usersWithStats);
      setArtists(usersWithStats); // Tous les utilisateurs sont des artistes potentiels
      
    } catch (err) {
      console.error("Erreur récupération utilisateurs:", err);
      setAllUsers([]);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  // Récupération des abonnements
  const fetchSubscriptions = async () => {
    if (!user) return;
    
    try {
      const res = await databases.listDocuments(
        DATABASE_ID, 
        SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal("userId", user.$id),
          Query.limit(100)
        ]
      );
      
      setSubscriptions(res.documents);
      
      // Récupérer les musiques des artistes suivis
      if (res.documents.length > 0) {
        const followedArtistIds = res.documents.map(sub => sub.artistId);
        const followedTracksRes = await databases.listDocuments(
          DATABASE_ID,
          MUSIC_COLLECTION_ID,
          [
            Query.limit(1000)
          ]
        );
        
        const filteredFollowedTracks = followedTracksRes.documents.filter(
          track => followedArtistIds.includes(track.uploadedBy)
        );
        
        setFollowedTracks(filteredFollowedTracks);
      } else {
        setFollowedTracks([]);
      }
      
    } catch (err) {
      console.error("Erreur récupération abonnements:", err);
      setSubscriptions([]);
      setFollowedTracks([]);
    }
  };

  // 🔥 FONCTION AMÉLIORÉE : S'abonner à un artiste
  const subscribeToArtist = async (artistUserId) => {
    if (!user) {
      alert("❌ Vous devez être connecté pour suivre un artiste !");
      return;
    }
    
    if (artistUserId === user.$id) {
      alert("❌ Vous ne pouvez pas vous abonner à vous-même !");
      return;
    }
    
    // Vérifier si déjà abonné
    if (isSubscribedToArtist(artistUserId)) {
      alert("❌ Vous êtes déjà abonné à cet artiste !");
      return;
    }
    
    try {
      await databases.createDocument(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        ID.unique(),
        {
          userId: user.$id,
          artistId: artistUserId,
          subscribedAt: new Date().toISOString()
        }
      );
      
      // Rafraîchir les données
      await fetchSubscriptions();
      await fetchAllUsers();
      
      // Trouver le nom de l'artiste
      const artist = allUsers.find(u => u.userId === artistUserId);
      const artistName = artist?.artistName || artist?.name || "cet artiste";
      
      alert(`✅ Vous suivez maintenant ${artistName} !`);
    } catch (err) {
      console.error("Erreur abonnement:", err);
      alert("❌ Erreur lors de l'abonnement");
    }
  };

  // 🔥 FONCTION AMÉLIORÉE : Se désabonner d'un artiste
  const unsubscribeFromArtist = async (artistUserId) => {
    if (!user) return;
    
    try {
      const subscription = subscriptions.find(sub => sub.artistId === artistUserId);
      if (subscription) {
        await databases.deleteDocument(
          DATABASE_ID,
          SUBSCRIPTIONS_COLLECTION_ID,
          subscription.$id
        );
        
        // Rafraîchir les données
        await fetchSubscriptions();
        await fetchAllUsers();
        
        // Trouver le nom de l'artiste
        const artist = allUsers.find(u => u.userId === artistUserId);
        const artistName = artist?.artistName || artist?.name || "cet artiste";
        
        alert(`✅ Vous ne suivez plus ${artistName} !`);
      }
    } catch (err) {
      console.error("Erreur désabonnement:", err);
      alert("❌ Erreur lors du désabonnement");
    }
  };

  // Vérifier si l'utilisateur est abonné à un artiste
  const isSubscribedToArtist = (artistUserId) => {
    return subscriptions.some(sub => sub.artistId === artistUserId);
  };

  // Mise à jour du profil
  const updateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    
    try {
      let profileImageUrl = user.prefs?.avatar || "";
      
      if (profileImage) {
        const uploadedImage = await storage.createFile(
          BUCKET_ID, 
          ID.unique(), 
          profileImage
        );
        profileImageUrl = storage.getFileView(BUCKET_ID, uploadedImage.$id);
      }
      
      await account.updatePrefs({
        ...user.prefs,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website,
        socialLinks: profileData.socialLinks,
        avatar: profileImageUrl,
        isArtist: profileData.isArtist,
        artistName: profileData.artistName,
        genre: profileData.genre
      });
      
      if (profileData.name !== user.name) {
        await account.updateName(profileData.name);
      }
      
      await fetchUser();
      setShowProfileModal(false);
      setProfileImage(null);
      alert("✅ Profil mis à jour avec succès !");
      
    } catch (err) {
      console.error("Erreur mise à jour profil:", err);
      alert("❌ Erreur lors de la mise à jour du profil");
    } finally {
      setProfileLoading(false);
    }
  };

  // Gestion du formulaire
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Gestion du formulaire de profil
  const handleProfileInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('social.')) {
      const socialField = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Calculer la durée du fichier audio
  const getAudioDuration = (file) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(Math.floor(audio.duration));
      };
      audio.onerror = () => resolve(0);
      audio.src = URL.createObjectURL(file);
    });
  };

  // Validation des fichiers
  const validateFile = (file, type) => {
    if (!file) return { valid: false, error: "Aucun fichier sélectionné" };
    
    if (type === 'audio') {
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
      if (!validTypes.includes(file.type)) {
        return { valid: false, error: "Format audio non supporté. Utilisez MP3, WAV, OGG ou M4A." };
      }
      if (file.size > 50 * 1024 * 1024) {
        return { valid: false, error: "Le fichier audio ne doit pas dépasser 50MB." };
      }
    }
    
    if (type === 'image') {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return { valid: false, error: "Format d'image non supporté. Utilisez JPEG, PNG ou WebP." };
      }
      if (file.size > 5 * 1024 * 1024) {
        return { valid: false, error: "L'image ne doit pas dépasser 5MB." };
      }
    }
    
    return { valid: true };
  };

  // Upload de fichier avec retry
  const uploadFileWithRetry = async (file, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tentative d'upload ${attempt}/${maxRetries} pour ${file.name}`);
        
        const fileToUpload = new File([file], file.name, { type: file.type });
        
        const uploadedFile = await storage.createFile(
          BUCKET_ID, 
          ID.unique(), 
          fileToUpload
        );
        
        console.log(`Upload réussi: ${uploadedFile.$id}`);
        return uploadedFile;
        
      } catch (error) {
        console.error(`Erreur tentative ${attempt}:`, error);
        
        if (attempt === maxRetries) {
          throw new Error(`Échec de l'upload après ${maxRetries} tentatives: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  // Upload de musique
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!audioFile || !user || !formData.title.trim() || !formData.artist.trim()) {
      alert("Veuillez remplir au moins le titre, l'artiste et sélectionner un fichier audio");
      return;
    }

    const audioValidation = validateFile(audioFile, 'audio');
    if (!audioValidation.valid) {
      alert(`Erreur fichier audio: ${audioValidation.error}`);
      return;
    }

    if (coverImage) {
      const imageValidation = validateFile(coverImage, 'image');
      if (!imageValidation.valid) {
        alert(`Erreur image: ${imageValidation.error}`);
        return;
      }
    }

    setLoading(true);
    setUploadProgress(0);
    
    try {
      console.log("Début de l'upload...");
      
      setUploadProgress(10);
      const audioDuration = await getAudioDuration(audioFile);
      console.log(`Durée audio: ${audioDuration}s`);

      setUploadProgress(20);
      console.log("Upload du fichier audio...");
      const uploadedAudio = await uploadFileWithRetry(audioFile);
      const audioUrl = storage.getFileView(BUCKET_ID, uploadedAudio.$id);
      console.log(`URL audio: ${audioUrl}`);

      setUploadProgress(60);

      let coverImageUrl = "";
      if (coverImage) {
        console.log("Upload de l'image de couverture...");
        const uploadedCover = await uploadFileWithRetry(coverImage);
        coverImageUrl = storage.getFileView(BUCKET_ID, uploadedCover.$id);
        console.log(`URL image: ${coverImageUrl}`);
      }

      setUploadProgress(80);

      const musicData = {
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        audioUrl: audioUrl.toString(),
        duration: audioDuration,
        uploadedBy: user.$id,
        uploaderName: user.name,
        fileSize: audioFile.size,
        fileFormat: audioFile.name.split('.').pop().toLowerCase(),
        isExplicit: formData.isExplicit,
        playsCount: 0,
        likesCount: 0
      };

      if (formData.album?.trim()) musicData.album = formData.album.trim();
      if (formData.genre) musicData.genre = formData.genre;
      if (formData.year) musicData.year = parseInt(formData.year);
      if (formData.trackNumber) musicData.trackNumber = parseInt(formData.trackNumber);
      if (coverImageUrl) musicData.coverImage = coverImageUrl;
      if (formData.description?.trim()) musicData.description = formData.description.trim();
      if (formData.lyrics?.trim()) musicData.lyrics = formData.lyrics.trim();
      if (formData.tags?.trim()) musicData.tags = formData.tags.trim();
      if (formData.mood) musicData.mood = formData.mood;
      if (formData.bpm) musicData.bpm = parseInt(formData.bpm);
      if (formData.musicalKey) musicData.musicalKey = formData.musicalKey;
      if (formData.energy) musicData.energy = parseInt(formData.energy);

      console.log("Création du document dans la base de données...");
      
      await databases.createDocument(
        DATABASE_ID,
        MUSIC_COLLECTION_ID,
        ID.unique(),
        musicData
      );

      setUploadProgress(100);

      setFormData({
        title: "",
        artist: "",
        album: "",
        genre: "",
        year: "",
        trackNumber: "",
        description: "",
        lyrics: "",
        tags: "",
        mood: "",
        bpm: "",
        musicalKey: "",
        energy: "",
        isExplicit: false
      });
      setAudioFile(null);
      setCoverImage(null);
      
      await fetchTracks();
      await fetchAllUsers();
      scrollToSection("library");
      alert("🎵 Musique ajoutée avec succès !");

    } catch (err) {
      console.error("Erreur upload:", err);
      alert(`❌ Erreur lors de l'upload: ${err.message}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Fonctions du lecteur audio
  const playTrack = async (track) => {
    if (currentTrack?.$id === track.$id && isPlaying) {
      pauseTrack();
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = track.audioUrl;
        try {
          await audioRef.current.play();
          await databases.updateDocument(
            DATABASE_ID,
            MUSIC_COLLECTION_ID,
            track.$id,
            { playsCount: (track.playsCount || 0) + 1 }
          );
        } catch (err) {
          console.error("Erreur lecture:", err);
          setIsPlaying(false);
        }
      }
    }
  };

  const pauseTrack = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const nextTrack = () => {
    const currentIndex = tracks.findIndex(track => track.$id === currentTrack?.$id);
    if (currentIndex < tracks.length - 1) {
      playTrack(tracks[currentIndex + 1]);
    } else if (repeatMode === "all") {
      playTrack(tracks[0]);
    }
  };

  const previousTrack = () => {
    const currentIndex = tracks.findIndex(track => track.$id === currentTrack?.$id);
    if (currentIndex > 0) {
      playTrack(tracks[currentIndex - 1]);
    } else if (repeatMode === "all") {
      playTrack(tracks[tracks.length - 1]);
    }
  };

  const seekToTime = (newTime) => {
    if (audioRef.current && duration && !isNaN(newTime) && isFinite(newTime) && newTime >= 0) {
      const clampedTime = Math.max(0, Math.min(newTime, duration));
      try {
        audioRef.current.currentTime = clampedTime;
        setCurrentTime(clampedTime);
      } catch (error) {
        console.error("Erreur lors du changement de position:", error);
      }
    }
  };

  // Gestion des likes
  const toggleLike = async (track) => {
    try {
      const newLikesCount = (track.likesCount || 0) + 1;
      await databases.updateDocument(
        DATABASE_ID,
        MUSIC_COLLECTION_ID,
        track.$id,
        { likesCount: newLikesCount }
      );
      fetchTracks();
    } catch (err) {
      console.error("Erreur like:", err);
    }
  };

  // Suppression de musique
  const deleteTrack = async (trackId) => {
    if (window.confirm("Supprimer cette musique définitivement ?")) {
      try {
        await databases.deleteDocument(DATABASE_ID, MUSIC_COLLECTION_ID, trackId);
        fetchTracks();
        fetchAllUsers();
        if (currentTrack?.$id === trackId) {
          setCurrentTrack(null);
          setIsPlaying(false);
        }
        alert("Musique supprimée");
      } catch (err) {
        console.error("Erreur suppression:", err);
        alert("Erreur lors de la suppression");
      }
    }
  };

  // Utilitaires
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // Effects
  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTracks();
    }
  }, [searchQuery, selectedGenre, sortBy, user]);

  useEffect(() => {
    if (user) {
      fetchAllUsers();
    }
  }, [searchArtistQuery, user]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (audio.currentTime && isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };
    
    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    
    const handleEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextTrack();
      }
    };

    const handleError = (e) => {
      console.error("Erreur audio:", e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [currentTrack, repeatMode, tracks]);

  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.particles}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.particle,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        <div style={styles.loginContent}>
          <div style={styles.loginHeader}>
            <div style={styles.loginIcon}>🎵</div>
            <div style={styles.loginGlow}></div>
          </div>
          <h1 style={styles.loginTitle}>
            MusicStream
          </h1>
          <p style={styles.loginSubtitle}>
            Découvrez, partagez et écoutez votre musique préférée dans une expérience immersive
          </p>
          <button
            onClick={loginWithGoogle}
            style={styles.loginButton}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 25px 50px -12px rgba(16, 185, 129, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
            }}
          >
            <span style={styles.loginButtonContent}>
              <svg style={styles.googleIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Se connecter avec Google</span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <audio ref={audioRef} volume={volume} />
      
      {/* Header fixe moderne */}
      <header style={{
        ...styles.header,
        ...(isScrolled ? styles.headerScrolled : {})
      }}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>🎵</div>
            <div>
              <h1 style={styles.headerTitle}>
                MusicStream
              </h1>
            </div>
          </div>
          
          {!isMobile && (
            <nav style={styles.navigation}>
              {[
                { id: "library", icon: "🎵", label: "Bibliothèque", count: tracks.length },
                { id: "upload", icon: "⬆️", label: "Ajouter" },
                { id: "artists", icon: "👥", label: "Artistes", count: artists.length },
                { id: "following", icon: "⭐", label: "Abonnements", count: followedTracks.length },
                { id: "stats", icon: "📊", label: "Stats" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  style={{
                    ...styles.navButton,
                    ...(activeSection === tab.id ? styles.navButtonActive : {})
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== tab.id) {
                      e.target.style.backgroundColor = 'rgba(71, 85, 105, 0.5)';
                      e.target.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== tab.id) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = 'rgb(148, 163, 184)';
                    }
                  }}
                >
                  <span>{tab.icon}</span>
                  <span style={styles.navButtonLabel}>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span style={styles.navButtonBadge}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          )}
          
          <div style={styles.headerRight}>
            {!isMobile && (
              <div style={styles.userInfo}>
                <p style={styles.userWelcome}>Bienvenue,</p>
                <p style={styles.userName}>{user.name}</p>
              </div>
            )}
            <div style={styles.avatarContainer}>
              <img 
                src={user.prefs?.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=10b981&color=fff`}
                alt="Avatar"
                style={styles.avatar}
                onClick={() => setShowProfileModal(true)}
              />
              <div style={styles.avatarStatus}></div>
            </div>
            <button
              onClick={logout}
              style={styles.logoutButton}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(153, 27, 27, 0.2)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.transform = 'scale(1)';
              }}
            >
              {isMobile ? "🚪" : "Déconnexion"}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation mobile */}
      {isMobile && (
        <div style={styles.mobileNav}>
          <div style={styles.mobileNavContent}>
            {[
              { id: "library", icon: "🎵", label: "Bibliothèque", count: tracks.length },
              { id: "upload", icon: "⬆️", label: "Ajouter" },
              { id: "artists", icon: "👥", label: "Artistes", count: artists.length },
              { id: "following", icon: "⭐", label: "Abonnements", count: followedTracks.length },
              { id: "stats", icon: "📊", label: "Stats" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                style={{
                  ...styles.mobileNavButton,
                  ...(activeSection === tab.id ? styles.mobileNavButtonActive : {})
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={styles.mobileNavBadge}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <main 
        ref={mainContentRef}
        style={{
          ...styles.mainContent,
          paddingTop: isMobile ? '9rem' : '6rem',
          paddingBottom: currentTrack ? '12rem' : '3rem'
        }}
      >
        <div style={styles.contentContainer}>
          {/* Section Library */}
          {activeTab === "library" && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  Ma Bibliothèque Musicale
                </h2>
                <p style={styles.sectionSubtitle}>
                  Découvrez et gérez votre collection de musiques
                </p>
              </div>

              {/* Filtres et recherche */}
              <div style={styles.filtersContainer}>
                <div style={styles.filtersGrid}>
                  <div style={styles.searchContainer}>
                    <div style={styles.searchIcon}>🔍</div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher une musique..."
                      style={styles.input}
                    />
                  </div>
                  
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">🎼 Tous les genres</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={styles.select}
                  >
                    <option value="$createdAt">📅 Plus récent</option>
                    <option value="-$createdAt">📅 Plus ancien</option>
                    <option value="title">🔤 Titre A-Z</option>
                    <option value="-title">🔤 Titre Z-A</option>
                    <option value="artist">👤 Artiste A-Z</option>
                    <option value="-artist">👤 Artiste Z-A</option>
                    <option value="-playsCount">▶️ Plus écouté</option>
                    <option value="-likesCount">❤️ Plus aimé</option>
                  </select>
                  
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedGenre("");
                      setSortBy("$createdAt");
                    }}
                    style={styles.resetButton}
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>

              {/* Grille de cartes musicales */}
              {loading ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>⏳</div>
                  <h3 style={styles.emptyTitle}>Chargement...</h3>
                  <p style={styles.emptySubtitle}>Récupération des musiques en cours</p>
                </div>
              ) : tracks.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>🎵</div>
                  <h3 style={styles.emptyTitle}>
                    {searchQuery || selectedGenre ? "Aucun résultat trouvé" : "Votre bibliothèque est vide"}
                  </h3>
                  <p style={styles.emptySubtitle}>
                    {searchQuery || selectedGenre 
                      ? "Essayez de modifier vos filtres de recherche" 
                      : "Commencez par ajouter votre première musique"
                    }
                  </p>
                  {!searchQuery && !selectedGenre && (
                    <button 
                      onClick={() => scrollToSection("upload")}
                      style={styles.primaryButton}
                    >
                      ➕ Ajouter une musique
                    </button>
                  )}
                </div>
              ) : (
                <div style={styles.tracksGrid}>
                  {tracks.map((track, index) => (
                    <div 
                      key={track.$id} 
                      style={{
                        ...styles.trackCard,
                        ...(currentTrack?.$id === track.$id ? styles.trackCardActive : {})
                      }}
                      className="track-card"
                    >
                      {/* Image de couverture */}
                      <div style={styles.trackCover}>
                        {track.coverImage ? (
                          <img 
                            src={track.coverImage} 
                            alt="Cover" 
                            style={styles.coverImage}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div style={{
                          ...styles.coverPlaceholder,
                          display: track.coverImage ? 'none' : 'flex'
                        }}>
                          🎵
                        </div>
                        
                        {/* Overlay avec bouton play */}
                        <div style={styles.coverOverlay} className="cover-overlay">
                          <button
                            onClick={() => playTrack(track)}
                            style={styles.playButton}
                            className="play-button"
                          >
                            {currentTrack?.$id === track.$id && isPlaying ? "⏸️" : "▶️"}
                          </button>
                        </div>

                        {/* Badges */}
                        {currentTrack?.$id === track.$id && isPlaying && (
                          <div style={styles.playingBadge}>
                            <div style={styles.playingIndicator}></div>
                            En cours
                          </div>
                        )}

                        {track.isExplicit && (
                          <div style={styles.explicitBadge}>
                            🔞 Explicite
                          </div>
                        )}
                      </div>

                      {/* Informations */}
                      <div style={styles.trackInfo}>
                        <div>
                          <h3 style={styles.trackTitle}>
                            {track.title}
                          </h3>
                          <p style={styles.trackArtist}>{track.artist}</p>
                        </div>

                        {/* Métadonnées */}
                        <div style={styles.trackMeta}>
                          {track.album && (
                            <span style={styles.metaBadge}>
                              📀 {track.album}
                            </span>
                          )}
                          {track.genre && (
                            <span style={styles.metaBadge}>
                              🎼 {track.genre}
                            </span>
                          )}
                          {track.year && (
                            <span style={styles.metaBadge}>
                              📅 {track.year}
                            </span>
                          )}
                        </div>

                        {/* Statistiques */}
                        <div style={styles.trackStats}>
                          <div style={styles.statsLeft}>
                            {track.playsCount > 0 && (
                              <span style={styles.statItem}>
                                <span>▶️</span>
                                <span>{track.playsCount}</span>
                              </span>
                            )}
                            {track.likesCount > 0 && (
                              <span style={styles.statItem}>
                                <span>❤️</span>
                                <span>{track.likesCount}</span>
                              </span>
                            )}
                          </div>
                          <span style={styles.trackDuration}>{formatTime(track.duration)}</span>
                        </div>

                        {/* Actions */}
                        <div style={styles.trackActions}>
                          <button
                            onClick={() => toggleLike(track)}
                            style={styles.actionButton}
                          >
                            <span>❤️</span>
                            <span style={styles.actionLabel}>J'aime</span>
                          </button>
                          
                          {track.uploadedBy === user.$id && (
                            <button
                              onClick={() => deleteTrack(track.$id)}
                              style={styles.deleteButton}
                            >
                              <span>🗑️</span>
                              <span style={styles.actionLabel}>Supprimer</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section Upload */}
          {activeTab === "upload" && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  Ajouter une Musique
                </h2>
                <p style={styles.sectionSubtitle}>
                  Partagez vos créations avec la communauté
                </p>
              </div>

              <div style={styles.uploadContainer}>
                <div style={styles.uploadForm}>
                  <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Barre de progression */}
                    {loading && (
                      <div style={styles.progressContainer}>
                        <div style={styles.progressLabel}>
                          Upload en cours... {uploadProgress}%
                        </div>
                        <div style={styles.progressBar}>
                          <div 
                            style={{
                              ...styles.progressFill,
                              width: `${uploadProgress}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Informations principales */}
                    <div style={styles.formSection}>
                      <h3 style={styles.formSectionTitle}>
                        <span style={styles.formSectionIcon}>📝</span>
                        Informations principales
                      </h3>
                      <div style={styles.formGrid}>
                        <div style={styles.formField}>
                          <label style={styles.label}>Titre *</label>
                          <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Titre de la chanson"
                            style={styles.input}
                            required
                            disabled={loading}
                          />
                        </div>
                        <div style={styles.formField}>
                          <label style={styles.label}>Artiste *</label>
                          <input
                            type="text"
                            name="artist"
                            value={formData.artist}
                            onChange={handleInputChange}
                            placeholder="Nom de l'artiste"
                            style={styles.input}
                            required
                            disabled={loading}
                          />
                        </div>
                        <div style={styles.formField}>
                          <label style={styles.label}>Album</label>
                          <input
                            type="text"
                            name="album"
                            value={formData.album}
                            onChange={handleInputChange}
                            placeholder="Nom de l'album"
                            style={styles.input}
                            disabled={loading}
                          />
                        </div>
                        <div style={styles.formField}>
                          <label style={styles.label}>Genre</label>
                          <select
                            name="genre"
                            value={formData.genre}
                            onChange={handleInputChange}
                            style={styles.select}
                            disabled={loading}
                          >
                            <option value="">Sélectionner un genre</option>
                            {genres.map(genre => (
                              <option key={genre} value={genre}>{genre}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Fichiers */}
                    <div style={styles.formSection}>
                      <h3 style={styles.formSectionTitle}>
                        <span style={styles.formSectionIcon}>📁</span>
                        Fichiers
                      </h3>
                      <div style={styles.formGrid}>
                        <div style={styles.formField}>
                          <label style={styles.label}>
                            🎵 Fichier Audio * (MP3, WAV, OGG, M4A - Max 50MB)
                          </label>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => setAudioFile(e.target.files[0])}
                            style={styles.fileInput}
                            required
                            disabled={loading}
                          />
                          {audioFile && (
                            <div style={styles.filePreview}>
                              <span style={styles.fileIcon}>✅</span>
                              <span style={styles.fileName}>{audioFile.name}</span>
                              <span style={styles.fileSize}>({formatFileSize(audioFile.size)})</span>
                            </div>
                          )}
                        </div>
                        
                        <div style={styles.formField}>
                          <label style={styles.label}>
                            🖼️ Image de couverture (JPEG, PNG, WebP - Max 5MB)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCoverImage(e.target.files[0])}
                            style={styles.fileInput}
                            disabled={loading}
                          />
                          {coverImage && (
                            <div style={styles.filePreview}>
                              <span style={styles.fileIcon}>✅</span>
                              <span style={styles.fileName}>{coverImage.name}</span>
                              <span style={styles.fileSize}>({formatFileSize(coverImage.size)})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Métadonnées avancées */}
                    <div style={styles.formSection}>
                      <h3 style={styles.formSectionTitle}>
                        <span style={styles.formSectionIcon}>🎼</span>
                        Métadonnées avancées
                      </h3>
                      <div style={styles.metaGrid}>
                        <div style={styles.formField}>
                          <label style={styles.smallLabel}>Année</label>
                          <input
                            type="number"
                            name="year"
                            value={formData.year}
                            onChange={handleInputChange}
                            placeholder="2024"
                            min="1900"
                            max="2030"
                            style={styles.smallInput}
                            disabled={loading}
                          />
                        </div>
                        <div style={styles.formField}>
                          <label style={styles.smallLabel}>N° Piste</label>
                          <input
                            type="number"
                            name="trackNumber"
                            value={formData.trackNumber}
                            onChange={handleInputChange}
                            placeholder="1"
                            min="1"
                            style={styles.smallInput}
                            disabled={loading}
                          />
                        </div>
                        <div style={styles.formField}>
                          <label style={styles.smallLabel}>BPM</label>
                          <input
                            type="number"
                            name="bpm"
                            value={formData.bpm}
                            onChange={handleInputChange}
                            placeholder="120"
                            min="1"
                            max="300"
                            style={styles.smallInput}
                            disabled={loading}
                          />
                        </div>
                        <div style={styles.formField}>
                          <label style={styles.smallLabel}>Énergie (1-10)</label>
                          <input
                            type="number"
                            name="energy"
                            value={formData.energy}
                            onChange={handleInputChange}
                            placeholder="5"
                            min="1"
                            max="10"
                            style={styles.smallInput}
                            disabled={loading}
                          />
                        </div>
                      </div>
                      
                      <div style={styles.formGrid}>
                        <div style={styles.formField}>
                          <label style={styles.label}>Ambiance</label>
                          <select
                            name="mood"
                            value={formData.mood}
                            onChange={handleInputChange}
                            style={styles.select}
                            disabled={loading}
                          >
                            <option value="">Sélectionner une ambiance</option>
                            {moods.map(mood => (
                              <option key={mood} value={mood}>{mood}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div style={styles.formField}>
                          <label style={styles.label}>Clé musicale</label>
                          <select
                            name="musicalKey"
                            value={formData.musicalKey}
                            onChange={handleInputChange}
                            style={styles.select}
                            disabled={loading}
                          >
                            <option value="">Clé musicale</option>
                            {musicalKeys.map(key => (
                              <option key={key} value={key}>{key}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Contenu */}
                    <div style={styles.formSection}>
                      <h3 style={styles.formSectionTitle}>
                        <span style={styles.formSectionIcon}>📝</span>
                        Contenu
                      </h3>
                      <div style={styles.contentFields}>
                        <div style={styles.formField}>
                          <label style={styles.label}>Description</label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Description de la chanson..."
                            rows="3"
                            style={styles.textarea}
                            disabled={loading}
                          />
                        </div>
                        
                        <div style={styles.formField}>
                          <label style={styles.label}>Paroles</label>
                          <textarea
                            name="lyrics"
                            value={formData.lyrics}
                            onChange={handleInputChange}
                            placeholder="Paroles de la chanson..."
                            rows="6"
                            style={styles.textarea}
                            disabled={loading}
                          />
                        </div>
                        
                        <div style={styles.formField}>
                          <label style={styles.label}>Tags</label>
                          <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleInputChange}
                            placeholder="pop, dance, summer (séparés par des virgules)"
                            style={styles.input}
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Options */}
                    <div style={styles.formSection}>
                      <h3 style={styles.formSectionTitle}>
                        <span style={styles.formSectionIcon}>⚙️</span>
                        Options
                      </h3>
                      <div style={styles.checkboxContainer}>
                        <input
                          type="checkbox"
                          name="isExplicit"
                          checked={formData.isExplicit}
                          onChange={handleInputChange}
                          style={styles.checkbox}
                          disabled={loading}
                        />
                        <label style={styles.checkboxLabel}>
                          🔞 Contenu explicite
                        </label>
                      </div>
                    </div>

                    {/* Bouton de soumission */}
                    <button
                      type="submit"
                      disabled={loading || !audioFile || !formData.title.trim() || !formData.artist.trim()}
                      style={{
                        ...styles.submitButton,
                        ...(loading || !audioFile || !formData.title.trim() || !formData.artist.trim() 
                          ? styles.submitButtonDisabled 
                          : {})
                      }}
                    >
                      {loading ? (
                        <span style={styles.loadingContent}>
                          <div style={styles.loadingSpinner}></div>
                          Upload en cours... {uploadProgress}%
                        </span>
                      ) : (
                        "🎵 Ajouter à ma bibliothèque"
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* 🔥 SECTION ARTISTES COMPLÈTEMENT REFAITE */}
          {activeTab === "artists" && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  Découvrir les Artistes
                </h2>
                <p style={styles.sectionSubtitle}>
                  Trouvez et suivez tous les utilisateurs de la communauté MusicStream
                </p>
              </div>

              {/* Barre de recherche d'artistes */}
              <div style={styles.filtersContainer}>
                <div style={styles.searchContainer}>
                  <div style={styles.searchIcon}>🔍</div>
                  <input
                    type="text"
                    value={searchArtistQuery}
                    onChange={(e) => setSearchArtistQuery(e.target.value)}
                    placeholder="Rechercher un utilisateur ou artiste..."
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Mon profil d'artiste */}
              {userProfile && (
                <div style={styles.myProfileSection}>
                  <h3 style={styles.subsectionTitle}>
                    <span style={styles.subsectionIcon}>👤</span>
                    Mon Profil
                  </h3>
                  <div style={styles.myProfileCard}>
                    <div style={styles.artistHeader}>
                      <div style={styles.artistAvatar}>
                        <img 
                          src={userProfile.avatar} 
                          alt={userProfile.name} 
                          style={styles.artistAvatarImage} 
                        />
                      </div>
                      <div style={styles.myProfileBadge}>
                        <span>🎤</span>
                        <span>C'est vous !</span>
                      </div>
                    </div>
                    
                    <div style={styles.artistInfo}>
                      <h4 style={styles.artistName}>{userProfile.artistName || userProfile.name}</h4>
                      <p style={styles.artistGenre}>{userProfile.genre || "Utilisateur"}</p>
                      {userProfile.bio && (
                        <p style={styles.artistBio}>{userProfile.bio}</p>
                      )}
                      {userProfile.location && (
                        <p style={styles.artistLocation}>
                          <span>📍</span>
                          <span>{userProfile.location}</span>
                        </p>
                      )}
                    </div>

                    <div style={styles.artistStats}>
                      <div style={styles.artistStat}>
                        <span style={styles.artistStatValue}>
                          {tracks.filter(track => track.uploadedBy === user.$id).length}
                        </span>
                        <span style={styles.artistStatLabel}>Titres</span>
                      </div>
                      <div style={styles.artistStat}>
                        <span style={styles.artistStatValue}>
                          {artists.find(artist => artist.userId === user.$id)?.followersCount || 0}
                        </span>
                        <span style={styles.artistStatLabel}>Abonnés</span>
                      </div>
                      <div style={styles.artistStat}>
                        <span style={styles.artistStatValue}>
                          {tracks
                            .filter(track => track.uploadedBy === user.$id)
                            .reduce((sum, track) => sum + (track.playsCount || 0), 0)
                          }
                        </span>
                        <span style={styles.artistStatLabel}>Lectures</span>
                      </div>
                    </div>

                    {/* Liens sociaux */}
                    {userProfile.socialLinks && Object.values(userProfile.socialLinks).some(link => link) && (
                      <div style={styles.artistSocial}>
                        {userProfile.socialLinks.spotify && (
                          <a href={userProfile.socialLinks.spotify} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                            🎵
                          </a>
                        )}
                        {userProfile.socialLinks.instagram && (
                          <a href={userProfile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                            📷
                          </a>
                        )}
                        {userProfile.socialLinks.twitter && (
                          <a href={userProfile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                            🐦
                          </a>
                        )}
                        {userProfile.socialLinks.youtube && (
                          <a href={userProfile.socialLinks.youtube} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                            📺
                          </a>
                        )}
                      </div>
                    )}

                    <div style={styles.artistActions}>
                      <button
                        onClick={() => setShowProfileModal(true)}
                        style={styles.editProfileButton}
                      >
                        <span>✏️</span>
                        <span>Modifier mon profil</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Mes abonnements */}
              {subscriptions.length > 0 && (
                <div style={styles.subscriptionsSection}>
                  <h3 style={styles.subsectionTitle}>
                    <span style={styles.subsectionIcon}>⭐</span>
                    Mes Abonnements ({subscriptions.length})
                  </h3>
                  <div style={styles.artistsGrid}>
                    {artists
                      .filter(artist => isSubscribedToArtist(artist.userId) && artist.userId !== user.$id)
                      .map((artist) => (
                        <div key={artist.$id} style={styles.artistCard} className="artist-card">
                          <div style={styles.artistHeader}>
                            <div style={styles.artistAvatar}>
                              <img src={artist.avatar} alt={artist.name} style={styles.artistAvatarImage} />
                            </div>
                            <div style={styles.subscribedBadge}>
                              <span>⭐</span>
                              <span>Suivi</span>
                            </div>
                          </div>
                          
                          <div style={styles.artistInfo}>
                            <h4 style={styles.artistName}>{artist.artistName || artist.name}</h4>
                            <p style={styles.artistGenre}>{artist.genre || "Utilisateur"}</p>
                            {artist.bio && (
                              <p style={styles.artistBio}>{artist.bio}</p>
                            )}
                            {artist.location && (
                              <p style={styles.artistLocation}>
                                <span>📍</span>
                                <span>{artist.location}</span>
                              </p>
                            )}
                          </div>

                          <div style={styles.artistStats}>
                            <div style={styles.artistStat}>
                              <span style={styles.artistStatValue}>{artist.tracksCount}</span>
                              <span style={styles.artistStatLabel}>Titres</span>
                            </div>
                            <div style={styles.artistStat}>
                              <span style={styles.artistStatValue}>{artist.followersCount}</span>
                              <span style={styles.artistStatLabel}>Abonnés</span>
                            </div>
                            <div style={styles.artistStat}>
                              <span style={styles.artistStatValue}>{artist.totalPlays}</span>
                              <span style={styles.artistStatLabel}>Lectures</span>
                            </div>
                          </div>

                          {/* Liens sociaux */}
                          {artist.socialLinks && Object.values(artist.socialLinks).some(link => link) && (
                            <div style={styles.artistSocial}>
                              {artist.socialLinks.spotify && (
                                <a href={artist.socialLinks.spotify} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                                  🎵
                                </a>
                              )}
                              {artist.socialLinks.instagram && (
                                <a href={artist.socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                                  📷
                                </a>
                              )}
                              {artist.socialLinks.twitter && (
                                <a href={artist.socialLinks.twitter} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                                  🐦
                                </a>
                              )}
                              {artist.socialLinks.youtube && (
                                <a href={artist.socialLinks.youtube} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                                  📺
                                </a>
                              )}
                            </div>
                          )}

                          <div style={styles.artistActions}>
                            <button
                              onClick={() => unsubscribeFromArtist(artist.userId)}
                              style={styles.unsubscribeButton}
                            >
                              <span>❌</span>
                              <span>Ne plus suivre</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 🔥 TOUS LES UTILISATEURS DE LA COMMUNAUTÉ */}
              <div style={styles.allArtistsSection}>
                <h3 style={styles.subsectionTitle}>
                  <span style={styles.subsectionIcon}>👥</span>
                  Tous les Utilisateurs de la Communauté ({artists.length})
                </h3>
                
                {loading ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>⏳</div>
                    <h3 style={styles.emptyTitle}>Chargement...</h3>
                    <p style={styles.emptySubtitle}>Récupération des utilisateurs en cours</p>
                  </div>
                ) : artists.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>👥</div>
                    <h3 style={styles.emptyTitle}>
                      {searchArtistQuery ? "Aucun utilisateur trouvé" : "Aucun utilisateur disponible"}
                    </h3>
                    <p style={styles.emptySubtitle}>
                      {searchArtistQuery 
                        ? "Essayez de modifier votre recherche" 
                        : "Les utilisateurs apparaîtront ici une fois inscrits"
                      }
                    </p>
                  </div>
                ) : (
                  <div style={styles.artistsGrid}>
                    {artists.map((artist) => (
                      <div key={artist.$id} style={styles.artistCard} className="artist-card">
                        <div style={styles.artistHeader}>
                          <div style={styles.artistAvatar}>
                            <img src={artist.avatar} alt={artist.name} style={styles.artistAvatarImage} />
                          </div>
                          {artist.userId === user.$id ? (
                            <div style={styles.myProfileBadge}>
                              <span>🎤</span>
                              <span>Vous</span>
                            </div>
                          ) : isSubscribedToArtist(artist.userId) ? (
                            <div style={styles.subscribedBadge}>
                              <span>⭐</span>
                              <span>Suivi</span>
                            </div>
                          ) : null}
                        </div>
                        
                        <div style={styles.artistInfo}>
                          <h4 style={styles.artistName}>{artist.artistName || artist.name}</h4>
                          <p style={styles.artistGenre}>{artist.genre || "Utilisateur"}</p>
                          {artist.bio && (
                            <p style={styles.artistBio}>{artist.bio}</p>
                          )}
                          {artist.location && (
                            <p style={styles.artistLocation}>
                              <span>📍</span>
                              <span>{artist.location}</span>
                            </p>
                          )}
                          <p style={styles.artistJoinDate}>
                            <span>📅</span>
                            <span>Inscrit le {new Date(artist.joinedAt || artist.$createdAt).toLocaleDateString('fr-FR')}</span>
                          </p>
                        </div>

                        <div style={styles.artistStats}>
                          <div style={styles.artistStat}>
                            <span style={styles.artistStatValue}>{artist.tracksCount}</span>
                            <span style={styles.artistStatLabel}>Titres</span>
                          </div>
                          <div style={styles.artistStat}>
                            <span style={styles.artistStatValue}>{artist.followersCount}</span>
                            <span style={styles.artistStatLabel}>Abonnés</span>
                          </div>
                          <div style={styles.artistStat}>
                            <span style={styles.artistStatValue}>{artist.totalPlays}</span>
                            <span style={styles.artistStatLabel}>Lectures</span>
                          </div>
                        </div>

                        {/* Liens sociaux */}
                        {artist.socialLinks && Object.values(artist.socialLinks).some(link => link) && (
                          <div style={styles.artistSocial}>
                            {artist.socialLinks.spotify && (
                              <a href={artist.socialLinks.spotify} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                                🎵
                              </a>
                            )}
                            {artist.socialLinks.instagram && (
                              <a href={artist.socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                                📷
                              </a>
                            )}
                            {artist.socialLinks.twitter && (
                              <a href={artist.socialLinks.twitter} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                                🐦
                              </a>
                            )}
                            {artist.socialLinks.youtube && (
                              <a href={artist.socialLinks.youtube} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                                📺
                              </a>
                            )}
                          </div>
                        )}

                        <div style={styles.artistActions}>
                          {artist.userId === user.$id ? (
                            <button
                              onClick={() => setShowProfileModal(true)}
                              style={styles.editProfileButton}
                            >
                              <span>✏️</span>
                              <span>Modifier mon profil</span>
                            </button>
                          ) : isSubscribedToArtist(artist.userId) ? (
                            <button
                              onClick={() => unsubscribeFromArtist(artist.userId)}
                              style={{
                                ...styles.unsubscribeButton,
                                background: 'rgba(239, 68, 68, 0.2)',
                                borderColor: 'rgba(239, 68, 68, 0.5)',
                                color: '#ef4444'
                              }}
                            >
                              <span>❌</span>
                              <span>Ne plus suivre</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => subscribeToArtist(artist.userId)}
                              style={{
                                ...styles.subscribeButton,
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                border: 'none',
                                color: 'white'
                              }}
                            >
                              <span>⭐</span>
                              <span>Suivre</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 🔥 NOUVELLE SECTION : Abonnements (Musiques des artistes suivis) */}
          {activeTab === "following" && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  Mes Abonnements
                </h2>
                <p style={styles.sectionSubtitle}>
                  Découvrez les dernières publications des artistes que vous suivez
                </p>
              </div>

              {subscriptions.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>⭐</div>
                  <h3 style={styles.emptyTitle}>Vous ne suivez aucun artiste</h3>
                  <p style={styles.emptySubtitle}>
                    Commencez par suivre des artistes pour voir leurs publications ici
                  </p>
                  <button 
                    onClick={() => scrollToSection("artists")}
                    style={styles.primaryButton}
                  >
                    🔍 Découvrir des artistes
                  </button>
                </div>
              ) : followedTracks.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>🎵</div>
                  <h3 style={styles.emptyTitle}>Aucune publication récente</h3>
                  <p style={styles.emptySubtitle}>
                    Les artistes que vous suivez n'ont pas encore publié de musique
                  </p>
                </div>
              ) : (
                <div style={styles.tracksGrid}>
                  {followedTracks
                    .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
                    .map((track) => {
                      const trackArtist = artists.find(artist => artist.userId === track.uploadedBy);
                      return (
                        <div 
                          key={track.$id} 
                          style={{
                            ...styles.trackCard,
                            ...(currentTrack?.$id === track.$id ? styles.trackCardActive : {})
                          }}
                          className="track-card"
                        >
                          {/* Image de couverture */}
                          <div style={styles.trackCover}>
                            {track.coverImage ? (
                              <img 
                                src={track.coverImage} 
                                alt="Cover" 
                                style={styles.coverImage}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div style={{
                              ...styles.coverPlaceholder,
                              display: track.coverImage ? 'none' : 'flex'
                            }}>
                              🎵
                            </div>
                            
                            {/* Overlay avec bouton play */}
                            <div style={styles.coverOverlay} className="cover-overlay">
                              <button
                                onClick={() => playTrack(track)}
                                style={styles.playButton}
                                className="play-button"
                              >
                                {currentTrack?.$id === track.$id && isPlaying ? "⏸️" : "▶️"}
                              </button>
                            </div>

                            {/* Badge artiste suivi */}
                            <div style={styles.followedBadge}>
                              <span>⭐</span>
                              <span>Suivi</span>
                            </div>

                            {/* Badges */}
                            {currentTrack?.$id === track.$id && isPlaying && (
                              <div style={styles.playingBadge}>
                                <div style={styles.playingIndicator}></div>
                                En cours
                              </div>
                            )}

                            {track.isExplicit && (
                              <div style={styles.explicitBadge}>
                                🔞 Explicite
                              </div>
                            )}
                          </div>

                          {/* Informations */}
                          <div style={styles.trackInfo}>
                            <div>
                              <h3 style={styles.trackTitle}>
                                {track.title}
                              </h3>
                              <p style={styles.trackArtist}>{track.artist}</p>
                              {trackArtist && (
                                <p style={styles.trackUploader}>
                                  <span>👤</span>
                                  <span>Par {trackArtist.artistName || trackArtist.name}</span>
                                </p>
                              )}
                            </div>

                            {/* Métadonnées */}
                            <div style={styles.trackMeta}>
                              {track.album && (
                                <span style={styles.metaBadge}>
                                  📀 {track.album}
                                </span>
                              )}
                              {track.genre && (
                                <span style={styles.metaBadge}>
                                  🎼 {track.genre}
                                </span>
                              )}
                              {track.year && (
                                <span style={styles.metaBadge}>
                                  📅 {track.year}
                                </span>
                              )}
                              <span style={styles.metaBadge}>
                                🕒 {new Date(track.$createdAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>

                            {/* Statistiques */}
                            <div style={styles.trackStats}>
                              <div style={styles.statsLeft}>
                                {track.playsCount > 0 && (
                                  <span style={styles.statItem}>
                                    <span>▶️</span>
                                    <span>{track.playsCount}</span>
                                  </span>
                                )}
                                {track.likesCount > 0 && (
                                  <span style={styles.statItem}>
                                    <span>❤️</span>
                                    <span>{track.likesCount}</span>
                                  </span>
                                )}
                              </div>
                              <span style={styles.trackDuration}>{formatTime(track.duration)}</span>
                            </div>

                            {/* Actions */}
                            <div style={styles.trackActions}>
                              <button
                                onClick={() => toggleLike(track)}
                                style={styles.actionButton}
                              >
                                <span>❤️</span>
                                <span style={styles.actionLabel}>J'aime</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Section Stats */}
          {activeTab === "stats" && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  Statistiques
                </h2>
                <p style={styles.sectionSubtitle}>
                  Analysez vos performances musicales
                </p>
              </div>

              <div style={styles.statsContainer}>
                <div style={styles.statsCard}>
                  <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                      <div style={styles.statIcon}>🎵</div>
                      <div style={styles.statValue}>{tracks.filter(track => track.uploadedBy === user.$id).length}</div>
                      <div style={styles.statLabel}>Mes Musiques</div>
                    </div>
                    
                    <div style={styles.statCard}>
                      <div style={styles.statIcon}>▶️</div>
                      <div style={styles.statValue}>
                        {tracks
                          .filter(track => track.uploadedBy === user.$id)
                          .reduce((sum, track) => sum + (track.playsCount || 0), 0)
                        }
                      </div>
                      <div style={styles.statLabel}>Mes Lectures</div>
                    </div>
                    
                    <div style={styles.statCard}>
                      <div style={styles.statIcon}>❤️</div>
                      <div style={styles.statValue}>
                        {tracks
                          .filter(track => track.uploadedBy === user.$id)
                          .reduce((sum, track) => sum + (track.likesCount || 0), 0)
                        }
                      </div>
                      <div style={styles.statLabel}>Mes Likes</div>
                    </div>
                    
                    <div style={styles.statCard}>
                      <div style={styles.statIcon}>⭐</div>
                      <div style={styles.statValue}>{subscriptions.length}</div>
                      <div style={styles.statLabel}>Abonnements</div>
                    </div>
                  </div>

                  {/* Top tracks personnelles */}
                  {tracks.filter(track => track.uploadedBy === user.$id).length > 0 && (
                    <div style={styles.topTracksSection}>
                      <h3 style={styles.topTracksTitle}>
                        <span style={styles.topTracksIcon}>🏆</span>
                        Mes Top Musiques
                      </h3>
                      <div style={styles.topTracksList}>
                        {tracks
                          .filter(track => track.uploadedBy === user.$id)
                          .sort((a, b) => (b.playsCount || 0) - (a.playsCount || 0))
                          .slice(0, 5)
                          .map((track, index) => (
                            <div 
                              key={track.$id} 
                              style={styles.topTrackItem}
                              className="top-track-item"
                              onClick={() => playTrack(track)}
                            >
                              <div style={styles.topTrackRank}>
                                <div style={{
                                  ...styles.rankBadge,
                                  background: index === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                                            index === 1 ? 'linear-gradient(135deg, #d1d5db, #9ca3af)' :
                                            index === 2 ? 'linear-gradient(135deg, #d97706, #92400e)' :
                                            'linear-gradient(135deg, #10b981, #059669)'
                                }}>
                                  {index + 1}
                                </div>
                              </div>
                              
                              <div style={styles.topTrackCover}>
                                {track.coverImage ? (
                                  <img src={track.coverImage} alt="Cover" style={styles.topTrackImage} />
                                ) : (
                                  <div style={styles.topTrackPlaceholder}>🎵</div>
                                )}
                              </div>
                              
                              <div style={styles.topTrackInfo}>
                                <div style={styles.topTrackTitle}>{track.title}</div>
                                <div style={styles.topTrackArtist}>{track.artist}</div>
                                {track.album && (
                                  <div style={styles.topTrackAlbum}>📀 {track.album}</div>
                                )}
                              </div>
                              
                              <div style={styles.topTrackStats}>
                                <div style={styles.topTrackPlays}>
                                  {track.playsCount || 0}
                                </div>
                                <div style={styles.topTrackPlaysLabel}>lectures</div>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playTrack(track);
                                }}
                                style={styles.topTrackPlayButton}
                                className="top-track-play-button"
                              >
                                {currentTrack?.$id === track.$id && isPlaying ? "⏸️" : "▶️"}
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de profil */}
      {showProfileModal && (
        <div style={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <span style={styles.modalIcon}>👤</span>
                Modifier mon profil
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                style={styles.modalCloseButton}
              >
                ✕
              </button>
            </div>

            <form onSubmit={updateProfile} style={styles.profileForm}>
              {/* Photo de profil */}
              <div style={styles.profileImageSection}>
                <div style={styles.currentProfileImage}>
                  <img 
                    src={user.prefs?.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=10b981&color=fff`}
                    alt="Avatar actuel"
                    style={styles.currentAvatar}
                  />
                </div>
                <div style={styles.profileImageUpload}>
                  <label style={styles.profileImageLabel}>
                    📷 Changer la photo de profil
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfileImage(e.target.files[0])}
                      style={styles.hiddenFileInput}
                      disabled={profileLoading}
                    />
                  </label>
                  {profileImage && (
                    <div style={styles.newImagePreview}>
                      <span style={styles.fileIcon}>✅</span>
                      <span style={styles.fileName}>{profileImage.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations d'artiste */}
              <div style={styles.profileSection}>
                <h3 style={styles.profileSectionTitle}>
                  <span style={styles.profileSectionIcon}>🎤</span>
                  Informations d'artiste
                </h3>
                <div style={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    name="isArtist"
                    checked={profileData.isArtist}
                    onChange={handleProfileInputChange}
                    style={styles.checkbox}
                    disabled={profileLoading}
                  />
                  <label style={styles.checkboxLabel}>
                    🎵 Je suis un artiste/musicien
                  </label>
                </div>
                
                {profileData.isArtist && (
                  <div style={styles.profileGrid}>
                    <div style={styles.formField}>
                      <label style={styles.label}>Nom d'artiste</label>
                      <input
                        type="text"
                        name="artistName"
                        value={profileData.artistName}
                        onChange={handleProfileInputChange}
                        placeholder="Votre nom d'artiste"
                        style={styles.input}
                        disabled={profileLoading}
                      />
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.label}>Genre musical principal</label>
                      <select
                        name="genre"
                        value={profileData.genre}
                        onChange={handleProfileInputChange}
                        style={styles.select}
                        disabled={profileLoading}
                      >
                        <option value="">Sélectionner un genre</option>
                        {genres.map(genre => (
                          <option key={genre} value={genre}>{genre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Informations de base */}
              <div style={styles.profileSection}>
                <h3 style={styles.profileSectionTitle}>
                  <span style={styles.profileSectionIcon}>📝</span>
                  Informations de base
                </h3>
                <div style={styles.profileGrid}>
                  <div style={styles.formField}>
                    <label style={styles.label}>Nom complet</label>
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileInputChange}
                      placeholder="Votre nom complet"
                      style={styles.input}
                      disabled={profileLoading}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.label}>Localisation</label>
                    <input
                      type="text"
                      name="location"
                      value={profileData.location}
                      onChange={handleProfileInputChange}
                      placeholder="Ville, Pays"
                      style={styles.input}
                      disabled={profileLoading}
                    />
                  </div>
                </div>
                
                <div style={styles.formField}>
                  <label style={styles.label}>Biographie</label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileInputChange}
                    placeholder="Parlez-nous de vous, votre musique, votre parcours..."
                    rows="4"
                    style={styles.textarea}
                    disabled={profileLoading}
                  />
                </div>
                
                <div style={styles.formField}>
                  <label style={styles.label}>Site web</label>
                  <input
                    type="url"
                    name="website"
                    value={profileData.website}
                    onChange={handleProfileInputChange}
                    placeholder="https://votre-site.com"
                    style={styles.input}
                    disabled={profileLoading}
                  />
                </div>
              </div>

              {/* Réseaux sociaux */}
              <div style={styles.profileSection}>
                <h3 style={styles.profileSectionTitle}>
                  <span style={styles.profileSectionIcon}>🌐</span>
                  Réseaux sociaux
                </h3>
                <div style={styles.socialGrid}>
                  <div style={styles.formField}>
                    <label style={styles.label}>🎵 Spotify</label>
                    <input
                      type="url"
                      name="social.spotify"
                      value={profileData.socialLinks.spotify}
                      onChange={handleProfileInputChange}
                      placeholder="https://open.spotify.com/artist/..."
                      style={styles.input}
                      disabled={profileLoading}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.label}>📷 Instagram</label>
                    <input
                      type="url"
                      name="social.instagram"
                      value={profileData.socialLinks.instagram}
                      onChange={handleProfileInputChange}
                      placeholder="https://instagram.com/..."
                      style={styles.input}
                      disabled={profileLoading}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.label}>🐦 Twitter</label>
                    <input
                      type="url"
                      name="social.twitter"
                      value={profileData.socialLinks.twitter}
                      onChange={handleProfileInputChange}
                      placeholder="https://twitter.com/..."
                      style={styles.input}
                      disabled={profileLoading}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.label}>📺 YouTube</label>
                    <input
                      type="url"
                      name="social.youtube"
                      value={profileData.socialLinks.youtube}
                      onChange={handleProfileInputChange}
                      placeholder="https://youtube.com/..."
                      style={styles.input}
                      disabled={profileLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div style={styles.profileActions}>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  style={styles.cancelButton}
                  disabled={profileLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.saveButton,
                    ...(profileLoading ? styles.saveButtonDisabled : {})
                  }}
                  disabled={profileLoading}
                >
                  {profileLoading ? (
                    <span style={styles.loadingContent}>
                      <div style={styles.loadingSpinner}></div>
                      Sauvegarde...
                    </span>
                  ) : (
                    "💾 Sauvegarder"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lecteur audio fixe moderne */}
      {currentTrack && (
        <div style={styles.audioPlayer}>
          <div style={styles.playerContent}>
            {/* Informations de la piste */}
            <div style={styles.playerTrackInfo}>
              <div style={styles.playerCover}>
                {currentTrack.coverImage ? (
                  <img 
                    src={currentTrack.coverImage} 
                    alt="Cover" 
                    style={styles.playerCoverImage}
                  />
                ) : (
                  <div style={styles.playerCoverPlaceholder}>🎵</div>
                )}
              </div>
              <div style={styles.playerInfo}>
                <div style={styles.playerTitle}>{currentTrack.title}</div>
                <div style={styles.playerArtist}>{currentTrack.artist}</div>
              </div>
            </div>

            {/* Contrôles principaux */}
            <div style={styles.playerControls}>
              <div style={styles.playerButtons}>
                <button
                  onClick={() => setIsShuffled(!isShuffled)}
                  style={{
                    ...styles.playerButton,
                    ...(isShuffled ? styles.playerButtonActive : {})
                  }}
                >
                  🔀
                </button>
                <button
                  onClick={previousTrack}
                  style={styles.playerButton}
                >
                  ⏮️
                </button>
                <button
                  onClick={() => isPlaying ? pauseTrack() : playTrack(currentTrack)}
                  style={styles.playerPlayButton}
                >
                  {isPlaying ? "⏸️" : "▶️"}
                </button>
                <button
                  onClick={nextTrack}
                  style={styles.playerButton}
                >
                  ⏭️
                </button>
                <button
                  onClick={() => {
                    const modes = ["none", "one", "all"];
                    const currentIndex = modes.indexOf(repeatMode);
                    const nextMode = modes[(currentIndex + 1) % modes.length];
                    setRepeatMode(nextMode);
                  }}
                  style={{
                    ...styles.playerButton,
                    ...(repeatMode !== "none" ? styles.playerButtonActive : {})
                  }}
                >
                  {repeatMode === "one" ? "🔂" : "🔁"}
                </button>
              </div>

              {/* Barre de progression */}
              <div style={styles.progressContainer}>
                <span style={styles.timeLabel}>{formatTime(currentTime)}</span>
                <div 
                  style={styles.progressBar}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    const newTime = percent * duration;
                    seekToTime(newTime);
                  }}
                >
                  <div 
                    style={{
                      ...styles.progressFill,
                      width: duration ? `${(currentTime / duration) * 100}%` : '0%'
                    }}
                  />
                  <div 
                    style={{
                      ...styles.progressHandle,
                      left: duration ? `${(currentTime / duration) * 100}%` : '0%'
                    }}
                  />
                </div>
                <span style={styles.timeLabel}>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Contrôles secondaires */}
            <div style={styles.playerSecondary}>
              <button
                onClick={() => toggleLike(currentTrack)}
                style={styles.playerButton}
              >
                ❤️
              </button>
              
              {/* Contrôle du volume */}
              <div style={styles.volumeContainer}>
                <button
                  onClick={() => setVolume(volume === 0 ? 1 : 0)}
                  style={styles.playerButton}
                >
                  {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value);
                    setVolume(newVolume);
                    if (audioRef.current) {
                      audioRef.current.volume = newVolume;
                    }
                  }}
                  style={styles.volumeSlider}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles CSS-in-JS complets
const styles = {
  // Container principal
  appContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    color: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: 'relative',
    overflow: 'hidden'
  },

  // Login
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    position: 'relative',
    overflow: 'hidden'
  },

  particles: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 1
  },

  particle: {
    position: 'absolute',
    width: '4px',
    height: '4px',
    background: 'rgba(16, 185, 129, 0.6)',
    borderRadius: '50%',
    animation: 'float 6s ease-in-out infinite'
  },

  loginContent: {
    textAlign: 'center',
    zIndex: 2,
    position: 'relative',
    maxWidth: '400px',
    padding: '2rem'
  },

  loginHeader: {
    position: 'relative',
    marginBottom: '2rem'
  },

  loginIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    display: 'block',
    position: 'relative',
    zIndex: 2
  },

  loginGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '120px',
    height: '120px',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
    borderRadius: '50%',
    filter: 'blur(20px)',
    zIndex: 1
  },

  loginTitle: {
    fontSize: '3rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #10b981, #34d399)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '1rem'
  },

  loginSubtitle: {
    fontSize: '1.1rem',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '3rem',
    lineHeight: '1.6'
  },

  loginButton: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '12px',
    padding: '1rem 2rem',
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    width: '100%'
  },

  loginButtonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem'
  },

  googleIcon: {
    width: '20px',
    height: '20px'
  },

  // Header
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    zIndex: 1000,
    transition: 'all 0.3s ease'
  },

  headerScrolled: {
    background: 'rgba(15, 23, 42, 0.95)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
  },

  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    maxWidth: '1400px',
    margin: '0 auto'
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },

  headerIcon: {
    fontSize: '2rem',
    background: 'linear-gradient(135deg, #10b981, #34d399)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },

  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #10b981, #34d399)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0
  },

  navigation: {
    display: 'flex',
    gap: '0.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '0.5rem'
  },

  navButton: {
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: 'rgb(148, 163, 184)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    position: 'relative'
  },

  navButtonActive: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  },

  navButtonLabel: {
    fontSize: '0.9rem'
  },

  navButtonBadge: {
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    padding: '0.2rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    minWidth: '20px',
    textAlign: 'center'
  },

  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },

  userInfo: {
    textAlign: 'right'
  },

  userWelcome: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: 0
  },

  userName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'white',
    margin: 0
  },

  avatarContainer: {
    position: 'relative'
  },

  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '2px solid rgba(16, 185, 129, 0.5)',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },

  avatarStatus: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    width: '12px',
    height: '12px',
    background: '#10b981',
    borderRadius: '50%',
    border: '2px solid #0f172a'
  },

  logoutButton: {
    background: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '500'
  },

  // Navigation mobile
  mobileNav: {
    position: 'fixed',
    top: '80px',
    left: 0,
    right: 0,
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    zIndex: 999,
    padding: '1rem'
  },

  mobileNavContent: {
    display: 'flex',
    justifyContent: 'space-around',
    maxWidth: '600px',
    margin: '0 auto'
  },

  mobileNavButton: {
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem',
    color: 'rgb(148, 163, 184)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.8rem',
    fontWeight: '500',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    position: 'relative',
    minWidth: '60px'
  },

  mobileNavButtonActive: {
    color: '#10b981'
  },

  mobileNavBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    background: '#ef4444',
    borderRadius: '10px',
    padding: '0.1rem 0.3rem',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    minWidth: '16px',
    textAlign: 'center'
  },

  // Contenu principal
  mainContent: {
    paddingTop: '6rem',
    paddingBottom: '3rem',
    minHeight: '100vh',
    overflowY: 'auto',
    overflowX: 'hidden'
  },

  contentContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 2rem'
  },

  // Sections
  section: {
    marginBottom: '4rem'
  },

  sectionHeader: {
    textAlign: 'center',
    marginBottom: '3rem'
  },

  sectionTitle: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #10b981, #34d399)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '1rem'
  },

  sectionSubtitle: {
    fontSize: '1.1rem',
    color: 'rgba(255, 255, 255, 0.7)',
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: '1.6'
  },

  // Filtres
  filtersContainer: {
    marginBottom: '2rem'
  },

  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    alignItems: 'end'
  },

  searchContainer: {
    position: 'relative',
    gridColumn: 'span 2'
  },

  searchIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.2rem',
    color: 'rgba(255, 255, 255, 0.5)',
    zIndex: 2
  },

  // Formulaires
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    paddingLeft: '3rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    outline: 'none'
  },

  select: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    cursor: 'pointer'
  },

  textarea: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit'
  },

  resetButton: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },

  // États vides
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },

  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    opacity: 0.5
  },

  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '0.5rem'
  },

  emptySubtitle: {
    fontSize: '1rem',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: '2rem',
    lineHeight: '1.6'
  },

  primaryButton: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  },

  // Grilles de cartes
  tracksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem'
  },

  artistsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem'
  },

  // Cartes de musique
  trackCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative'
  },

  trackCardActive: {
    border: '1px solid rgba(16, 185, 129, 0.5)',
    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)'
  },

  trackCover: {
    position: 'relative',
    width: '100%',
    height: '200px',
    overflow: 'hidden'
  },

  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease'
  },

  coverPlaceholder: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #374151, #4b5563)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
    color: 'rgba(255, 255, 255, 0.3)'
  },

  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },

  playButton: {
    background: 'rgba(16, 185, 129, 0.9)',
    border: 'none',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
  },

  playingBadge: {
    position: 'absolute',
    top: '0.75rem',
    left: '0.75rem',
    background: 'rgba(16, 185, 129, 0.9)',
    borderRadius: '20px',
    padding: '0.25rem 0.75rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },

  playingIndicator: {
    width: '8px',
    height: '8px',
    background: 'white',
    borderRadius: '50%',
    animation: 'pulse 1.5s ease-in-out infinite'
  },

  explicitBadge: {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    background: 'rgba(239, 68, 68, 0.9)',
    borderRadius: '4px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: 'white'
  },

  followedBadge: {
    position: 'absolute',
    bottom: '0.75rem',
    left: '0.75rem',
    background: 'rgba(251, 191, 36, 0.9)',
    borderRadius: '20px',
    padding: '0.25rem 0.75rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },

  trackInfo: {
    padding: '1.5rem'
  },

  trackTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '0.5rem',
    lineHeight: '1.3'
  },

  trackArtist: {
    fontSize: '1rem',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '1rem'
  },

  trackUploader: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },

  trackMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '1rem'
  },

  metaBadge: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '0.25rem 0.75rem',
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.8)',
    whiteSpace: 'nowrap'
  },

  trackStats: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },

  statsLeft: {
    display: 'flex',
    gap: '1rem'
  },

  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.6)'
  },

  trackDuration: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500'
  },

  trackActions: {
    display: 'flex',
    gap: '0.5rem'
  },

  actionButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    color: 'rgba(255, 255, 255, 0.8)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    justifyContent: 'center'
  },

  actionLabel: {
    fontSize: '0.8rem'
  },

  deleteButton: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    justifyContent: 'center'
  },

  // Cartes d'artistes
  artistCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '1.5rem',
    transition: 'all 0.3s ease',
    position: 'relative'
  },

  artistHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '1rem'
  },

  artistAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid rgba(16, 185, 129, 0.3)'
  },

  artistAvatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },

  myProfileBadge: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    borderRadius: '20px',
    padding: '0.25rem 0.75rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },

  subscribedBadge: {
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    borderRadius: '20px',
    padding: '0.25rem 0.75rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },

  artistInfo: {
    marginBottom: '1.5rem'
  },

  artistName: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '0.5rem'
  },

  artistGenre: {
    fontSize: '1rem',
    color: 'rgba(16, 185, 129, 0.8)',
    marginBottom: '0.75rem',
    fontWeight: '500'
  },

  artistBio: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: '1.5',
    marginBottom: '0.75rem'
  },

  artistLocation: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.6)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem'
  },

  artistJoinDate: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.5)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },

  artistStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem'
  },

  artistStat: {
    textAlign: 'center'
  },

  artistStatValue: {
    display: 'block',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '0.25rem'
  },

  artistStatLabel: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  artistSocial: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    justifyContent: 'center'
  },

  socialLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    color: 'rgba(255, 255, 255, 0.7)',
    textDecoration: 'none',
    fontSize: '1.2rem',
    transition: 'all 0.3s ease'
  },

  artistActions: {
    display: 'flex',
    gap: '0.75rem'
  },

  subscribeButton: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    justifyContent: 'center'
  },

  unsubscribeButton: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    justifyContent: 'center'
  },

  editProfileButton: {
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#3b82f6',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    justifyContent: 'center'
  },

  // Sections spéciales
  myProfileSection: {
    marginBottom: '3rem'
  },

  subscriptionsSection: {
    marginBottom: '3rem'
  },

  allArtistsSection: {
    marginBottom: '3rem'
  },

  subsectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },

  subsectionIcon: {
    fontSize: '1.3rem'
  },

  myProfileCard: {
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.05))',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '2rem'
  },

  // Upload
  uploadContainer: {
    maxWidth: '800px',
    margin: '0 auto'
  },

  uploadForm: {
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '2rem'
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },

  progressContainer: {
    marginBottom: '1rem'
  },

  progressLabel: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '0.5rem',
    fontWeight: '500'
  },

  progressBar: {
    width: '100%',
    height: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer'
  },

  progressFill: {
    height: '100%',
    background: 'linear-gradient(135deg, #10b981, #34d399)',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },

  progressHandle: {
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '16px',
    height: '16px',
    background: 'white',
    borderRadius: '50%',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    transition: 'left 0.3s ease'
  },

  formSection: {
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '1.5rem'
  },

  formSectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },

  formSectionIcon: {
    fontSize: '1.1rem'
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem'
  },

  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem'
  },

  contentFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },

  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },

  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)'
  },

  smallLabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)'
  },

  smallInput: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: 'white',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    outline: 'none'
  },

  fileInput: {
    width: '100%',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px dashed rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },

  filePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '8px',
    marginTop: '0.5rem'
  },

  fileIcon: {
    fontSize: '1.2rem'
  },

  fileName: {
    fontSize: '0.9rem',
    color: 'white',
    fontWeight: '500',
    flex: 1
  },

  fileSize: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.6)'
  },

  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },

  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: '#10b981'
  },

  checkboxLabel: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.9)',
    cursor: 'pointer'
  },

  submitButton: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '12px',
    padding: '1rem 2rem',
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    alignSelf: 'center'
  },

  submitButtonDisabled: {
    background: 'rgba(107, 114, 128, 0.5)',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },

  loadingContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    justifyContent: 'center'
  },

  loadingSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  // Stats
  statsContainer: {
    maxWidth: '1000px',
    margin: '0 auto'
  },

  statsCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '2rem'
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem'
  },

  statCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '1.5rem',
    textAlign: 'center',
    transition: 'all 0.3s ease'
  },

  statIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
    display: 'block'
  },

  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '0.5rem'
  },

  statLabel: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  topTracksSection: {
    marginTop: '2rem'
  },

  topTracksTitle: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },

  topTracksIcon: {
    fontSize: '1.2rem'
  },

  topTracksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },

  topTrackItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },

  topTrackRank: {
    minWidth: '40px'
  },

  rankBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: 'white'
  },

  topTrackCover: {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    overflow: 'hidden'
  },

  topTrackImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },

  topTrackPlaceholder: {
    width: '100%',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    color: 'rgba(255, 255, 255, 0.5)'
  },

  topTrackInfo: {
    flex: 1,
    minWidth: 0
  },

  topTrackTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'white',
    marginBottom: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  topTrackArtist: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '0.25rem'
  },

  topTrackAlbum: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.5)'
  },

  topTrackStats: {
    textAlign: 'center',
    minWidth: '80px'
  },

  topTrackPlays: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#10b981'
  },

  topTrackPlaysLabel: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.6)'
  },

  topTrackPlayButton: {
    background: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid rgba(16, 185, 129, 0.5)',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    color: '#10b981',
    fontSize: '1.2rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '2rem'
  },

  modalContent: {
    background: 'linear-gradient(135deg, #1e293b, #334155)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto'
  },

  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.5rem 2rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },

  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },

  modalIcon: {
    fontSize: '1.3rem'
  },

  modalCloseButton: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '50%',
    transition: 'all 0.3s ease'
  },

  profileForm: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },

  profileImageSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    padding: '1.5rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },

  currentProfileImage: {
    flexShrink: 0
  },

  currentAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '3px solid rgba(16, 185, 129, 0.3)'
  },

  profileImageUpload: {
    flex: 1
  },

  profileImageLabel: {
    display: 'inline-block',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#3b82f6',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '500'
  },

  hiddenFileInput: {
    display: 'none'
  },

  newImagePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.75rem',
    padding: '0.75rem',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '8px'
  },

  profileSection: {
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '1.5rem'
  },

  profileSectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },

  profileSectionIcon: {
    fontSize: '1rem'
  },

  profileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem'
  },

  socialGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },

  profileActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  },

  cancelButton: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    color: 'rgba(255, 255, 255, 0.8)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '500'
  },

  saveButton: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  },

  saveButtonDisabled: {
    background: 'rgba(107, 114, 128, 0.5)',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },

  // Lecteur audio
  audioPlayer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    zIndex: 1000,
    padding: '1rem 2rem'
  },

  playerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    maxWidth: '1400px',
    margin: '0 auto'
  },

  playerTrackInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    minWidth: '250px',
    flex: '0 0 auto'
  },

  playerCover: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    overflow: 'hidden',
    flexShrink: 0
  },

  playerCoverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },

  playerCoverPlaceholder: {
    width: '100%',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    color: 'rgba(255, 255, 255, 0.5)'
  },

  playerInfo: {
    minWidth: 0,
    flex: 1
  },

  playerTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'white',
    marginBottom: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  playerArtist: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.7)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  playerControls: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem'
  },

  playerButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },

  playerButton: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '1.2rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: '0.5rem',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  playerButtonActive: {
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.1)'
  },

  playerPlayButton: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: '0.75rem',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  },

  timeLabel: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.6)',
    minWidth: '40px',
    textAlign: 'center'
  },

  playerSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    minWidth: '200px',
    flex: '0 0 auto',
    justifyContent: 'flex-end'
  },

  volumeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },

  volumeSlider: {
    width: '80px',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '2px',
    outline: 'none',
    cursor: 'pointer',
    accentColor: '#10b981'
  },

  // Animations et effets
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  },

  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 }
  },

  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-20px)' }
  },

  // Responsive
  '@media (max-width: 768px)': {
    headerContent: {
      padding: '1rem'
    },
    
    contentContainer: {
      padding: '0 1rem'
    },
    
    tracksGrid: {
      gridTemplateColumns: '1fr'
    },
    
    artistsGrid: {
      gridTemplateColumns: '1fr'
    },
    
    filtersGrid: {
      gridTemplateColumns: '1fr'
    },
    
    searchContainer: {
      gridColumn: 'span 1'
    },
    
    playerContent: {
      flexDirection: 'column',
      gap: '1rem',
      padding: '1rem'
    },
    
    playerTrackInfo: {
      minWidth: 'auto',
      width: '100%'
    },
    
    playerSecondary: {
      minWidth: 'auto',
      width: '100%',
      justifyContent: 'center'
    }
  }
};

// Ajout des styles CSS pour les animations et les hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  .track-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(16, 185, 129, 0.15);
  }
  
  .track-card:hover .cover-overlay {
    opacity: 1;
  }
  
  .track-card:hover .cover-image {
    transform: scale(1.05);
  }
  
  .artist-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(16, 185, 129, 0.15);
  }
  
  .top-track-item:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(4px);
  }
  
  .top-track-play-button:hover {
    background: rgba(16, 185, 129, 0.3);
    transform: scale(1.1);
  }
  
  input:focus, select:focus, textarea:focus {
    border-color: rgba(16, 185, 129, 0.5);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
  
  button:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  .social-link:hover {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    transform: scale(1.1);
  }
`;

document.head.appendChild(styleSheet);

export default SpotifyApp;

