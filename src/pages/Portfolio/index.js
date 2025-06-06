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

  const fetchUser = async () => {
    try {
      const user = await account.get();
      setUser(user);
      fetchTracks();
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

  // Gestion du formulaire
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

  // Upload de musique avec gestion d'erreurs améliorée
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
    if (audioRef.current && duration && !isNaN(newTime) && isFinite(newTime)) {
      const clampedTime = Math.max(0, Math.min(newTime, duration));
      audioRef.current.currentTime = clampedTime;
      setCurrentTime(clampedTime);
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
          paddingTop: isMobile ? '8rem' : '5rem', // Ajustement du padding
          paddingBottom: currentTrack ? '10rem' : '2rem' // Plus d'espace si lecteur actif
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
                      <div style={styles.statValue}>{tracks.length}</div>
                      <div style={styles.statLabel}>Musiques</div>
                    </div>
                    
                    <div style={styles.statCard}>
                      <div style={styles.statIcon}>▶️</div>
                      <div style={styles.statValue}>
                        {tracks.reduce((sum, track) => sum + (track.playsCount || 0), 0)}
                      </div>
                      <div style={styles.statLabel}>Lectures totales</div>
                    </div>
                    
                    <div style={styles.statCard}>
                      <div style={styles.statIcon}>❤️</div>
                      <div style={styles.statValue}>
                        {tracks.reduce((sum, track) => sum + (track.likesCount || 0), 0)}
                      </div>
                      <div style={styles.statLabel}>Likes totaux</div>
                    </div>
                    
                    <div style={styles.statCard}>
                      <div style={styles.statIcon}>🎼</div>
                      <div style={styles.statValue}>
                        {new Set(tracks.map(track => track.genre).filter(Boolean)).size}
                      </div>
                      <div style={styles.statLabel}>Genres</div>
                    </div>
                  </div>

                  {/* Top tracks */}
                  {tracks.length > 0 && (
                    <div style={styles.topTracksSection}>
                      <h3 style={styles.topTracksTitle}>
                        <span style={styles.topTracksIcon}>🏆</span>
                        Top Musiques
                      </h3>
                      <div style={styles.topTracksList}>
                        {tracks
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

      {/* Lecteur audio fixe en bas */}
      {currentTrack && (
        <div style={styles.player}>
          <div style={styles.playerContent}>
            {/* Barre de progression */}
            <div style={styles.progressSection}>
              <div style={styles.progressContainer}>
                <span style={styles.timeLabel}>{formatTime(currentTime)}</span>
                <div 
                  style={styles.progressBar}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    const newTime = percent * duration;
                    seekToTime(newTime); // Utilisation de la fonction sécurisée
                  }}
                >
                  <div 
                    style={{
                      ...styles.progressFill,
                      width: `${duration && isFinite(duration) ? (currentTime / duration) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <span style={styles.timeLabel}>{formatTime(duration)}</span>
              </div>
            </div>

            <div style={{
              ...styles.playerMain,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '1rem' : '2rem'
            }}>
              {/* Infos de la piste actuelle */}
              <div style={{
                ...styles.playerTrackInfo,
                justifyContent: isMobile ? 'center' : 'flex-start'
              }}>
                <div style={styles.playerTrackCover}>
                  {currentTrack.coverImage ? (
                    <img src={currentTrack.coverImage} alt="Cover" style={styles.playerCoverImage} />
                  ) : (
                    <div style={styles.playerCoverPlaceholder}>🎵</div>
                  )}
                </div>
                <div style={styles.playerTrackDetails}>
                  <h4 style={styles.playerTrackTitle}>{currentTrack.title}</h4>
                  <p style={styles.playerTrackArtist}>{currentTrack.artist}</p>
                  {currentTrack.album && (
                    <p style={styles.playerTrackAlbum}>📀 {currentTrack.album}</p>
                  )}
                </div>
              </div>

              {/* Contrôles centraux */}
              <div style={{
                ...styles.playerControls,
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setIsShuffled(!isShuffled)}
                  style={{
                    ...styles.controlButton,
                    ...(isShuffled ? styles.controlButtonActive : {})
                  }}
                  className="control-button"
                  title="Lecture aléatoire"
                >
                  🔀
                </button>
                
                <button
                  onClick={previousTrack}
                  style={styles.controlButton}
                  className="control-button"
                  title="Précédent"
                >
                  ⏮️
                </button>
                
                <button
                  onClick={() => isPlaying ? pauseTrack() : playTrack(currentTrack)}
                  style={styles.playControlButton}
                  className="play-control-button"
                  title={isPlaying ? "Pause" : "Jouer"}
                >
                  {isPlaying ? "⏸️" : "▶️"}
                </button>
                
                <button
                  onClick={nextTrack}
                  style={styles.controlButton}
                  className="control-button"
                  title="Suivant"
                >
                  ⏭️
                </button>
                
                <button
                  onClick={() => {
                    const modes = ["none", "one", "all"];
                    const currentIndex = modes.indexOf(repeatMode);
                    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
                  }}
                  style={{
                    ...styles.controlButton,
                    ...(repeatMode !== "none" ? styles.controlButtonActive : {})
                  }}
                  className="control-button"
                  title={`Répétition: ${repeatMode === "none" ? "Désactivée" : repeatMode === "one" ? "Une seule" : "Toutes"}`}
                >
                  {repeatMode === "one" ? "🔂" : "🔁"}
                </button>
              </div>

              {/* Contrôles de volume et actions */}
              <div style={{
                ...styles.playerActions,
                justifyContent: isMobile ? 'center' : 'flex-end'
              }}>
                <button
                  onClick={() => toggleLike(currentTrack)}
                  style={styles.likeButton}
                  title="J'aime"
                >
                  ❤️
                </button>
                
                {!isMobile && (
                  <div style={styles.volumeControl}>
                    <span style={styles.volumeIcon}>🔊</span>
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
                    <span style={styles.volumeLabel}>{Math.round(volume * 100)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles CSS-in-JS améliorés
const styles = {
  // Page de connexion
  loginContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #059669 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    position: 'relative',
    overflow: 'hidden'
  },
  particles: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden'
  },
  particle: {
    position: 'absolute',
    width: '4px',
    height: '4px',
    backgroundColor: '#10b981',
    borderRadius: '50%',
    opacity: 0.3,
    animation: 'float 6s ease-in-out infinite'
  },
  loginContent: {
    textAlign: 'center',
    maxWidth: '28rem',
    width: '100%',
    position: 'relative',
    zIndex: 10
  },
  loginHeader: {
    position: 'relative',
    marginBottom: '2rem'
  },
  loginIcon: {
    fontSize: '5rem',
    marginBottom: '1rem',
    animation: 'bounce 2s infinite'
  },
  loginGlow: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to right, #10b981, #fbbf24, #3b82f6)',
    opacity: 0.2,
    filter: 'blur(3rem)',
    borderRadius: '50%',
    animation: 'pulse 3s infinite'
  },
  loginTitle: {
    fontSize: '3.75rem',
    fontWeight: 900,
    marginBottom: '1rem',
    background: 'linear-gradient(to right, #10b981, #fbbf24, #3b82f6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  loginSubtitle: {
    fontSize: '1.25rem',
    color: '#cbd5e1',
    marginBottom: '2rem',
    lineHeight: 1.6
  },
  loginButton: {
    position: 'relative',
    padding: '1rem 2rem',
    background: 'linear-gradient(to right, #10b981, #fbbf24, #3b82f6)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.125rem',
    borderRadius: '1rem',
    border: 'none',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  },
  loginButtonContent: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem'
  },
  googleIcon: {
    width: '1.5rem',
    height: '1.5rem'
  },

  // Container principal
  appContainer: {
    height: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #059669 100%)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },

  // Header amélioré
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    transition: 'all 0.3s ease',
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(71, 85, 105, 0.3)'
  },
  headerScrolled: {
    background: 'rgba(15, 23, 42, 0.98)',
    borderBottomColor: 'rgba(71, 85, 105, 0.5)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  headerContent: {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '4rem'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  headerIcon: {
    fontSize: '1.875rem',
    animation: 'float 3s ease-in-out infinite'
  },
  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: 900,
    background: 'linear-gradient(to right, #10b981, #fbbf24, #3b82f6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  navigation: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(30, 41, 59, 0.5)',
    backdropFilter: 'blur(4px)',
    borderRadius: '1rem',
    padding: '0.5rem',
    border: '1px solid rgba(71, 85, 105, 0.5)'
  },
  navButton: {
    position: 'relative',
    padding: '0.5rem 1rem',
    borderRadius: '0.75rem',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer'
  },
  navButtonActive: {
    background: 'linear-gradient(to right, #10b981, #3b82f6)',
    color: 'white',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    transform: 'scale(1.05)'
  },
  navButtonLabel: {
    display: 'none',
    '@media (min-width: 1024px)': {
      display: 'inline'
    }
  },
  navButtonBadge: {
    background: '#059669',
    color: 'white',
    fontSize: '0.75rem',
    padding: '0.125rem 0.5rem',
    borderRadius: '9999px'
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
    color: '#cbd5e1',
    fontSize: '0.875rem',
    margin: 0
  },
  userName: {
    fontWeight: 600,
    color: '#10b981',
    margin: 0
  },
  avatarContainer: {
    position: 'relative'
  },
  avatar: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    border: '2px solid #10b981',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'transform 0.3s ease'
  },
  avatarStatus: {
    position: 'absolute',
    bottom: '-0.25rem',
    right: '-0.25rem',
    width: '1rem',
    height: '1rem',
    background: '#10b981',
    borderRadius: '50%',
    border: '2px solid #0f172a',
    animation: 'pulse 2s infinite'
  },
  logoutButton: {
    color: '#f87171',
    fontWeight: 600,
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    transition: 'all 0.3s ease',
    fontSize: '0.875rem',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer'
  },

  // Navigation mobile améliorée
  mobileNav: {
    position: 'fixed',
    top: '4rem',
    left: 0,
    right: 0,
    zIndex: 40,
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(71, 85, 105, 0.5)',
    padding: '0.75rem 1rem'
  },
  mobileNavContent: {
    display: 'flex',
    gap: '0.5rem',
    overflowX: 'auto'
  },
  mobileNavButton: {
    flexShrink: 0,
    padding: '0.5rem 1rem',
    borderRadius: '0.75rem',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    border: 'none',
    background: 'rgba(30, 41, 59, 0.5)',
    color: '#cbd5e1',
    cursor: 'pointer'
  },
  mobileNavButtonActive: {
    background: 'linear-gradient(to right, #10b981, #3b82f6)',
    color: 'white',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  mobileNavBadge: {
    background: '#059669',
    color: 'white',
    fontSize: '0.75rem',
    padding: '0.125rem 0.5rem',
    borderRadius: '9999px'
  },

  // Contenu principal avec padding adaptatif
  mainContent: {
    flex: 1,
    overflowY: 'auto',
    scrollBehavior: 'smooth'
  },
  contentContainer: {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '2rem 1rem'
  },

  // Sections
  section: {
    animation: 'fadeIn 0.6s ease-out'
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '3rem'
  },
  sectionTitle: {
    fontSize: '2.25rem',
    '@media (min-width: 768px)': {
      fontSize: '3.75rem'
    },
    fontWeight: 900,
    marginBottom: '1rem',
    background: 'linear-gradient(to right, #10b981, #fbbf24, #3b82f6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  sectionSubtitle: {
    fontSize: '1.25rem',
    color: '#cbd5e1'
  },

  // Filtres
  filtersContainer: {
    background: 'rgba(30, 41, 59, 0.5)',
    backdropFilter: 'blur(12px)',
    padding: '1.5rem',
    borderRadius: '1.5rem',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    marginBottom: '2rem'
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(4, 1fr)'
    },
    gap: '1rem'
  },
  searchContainer: {
    position: 'relative'
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    pointerEvents: 'none'
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    paddingLeft: '3rem',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: '0.75rem',
    color: 'white',
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  select: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: '0.75rem',
    color: 'white',
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  resetButton: {
    padding: '0.75rem 1rem',
    background: 'rgba(71, 85, 105, 0.5)',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: '0.75rem',
    color: '#cbd5e1',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },

  // État vide
  emptyState: {
    textAlign: 'center',
    padding: '5rem 0'
  },
  emptyIcon: {
    fontSize: '5rem',
    marginBottom: '1.5rem',
    animation: 'bounce 2s infinite'
  },
  emptyTitle: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#cbd5e1',
    marginBottom: '1rem'
  },
  emptySubtitle: {
    color: '#94a3b8',
    marginBottom: '2rem',
    fontSize: '1.125rem'
  },
  primaryButton: {
    padding: '1rem 2rem',
    background: 'linear-gradient(to right, #10b981, #3b82f6)',
    color: 'white',
    fontWeight: 'bold',
    borderRadius: '1rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1rem'
  },

  // Grille de musiques
  tracksGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    '@media (min-width: 640px)': {
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    '@media (min-width: 1024px)': {
      gridTemplateColumns: 'repeat(3, 1fr)'
    },
    '@media (min-width: 1280px)': {
      gridTemplateColumns: 'repeat(4, 1fr)'
    },
    '@media (min-width: 1536px)': {
      gridTemplateColumns: 'repeat(5, 1fr)'
    },
    gap: '1.5rem'
  },

  // Carte de musique
  trackCard: {
    background: 'rgba(30, 41, 59, 0.8)',
    backdropFilter: 'blur(12px)',
    borderRadius: '1rem',
    overflow: 'hidden',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  trackCardActive: {
    border: '2px solid #10b981',
    boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.2)'
  },
  trackCover: {
    position: 'relative',
    width: '100%',
    height: '12rem',
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
    color: '#64748b',
    fontSize: '3.75rem'
  },
  coverOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },
  playButton: {
    width: '4rem',
    height: '4rem',
    background: 'linear-gradient(to right, #10b981, #3b82f6)',
    border: 'none',
    borderRadius: '50%',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  playingBadge: {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    background: 'linear-gradient(to right, #10b981, #3b82f6)',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  playingIndicator: {
    width: '0.5rem',
    height: '0.5rem',
    background: 'white',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  },
  explicitBadge: {
    position: 'absolute',
    top: '0.75rem',
    left: '0.75rem',
    background: 'linear-gradient(to right, #dc2626, #b91c1c)',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600
  },
  trackInfo: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  trackTitle: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: '1.125rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    transition: 'color 0.3s ease'
  },
  trackArtist: {
    color: '#94a3b8',
    fontSize: '0.875rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  trackMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    fontSize: '0.75rem'
  },
  metaBadge: {
    background: 'rgba(71, 85, 105, 0.5)',
    color: '#cbd5e1',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.375rem',
    fontSize: '0.75rem'
  },
  trackStats: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#94a3b8'
  },
  statsLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  trackDuration: {
    fontFamily: 'monospace'
  },
  trackActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '0.5rem',
    borderTop: '1px solid rgba(71, 85, 105, 0.5)'
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#f87171',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#f87171',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  actionLabel: {
    fontSize: '0.75rem'
  },

  // Formulaire d'upload
  uploadContainer: {
    maxWidth: '64rem',
    margin: '0 auto'
  },
  uploadForm: {
    background: 'rgba(30, 41, 59, 0.5)',
    backdropFilter: 'blur(12px)',
    padding: '2rem',
    borderRadius: '1.5rem',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  progressContainer: {
    background: 'rgba(30, 41, 59, 0.8)',
    padding: '1rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(71, 85, 105, 0.5)'
  },
  progressLabel: {
    color: '#10b981',
    fontWeight: 600,
    marginBottom: '0.5rem',
    textAlign: 'center'
  },
  progressBar: {
    width: '100%',
    height: '0.5rem',
    background: 'rgba(71, 85, 105, 0.5)',
    borderRadius: '0.25rem',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(to right, #10b981, #3b82f6)',
    borderRadius: '0.25rem',
    transition: 'width 0.3s ease'
  },
  formSection: {
    background: 'rgba(30, 41, 59, 0.3)',
    padding: '1.5rem',
    borderRadius: '1rem',
    border: '1px solid rgba(71, 85, 105, 0.3)'
  },
  formSectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#10b981',
    display: 'flex',
    alignItems: 'center'
  },
  formSectionIcon: {
    marginRight: '0.75rem'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    gap: '1.5rem'
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(4, 1fr)'
    },
    gap: '1rem',
    marginBottom: '1rem'
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#cbd5e1'
  },
  smallLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: '#94a3b8'
  },
  smallInput: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: '0.5rem',
    color: 'white',
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  textarea: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: '0.75rem',
    color: 'white',
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    resize: 'vertical',
    minHeight: '6rem'
  },
  fileInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: '0.75rem',
    color: 'white',
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  filePreview: {
    display: 'flex',
    alignItems: 'center',
    color: '#10b981',
    fontSize: '0.875rem',
    background: 'rgba(16, 185, 129, 0.2)',
    padding: '0.75rem',
    borderRadius: '0.5rem'
  },
  fileIcon: {
    marginRight: '0.5rem'
  },
  fileName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  fileSize: {
    marginLeft: 'auto',
    color: '#94a3b8'
  },
  contentFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  checkbox: {
    width: '1.25rem',
    height: '1.25rem',
    accentColor: '#10b981'
  },
  checkboxLabel: {
    color: '#cbd5e1',
    fontWeight: 500
  },
  submitButton: {
    width: '100%',
    padding: '1.5rem 2rem',
    borderRadius: '1rem',
    fontWeight: 'bold',
    fontSize: '1.25rem',
    transition: 'all 0.3s ease',
    border: 'none',
    cursor: 'pointer',
    background: 'linear-gradient(to right, #10b981, #3b82f6)',
    color: 'white'
  },
  submitButtonDisabled: {
    background: '#64748b',
    cursor: 'not-allowed',
    color: '#94a3b8'
  },
  loadingContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem'
  },
  loadingSpinner: {
    width: '1.5rem',
    height: '1.5rem',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  // Section Stats
  statsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  statsCard: {
    background: 'rgba(30, 41, 59, 0.5)',
    backdropFilter: 'blur(12px)',
    padding: '2rem',
    borderRadius: '1.5rem',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    '@media (min-width: 1024px)': {
      gridTemplateColumns: 'repeat(4, 1fr)'
    },
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  statCard: {
    background: 'rgba(30, 41, 59, 0.8)',
    padding: '1.5rem',
    borderRadius: '1rem',
    textAlign: 'center',
    border: '1px solid rgba(71, 85, 105, 0.5)'
  },
  statIcon: {
    fontSize: '2.5rem',
    marginBottom: '0.75rem',
    animation: 'bounce 2s infinite'
  },
  statValue: {
    fontSize: '1.875rem',
    fontWeight: 900,
    color: '#10b981'
  },
  statLabel: {
    color: '#cbd5e1',
    fontWeight: 500
  },
  topTracksSection: {
    marginTop: '2rem'
  },
  topTracksTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#10b981',
    display: 'flex',
    alignItems: 'center'
  },
  topTracksIcon: {
    marginRight: '0.75rem'
  },
  topTracksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  topTrackItem: {
    background: 'rgba(30, 41, 59, 0.8)',
    padding: '1rem',
    borderRadius: '1rem',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  topTrackRank: {
    flexShrink: 0
  },
  rankBadge: {
    width: '3rem',
    height: '3rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.125rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  topTrackCover: {
    width: '3.5rem',
    height: '3.5rem',
    background: '#64748b',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
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
    color: '#64748b',
    fontSize: '1.25rem'
  },
  topTrackInfo: {
    flex: 1,
    minWidth: 0
  },
  topTrackTitle: {
    fontWeight: 'bold',
    color: 'white',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  topTrackArtist: {
    color: '#94a3b8',
    fontSize: '0.875rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  topTrackAlbum: {
    color: '#64748b',
    fontSize: '0.75rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  topTrackStats: {
    textAlign: 'right'
  },
  topTrackPlays: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: '1.125rem'
  },
  topTrackPlaysLabel: {
    color: '#94a3b8',
    fontSize: '0.75rem'
  },
  topTrackPlayButton: {
    width: '2.5rem',
    height: '2.5rem',
    background: 'linear-gradient(to right, #10b981, #3b82f6)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },

  // Lecteur audio amélioré
  player: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(15, 23, 42, 0.98)',
    backdropFilter: 'blur(12px)',
    borderTop: '1px solid rgba(71, 85, 105, 0.5)',
    zIndex: 50,
    boxShadow: '0 -25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  playerContent: {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '0 1rem'
  },
  progressSection: {
    paddingTop: '0.5rem'
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  timeLabel: {
    width: '3rem',
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    color: '#94a3b8'
  },
  playerMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    paddingBottom: '1rem'
  },
  playerTrackInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1,
    minWidth: 0
  },
  playerTrackCover: {
    width: '3.5rem',
    height: '3.5rem',
    background: '#64748b',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
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
    color: '#64748b',
    fontSize: '1.25rem'
  },
  playerTrackDetails: {
    minWidth: 0,
    flex: 1
  },
  playerTrackTitle: {
    fontWeight: 'bold',
    color: 'white',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: 0
  },
  playerTrackArtist: {
    color: '#94a3b8',
    fontSize: '0.875rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: 0
  },
  playerTrackAlbum: {
    color: '#64748b',
    fontSize: '0.75rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: 0
  },
  playerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  controlButton: {
    width: '2.5rem',
    height: '2.5rem',
    color: '#94a3b8',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer'
  },
  controlButtonActive: {
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.3)'
  },
  playControlButton: {
    width: '3.5rem',
    height: '3.5rem',
    background: 'linear-gradient(to right, #10b981, #3b82f6)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    transform: 'scale(1)',
    transition: 'all 0.3s ease',
    border: 'none',
    color: 'white',
    cursor: 'pointer'
  },
  playerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1,
    justifyContent: 'flex-end'
  },
  likeButton: {
    width: '2.5rem',
    height: '2.5rem',
    color: '#f87171',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer'
  },
  volumeControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  volumeIcon: {
    color: '#94a3b8'
  },
  volumeSlider: {
    width: '5rem',
    height: '0.25rem',
    background: 'rgba(71, 85, 105, 0.5)',
    borderRadius: '0.125rem',
    outline: 'none',
    cursor: 'pointer',
    accentColor: '#10b981'
  },
  volumeLabel: {
    color: '#94a3b8',
    fontSize: '0.75rem',
    width: '2rem'
  }
};

// Ajout des animations CSS via une balise style
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  
  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
    40%, 43% { transform: translateY(-30px); }
    70% { transform: translateY(-15px); }
    90% { transform: translateY(-4px); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  /* Hover effects */
  .track-card:hover .cover-overlay {
    opacity: 1;
  }
  
  .track-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  
  .play-button:hover {
    transform: scale(1.1);
  }
  
  .control-button:hover {
    background: rgba(71, 85, 105, 0.5);
    color: white;
  }
  
  .play-control-button:hover {
    transform: scale(1.05);
    box-shadow: 0 25px 50px -12px rgba(16, 185, 129, 0.25);
  }
  
  .top-track-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
  
  .top-track-play-button:hover {
    transform: scale(1.1);
  }
  
  /* Focus styles for accessibility */
  input:focus, select:focus, textarea:focus, button:focus {
    outline: 2px solid #10b981;
    outline-offset: 2px;
  }
  
  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: rgba(71, 85, 105, 0.3);
  }
  
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #10b981, #3b82f6);
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, #059669, #2563eb);
  }
`;

document.head.appendChild(styleSheet);

export default SpotifyApp;

