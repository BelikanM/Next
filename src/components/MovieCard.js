import React from 'react';
import { Link } from 'react-router-dom';

const MovieCard = ({ movie }) => (
  <div style={{ 
    width: '100%', 
    margin: '10px',
    transition: 'transform 0.3s ease',
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
  >
    <Link to={`/movie/${movie.id}`} style={{ textDecoration: 'none', color: 'white' }}>
      <img 
        src={movie.poster} 
        alt={movie.title} 
        style={{ 
          width: '100%', 
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/300x450/333/fff?text=Image+non+disponible';
        }}
      />
      <h4 style={{ 
        marginTop: '10px', 
        fontSize: '14px',
        textAlign: 'center'
      }}>
        {movie.title}
      </h4>
    </Link>
  </div>
);

export default MovieCard;