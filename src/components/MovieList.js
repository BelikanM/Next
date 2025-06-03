import React from 'react';
import MovieCard from './MovieCard';

const MovieList = ({ movies, title = "Films" }) => (
  <div style={{ padding: '20px' }}>
    <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>{title}</h2>
    <div className="movie-grid">
      {movies.map(movie => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
    {movies.length === 0 && (
      <p style={{ textAlign: 'center', color: '#666', fontSize: '18px' }}>
        Aucun film disponible
      </p>
    )}
  </div>
);

export default MovieList;