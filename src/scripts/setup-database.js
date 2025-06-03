import { Client, Databases, Storage } from 'appwrite';
import { ID, Permission, Role } from 'appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('67bb24ad002378e79e38')
    .setKey('YOUR_API_KEY_HERE'); // Remplacez par votre clé API

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = 'netflix-pwa-db';

async function setupDatabase() {
    console.log('🚀 Configuration de la base de données Appwrite...');

    try {
        // 1. Créer la base de données
        console.log('📊 Création de la base de données...');
        await databases.create(DATABASE_ID, 'Netflix PWA Database');
        console.log('✅ Base de données créée');

        // 2. Créer la collection Movies
        console.log('🎬 Création de la collection Movies...');
        await databases.createCollection(
            DATABASE_ID,
            'movies',
            'Movies',
            [
                Permission.read(Role.any()),
                Permission.write(Role.users())
            ]
        );

        // Attributs pour Movies
        const movieAttributes = [
            { key: 'title', type: 'string', size: 255, required: true },
            { key: 'description', type: 'string', size: 1000, required: true },
            { key: 'poster', type: 'url', required: true },
            { key: 'trailer', type: 'url', required: false },
            { key: 'genre', type: 'string', size: 100, required: true },
            { key: 'year', type: 'integer', required: true },
            { key: 'rating', type: 'double', required: true },
            { key: 'duration', type: 'integer', required: true },
            { key: 'director', type: 'string', size: 255, required: true },
            { key: 'cast', type: 'string', size: 1000, required: false, array: true },
            { key: 'categoryId', type: 'string', size: 50, required: true }
        ];

        for (const attr of movieAttributes) {
            if (attr.type === 'string') {
                await databases.createStringAttribute(
                    DATABASE_ID, 'movies', attr.key, attr.size, attr.required, null, attr.array || false
                );
            } else if (attr.type === 'integer') {
                await databases.createIntegerAttribute(
                    DATABASE_ID, 'movies', attr.key, attr.required
                );
            } else if (attr.type === 'double') {
                await databases.createFloatAttribute(
                    DATABASE_ID, 'movies', attr.key, attr.required
                );
            } else if (attr.type === 'url') {
                await databases.createUrlAttribute(
                    DATABASE_ID, 'movies', attr.key, attr.required
                );
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // Délai entre les attributs
        }

        // 3. Créer la collection Categories
        console.log('📂 Création de la collection Categories...');
        await databases.createCollection(
            DATABASE_ID,
            'categories',
            'Categories',
            [
                Permission.read(Role.any()),
                Permission.write(Role.users())
            ]
        );

        await databases.createStringAttribute(DATABASE_ID, 'categories', 'name', 100, true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await databases.createStringAttribute(DATABASE_ID, 'categories', 'description', 500, false);

        // 4. Créer la collection Watchlist
        console.log('📝 Création de la collection Watchlist...');
        await databases.createCollection(
            DATABASE_ID,
            'watchlist',
            'Watchlist',
            [
                Permission.read(Role.users()),
                Permission.write(Role.users())
            ]
        );

        await databases.createStringAttribute(DATABASE_ID, 'watchlist', 'userId', 50, true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await databases.createStringAttribute(DATABASE_ID, 'watchlist', 'movieId', 50, true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await databases.createDatetimeAttribute(DATABASE_ID, 'watchlist', 'addedAt', true);

        // 5. Créer la collection Reviews
        console.log('⭐ Création de la collection Reviews...');
        await databases.createCollection(
            DATABASE_ID,
            'reviews',
            'Reviews',
            [
                Permission.read(Role.any()),
                Permission.write(Role.users())
            ]
        );

        await databases.createStringAttribute(DATABASE_ID, 'reviews', 'userId', 50, true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await databases.createStringAttribute(DATABASE_ID, 'reviews', 'movieId', 50, true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await databases.createStringAttribute(DATABASE_ID, 'reviews', 'content', 1000, true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await databases.createIntegerAttribute(DATABASE_ID, 'reviews', 'rating', true);

        // 6. Créer les buckets de stockage
        console.log('🗂️ Création des buckets de stockage...');
        
        await storage.createBucket(
            'movie-posters',
            'Movie Posters',
            [
                Permission.read(Role.any()),
                Permission.write(Role.users())
            ]
        );

        await storage.createBucket(
            'user-avatars',
            'User Avatars',
            [
                Permission.read(Role.any()),
                Permission.write(Role.users())
            ]
        );

        console.log('🎉 Configuration de la base de données terminée !');
        console.log('📋 Collections créées:');
        console.log('   ✅ Movies - Films avec tous les détails');
        console.log('   ✅ Categories - Catégories de films');
        console.log('   ✅ Watchlist - Liste de films à regarder');
        console.log('   ✅ Reviews - Avis et notes des utilisateurs');
        console.log('📁 Buckets de stockage créés:');
        console.log('   ✅ movie-posters - Affiches de films');
        console.log('   ✅ user-avatars - Avatars des utilisateurs');

    } catch (error) {
        console.error('❌ Erreur lors de la configuration:', error);
    }
}

// Fonction pour peupler la base avec des données de test
async function populateDatabase() {
    console.log('📊 Peuplement de la base avec des données de test...');

    try {
        // Ajouter des catégories
        const categories = [
            { name: 'Action', description: 'Films d action et d aventure' },
            { name: 'Science-Fiction', description: 'Films de science-fiction' },
            { name: 'Drame', description: 'Films dramatiques' },
            { name: 'Comédie', description: 'Films comiques' },
            { name: 'Horreur', description: 'Films d horreur' },
            { name: 'Romance', description: 'Films romantiques' },
            { name: 'Crime', description: 'Films policiers et de crime' }
        ];

        for (const category of categories) {
            await databases.createDocument(DATABASE_ID, 'categories', ID.unique(), category);
        }

        // Ajouter des films
        const movies = [
            {
                title: 'Inception',
                description: 'Un thriller de science-fiction sur les reves et la realite',
                poster: 'https://via.placeholder.com/300x450/e50914/fff?text=INCEPTION',
                trailer: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
                genre: 'Science-Fiction',
                year: 2010,
                rating: 8.8,
                duration: 148,
                director: 'Christopher Nolan',
                cast: ['Leonardo DiCaprio', 'Marion Cotillard', 'Tom Hardy'],
                categoryId: 'sci-fi'
            },
            {
                title: 'The Dark Knight',
                description: 'Batman affronte le Joker dans une bataille pour l ame de Gotham',
                poster: 'https://via.placeholder.com/300x450/e50914/fff?text=BATMAN',
                trailer: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
                genre: 'Action',
                year: 2008,
                rating: 9.0,
                duration: 152,
                director: 'Christopher Nolan',
                cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
                categoryId: 'action'
            }
        ];

        for (const movie of movies) {
            await databases.createDocument(DATABASE_ID, 'movies', ID.unique(), movie);
        }

        console.log('✅ Base de données peuplée avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors du peuplement:', error);
    }
}

// Exporter les fonctions
export { setupDatabase, populateDatabase };

// Si exécuté directement
if (typeof window === 'undefined') {
    setupDatabase().then(() => populateDatabase());
}