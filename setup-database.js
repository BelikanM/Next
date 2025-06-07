import { Client, Databases, ID, Permission, Role } from "appwrite";

// Configuration Appwrite
const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("681deee80012cf6d3e15")
  .setKey("standard_4827a8ea1f5bd574cc91a18c747f0fb61af67f2f5fc5c593148c681736a6baabd225ee3b3cfcfa971315e1e7e16d3c759b2dc13426e701dc3776aa2503c61ff98fc304b2343ec53e9738695a0261cec9c0bd33818962c9319b913e20d0144c4a244685f9aa663d918b8af1debc40bd39022fcb63d474a09370bf87346118f9a7"); // Remplacez par votre clé API

const databases = new Databases(client);

const DATABASE_ID = "tiktok_db";
const USERS_COLLECTION_ID = "users";

async function createUsersCollection() {
  try {
    console.log("🚀 Création de la collection 'users'...");

    // 1. Créer la collection
    const collection = await databases.createCollection(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "users", // nom de la collection
      [
        // Permissions de lecture pour tous les utilisateurs authentifiés
        Permission.read(Role.users()),
        // Permissions d'écriture pour le propriétaire du document
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    console.log("✅ Collection créée:", collection.name);

    // 2. Créer les attributs
    console.log("📝 Création des attributs...");

    // Attribut userId (obligatoire, unique)
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "userId",
      255,
      true // required
    );
    console.log("✅ Attribut 'userId' créé");

    // Attribut name (obligatoire, searchable)
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "name",
      255,
      true // required
    );
    console.log("✅ Attribut 'name' créé");

    // Attribut email (obligatoire)
    await databases.createEmailAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "email",
      true // required
    );
    console.log("✅ Attribut 'email' créé");

    // Attribut avatar (URL de l'image)
    await databases.createUrlAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "avatar",
      false // optional
    );
    console.log("✅ Attribut 'avatar' créé");

    // Attribut bio (texte long)
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "bio",
      1000,
      false // optional
    );
    console.log("✅ Attribut 'bio' créé");

    // Attribut location
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "location",
      255,
      false // optional
    );
    console.log("✅ Attribut 'location' créé");

    // Attribut website
    await databases.createUrlAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "website",
      false // optional
    );
    console.log("✅ Attribut 'website' créé");

    // Attribut socialLinks (JSON pour stocker les liens sociaux)
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "socialLinks",
      2000,
      false, // optional
      JSON.stringify({
        instagram: "",
        twitter: "",
        youtube: "",
        spotify: ""
      }) // valeur par défaut
    );
    console.log("✅ Attribut 'socialLinks' créé");

    // Attribut isArtist (booléen)
    await databases.createBooleanAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "isArtist",
      false, // optional
      true // valeur par défaut
    );
    console.log("✅ Attribut 'isArtist' créé");

    // Attribut artistName
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "artistName",
      255,
      false // optional
    );
    console.log("✅ Attribut 'artistName' créé");

    // Attribut genre (genre musical)
    await databases.createStringAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "genre",
      100,
      false // optional
    );
    console.log("✅ Attribut 'genre' créé");

    // Attributs de statistiques
    await databases.createIntegerAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "tracksCount",
      false, // optional
      0 // valeur par défaut
    );
    console.log("✅ Attribut 'tracksCount' créé");

    await databases.createIntegerAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "followersCount",
      false, // optional
      0 // valeur par défaut
    );
    console.log("✅ Attribut 'followersCount' créé");

    await databases.createIntegerAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "totalPlays",
      false, // optional
      0 // valeur par défaut
    );
    console.log("✅ Attribut 'totalPlays' créé");

    // Attribut joinedAt (date d'inscription)
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "joinedAt",
      false // optional
    );
    console.log("✅ Attribut 'joinedAt' créé");

    // Attendre un peu pour que les attributs soient créés
    console.log("⏳ Attente de la création des attributs...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. Créer les index
    console.log("🔍 Création des index...");

    // Index unique sur userId
    await databases.createIndex(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "userId_unique",
      "unique",
      ["userId"]
    );
    console.log("✅ Index unique 'userId' créé");

    // Index de recherche sur name
    await databases.createIndex(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "name_search",
      "fulltext",
      ["name"]
    );
    console.log("✅ Index de recherche 'name' créé");

    // Index de recherche sur artistName
    await databases.createIndex(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "artistName_search",
      "fulltext",
      ["artistName"]
    );
    console.log("✅ Index de recherche 'artistName' créé");

    // Index sur email
    await databases.createIndex(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "email_index",
      "key",
      ["email"]
    );
    console.log("✅ Index 'email' créé");

    // Index sur genre
    await databases.createIndex(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "genre_index",
      "key",
      ["genre"]
    );
    console.log("✅ Index 'genre' créé");

    // Index sur isArtist
    await databases.createIndex(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "isArtist_index",
      "key",
      ["isArtist"]
    );
    console.log("✅ Index 'isArtist' créé");

    // Index composé pour les statistiques
    await databases.createIndex(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      "stats_index",
      "key",
      ["tracksCount", "followersCount", "totalPlays"]
    );
    console.log("✅ Index 'stats' créé");

    console.log("🎉 Collection 'users' créée avec succès !");
    console.log("📋 Résumé:");
    console.log("   - Collection: users");
    console.log("   - Attributs: 14 attributs créés");
    console.log("   - Index: 7 index créés");
    console.log("   - Permissions: Lecture/Écriture pour utilisateurs authentifiés");

  } catch (error) {
    console.error("❌ Erreur lors de la création:", error);
    
    // Gestion des erreurs spécifiques
    if (error.code === 409) {
      console.log("ℹ️  La collection existe déjà");
    } else if (error.code === 401) {
      console.log("🔑 Erreur d'authentification - vérifiez votre clé API");
    } else {
      console.log("💡 Détails de l'erreur:", error.message);
    }
  }
}

// Fonction pour vérifier si la collection existe
async function checkCollection() {
  try {
    const collection = await databases.getCollection(DATABASE_ID, USERS_COLLECTION_ID);
    console.log("✅ Collection 'users' existe déjà");
    console.log("📊 Attributs existants:", collection.attributes.length);
    console.log("🔍 Index existants:", collection.indexes.length);
    return true;
  } catch (error) {
    if (error.code === 404) {
      console.log("❌ Collection 'users' n'existe pas");
      return false;
    }
    throw error;
  }
}

// Fonction principale
async function setupDatabase() {
  console.log("🔧 Configuration de la base de données...");
  console.log("📍 Endpoint:", client.config.endpoint);
  console.log("🆔 Project ID:", client.config.project);
  console.log("🗄️  Database ID:", DATABASE_ID);
  console.log("📁 Collection ID:", USERS_COLLECTION_ID);
  console.log("---");

  const exists = await checkCollection();
  
  if (!exists) {
    await createUsersCollection();
  } else {
    console.log("ℹ️  La collection existe déjà. Aucune action nécessaire.");
  }
}

// Exécuter le script
setupDatabase().catch(console.error);

export { setupDatabase, createUsersCollection };

