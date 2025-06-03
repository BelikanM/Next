import React, { useEffect, useState } from 'react';
import MovieList from '../components/MovieList';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchMovies } from '../services/api';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoading(true);
        const moviesData = await fetchMovies();
        setMovies(moviesData);
      } catch (err) {
        setError('Erreur lors du chargement des films');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  if (loading) return <LoadingSpinner />;
  
  if (error) return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p style={{ color: '#e50914', fontSize: '18px' }}>{error}</p>
    </div>
  );

  return (
    <div>
      <div style={{
        background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
            Bienvenue sur Netflix PWA
          </h1>
          <p style={{ fontSize: '20px', maxWidth: '600px' }}>
            Découvrez des milliers de films et séries en streaming
          </p>
        </div>
      </div>
      <MovieList movies={movies} title="Films Populaires" />
    </div>
  );
};

export default Home;