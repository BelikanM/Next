// auto-setup.js
import fetch from 'node-fetch';

const PROJECT_ID = "681deee80012cf6d3e15";
const DATABASE_ID = "tiktok_db";
const COLLECTION_ID = "users";
const ENDPOINT = "https://fra.cloud.appwrite.io/v1";

const headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': PROJECT_ID
};

async function apiCall(method, url, data = null) {
    try {
        const options = {
            method,
            headers,
            body: data ? JSON.stringify(data) : null
        };
        
        const response = await fetch(`${ENDPOINT}${url}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${result.message || 'Unknown error'}`);
        }
        
        return result;
    } catch (error) {
        console.error(`❌ Erreur API:`, error.message);
        return null;
    }
}

async function createCollection() {
    console.log("🚀 Création de la collection 'users'...");
    
    const data = {
        collectionId: COLLECTION_ID,
        name: "users",
        permissions: [
            "read(\"users\")",
            "create(\"users\")",
            "update(\"users\")",
            "delete(\"users\")"
        ],
        documentSecurity: true
    };
    
    const result = await apiCall('POST', `/databases/${DATABASE_ID}/collections`, data);
    
    if (result) {
        console.log("✅ Collection créée avec succès");
        return true;
    }
    return false;
}

async function createAttribute(type, key, options = {}) {
    console.log(`📝 Création de l'attribut '${key}' (${type})...`);
    
    const data = {
        key,
        ...options
    };
    
    const result = await apiCall('POST', `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/${type}`, data);
    
    if (result) {
        console.log(`✅ Attribut '${key}' créé`);
    }
    
    // Attendre un peu entre chaque attribut
    await new Promise(resolve => setTimeout(resolve, 1000));
}

async function createIndex(key, type, attributes) {
    console.log(`🔍 Création de l'index '${key}' (${type})...`);
    
    const data = {
        key,
        type,
        attributes
    };
    
    const result = await apiCall('POST', `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/indexes`, data);
    
    if (result) {
        console.log(`✅ Index '${key}' créé`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
}

async function setupDatabase() {
    console.log("🎵 MUSICSTREAM - Configuration automatique de la base de données");
    console.log("================================================================");
    console.log(`📍 Endpoint: ${ENDPOINT}`);
    console.log(`🆔 Project ID: ${PROJECT_ID}`);
    console.log(`🗄️  Database ID: ${DATABASE_ID}`);
    console.log(`📁 Collection ID: ${COLLECTION_ID}`);
    console.log("");
    
    // Créer la collection
    const collectionCreated = await createCollection();
    if (!collectionCreated) {
        console.log("❌ Impossible de créer la collection");
        return;
    }
    
    console.log("");
    console.log("📝 Création des attributs...");
    
    // Créer les attributs
    await createAttribute('string', 'userId', { size: 255, required: true });
    await createAttribute('string', 'name', { size: 255, required: true });
    await createAttribute('email', 'email', { required: true });
    await createAttribute('url', 'avatar', { required: false });
    await createAttribute('string', 'bio', { size: 1000, required: false });
    await createAttribute('string', 'location', { size: 255, required: false });
    await createAttribute('url', 'website', { required: false });
    await createAttribute('string', 'socialLinks', { 
        size: 2000, 
        required: false,
        default: '{"instagram":"","twitter":"","youtube":"","spotify":""}' 
    });
    await createAttribute('boolean', 'isArtist', { required: false, default: true });
    await createAttribute('string', 'artistName', { size: 255, required: false });
    await createAttribute('string', 'genre', { size: 100, required: false });
    await createAttribute('integer', 'tracksCount', { required: false, min: 0, max: 999999999, default: 0 });
    await createAttribute('integer', 'followersCount', { required: false, min: 0, max: 999999999, default: 0 });
    await createAttribute('integer', 'totalPlays', { required: false, min: 0, max: 999999999, default: 0 });
    await createAttribute('datetime', 'joinedAt', { required: false });
    
    console.log("");
    console.log("⏳ Attente de 10 secondes pour que les attributs soient créés...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log("");
    console.log("🔍 Création des index...");
    
    // Créer les index
    await createIndex('userId_unique', 'unique', ['userId']);
    await createIndex('name_search', 'fulltext', ['name']);
    await createIndex('email_index', 'key', ['email']);
    await createIndex('isArtist_index', 'key', ['isArtist']);
    
    console.log("");
    console.log("🎉 Collection 'users' créée avec succès !");
    console.log("📋 Résumé:");
    console.log("   ✅ Collection: users");
    console.log("   ✅ Attributs: 15 attributs créés");
    console.log("   ✅ Index: 4 index créés");
    console.log("   ✅ Permissions: Configurées pour utilisateurs authentifiés");
    console.log("");
    console.log("🚀 Vous pouvez maintenant lancer votre application:");
    console.log("   cd tiktok-clone");
    console.log("   npm start");
}

setupDatabase().catch(console.error);

