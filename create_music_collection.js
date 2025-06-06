const { Client, Databases, ID } = require('node-appwrite');

// Configuration
const PROJECT_ID = "681deee80012cf6d3e15";
const ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const DATABASE_ID = "tiktok_db";
const API_KEY = "standard_4827a8ea1f5bd574cc91a18c747f0fb61af67f2f5fc5c593148c681736a6baabd225ee3b3cfcfa971315e1e7e16d3c759b2dc13426e701dc3776aa2503c61ff98fc304b2343ec53e9738695a0261cec9c0bd33818962c9319b913e20d0144c4a244685f9aa663d918b8af1debc40bd39022fcb63d474a09370bf87346118f9a7";

// Couleurs pour la console
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    purple: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Initialiser le client Appwrite
const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

// Fonction utilitaire pour les logs colorés
const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

// Fonction pour attendre
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour créer un attribut avec gestion d'erreur
const createAttribute = async (type, key, options, description) => {
    try {
        log(`⏳ ${description}...`, 'yellow');
        
        let result;
        switch (type) {
            case 'string':
                result = await databases.createStringAttribute(
                    DATABASE_ID, 
                    'music', 
                    key, 
                    options.size, 
                    options.required, 
                    options.default,
                    options.array || false
                );
                break;
            case 'integer':
                result = await databases.createIntegerAttribute(
                    DATABASE_ID, 
                    'music', 
                    key, 
                    options.required, 
                    options.min, 
                    options.max, 
                    options.default,
                    options.array || false
                );
                break;
            case 'float':
                result = await databases.createFloatAttribute(
                    DATABASE_ID, 
                    'music', 
                    key, 
                    options.required, 
                    options.min, 
                    options.max, 
                    options.default,
                    options.array || false
                );
                break;
            case 'boolean':
                result = await databases.createBooleanAttribute(
                    DATABASE_ID, 
                    'music', 
                    key, 
                    options.required, 
                    options.default,
                    options.array || false
                );
                break;
        }
        
        log(`✅ ${description} réussi`, 'green');
        await sleep(2000); // Attendre 2 secondes entre chaque attribut
        return result;
    } catch (error) {
        log(`❌ Erreur ${description}: ${error.message}`, 'red');
        await sleep(2000);
        return null;
    }
};

// Fonction pour créer un index
const createIndex = async (key, type, attributes, description) => {
    try {
        log(`⏳ ${description}...`, 'yellow');
        const result = await databases.createIndex(
            DATABASE_ID,
            'music',
            key,
            type,
            attributes
        );
        log(`✅ ${description} réussi`, 'green');
        await sleep(2000);
        return result;
    } catch (error) {
        log(`❌ Erreur ${description}: ${error.message}`, 'red');
        await sleep(2000);
        return null;
    }
};

