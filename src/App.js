import React from 'react';
import './App.css';
import { movieService, categoryService } from './services/appwrite';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      movies: [],
      categories: [],
      selectedMovie: null,
      loading: true,
      error: null,
      searchQuery: ''
    };
  }

  async componentDidMount() {
    await this.loadData();
  }

  loadData = async () => {
    try {
      this.setState({ loading: true, error: null });
      
      console.log('🔄 Chargement des données depuis Appwrite...');
      
      const [movies, categories] = await Promise.all([
        movieService.getMovies(),
        categoryService.getCategories()
      ]);
      
      console.log(`✅ ${movies.length} films et ${categories.length} catégories chargés`);
      
      this.setState({ 
        movies, 
        categories, 
        loading: false 
      });
      
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      this.setState({ 
        error: 'Erreur de connexion à Appwrite',
        loading: false 
      });
    }
  }

  selectMovie = (movie) => {
    this.setState({ selectedMovie: movie });
  }

  goHome = () => {
    this.setState({ selectedMovie: null });
  }

  handleSearch = async (query) => {
    if (!query.trim()) {
      await this.loadData();
      return;
    }
    
    try {
      this.setState({ loading: true });
      const movies = await movieService.searchMovies(query);
      this.setState({ movies, loading: false });
    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      this.setState({ loading: false });
    }
  }

  filterByGenre = async (genre) => {
    try {
      this.setState({ loading: true });
      const movies = await movieService.getMoviesByGenre(genre);
      this.setState({ movies, loading: false });
    } catch (error) {
      console.error('❌ Erreur filtre genre:', error);
      this.setState({ loading: false });
    }
  }

  render() {
    const { movies, categories, selectedMovie, loading, error } = this.state;

    if (loading) {
      return React.createElement(LoadingScreen);
    }

    if (error) {
      return React.createElement(ErrorScreen, { 
        error, 
        onRetry: this.loadData 
      });
    }

    return React.createElement('div', { className: 'App' },
      // Header
      React.createElement('header', { className: 'header' },
        React.createElement('h1', { 
          className: 'logo',
          onClick: this.goHome 
        }, 'NETFLIX PWA'),
        React.createElement('nav', { className: 'nav' },
          React.createElement('button', {
            className: 'nav-btn',
            onClick: this.goHome
          }, 'Accueil'),
          React.createElement('button', {
            className: 'nav-btn',
            onClick: this.loadData
          }, '🔄 Actualiser')
        )
      ),

      // Main Content
      React.createElement('main', { className: 'main-content' },
        selectedMovie ? 
          React.createElement(MovieDetail, {
            movie: selectedMovie,
            onBack: this.goHome
          }) :
          React.createElement('div', null,
            // Hero Section
            React.createElement('section', { className: 'hero-section' },
              React.createElement('div', { className: 'hero-content' },
                React.createElement('h1', null, 'Netflix PWA + Appwrite'),
                React.createElement('p', null, 'Base de données cloud en temps réel'),
                React.createElement('div', { className: 'hero-stats' },
                  React.createElement('span', null, `${movies.length} Films`),
                  React.createElement('span', null, `${categories.length} Catégories`),
                  React.createElement('span', null, '☁️ Cloud Database')
                )
              )
            ),
            
            // Search Section
            React.createElement('section', { className: 'search-section' },
              React.createElement('div', { className: 'search-container' },
                React.createElement('input', {
                  type: 'text',
                  placeholder: 'Rechercher un film...',
                  className: 'search-input',
                  onChange: (e) => {
                    const query = e.target.value;
                    this.setState({ searchQuery: query });
                    if (query.length > 2) {
                      this.handleSearch(query);
                    } else if (query.length === 0) {
                      this.loadData();
                    }
                  }
                }),
                React.createElement('button', {
                  className: 'search-btn',
                  onClick: () => this.handleSearch(this.state.searchQuery)
                }, '🔍')
              )
            ),
            
            // Genre Filter
            React.createElement('section', { className: 'genre-section' },
              React.createElement('h3', null, 'Filtrer par genre:'),
              React.createElement('div', { className: 'genre-buttons' },
                React.createElement('button', {
                  className: 'genre-btn',
                  onClick: this.loadData
                }, 'Tous'),
                React.createElement('button', {
                  className: 'genre-btn',
                  onClick: () => this.filterByGenre('Action')
                }, 'Action'),
                React.createElement('button', {
                  className: 'genre-btn',
                  onClick: () => this.filterByGenre('Science-Fiction')
                }, 'Sci-Fi'),
                React.createElement('button', {
                  className: 'genre-btn',
                  onClick: () => this.filterByGenre('Drame')
                }, 'Drame'),
                React.createElement('button', {
                  className: 'genre-btn',
                  onClick: () => this.filterByGenre('Crime')
                }, 'Crime')
              )
            ),
            
            // Movies Section
            React.createElement('section', { className: 'movies-section' },
              React.createElement('h2', null, `Films (${movies.length})`),
              movies.length === 0 ? 
                React.createElement('div', { className: 'no-movies' },
                  React.createElement('p', null, 'Aucun film trouvé'),
                  React.createElement('button', {
                    className: 'retry-btn',
                    onClick: this.loadData
                  }, 'Recharger')
                ) :
                React.createElement('div', { className: 'movies-grid' },
                  ...movies.map(movie =>
                    React.createElement(MovieCard, {
                      key: movie.$id || movie.id,
                      movie: movie,
                      onClick: () => this.selectMovie(movie)
                    })
                  )
                )
            )
          )
      )
    );
  }
}

