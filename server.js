require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sdk = require('node-appwrite');

const app = express();
app.use(cors());
app.use(express.json()); 

const client = new sdk.Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

const DATABASE_ID = 'app_database';
const COLLECTION_ID = 'videos'; // comme dans ton script setup

// GET /videos : récupérer toutes les vidéos (avec pagination simple)
app.get('/videos', async (req, res) => {
  try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      sdk.Query.orderDesc('createdAt'),
      sdk.Query.limit(20),
    ]);
    res.json(response.documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des vidéos' });
  }
});

// POST /videos : ajouter une nouvelle vidéo
app.post('/videos', async (req, res) => {
  try {
    const { userId, caption, videoUrl, likes = 0, location, createdAt } = req.body;

    if (!userId || !videoUrl || !createdAt) {
      return res.status(400).json({ message: "Les champs 'userId', 'videoUrl' et 'createdAt' sont obligatoires" });
    }

    const doc = await databases.createDocument(DATABASE_ID, COLLECTION_ID, sdk.ID.unique(), {
      userId,
      caption,
      videoUrl,
      likes,
      location,
      createdAt,
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création de la vidéo' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API backend lancé sur http://localhost:${PORT}`);
});
