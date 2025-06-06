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
const USERS_COLLECTION_ID = "users"; // Collection pour les profils utilisateurs
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
  
  // États pour les artistes et abonnements - MODIFIÉS
  const [artists, setArtists] = useState([]); // Tous les utilisateurs qui ont publié
  const [subscriptions, setSubscriptions] = useState([]);
  const [searchArtistQuery, setSearchArtistQuery] = useState("");
  const [userProfile, setUserProfile] = useState(null); // Profil utilisateur complet
  
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
    isArtist: true, // Nouveau champ
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

  // NOUVELLE FONCTION : Créer ou mettre à jour le profil utilisateur
  const createOrUpdateUserProfile = async (userData) => {
    try {
      // Vérifier si le profil existe déjà
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
        avatar: userData.prefs?.avatar || `https://ui-avatars.com/api/?name=${userData.name}&background=10b981&color=fff`,
        bio: userData.prefs?.bio || "",
        location: userData.prefs?.location || "",
        website: userData.prefs?.website || "",
        socialLinks: userData.prefs?.socialLinks || {
          instagram: "",
          twitter: "",
          youtube: "",
          spotify: ""
        },
        isArtist: userData.prefs?.isArtist !== false, // Par défaut true
        artistName: userData.prefs?.artistName || userData.name,
        genre: userData.prefs?.genre || "",
        tracksCount: 0,
        followersCount: 0,
        totalPlays: 0,
        joinedAt: new Date().toISOString()
      };

      if (existingProfile) {
        // Mettre à jour le profil existant
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
        // Créer un nouveau profil
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
      
      // Créer ou mettre à jour le profil utilisateur
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
      fetchArtists();
      fetchSubscriptions();
    } catch (err) {
      console.error("Erreur récupération utilisateur:", err);
      setUser(null);
    }
  };

  // Récupération des musiques avec filtres et tri améliorés
  const fetchTracks = async () => {
    try {
      const queries = [];
      
      if (searchQuery.trim()) {
        queries.push(Query.search("title", searchQuery));
      }
      
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
      
      setTracks(res.documents);
    } catch (err) {
      console.error("Erreur récupération musiques:", err);
      setTracks([]);
    }
  };

  // NOUVELLE FONCTION : Récupération des artistes (utilisateurs qui ont publié)
  const fetchArtists = async () => {
    try {
      const queries = [];
      
      if (searchArtistQuery.trim()) {
        queries.push(Query.search("name", searchArtistQuery));
      }
      
      // Récupérer tous les profils utilisateurs
      const res = await databases.listDocuments(
        DATABASE_ID, 
        USERS_COLLECTION_ID,
        [
          ...queries,
          Query.orderDesc("$createdAt"),
          Query.limit(100)
        ]
      );
      
      // Calculer les statistiques pour chaque artiste
      const artistsWithStats = await Promise.all(
        res.documents.map(async (artist) => {
          try {
            // Compter les musiques de cet artiste
            const tracksRes = await databases.listDocuments(
              DATABASE_ID,
              MUSIC_COLLECTION_ID,
              [
                Query.equal("uploadedBy", artist.userId),
                Query.limit(1000)
              ]
            );
            
            // Calculer le total des lectures
            const totalPlays = tracksRes.documents.reduce(
              (sum, track) => sum + (track.playsCount || 0), 0
            );
            
            // Compter les abonnés
            const followersRes = await databases.listDocuments(
              DATABASE_ID,
              SUBSCRIPTIONS_COLLECTION_ID,
              [
                Query.equal("artistId", artist.userId),
                Query.limit(1000)
              ]
            );
            
            return {
              ...artist,
              tracksCount: tracksRes.documents.length,
              totalPlays: totalPlays,
              followersCount: followersRes.documents.length,
              tracks: tracksRes.documents
            };
          } catch (err) {
            console.error(`Erreur stats pour ${artist.name}:`, err);
            return {
              ...artist,
              tracksCount: 0,
              totalPlays: 0,
              followersCount: 0,
              tracks: []
            };
          }
        })
      );
      
      // Filtrer pour ne montrer que les artistes qui ont publié au moins une musique
      // OU inclure l'utilisateur actuel même s'il n'a pas encore publié
      const filteredArtists = artistsWithStats.filter(artist => 
        artist.tracksCount > 0 || (user && artist.userId === user.$id)
      );
      
      setArtists(filteredArtists);
    } catch (err) {
      console.error("Erreur récupération artistes:", err);
      setArtists([]);
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
    } catch (err) {
      console.error("Erreur récupération abonnements:", err);
      setSubscriptions([]);
    }
  };

  // S'abonner à un artiste - MODIFIÉ
  const subscribeToArtist = async (artistUserId) => {
    if (!user) return;
    
    // Empêcher de s'abonner à soi-même
    if (artistUserId === user.$id) {
      alert("❌ Vous ne pouvez pas vous abonner à vous-même !");
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
      
      fetchSubscriptions();
      fetchArtists(); // Rafraîchir pour mettre à jour le compteur
      alert("✅ Abonnement réussi !");
    } catch (err) {
      console.error("Erreur abonnement:", err);
      alert("❌ Erreur lors de l'abonnement");
    }
  };

  // Se désabonner d'un artiste - MODIFIÉ
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
        
        fetchSubscriptions();
        fetchArtists(); // Rafraîchir pour mettre à jour le compteur
        alert("✅ Désabonnement réussi !");
      }
    } catch (err) {
      console.error("Erreur désabonnement:", err);
      alert("❌ Erreur lors du désabonnement");
    }
  };

  // Vérifier si l'utilisateur est abonné à un artiste - MODIFIÉ
  const isSubscribedToArtist = (artistUserId) => {
    return subscriptions.some(sub => sub.artistId === artistUserId);
  };

  // Mise à jour du profil - MODIFIÉE
  const updateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    
    try {
      let profileImageUrl = user.prefs?.avatar || "";
      
      // Upload de la nouvelle image de profil si sélectionnée
      if (profileImage) {
        const uploadedImage = await storage.createFile(
          BUCKET_ID, 
          ID.unique(), 
          profileImage
        );
        profileImageUrl = storage.getFileView(BUCKET_ID, uploadedImage.$id);
      }
      
      // Mise à jour des préférences utilisateur
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
      
      // Mise à jour du nom si changé
      if (profileData.name !== user.name) {
        await account.updateName(profileData.name);
      }
      
      // Rafraîchir les données utilisateur
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

  // Gestion du formulaire de profil - MODIFIÉE
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
      if (file.size > 50 * 1024 * 1024) { // 50MB max
        return { valid: false, error: "Le fichier audio ne doit pas dépasser 50MB." };
      }
    }
    
    if (type === 'image') {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return { valid: false, error: "Format d'image non supporté. Utilisez JPEG, PNG ou WebP." };
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        return { valid: false, error: "L'image ne doit pas dépasser 5MB." };
      }
    }
    
    return { valid: true };
  };

  // Upload de fichier avec retry et gestion d'erreurs améliorée
  const uploadFileWithRetry = async (file, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tentative d'upload ${attempt}/${maxRetries} pour ${file.name}`);
        
        // Créer un nouveau fichier à chaque tentative pour éviter ERR_UPLOAD_FILE_CHANGED
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
        
        // Attendre avant la prochaine tentative
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  // Upload de musique avec gestion d'erreurs améliorée - MODIFIÉE
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!audioFile || !user || !formData.title.trim() || !formData.artist.trim()) {
      alert("Veuillez remplir au moins le titre, l'artiste et sélectionner un fichier audio");
      return;
    }

    // Validation des fichiers
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
      
      // Calculer la durée audio
      setUploadProgress(10);
      const audioDuration = await getAudioDuration(audioFile);
      console.log(`Durée audio: ${audioDuration}s`);

      // Upload du fichier audio
      setUploadProgress(20);
      console.log("Upload du fichier audio...");
      const uploadedAudio = await uploadFileWithRetry(audioFile);
      const audioUrl = storage.getFileView(BUCKET_ID, uploadedAudio.$id);
      console.log(`URL audio: ${audioUrl}`);

      setUploadProgress(60);

      // Upload de l'image de couverture (optionnel)
      let coverImageUrl = "";
      if (coverImage) {
        console.log("Upload de l'image de couverture...");
        const uploadedCover = await uploadFileWithRetry(coverImage);
        coverImageUrl = storage.getFileView(BUCKET_ID, uploadedCover.$id);
        console.log(`URL image: ${coverImageUrl}`);
      }

      setUploadProgress(80);

      // Préparer les données de la musique
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

      // Ajouter les champs optionnels seulement s'ils sont remplis
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
      
      // Créer le document dans la base de données
      await databases.createDocument(
        DATABASE_ID,
        MUSIC_COLLECTION_ID,
        ID.unique(),
        musicData
      );

      setUploadProgress(100);

      // Réinitialiser le formulaire
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
      
      // Actualiser la liste et naviguer vers la bibliothèque
      await fetchTracks();
      await fetchArtists(); // Rafraîchir les artistes pour mettre à jour les stats
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

  // Fonctions du lecteur audio avec validation
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
          // Incrémenter le compteur de lectures
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

  // Fonction sécurisée pour changer le temps de lecture
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
        fetchArtists(); // Rafraîchir les artistes pour mettre à jour les stats
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
      fetchArtists();
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
        {/* Particules d'arrière-plan */}
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
          
          {/* Navigation moderne - masquée sur mobile */}
          {!isMobile && (
            <nav style={styles.navigation}>
              {[
                { id: "library", icon: "🎵", label: "Bibliothèque", count: tracks.length },
                { id: "upload", icon: "⬆️", label: "Ajouter" },
                { id: "artists", icon: "👥", label: "Artistes", count: artists.length },
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

      {/* Contenu principal avec padding adaptatif */}
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
              {/* En-tête de section */}
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  Ma Bibliothèque Musicale
                </h2>
                <p style={styles.sectionSubtitle}>
                  Découvrez et gérez votre collection de musiques
                </p>
              </div>

              {/* Filtres et recherche améliorés */}
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
              {tracks.length === 0 ? (
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
              {/* En-tête de section */}
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

          {/* Section Artistes - AMÉLIORÉE */}
          {activeTab === "artists" && (
            <div style={styles.section}>
              {/* En-tête de section */}
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  Découvrir les Artistes
                </h2>
                <p style={styles.sectionSubtitle}>
                  Trouvez et suivez vos artistes préférés de la communauté
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
                    placeholder="Rechercher un artiste..."
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Mon profil d'artiste - NOUVEAU */}
              {userProfile && (
                <div style={styles.myProfileSection}>
                  <h3 style={styles.subsectionTitle}>
                    <span style={styles.subsectionIcon}>👤</span>
                    Mon Profil d'Artiste
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
                      <p style={styles.artistGenre}>{userProfile.genre || "Artiste"}</p>
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
                              <span>Abonné</span>
                            </div>
                          </div>
                          
                          <div style={styles.artistInfo}>
                            <h4 style={styles.artistName}>{artist.artistName || artist.name}</h4>
                            <p style={styles.artistGenre}>{artist.genre || "Artiste"}</p>
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
                              <span>Se désabonner</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Tous les artistes */}
              <div style={styles.allArtistsSection}>
                <h3 style={styles.subsectionTitle}>
                  <span style={styles.subsectionIcon}>👥</span>
                  Tous les Artistes de la Communauté
                </h3>
                
                {artists.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>👥</div>
                    <h3 style={styles.emptyTitle}>
                      {searchArtistQuery ? "Aucun artiste trouvé" : "Aucun artiste disponible"}
                    </h3>
                    <p style={styles.emptySubtitle}>
                      {searchArtistQuery 
                        ? "Essayez de modifier votre recherche" 
                        : "Les artistes apparaîtront ici une fois qu'ils auront publié de la musique"
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
                              <span>Abonné</span>
                            </div>
                          ) : null}
                        </div>
                        
                        <div style={styles.artistInfo}>
                          <h4 style={styles.artistName}>{artist.artistName || artist.name}</h4>
                          <p style={styles.artistGenre}>{artist.genre || "Artiste"}</p>
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
                              style={styles.unsubscribeButton}
                            >
                              <span>❌</span>
                              <span>Se désabonner</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => subscribeToArtist(artist.userId)}
                              style={styles.subscribeButton}
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

          {/* Section Stats */}
          {activeTab === "stats" && (
            <div style={styles.section}>
              {/* En-tête de section */}
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

      {/* Modal de profil - AMÉLIORÉ */}
      {showProfileModal && (
        <div style={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <span style={styles.modalIcon}>👤</span>
                Modifier mon profil d'artiste
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

              {/* Informations d'artiste - NOUVEAU */}
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

// Styles CSS-in-JS complets et modernes
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

  // Page de connexion
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
    fontSize: '1.1rem',
    fontWeight: '600',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    position: 'relative',
    overflow: 'hidden'
  },

  loginButtonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    position: 'relative',
    zIndex: 2
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

  // Navigation
  navigation: {
    display: 'flex',
    gap: '0.5rem'
  },

  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    color: 'rgb(148, 163, 184)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '500',
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

  // Header right
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
    color: 'rgb(239, 68, 68)',
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
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.5rem',
    maxWidth: '400px',
    margin: '0 auto'
  },

  mobileNavButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.75rem 0.5rem',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    color: 'rgb(148, 163, 184)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.75rem',
    fontWeight: '500',
    position: 'relative'
  },

  mobileNavButtonActive: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  },

  mobileNavBadge: {
    position: 'absolute',
    top: '0.25rem',
    right: '0.25rem',
    background: '#ef4444',
    borderRadius: '10px',
    padding: '0.1rem 0.3rem',
    fontSize: '0.6rem',
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
    scrollBehavior: 'smooth'
  },

  contentContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 2rem'
  },

  // Sections
  section: {
    marginBottom: '3rem'
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
    marginBottom: '0.5rem'
  },

  sectionSubtitle: {
    fontSize: '1.1rem',
    color: 'rgba(255, 255, 255, 0.7)',
    maxWidth: '600px',
    margin: '0 auto'
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
    position: 'relative'
  },

  searchIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255, 255, 255, 0.5)',
    zIndex: 2
  },

  // Inputs et formulaires
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    paddingLeft: '2.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '0.9rem',
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
    fontSize: '0.9rem',
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
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit'
  },

  resetButton: {
    padding: '0.75rem 1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '500'
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
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: 'rgba(255, 255, 255, 0.8)'
  },

  emptySubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: '2rem'
  },

  primaryButton: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '600'
  },

  // Grille de musiques
  tracksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem'
  },

  trackCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
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
    objectFit: 'cover'
  },

  coverPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.1))',
    fontSize: '3rem',
    color: 'rgba(16, 185, 129, 0.5)'
  },

  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },

  playButton: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    fontSize: '1.5rem',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  playingBadge: {
    position: 'absolute',
    top: '0.75rem',
    left: '0.75rem',
    background: 'rgba(16, 185, 129, 0.9)',
    borderRadius: '20px',
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '600',
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
    borderRadius: '20px',
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '600'
  },

  trackInfo: {
    padding: '1.5rem'
  },

  trackTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
    color: 'white'
  },

  trackArtist: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '1rem'
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
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.8)'
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
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.6)'
  },

  trackDuration: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500'
  },

  trackActions: {
    display: 'flex',
    gap: '0.5rem'
  },

  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: 'rgba(255, 255, 255, 0.8)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.8rem'
  },

  actionLabel: {
    fontSize: '0.8rem'
  },

  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.8rem'
  },

  // Formulaire d'upload
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
    textAlign: 'center'
  },

  progressBar: {
    width: '100%',
    height: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
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
    cursor: 'pointer',
    transition: 'left 0.1s ease'
  },

  formSection: {
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },

  formSectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: 'rgba(255, 255, 255, 0.9)'
  },

  formSectionIcon: {
    fontSize: '1.2rem'
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
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)'
  },

  smallLabel: {
    fontSize: '0.8rem',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)'
  },

  smallInput: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: 'white',
    fontSize: '0.8rem',
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
    gap: '0.5rem',
    marginTop: '0.5rem',
    padding: '0.5rem',
    background: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(16, 185, 129, 0.3)'
  },

  fileIcon: {
    fontSize: '1rem'
  },

  fileName: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1
  },

  fileSize: {
    fontSize: '0.7rem',
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
    color: 'rgba(255, 255, 255, 0.8)',
    cursor: 'pointer'
  },

  submitButton: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '12px',
    padding: '1rem 2rem',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1rem',
    fontWeight: '600',
    marginTop: '1rem'
  },

  submitButtonDisabled: {
    background: 'rgba(255, 255, 255, 0.1)',
    cursor: 'not-allowed',
    opacity: 0.6
  },

  loadingContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem'
  },

  loadingSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  // Section Artistes
  myProfileSection: {
    marginBottom: '3rem'
  },

  subscriptionsSection: {
    marginBottom: '3rem'
  },

  allArtistsSection: {
    marginBottom: '2rem'
  },

  subsectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    color: 'rgba(255, 255, 255, 0.9)'
  },

  subsectionIcon: {
    fontSize: '1.5rem'
  },

  myProfileCard: {
    background: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '16px',
    padding: '2rem',
    position: 'relative'
  },

  artistsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem'
  },

  artistCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '1.5rem',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  },

  artistHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },

  artistAvatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid rgba(16, 185, 129, 0.3)'
  },

  artistAvatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },

  myProfileBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    background: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    borderRadius: '12px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#10b981'
  },

  subscribedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    background: 'rgba(251, 191, 36, 0.2)',
    border: '1px solid rgba(251, 191, 36, 0.4)',
    borderRadius: '12px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#fbbf24'
  },

  artistInfo: {
    marginBottom: '1rem'
  },

  artistName: {
    fontSize: '1.2rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
    color: 'white'
  },

  artistGenre: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.9rem',
    marginBottom: '0.5rem'
  },

  artistBio: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.8rem',
    lineHeight: '1.4',
    marginBottom: '0.5rem'
  },

  artistLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.8rem'
  },

  artistStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginBottom: '1rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px'
  },

  artistStat: {
    textAlign: 'center'
  },

  artistStatValue: {
    display: 'block',
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#10b981'
  },

  artistStatLabel: {
    fontSize: '0.7rem',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  artistSocial: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem'
  },

  socialLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    fontSize: '1rem',
    textDecoration: 'none',
    transition: 'all 0.3s ease'
  },

  artistActions: {
    display: 'flex',
    gap: '0.5rem'
  },

  subscribeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.8rem',
    fontWeight: '500',
    flex: 1
  },

  unsubscribeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.8rem',
    fontWeight: '500',
    flex: 1
  },

  editProfileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
    color: '#3b82f6',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.8rem',
    fontWeight: '500',
    flex: 1
  },

  // Modal de profil
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
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },

  modalTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.3rem',
    fontWeight: '600',
    color: 'white',
    margin: 0
  },

  modalIcon: {
    fontSize: '1.5rem'
  },

  modalCloseButton: {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '8px',
    transition: 'all 0.3s ease'
  },

  profileForm: {
    padding: '1.5rem',
    overflowY: 'auto',
    flex: 1
  },

  profileImageSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '2rem',
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
    padding: '0.75rem 1rem',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
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
    gap: '0.5rem',
    marginTop: '0.5rem',
    padding: '0.5rem',
    background: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(16, 185, 129, 0.3)'
  },

  profileSection: {
    marginBottom: '2rem'
  },

  profileSectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: 'rgba(255, 255, 255, 0.9)'
  },

  profileSectionIcon: {
    fontSize: '1.2rem'
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
    padding: '0.75rem 1.5rem',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: 'rgba(255, 255, 255, 0.8)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '500'
  },

  saveButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '600'
  },

  saveButtonDisabled: {
    background: 'rgba(255, 255, 255, 0.1)',
    cursor: 'not-allowed',
    opacity: 0.6
  },

  // Section Stats
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
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '1.5rem',
    textAlign: 'center',
    transition: 'all 0.3s ease'
  },

  statIcon: {
    fontSize: '2rem',
    marginBottom: '0.5rem'
  },

  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: '0.25rem'
  },

  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  topTracksSection: {
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '1.5rem'
  },

  topTracksTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.3rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    color: 'rgba(255, 255, 255, 0.9)'
  },

  topTracksIcon: {
    fontSize: '1.5rem'
  },

  topTracksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },

  topTrackItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },

  topTrackRank: {
    flexShrink: 0
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
    flexShrink: 0,
    width: '48px',
    height: '48px',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(16, 185, 129, 0.1)',
    color: 'rgba(16, 185, 129, 0.5)',
    fontSize: '1.2rem'
  },

  topTrackInfo: {
    flex: 1,
    minWidth: 0
  },

  topTrackTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'white',
    marginBottom: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  topTrackArtist: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '0.25rem'
  },

  topTrackAlbum: {
    fontSize: '0.7rem',
    color: 'rgba(255, 255, 255, 0.5)'
  },

  topTrackStats: {
    textAlign: 'center',
    marginRight: '1rem'
  },

  topTrackPlays: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#10b981'
  },

  topTrackPlaysLabel: {
    fontSize: '0.7rem',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  topTrackPlayButton: {
    flexShrink: 0,
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem'
  },

  // Lecteur audio
  audioPlayer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    zIndex: 1000,
    padding: '1rem 2rem'
  },

  playerContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 1fr',
    gap: '2rem',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto'
  },

  playerTrackInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    minWidth: 0
  },

  playerCover: {
    flexShrink: 0,
    width: '56px',
    height: '56px',
    borderRadius: '8px',
    overflow: 'hidden'
  },

  playerCoverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },

  playerCoverPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(16, 185, 129, 0.1)',
    color: 'rgba(16, 185, 129, 0.5)',
    fontSize: '1.5rem'
  },

  playerInfo: {
    minWidth: 0,
    flex: 1
  },

  playerTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'white',
    marginBottom: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  playerArtist: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.7)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  playerControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    alignItems: 'center'
  },

  playerButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },

  playerButton: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1.2rem',
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
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1.5rem',
    padding: '0.75rem',
    borderRadius: '50%',
    width: '56px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  },

  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    width: '100%'
  },

  timeLabel: {
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    minWidth: '40px',
    textAlign: 'center'
  },

  playerSecondary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '1rem'
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
  }
};

// Ajout des animations CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
    50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .track-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }

  .track-card:hover .cover-overlay {
    opacity: 1;
  }

  .track-card:hover .play-button {
    transform: scale(1.1);
  }

  .artist-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }

  .top-track-item:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateX(4px);
  }

  .top-track-item:hover .top-track-play-button {
    transform: scale(1.1);
  }

  input:focus, select:focus, textarea:focus {
    border-color: rgba(16, 185, 129, 0.5);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    .playerContent {
      grid-template-columns: 1fr;
      gap: 1rem;
      text-align: center;
    }
    
    .tracksGrid {
      grid-template-columns: 1fr;
    }
    
    .artistsGrid {
      grid-template-columns: 1fr;
    }
    
    .formGrid {
      grid-template-columns: 1fr;
    }
    
    .statsGrid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;

document.head.appendChild(styleSheet);

export default SpotifyApp;

