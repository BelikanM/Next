const { Client, Databases, Storage, ID, Permission, Role } = require('appwrite');

const PROJECT_ID = '67bb24ad002378e79e38';
const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const API_KEY = 'standard_3f73de9c98e0013d3f9474426e8fced16bd8b783a1c18b056d34713cd9776621781ac96561cc0e8959ec86b484952d265eb6c5b070334e400eaa91174db365f044904d82ca94cd0f5efceebe6adfd188b2502cfb6d3721ac6a3b1bd14dafda2eaa00713133b050fbc3095fc92bda0b64ddf27cef1d1737f810497aa56fd4a289';
const DATABASE_ID = 'netflix-pwa-db';

// Client administrateur
const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

// Fonction pour attendre
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function setupCompleteDatabase() {
    console.log('🚀 Configuration automatique de la base de données...');

    try {
        // 1. Créer la base de données
        console.log('📊 Création de la base de données...');
        try {
            await databases.create(DATABASE_ID, 'Netflix PWA Database');
            console.log('✅ Base de données créée');
        } catch (error) {
            if (error.code === 409) {
                console.log('ℹ️  Base de données existe déjà');
            } else {
                throw error;
            }
        }

        // 2. Créer la collection Movies
        console.log('🎬 Création de la collection Movies...');
        try {
            await databases.createCollection(
                DATABASE_ID,
                'movies',
                'Movies',
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            );
            console.log('✅ Collection Movies créée');
        } catch (error) {
            if (error.code === 409) {
                console.log('ℹ️  Collection Movies existe déjà');
            } else {
                throw error;
            }
        }

        // Attributs pour Movies
        console.log('📝 Ajout des attributs Movies...');
        const movieAttributes = [
            { key: 'title', type: 'string', size: 255, required: true },
            { key: 'description', type: 'string', size: 2000, required: true },
            { key: 'poster', type: 'url', required: true },
            { key: 'trailer', type: 'url', required: false },
            { key: 'genre', type: 'string', size: 100, required: true },
            { key: 'year', type: 'integer', required: true },
            { key: 'rating', type: 'double', required: true },
            { key: 'duration', type: 'integer', required: true },
            { key: 'director', type: 'string', size: 255, required: true },
            { key: 'cast', type: 'string', size: 2000, required: false },
            { key: 'categoryId', type: 'string', size: 50, required: true }
        ];

        for (const attr of movieAttributes) {
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(
                        DATABASE_ID, 'movies', attr.key, attr.size, attr.required
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
                console.log(`✅ Attribut ${attr.key} ajouté`);
                await wait(1000); // Attendre entre chaque attribut
            } catch (error) {
                if (error.code === 409) {
                    console.log(`ℹ️  Attribut ${attr.key} existe déjà`);
                } else {
                    console.error(`❌ Erreur attribut ${attr.key}:`, error.message);
                }
            }
        }

        // 3. Créer la collection Categories
        console.log('📂 Création de la collection Categories...');
        try {
            await databases.createCollection(
                DATABASE_ID,
                'categories',
                'Categories',
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            );
            console.log('✅ Collection Categories créée');
        } catch (error) {
            if (error.code === 409) {
                console.log('ℹ️  Collection Categories existe déjà');
            }
        }

        // Attributs Categories
        try {
            await databases.createStringAttribute(DATABASE_ID, 'categories', 'name', 100, true);
            await wait(1000);
            await databases.createStringAttribute(DATABASE_ID, 'categories', 'description', 500, false);
            console.log('✅ Attributs Categories ajoutés');
        } catch (error) {
            if (error.code !== 409) {
                console.error('❌ Erreur attributs Categories:', error.message);
            }
        }

        // 4. Créer la collection Watchlist
        console.log('📝 Création de la collection Watchlist...');
        try {
            await databases.createCollection(
                DATABASE_ID,
                'watchlist',
                'Watchlist',
                [
                    Permission.read(Role.users()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            );
            console.log('✅ Collection Watchlist créée');
        } catch (error) {
            if (error.code === 409) {
                console.log('ℹ️  Collection Watchlist existe déjà');
            }
        }

        // Attributs Watchlist
        try {
            await databases.createStringAttribute(DATABASE_ID, 'watchlist', 'userId', 50, true);
            await wait(1000);
            await databases.createStringAttribute(DATABASE_ID, 'watchlist', 'movieId', 50, true);
            await wait(1000);
            await databases.createDatetimeAttribute(DATABASE_ID, 'watchlist', 'addedAt', true);
            console.log('✅ Attributs Watchlist ajoutés');
        } catch (error) {
            if (error.code !== 409) {
                console.error('❌ Erreur attributs Watchlist:', error.message);
            }
        }

        // 5. Créer la collection Reviews
        console.log('⭐ Création de la collection Reviews...');
        try {
            await databases.createCollection(
                DATABASE_ID,
                'reviews',
                'Reviews',
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            );
            console.log('✅ Collection Reviews créée');
        } catch (error) {
            if (error.code === 409) {
                console.log('ℹ️  Collection Reviews existe déjà');
            }
        }

        // Attributs Reviews
        try {
            await databases.createStringAttribute(DATABASE_ID, 'reviews', 'userId', 50, true);
            await wait(1000);
            await databases.createStringAttribute(DATABASE_ID, 'reviews', 'movieId', 50, true);
            await wait(1000);
            await databases.createStringAttribute(DATABASE_ID, 'reviews', 'content', 2000, true);
            await wait(1000);
            await databases.createIntegerAttribute(DATABASE_ID, 'reviews', 'rating', true);
            console.log('✅ Attributs Reviews ajoutés');
        } catch (error) {
            if (error.code !== 409) {
                console.error('❌ Erreur attributs Reviews:', error.message);
            }
        }

        // 6. Créer les buckets de stockage
        console.log('🗂️ Création des buckets de stockage...');
        
        try {
            await storage.createBucket(
                'movie-posters',
                'Movie Posters',
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            );
            console.log('✅ Bucket movie-posters créé');
        } catch (error) {
            if (error.code === 409) {
                console.log('ℹ️  Bucket movie-posters existe déjà');
            }
        }

        try {
            await storage.createBucket(
                'user-avatars',
                'User Avatars',
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            );
            console.log('✅ Bucket user-avatars créé');
        } catch (error) {
            if (error.code === 409) {
                console.log('ℹ️  Bucket user-avatars existe déjà');
            }
        }

        console.log('\n🎉 CONFIGURATION TERMINÉE !');
        console.log('\n📋 Base de données créée avec :');
        console.log('   ✅ Collection Movies avec 11 attributs');
        console.log('   ✅ Collection Categories');
        console.log('   ✅ Collection Watchlist');
        console.log('   ✅ Collection Reviews');
        console.log('   ✅ Buckets de stockage');
        console.log('\n🚀 Prêt pour le peuplement des données !');

    } catch (error) {
        console.error('❌ Erreur lors de la configuration:', error);
    }
}

// Fonction pour peupler avec des données de test
async function populateWithTestData() {
    console.log('\n📊 Peuplement avec des données de test...');

    try {
        // Ajouter des catégories
        const categories = [
            { name: 'Action', description: 'Films d action et d aventure' },
            { name: 'Science-Fiction', description: 'Films de science-fiction' },
            { name: 'Drame', description: 'Films dramatiques' },
            { name: 'Comedie', description: 'Films comiques' },
            { name: 'Horreur', description: 'Films d horreur' },
            { name: 'Romance', description: 'Films romantiques' },
            { name: 'Crime', description: 'Films policiers et de crime' }
        ];

        console.log('📂 Ajout des catégories...');
        for (const category of categories) {
            try {
                await databases.createDocument(DATABASE_ID, 'categories', ID.unique(), category);
                console.log(`✅ Catégorie ${category.name} ajoutée`);
            } catch (error) {
                console.log(`ℹ️  Catégorie ${category.name} existe peut-être déjà`);
            }
        }

        // Ajouter des films
        const movies = [
            {
                title: 'Inception',
                description: 'Dom Cobb est un voleur expérimenté dans l art périlleux de l extraction, voler les secrets les plus intimes du subconscient pendant que l esprit est le plus vulnérable.',
                poster: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
                trailer: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
                genre: 'Science-Fiction',
                year: 2010,
                rating: 8.8,
                duration: 148,
                director: 'Christopher Nolan',
                cast: 'Leonardo DiCaprio, Marion Cotillard, Tom Hardy, Elliot Page',
                categoryId: 'sci-fi'
            },
            {
                title: 'The Dark Knight',
                description: 'Batman affronte le Joker, un criminel anarchiste qui veut plonger Gotham City dans le chaos.',
                poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
                trailer: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
                genre: 'Action',
                year: 2008,
                rating: 9.0,
                duration: 152,
                director: 'Christopher Nolan',
                cast: 'Christian Bale, Heath Ledger, Aaron Eckhart, Maggie Gyllenhaal',
                categoryId: 'action'
            },
            {
                title: 'Interstellar',
                description: 'Une équipe d explorateurs voyage à travers un trou de ver dans l espace dans une tentative d assurer la survie de l humanité.',
                poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
                trailer: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
                genre: 'Science-Fiction',
                year: 2014,
                rating: 8.6,
                duration: 169,
                director: 'Christopher Nolan',
                cast: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain',
                categoryId: 'sci-fi'
            },
            {
                title: 'Pulp Fiction',
                description: 'Les vies de deux tueurs à gages, d un boxeur, d un gangster et de sa femme s entremêlent dans quatre histoires de violence et de rédemption.',
                poster: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
                trailer: 'https://www.youtube.com/watch?v=s7EdQ4FqbhY',
                genre: 'Crime',
                year: 1994,
                rating: 8.9,
                duration: 154,
                director: 'Quentin Tarantino',
                cast: 'John Travolta, Uma Thurman, Samuel L. Jackson',
                categoryId: 'crime'
            },
            {
                title: 'The Matrix',
                description: 'Un programmeur informatique découvre que la réalité telle qu il la connaît n est qu une simulation informatique.',
                poster: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
                trailer: 'https://www.youtube.com/watch?v=vKQi3bBA1y8',
                genre: 'Science-Fiction',
                year: 1999,
                rating: 8.7,
                duration: 136,
                director: 'The Wachowskis',
                cast: 'Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss',
                categoryId: 'sci-fi'
            },
            {
                title: 'Forrest Gump',
                description: 'Les décennies de la vie de Forrest Gump, un homme de l Alabama au QI faible mais au grand cœur.',
                poster: 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
                trailer: 'https://www.youtube.com/watch?v=bLvqoHBptjg',
                genre: 'Drame',
                year: 1994,
                rating: 8.8,
                duration: 142,
                director: 'Robert Zemeckis',
                cast: 'Tom Hanks, Robin Wright, Gary Sinise',
                categoryId: 'drama'
            },
            {
                title: 'The Godfather',
                description: 'Le patriarche vieillissant d une dynastie du crime organisé transfère le contrôle de son empire clandestin à son fils réticent.',
                poster: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
                trailer: 'https://www.youtube.com/watch?v=sY1S34973zA',
                genre: 'Crime',
                year: 1972,
                rating: 9.2,
                duration: 175,
                director: 'Francis Ford Coppola',
                cast: 'Marlon Brando, Al Pacino, James Caan',
                categoryId: 'crime'
            },
            {
                title: 'Avatar',
                description: 'Un marine paraplégique envoyé sur la lune Pandora dans le cadre d une mission unique devient déchiré entre suivre ses ordres et protéger le monde qu il considère comme son foyer.',
                poster: 'https://image.tmdb.org/t/p/w500/6EiRUJpuoeQPghrs3YNktfnqOVh.jpg',
                trailer: 'https://www.youtube.com/watch?v=5PSNL1qE6VY',
                genre: 'Science-Fiction',
                year: 2009,
                rating: 7.8,
                duration: 162,
                director: 'James Cameron',
                cast: 'Sam Worthington, Zoe Saldana, Sigourney Weaver',
                categoryId: 'sci-fi'
            }
        ];

        console.log('🎬 Ajout des films...');
        for (const movie of movies) {
            try {
                await databases.createDocument(DATABASE_ID, 'movies', ID.unique(), movie);
                console.log(`✅ Film ${movie.title} ajouté`);
                await wait(500); // Petit délai entre chaque film
            } catch (error) {
                console.log(`ℹ️  Film ${movie.title} existe peut-être déjà`);
            }
        }

        console.log('\n🎉 DONNÉES DE TEST AJOUTÉES !');
        console.log(`   📂 ${categories.length} catégories`);
        console.log(`   🎬 ${movies.length} films avec vraies affiches TMDB`);

    } catch (error) {
        console.error('❌ Erreur lors du peuplement:', error);
    }
}

// Exécution principale
async function main() {
    await setupCompleteDatabase();
    await populateWithTestData();
    
    console.log('\n🚀 VOTRE NETFLIX PWA EST PRÊT !');
    console.log('\n📱 Lancez maintenant : npm start');
    console.log('🌐 Votre app aura de vraies données depuis Appwrite !');
}

main().catch(console.error);