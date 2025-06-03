import { Client, Databases, Storage, Account } from 'appwrite';

// Configuration Appwrite
const client = new Client();

client
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('67bb24ad002378e79e38');

// Services Appwrite
export const databases = new Databases(client);
export const storage = new Storage(client);
export const account = new Account(client);

// Configuration pour l'administration (côté serveur)
export const adminClient = new Client();
adminClient
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('67bb24ad002378e79e38')
    .setKey('standard_3f73de9c98e0013d3f9474426e8fced16bd8b783a1c18b056d34713cd9776621781ac96561cc0e8959ec86b484952d265eb6c5b070334e400eaa91174db365f044904d82ca94cd0f5efceebe6adfd188b2502cfb6d3721ac6a3b1bd14dafda2eaa00713133b050fbc3095fc92bda0b64ddf27cef1d1737f810497aa56fd4a289');

export const adminDatabases = new Databases(adminClient);
export const adminStorage = new Storage(adminClient);

// IDs des collections et base de données
export const DATABASE_ID = 'netflix-pwa-db';
export const COLLECTIONS = {
    MOVIES: 'movies',
    CATEGORIES: 'categories',
    WATCHLIST: 'watchlist',
    REVIEWS: 'reviews',
    USERS: 'users'
};

// Configuration des buckets de stockage
export const STORAGE_BUCKETS = {
    MOVIE_POSTERS: 'movie-posters',
    USER_AVATARS: 'user-avatars'
};

export default client;