// Composants...
class LoadingScreen extends React.Component {
  render() {
    return React.createElement('div', { className: 'loading-screen' },
      React.createElement('div', { className: 'loading-spinner' }),
      React.createElement('h2', null, 'Connexion à Appwrite...'),
      React.createElement('p', null, 'Chargement depuis le cloud ☁️')
    );
  }
}

class ErrorScreen extends React.Component {
  render() {
    const { error, onRetry } = this.props;
    
    return React.createElement('div', { className: 'error-screen' },
      React.createElement('h2', null, '⚠️ Erreur Appwrite'),
      React.createElement('p', null, error),
      React.createElement('p', null, 'Vérifiez que la base de données est configurée'),
      React.createElement('button', {
        className: 'retry-button',
        onClick: onRetry
      }, 'Réessayer'),
      React.createElement('p', { className: 'help-text' },
        'Exécutez: node src/scripts/auto-setup.js'
      )
    );
  }
}

class MovieCard extends React.Component {
  render() {
    const { movie, onClick } = this.props;
    
    return React.createElement('div', {
      className: 'movie-card',
      onClick: onClick
    },
      React.createElement('img', {
        src: movie.poster,
        alt: movie.title,
        className: 'movie-poster',
        onError: (e) => {
          e.target.src = 'https://via.placeholder.com/300x450/e50914/fff?text=' + encodeURIComponent(movie.title);
        }
      }),
      React.createElement('div', { className: 'movie-info' },
        React.createElement('h3', null, movie.title),
        React.createElement('div', { className: 'movie-meta' },
          React.createElement('span', { className: 'movie-genre' }, movie.genre),
          React.createElement('span', { className: 'movie-year' }, movie.year),
          React.createElement('span', { className: 'movie-rating' }, `⭐ ${movie.rating}`)
        )
      )
    );
  }
}

class MovieDetail extends React.Component {
  render() {
    const { movie, onBack } = this.props;
    
    return React.createElement('div', { className: 'movie-detail' },
      React.createElement('button', {
        className: 'back-button',
        onClick: onBack
      }, '← Retour'),
      
      React.createElement('div', { className: 'movie-detail-content' },
        React.createElement('img', {
          src: movie.poster,
          alt: movie.title,
          className: 'movie-detail-poster',
          onError: (e) => {
            e.target.src = 'https://via.placeholder.com/400x600/e50914/fff?text=' + encodeURIComponent(movie.title);
          }
        }),
        React.createElement('div', { className: 'movie-detail-info' },
          React.createElement('h1', null, movie.title),
          React.createElement('div', { className: 'movie-stats' },
            React.createElement('span', null, `${movie.year} • ${movie.duration}min • ⭐ ${movie.rating}`),
            React.createElement('span', { className: 'director' }, `Réalisé par ${movie.director}`)
          ),
          React.createElement('p', { className: 'movie-description' }, movie.description),
          React.createElement('div', { className: 'movie-meta' },
            React.createElement('span', { className: 'genre-tag' }, movie.genre)
          ),
          movie.cast && React.createElement('div', { className: 'cast-info' },
            React.createElement('h4', null, 'Casting:'),
            React.createElement('p', null, movie.cast)
          ),
          React.createElement('div', { className: 'action-buttons' },
            React.createElement('button', { className: 'play-button' }, '▶ Regarder'),
            React.createElement('button', { className: 'list-button' }, '+ Ma liste'),
            movie.trailer && React.createElement('a', {
              href: movie.trailer,
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'trailer-button'
            }, '🎬 Bande-annonce')
          )
        )
      )
    );
  }
}

export default App;