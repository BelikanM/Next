import { Client, Account, Databases, Storage, Query } from 'appwrite';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
export const COLLECTION_USERS = process.env.NEXT_PUBLIC_COLLECTION_USERS;
export const COLLECTION_VIDEOS = process.env.NEXT_PUBLIC_COLLECTION_VIDEOS;
export const COLLECTION_COMMENTS = process.env.NEXT_PUBLIC_COLLECTION_COMMENTS;
export const COLLECTION_LIKES = process.env.NEXT_PUBLIC_COLLECTION_LIKES;
export const COLLECTION_FOLLOWS = process.env.NEXT_PUBLIC_COLLECTION_FOLLOWS;

export { Query };
export default client;