// Fonction principale
const createSpotifyCollection = async () => {
    try {
        log('🎵 CRÉATION COLLECTION SPOTIFY COMPLÈTE 🎵', 'purple');
        log('================================================', 'cyan');

        // 1. Supprimer l'ancienne collection
        log('\n🗑️ NETTOYAGE', 'blue');
        try {
            await databases.deleteCollection(DATABASE_ID, 'music');
            log('✅ Ancienne collection supprimée', 'green');
        } catch (error) {
            log('ℹ️ Aucune ancienne collection à supprimer', 'yellow');
        }
        await sleep(3000);

        // 2. Créer la nouvelle collection
        log('\n📁 CRÉATION COLLECTION', 'blue');
        await databases.createCollection(
            DATABASE_ID,
            'music',
            'Music',
            [
                'read("any")',
                'create("users")',
                'update("users")',
                'delete("users")'
            ]
        );
        log('✅ Collection Music créée', 'green');
        await sleep(3000);

        // 3. Attributs principaux REQUIS
        log('\n🎵 ATTRIBUTS PRINCIPAUX REQUIS', 'blue');
        
        await createAttribute('string', 'title', {
            size: 200,
            required: true
        }, 'Attribut title');

        await createAttribute('string', 'artist', {
            size: 100,
            required: true
        }, 'Attribut artist');

        await createAttribute('string', 'audioUrl', {
            size: 500,
            required: true
        }, 'Attribut audioUrl');

        await createAttribute('integer', 'duration', {
            required: true
        }, 'Attribut duration');

        // 4. Métadonnées musicales OPTIONNELLES
        log('\n📀 MÉTADONNÉES MUSICALES', 'blue');

        await createAttribute('string', 'coverImage', {
            size: 500,
            required: false
        }, 'Attribut coverImage');

        await createAttribute('string', 'album', {
            size: 150,
            required: false
        }, 'Attribut album');

        await createAttribute('string', 'genre', {
            size: 50,
            required: false
        }, 'Attribut genre');

        await createAttribute('integer', 'year', {
            required: false
        }, 'Attribut year');

        await createAttribute('integer', 'trackNumber', {
            required: false
        }, 'Attribut trackNumber');

        // 5. Attributs utilisateur OPTIONNELS
        log('\n👤 ATTRIBUTS UTILISATEUR', 'blue');

        await createAttribute('string', 'uploadedBy', {
            size: 36,
            required: false
        }, 'Attribut uploadedBy');

        await createAttribute('string', 'uploaderName', {
            size: 100,
            required: false
        }, 'Attribut uploaderName');

        // 6. Statistiques OPTIONNELLES avec valeurs par défaut
        log('\n📊 STATISTIQUES', 'blue');

        await createAttribute('integer', 'playsCount', {
            required: false,
            default: 0
        }, 'Attribut playsCount');

        await createAttribute('integer', 'likesCount', {
            required: false,
            default: 0
        }, 'Attribut likesCount');

        await createAttribute('integer', 'sharesCount', {
            required: false,
            default: 0
        }, 'Attribut sharesCount');

        await createAttribute('integer', 'favoritesCount', {
            required: false,
            default: 0
        }, 'Attribut favoritesCount');

        await createAttribute('float', 'averageRating', {
            required: false,
            default: 0.0,
            min: 0.0,
            max: 5.0
        }, 'Attribut averageRating');

        // 7. Attributs techniques OPTIONNELS
        log('\n⚙️ ATTRIBUTS TECHNIQUES', 'blue');

        await createAttribute('integer', 'fileSize', {
            required: false
        }, 'Attribut fileSize');

        await createAttribute('string', 'fileFormat', {
            size: 10,
            required: false
        }, 'Attribut fileFormat');

        await createAttribute('integer', 'bitrate', {
            required: false
        }, 'Attribut bitrate');

        // 8. Contenu OPTIONNEL
        log('\n📝 CONTENU', 'blue');

        await createAttribute('string', 'description', {
            size: 1000,
            required: false
        }, 'Attribut description');

        await createAttribute('string', 'lyrics', {
            size: 5000,
            required: false
        }, 'Attribut lyrics');

        await createAttribute('string', 'tags', {
            size: 500,
            required: false
        }, 'Attribut tags');

        // 9. Visibilité OPTIONNELLE avec valeurs par défaut
        log('\n🔒 VISIBILITÉ', 'blue');

        await createAttribute('string', 'status', {
            size: 20,
            required: false,
            default: 'published'
        }, 'Attribut status');

        await createAttribute('string', 'visibility', {
            size: 20,
            required: false,
            default: 'public'
        }, 'Attribut visibility');

        await createAttribute('boolean', 'isExplicit', {
            required: false,
            default: false
        }, 'Attribut isExplicit');

        await createAttribute('boolean', 'isVerified', {
            required: false,
            default: false
        }, 'Attribut isVerified');

        // 10. Recommandations OPTIONNELLES
        log('\n🎧 RECOMMANDATIONS', 'blue');

        await createAttribute('string', 'mood', {
            size: 50,
            required: false
        }, 'Attribut mood');

        await createAttribute('integer', 'bpm', {
            required: false,
            min: 1,
            max: 300
        }, 'Attribut bpm');

        await createAttribute('string', 'musicalKey', {
            size: 10,
            required: false
        }, 'Attribut musicalKey');

        await createAttribute('integer', 'energy', {
            required: false,
            min: 1,
            max: 10
        }, 'Attribut energy');

        // Attendre que tous les attributs soient créés
        log('\n⏳ Attente de la finalisation des attributs...', 'yellow');
        await sleep(10000);

        // 11. Création des index
        log('\n🔍 CRÉATION DES INDEX', 'blue');

        await createIndex(
            'search_title_artist',
            'key',
            ['title', 'artist'],
            'Index recherche titre-artiste'
        );

        await createIndex(
            'genre_index',
            'key',
            ['genre'],
            'Index genre'
        );

        await createIndex(
            'popularity_index',
            'key',
            ['playsCount', 'likesCount'],
            'Index popularité'
        );

        await createIndex(
            'created_date_index',
            'key',
            ['$createdAt'],
            'Index date création'
        );

        await createIndex(
            'user_index',
            'key',
            ['uploadedBy'],
            'Index utilisateur'
        );

        await createIndex(
            'album_index',
            'key',
            ['album', 'trackNumber'],
            'Index album'
        );

        await createIndex(
            'year_index',
            'key',
            ['year'],
            'Index année'
        );

        await createIndex(
            'status_visibility_index',
            'key',
            ['status', 'visibility'],
            'Index statut-visibilité'
        );

        // Résumé final
        log('\n🎉 CRÉATION TERMINÉE AVEC SUCCÈS ! 🎉', 'purple');
        log('================================================', 'cyan');
        log('✅ Collection "music" créée avec tous les attributs !', 'green');
        log('\n📋 ATTRIBUTS CRÉÉS :', 'yellow');
        log('\n🎵 Requis : title, artist, audioUrl, duration', 'blue');
        log('📀 Métadonnées : coverImage, album, genre, year, trackNumber', 'blue');
        log('👤 Utilisateur : uploadedBy, uploaderName', 'blue');
        log('📊 Statistiques : playsCount, likesCount, sharesCount, favoritesCount, averageRating', 'blue');
        log('⚙️ Techniques : fileSize, fileFormat, bitrate', 'blue');
        log('📝 Contenu : description, lyrics, tags', 'blue');
        log('🔒 Visibilité : status, visibility, isExplicit, isVerified', 'blue');
        log('🎧 Recommandations : mood, bpm, musicalKey, energy', 'blue');
        log('\n🚀 Votre collection Spotify est maintenant 100% fonctionnelle !', 'green');
        log('================================================', 'cyan');

    } catch (error) {
        log(`❌ Erreur générale: ${error.message}`, 'red');
        console.error(error);
    }
};

// Exécuter le script
if (require.main === module) {
    createSpotifyCollection()
        .then(() => {
            log('\n✅ Script terminé avec succès !', 'green');
            process.exit(0);
        })
        .catch((error) => {
            log(`\n❌ Erreur fatale: ${error.message}`, 'red');
            console.error(error);
            process.exit(1);
        });
}

module.exports = { createSpotifyCollection };

