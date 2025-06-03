// API simulee pour les films
const movies = [
  {
    id: 1,
    title: "Inception",
    poster: "https://via.placeholder.com/300x450/e50914/fff?text=INCEPTION",
    description: "Un thriller de science-fiction sur les reves et la realite.",
    genre: "Science-Fiction",
    year: "2010",
    rating: "8.8"
  },
  {
    id: 2,
    title: "Interstellar",
    poster: "https://via.placeholder.com/300x450/e50914/fff?text=INTERSTELLAR",
    description: "Une aventure spatiale epique pour sauver l humanite.",
    genre: "Science-Fiction",
    year: "2014",
    rating: "8.6"
  },
  {
    id: 3,
    title: "The Dark Knight",
    poster: "https://via.placeholder.com/300x450/e50914/fff?text=BATMAN",
    description: "Batman affronte le Joker dans Gotham City.",
    genre: "Action",
    year: "2008",
    rating: "9.0"
  },
  {
    id: 4,
    title: "Pulp Fiction",
    poster: "https://via.placeholder.com/300x450/e50914/fff?text=PULP+FICTION",
    description: "Histoires croisees de criminels a Los Angeles.",
    genre: "Crime",
    year: "1994",
    rating: "8.9"
  },
  {
    id: 5,
    title: "The Matrix",
    poster: "https://via.placeholder.com/300x450/e50914/fff?text=MATRIX",
    description: "La realite n est qu une simulation informatique.",
    genre: "Science-Fiction",
    year: "1999",
    rating: "8.7"
  },
  {
    id: 6,
    title: "Forrest Gump",
    poster: "https://via.placeholder.com/300x450/e50914/fff?text=FORREST+GUMP",
    description: "La vie extraordinaire d un homme ordinaire.",
    genre: "Drame",
    year: "1994",
    rating: "8.8"
  },
  {
    id: 7,
    title: "Titanic",
    poster: "https://via.placeholder.com/300x450/e50914/fff?text=TITANIC",
    description: "Histoire d amour tragique sur le celebre navire.",
    genre: "Romance",
    year: "1997",
    rating: "7.8"
  },
  {
    id: 8,
    title: "Avatar",
    poster: "https://via.placeholder.com/300x450/e50914/fff?text=AVATAR",
    description: "Aventure sur la planete Pandora.",
    genre: "Science-Fiction",
    year: "2009",
    rating: "7.8"
  }
];

// Simulation d un delai reseau
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour recuperer tous les films
export const fetchMovies = async () => {
  console.log("Chargement des films...");
  await delay(800);
  return movies;
};

// Fonction pour recuperer un film par son ID
export const fetchMovieById = async (id) => {
  console.log(`Chargement du film ID: ${id}`);
  await delay(500);
  const movieId = parseInt(id);
  return movies.find(movie => movie.id === movieId);
};

// Fonction pour rechercher des films
export const searchMovies = async (query) => {
  console.log(`Recherche: ${query}`);
  await delay(600);
  const searchTerm = query.toLowerCase();
  return movies.filter(movie => 
    movie.title.toLowerCase().includes(searchTerm) ||
    movie.description.toLowerCase().includes(searchTerm) ||
    movie.genre.toLowerCase().includes(searchTerm)
  );
};

// Fonction pour filtrer par genre
export const getMoviesByGenre = async (genre) => {
  console.log(`Films du genre: ${genre}`);
  await delay(400);
  return movies.filter(movie => 
    movie.genre.toLowerCase() === genre.toLowerCase()
  );
};

// Exporter aussi les films pour usage direct
export { movies };

// Export par defaut
export default {
  fetchMovies,
  fetchMovieById,
  searchMovies,
  getMoviesByGenre,
  movies
};