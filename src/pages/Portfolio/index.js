import React, { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:4000/api';

const MusicManagerApp = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState(null);

  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(false);

  const [uploadData, setUploadData] = useState({
    title: '',
    artist: '',
    genre: '',
    album: '',
    year: '',
    isExplicit: false,
  });
  const [audioFile, setAudioFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const audioRef = useRef(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // -- AUTH --

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur login');
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setIsRegistering(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, email, password}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur inscription');
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setIsRegistering(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setTracks([]);
    setCurrentTrack(null);
    setIsPlaying(false);
    setError(null);
  };

  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        headers: {Authorization: 'Bearer ' + token}
      });
      if (!res.ok) throw new Error('Non authorisé');
      const profile = await res.json();
      setUser(profile);
    } catch {
      logout();
    }
  };

  // -- TRACKS --

  const fetchTracks = async () => {
    if (!token) return;
    setLoadingTracks(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/tracks`, {
        headers: {Authorization: 'Bearer ' + token}
      });
      if (!res.ok) throw new Error('Erreur chargement pistes');
      const data = await res.json();
      setTracks(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingTracks(false);
    }
  };

  const deleteTrack = async (trackId) => {
    if (!token) return alert("Connectez-vous");
    if (!window.confirm("Supprimer ce morceau ?")) return;
    try {
      const res = await fetch(`${API_BASE}/tracks/${trackId}`, {
        method: 'DELETE',
        headers: {Authorization: 'Bearer ' + token}
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur suppression");
      }
      alert("Supprimé !");
      fetchTracks();
      if (currentTrack && currentTrack.id === trackId) {
        setCurrentTrack(null);
        setIsPlaying(false);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const playTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handleUploadChange = (e) => {
    const {name, type, checked, value} = e.target;
    setUploadData(prev => ({...prev, [name]: type === 'checkbox' ? checked : value}));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!token) return alert("Connectez-vous");
    if (!audioFile) return alert("Fichier audio requis");
    if (!uploadData.title || !uploadData.artist) return alert("Titre et artiste requis");

    setUploadLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('artist', uploadData.artist);
      formData.append('genre', uploadData.genre);
      formData.append('album', uploadData.album);
      if (uploadData.year) formData.append('year', uploadData.year);
      formData.append('isExplicit', uploadData.isExplicit);
      formData.append('audioFile', audioFile);

      const res = await fetch(`${API_BASE}/tracks`, {
        method: 'POST',
        headers: {Authorization: 'Bearer ' + token},
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur upload');

      alert('Musique ajoutée avec succès !');
      setUploadData({
        title: '',
        artist: '',
        genre: '',
        album: '',
        year: '',
        isExplicit: false,
      });
      setAudioFile(null);
      fetchTracks();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchTracks();
    } else {
      setUser(null);
      setTracks([]);
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  }, [token]);

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentTrack]);

  if (!token) {
    return isRegistering
      ? <RegisterForm onRegister={register} switchToLogin={() => { setIsRegistering(false); setError(null); }} error={error} />
      : <LoginForm onLogin={login} switchToRegister={() => { setIsRegistering(true); setError(null); }} error={error} />;
  }

  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <h1 style={styles.logo}>🎵 Music Manager</h1>
        <div>
          {user && <span style={styles.welcome}>Bienvenue, {user.name}</span>}
          <button style={styles.logoutButton} onClick={logout}>Déconnexion</button>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.section}>
          <h2>Mes Musiques</h2>
          {loadingTracks ? (
            <p>Chargement...</p>
          ) : error ? (
            <p style={{color: 'red'}}>{error}</p>
          ) : tracks.length === 0 ? (
            <p>Aucune musique trouvée. Ajoutez-en une !</p>
          ) : (
            <TrackList tracks={tracks} onPlay={playTrack} currentTrack={currentTrack} isPlaying={isPlaying} onDelete={deleteTrack} />
          )}
        </section>

        <section style={styles.section}>
          <h2>Ajouter une musique</h2>
          <UploadForm uploadData={uploadData} audioFile={audioFile} setAudioFile={setAudioFile} onChange={handleUploadChange} onSubmit={handleUploadSubmit} isLoading={uploadLoading} />
        </section>
      </main>

      {currentTrack && <AudioPlayer track={currentTrack} audioRef={audioRef} isPlaying={isPlaying} togglePlay={togglePlay} currentTime={currentTime} duration={duration} setCurrentTime={(time) => { if(audioRef.current) audioRef.current.currentTime = time; setCurrentTime(time); }} />}
    </div>
  );
};

const RegisterForm = ({ onRegister, switchToLogin, error }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [localError, setLocalError] = useState(null);

  const submit = e => {
    e.preventDefault();
    setLocalError(null);
    if (password !== passwordConfirm) {
      setLocalError('Les mots de passe ne correspondent pas');
      return;
    }
    onRegister(name, email, password);
  };

  return (
    <div style={styles.loginContainer}>
      <form onSubmit={submit} style={styles.loginForm}>
        <h2>Inscription</h2>
        {error && <p style={{color:'red'}}>{error}</p>}
        {localError && <p style={{color:'red'}}>{localError}</p>}
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom complet" required style={styles.input} />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required style={styles.input} />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" required style={styles.input} />
        <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder="Confirmer le mot de passe" required style={styles.input} />
        <button type="submit" style={styles.buttonPrimary}>S'inscrire</button>
        <p style={{marginTop:10}}>
          Déjà un compte ?{' '}
          <button type="button" onClick={switchToLogin} style={{color:'#1DB954',background:'none',border:'none',cursor:'pointer',fontWeight:'bold'}}>
            Connectez-vous
          </button>
        </p>
      </form>
    </div>
  );
};

const LoginForm = ({ onLogin, switchToRegister, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = e => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div style={styles.loginContainer}>
      <form onSubmit={submit} style={styles.loginForm}>
        <h2>Connexion</h2>
        {error && <p style={{color:'red'}}>{error}</p>}
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required style={styles.input} />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" required style={styles.input} />
        <button type="submit" style={styles.buttonPrimary}>Se connecter</button>
        <p style={{marginTop:10}}>
          Pas de compte ?{' '}
          <button type="button" onClick={switchToRegister} style={{color:'#1DB954',background:'none',border:'none',cursor:'pointer',fontWeight:'bold'}}>
            Inscrivez-vous
          </button>
        </p>
      </form>
    </div>
  );
};

const TrackList = ({ tracks, onPlay, currentTrack, isPlaying, onDelete }) => (
  <ul style={styles.trackList}>
    {tracks.map(track => (
      <li key={track.id} style={{...styles.trackItem, backgroundColor: currentTrack?.id === track.id ? '#10b98122' : 'transparent'}}>
        <div style={styles.trackInfo}>
          <strong>{track.title}</strong> - <em>{track.artist}</em>
        </div>
        <div>
          <button style={styles.buttonSmall} onClick={() => onPlay(track)}>
            {(currentTrack?.id === track.id && isPlaying) ? '⏸️ Pause' : '▶️ Écouter'}
          </button>
          <button style={{...styles.buttonSmall, ...styles.buttonDelete}} onClick={() => onDelete(track.id)}>
            🗑️ Supprimer
          </button>
        </div>
      </li>
    ))}
  </ul>
);

const UploadForm = ({ uploadData, audioFile, setAudioFile, onChange, onSubmit, isLoading }) => (
  <form onSubmit={onSubmit} style={styles.uploadForm}>
    <input type="text" name="title" placeholder="Titre *" value={uploadData.title} onChange={onChange} required style={styles.input} disabled={isLoading} />
    <input type="text" name="artist" placeholder="Artiste *" value={uploadData.artist} onChange={onChange} required style={styles.input} disabled={isLoading} />
    <input type="text" name="album" placeholder="Album" value={uploadData.album} onChange={onChange} style={styles.input} disabled={isLoading} />
    <input type="text" name="genre" placeholder="Genre" value={uploadData.genre} onChange={onChange} style={styles.input} disabled={isLoading} />
    <input type="number" name="year" placeholder="Année" value={uploadData.year} onChange={onChange} style={styles.input} disabled={isLoading} min="1900" max={new Date().getFullYear() + 1} />
    <label style={styles.checkboxLabel}>
      <input type="checkbox" name="isExplicit" checked={uploadData.isExplicit} onChange={onChange} disabled={isLoading} />
      Contenu explicite (🔞)
    </label>
    <label style={styles.fileInputLabel}>
      Fichier audio *
      <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files[0])} required disabled={isLoading} style={{display:'none'}} />
    </label>
    {audioFile && <div style={styles.selectedFile}>{audioFile.name}</div>}
    <button type="submit" disabled={isLoading} style={styles.buttonPrimary}>
      {isLoading ? 'Upload en cours...' : 'Ajouter une musique'}
    </button>
  </form>
);

const AudioPlayer = ({ track, audioRef, isPlaying, togglePlay, currentTime, duration, setCurrentTime }) => {
  const formatTime = s => {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const onProgressClick = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    setCurrentTime(percent * duration);
  };

  return (
    <div style={styles.audioPlayer}>
      <audio ref={audioRef} src={`http://localhost:4000/${track.audio_path}`} autoPlay={isPlaying} />
      <div style={styles.playerInfo}>
        <div><strong>{track.title}</strong> - {track.artist}</div>
        <div>{formatTime(currentTime)} / {formatTime(duration)}</div>
      </div>
      <div style={styles.progressBar} onClick={onProgressClick}>
        <div style={{...styles.progressFill, width: `${progressPercent}%`}} />
      </div>
      <button onClick={togglePlay} style={styles.playPauseButton}>
        {isPlaying ? '⏸️' : '▶️'}
      </button>
    </div>
  );
};

