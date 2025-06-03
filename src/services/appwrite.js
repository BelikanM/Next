import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query, ID } from 'appwrite';

// Service pour les films
export class MovieService {
    async getMovies() {
        try {
            console.log('🎬 Récupération des films depuis Appwrite...');
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.MOVIES,
                [
                    Query.orderDesc('$createdAt'),
                    Query.limit(50)
                ]
            );
            console.log(`✅ ${response.documents.length} films récupérés`);
            return response.documents;
        } catch (error) {
            console.error('❌ Erreur récupération films:', error);
            return this.getFallbackMovies();
        }
    }

    async getMovieById(movieId) {
        try {
            const movie = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.MOVIES,
                movieId
            );
            return movie;
        } catch (error) {
            console.error('❌ Erreur récupération film:', error);
            return this.getFallbackMovies().find(m => m.id === movieId);
        }
    }

    async searchMovies(query) {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.MOVIES,
                [
                    Query.search('title', query),
                    Query.limit(20)
                ]
            );
            return response.documents;
        } catch (error) {
            console.error('❌ Erreur recherche films:', error);
            return this.getFallbackMovies().filter(movie => 
                movie.title.toLowerCase().includes(query.toLowerCase())
            );
        }
    }

    async getMoviesByGenre(genre) {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.MOVIES,
                [
                    Query.equal('genre', genre),
                    Query.limit(30)
                ]
            );
            return response.documents;
        } catch (error) {
            console.error('❌ Erreur films par genre:', error);
            return this.getFallbackMovies().filter(movie => 
                movie.genre.toLowerCase() === genre.toLowerCase()
            );
        }
    }

    // Données de fallback avec vraies affiches
    getFallbackMovies() {
        return [
            {
                id: '1',
                title: 'Inception',
                description: 'Dom Cobb est un voleur expérimenté dans l art périlleux de l extraction.',
                poster: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
                trailer: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
                genre: 'Science-Fiction',
                year: 2010,
                rating: 8.8,
                duration: 148,
                director: 'Christopher Nolan',
                cast: 'Leonardo DiCaprio, Marion Cotillard, Tom Hardy'
            },
            {
                id: '2',
                title: 'The Dark Knight',
                description: 'Batman affronte le Joker dans une bataille pour l ame de Gotham.',
                poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
                trailer: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
                genre: 'Action',
                year: 2008,
                rating: 9.0,
                duration: 152,
                director: 'Christopher Nolan',
                cast: 'Christian Bale, Heath Ledger, Aaron Eckhart'
            },
            {
                id: '3',
                title: 'Interstellar',
                description: 'Une équipe d explorateurs voyage à travers un trou de ver dans l espace.',
                poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
                trailer: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
                genre: 'Science-Fiction',
                year: 2014,
                rating: 8.6,
                duration: 169,
                director: 'Christopher Nolan',
                cast: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain'
            },
            {
                id: '4',
                title: 'The Matrix',
                description: 'Un programmeur découvre que la réalité n est qu une simulation.',
                poster: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
                trailer: 'https://www.youtube.com/watch?v=vKQi3bBA1y8',
                genre: 'Science-Fiction',
                year: 1999,
                rating: 8.7,
                duration: 136,
                director: 'The Wachowskis',
                cast: 'Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss'
            }
        ];
    }
}

// Service pour les catégories
export class CategoryService {
    async getCategories() {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.CATEGORIES
            );
            return response.documents;
        } catch (error) {
            console.error('❌ Erreur récupération catégories:', error);
            return [
                { id: 'action', name: 'Action', description: 'Films d action' },
                { id: 'sci-fi', name: 'Science-Fiction', description: 'Films de science-fiction' },
                { id: 'drama', name: 'Drame', description: 'Films dramatiques' },
                { id: 'comedy', name: 'Comédie', description: 'Films comiques' }
            ];
        }
    }
}

// Instances des services
export const movieService = new MovieService();
export const categoryService = new CategoryService();