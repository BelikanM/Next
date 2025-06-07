// simple-setup.js
console.log(`
🎵 MUSICSTREAM - Configuration de la base de données

Pour créer la collection 'users', suivez ces étapes :

1. 📱 Ouvrez la console Appwrite : https://fra.cloud.appwrite.io/console
2. 🎯 Sélectionnez votre projet : 681deee80012cf6d3e15
3. 🗄️  Allez dans Databases > tiktok_db
4. ➕ Cliquez sur "Create Collection"
5. 📝 Collection ID: users
6. 📝 Name: users

7. 🔧 Ajoutez ces attributs :

   userId          | String(255)    | Required | Unique
   name            | String(255)    | Required
   email           | Email          | Required
   avatar          | URL            | Optional
   bio             | String(1000)   | Optional
   location        | String(255)    | Optional
   website         | URL            | Optional
   socialLinks     | String(2000)   | Optional
   isArtist        | Boolean        | Optional | Default: true
   artistName      | String(255)    | Optional
   genre           | String(100)    | Optional
   tracksCount     | Integer        | Optional | Default: 0
   followersCount  | Integer        | Optional | Default: 0
   totalPlays      | Integer        | Optional | Default: 0
   joinedAt        | DateTime       | Optional

8. 🔍 Créez ces index :
   - userId_unique (Unique) sur [userId]
   - name_search (Fulltext) sur [name]
   - email_index (Key) sur [email]
   - isArtist_index (Key) sur [isArtist]

9. ✅ Votre collection est prête !

🚀 Ensuite, lancez votre application React :
   cd tiktok-clone
   npm start
`);

