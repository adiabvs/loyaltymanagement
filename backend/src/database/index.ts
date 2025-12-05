import { Firestore } from 'firebase-admin/firestore';
import { getFirebaseFirestore } from '../config/firebase';

// Initialize Firestore lazily
let dbInstance: Firestore | null = null;

function getDb(): Firestore {
  if (!dbInstance) {
    try {
      dbInstance = getFirebaseFirestore();
    } catch (error) {
      throw new Error('Firebase is not initialized. Please check your Firebase environment variables.');
    }
  }
  return dbInstance;
}

// Collection references (lazy initialization)
export const collections = {
  get users() {
    return getDb().collection('users');
  },
  // Add other collections as needed
};

// Generic CRUD operations
export const database = {
  // Create a new document
  async create<T>(collectionName: string, data: T, docId?: string): Promise<string> {
    try {
      const db = getDb();
      if (docId) {
        await db.collection(collectionName).doc(docId).set(data);
        return docId;
      } else {
        const docRef = await db.collection(collectionName).add(data);
        return docRef.id;
      }
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  },

  // Read a document by ID
  async get<T>(collectionName: string, docId: string): Promise<T | null> {
    try {
      const db = getDb();
      const doc = await db.collection(collectionName).doc(docId).get();
      if (!doc.exists) {
        return null;
      }
      const data = doc.data();
      if (!data) {
        return null;
      }
      
      // Convert Firestore Timestamps to Date objects
      const convertedData: any = { id: doc.id };
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === 'object' && 'toDate' in value) {
          // Firestore Timestamp
          convertedData[key] = (value as any).toDate();
        } else if (value && typeof value === 'object' && '_seconds' in value) {
          // Firestore Timestamp (alternative format)
          convertedData[key] = new Date((value as any)._seconds * 1000);
        } else {
          convertedData[key] = value;
        }
      }
      return convertedData as T;
    } catch (error) {
      console.error(`Error getting document ${docId} from ${collectionName}:`, error);
      throw error;
    }
  },

  // Update a document
  async update<T>(collectionName: string, docId: string, data: Partial<T>): Promise<void> {
    try {
      const db = getDb();
      // Convert undefined values to null for Firebase (Firebase doesn't support undefined)
      const cleanData: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value === undefined) {
          // Use FieldValue.delete() to remove fields
          const admin = require('firebase-admin');
          cleanData[key] = admin.firestore.FieldValue.delete();
        } else {
          cleanData[key] = value;
        }
      }
      await db.collection(collectionName).doc(docId).update(cleanData);
    } catch (error) {
      console.error(`Error updating document ${docId} in ${collectionName}:`, error);
      throw error;
    }
  },

  // Delete a document
  async delete(collectionName: string, docId: string): Promise<void> {
    try {
      const db = getDb();
      await db.collection(collectionName).doc(docId).delete();
    } catch (error) {
      console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
      throw error;
    }
  },

  // Query documents with filters
  async query<T>(
    collectionName: string, 
    conditions: [string, FirebaseFirestore.WhereFilterOp, any][] = [],
    limit: number = 100
  ): Promise<T[]> {
    try {
      const db = getDb();
      let query: FirebaseFirestore.Query = db.collection(collectionName);
      
      // Apply where conditions
      conditions.forEach(([field, operator, value]) => {
        query = query.where(field, operator, value);
      });
      
      const snapshot = await query.limit(limit).get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamps to Date objects
        const convertedData: any = { id: doc.id };
        for (const [key, value] of Object.entries(data)) {
          if (value && typeof value === 'object' && 'toDate' in value) {
            // Firestore Timestamp
            convertedData[key] = (value as any).toDate();
          } else if (value && typeof value === 'object' && '_seconds' in value) {
            // Firestore Timestamp (alternative format)
            convertedData[key] = new Date((value as any)._seconds * 1000);
          } else {
            convertedData[key] = value;
          }
        }
        return convertedData as T;
      });
    } catch (error) {
      console.error(`Error querying ${collectionName}:`, error);
      throw error;
    }
  }
};

export default database;