const styles = {
  appContainer: {
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    maxWidth: 900,
    margin: '0 auto',
    background: '#121212',
    color: '#eee',
    minHeight: '100vh',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent:'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    borderBottom: '1px solid #333',
    paddingBottom: '0.5rem',
  },
  logo: {
    fontSize: '1.5rem',
    color: '#1DB954',
  },
  welcome: {
    marginRight: '1rem',
    fontWeight: 'bold'
  },
  logoutButton: {
    background: '#ef4444',
    border: 'none',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: 8,
    cursor: 'pointer',
  },
  main: {
    flex: 1
  },
  section: {
    marginBottom: '2rem',
  },
  trackList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  trackItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem',
    borderBottom: '1px solid #333',
    alignItems: 'center',
    borderRadius: 8,
  },
  trackInfo: {
    flex: 1,
    marginRight: '1rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  buttonSmall: {
    marginRight: 8,
    backgroundColor: '#1DB954',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: 6,
    cursor: 'pointer',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '0.85rem',
  },
  buttonDelete: {
    backgroundColor: '#ef4444',
  },
  loginContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#121212',
  },
  loginForm: {
    background: '#222',
    padding: '2rem',
    borderRadius: 12,
    color: 'white',
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: '0.75rem',
    marginBottom: '1rem',
    borderRadius: 6,
    border: 'none',
    fontSize: '1rem',
  },
  buttonPrimary: {
    backgroundColor: '#1DB954',
    border: 'none',
    borderRadius: 8,
    padding: '0.75rem',
    cursor: 'pointer',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '1rem',
    transition: 'background-color 0.3s',
  },
  uploadForm: {
    display: 'flex',
    flexDirection: 'column',
  },
  checkboxLabel: {
    marginBottom: '1rem',
    userSelect: 'none',
  },
  fileInputLabel: {
    backgroundColor: '#333',
    padding: '0.75rem',
    borderRadius: 8,
    color: '#eee',
    fontWeight: 'bold',
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: 8,
  },
  selectedFile: {
    color: '#1DB954',
    marginBottom: 8,
  },
  audioPlayer: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: '1rem',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    maxWidth: 900,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    color: '#eee',
    boxShadow: '0 -2px 10px rgba(0,0,0,.7)',
    zIndex: 1000,
  },
  playerInfo: {
    flex: 1,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  progressBar: {
    flex: 3,
    height: '6px',
    backgroundColor: '#333',
    borderRadius: '3px',
    cursor: 'pointer',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1DB954',
    borderRadius: '3px',
  },
  playPauseButton: {
    fontSize: '1.5rem',
    background: 'none',
    border: 'none',
    color: '#1DB954',
    cursor: 'pointer',
  }
};

export default MusicManagerApp;

