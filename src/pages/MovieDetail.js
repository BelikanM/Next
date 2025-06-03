import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchMovieById } from '../services/api';

const MovieDetail = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMovie = async () => {
      try {
        setLoading(true);
        const movieData = await fetchMovieById(id);
        if (movieData) {
          setMovie(movieData);
        } else {
          setError('Film non trouvé');
        }
      } catch (err) {
        setError('Erreur lors du chargement du film');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMovie();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  
  if (error) return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p style={{ color: '#e50914', fontSize: '18px' }}>{error}</p>
      <a href="/" style={{ color: '#e50914' }}>← Retour à l'accueil</a>
    </div>
  );

  if (!movie) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        <img 
          src={movie.poster} 
          alt={movie.title} 
          style={{ 
            maxWidth: '400px', 
            borderRadius: '8px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
          }}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x600/333/fff?text=Image+non+disponible';
          }}
        />
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '20px' }}>
            {movie.title}
          </h1>
          <p style={{ 
            fontSize: '18px', 
            lineHeight: '1.6', 
            marginBottom: '20px',
            color: '#ccc'
          }}>
            {movie.description}
          </p>
          <div style={{ marginBottom: '20px' }}>
            <span style={{ 
              backgroundColor: '#e50914', 
              padding: '5px 10px', 
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {movie.genre || 'Action'}
            </span>
          </div>
          <button className="btn" style={{ marginRight: '10px' }}>
            ▶ Regarder
          </button>
          <button className="btn" style={{ backgroundColor: '#666' }}>
            + Ma liste
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;