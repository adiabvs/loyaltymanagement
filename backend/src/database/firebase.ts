import * as admin from 'firebase-admin';
import { IDatabaseAdapter } from './base';
import { User, Customer, Brand, Visit, Reward, Campaign } from '../types';
import { getFirebaseFirestore } from '../config/firebase';

// Use Firebase Admin SDK (not client SDK)
// The Firebase Admin is initialized in config/firebase.ts

export class FirebaseDatabase implements IDatabaseAdapter {
  private db: admin.firestore.Firestore;

  // Initialize repositories
  public users: IDatabaseAdapter['users'];
  public customers: IDatabaseAdapter['customers'];
  public brands: IDatabaseAdapter['brands'];
  public visits: IDatabaseAdapter['visits'];
  public rewards: IDatabaseAdapter['rewards'];
  public campaigns: IDatabaseAdapter['campaigns'];

  constructor() {
    // Get Firestore instance from Firebase Admin (initialized in config/firebase.ts)
    try {
      this.db = getFirebaseFirestore();
    } catch (error) {
      throw new Error('Firebase is not properly initialized. Please check your Firebase environment variables.');
    }

    // Initialize repositories using Firebase Admin SDK
    this.users = {
      create: async (data: Partial<User>) => {
        const userRef = this.db.collection('users').doc();
        const userData = {
          ...data,
          id: userRef.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await userRef.set(userData);
        const createdDoc = await userRef.get();
        return { id: createdDoc.id, ...createdDoc.data() } as User;
      },
      findById: async (id: string) => {
        const userDoc = await this.db.collection('users').doc(id).get();
        return userDoc.exists ? { id: userDoc.id, ...userDoc.data() } as User : null;
      },
      findByEmailOrPhone: async (phoneOrEmail: string) => {
        const usersRef = this.db.collection('users');
        const emailQuery = usersRef.where('email', '==', phoneOrEmail).limit(1);
        const phoneQuery = usersRef.where('phoneNumber', '==', phoneOrEmail).limit(1);
        
        const [emailSnapshot, phoneSnapshot] = await Promise.all([
          emailQuery.get(),
          phoneQuery.get()
        ]);

        if (!emailSnapshot.empty) {
          const doc = emailSnapshot.docs[0];
          return { id: doc.id, ...doc.data() } as User;
        }
        if (!phoneSnapshot.empty) {
          const doc = phoneSnapshot.docs[0];
          return { id: doc.id, ...doc.data() } as User;
        }
        return null;
      },
      update: async (id: string, data: Partial<User>) => {
        const userRef = this.db.collection('users').doc(id);
        await userRef.update({ 
          ...data, 
          updatedAt: admin.firestore.FieldValue.serverTimestamp() 
        });
        const updatedDoc = await userRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() } as User;
      },
    };

    // Initialize other repositories with basic CRUD operations using Firebase Admin SDK
    // You can expand these with more specific queries as needed
    const createRepository = <T extends { id: string }>(collectionName: string) => ({
      getById: async (id: string): Promise<T | null> => {
        const docRef = this.db.collection(collectionName).doc(id);
        const docSnap = await docRef.get();
        return docSnap.exists ? { id: docSnap.id, ...docSnap.data() } as T : null;
      },
      create: async (data: Omit<T, 'id'>): Promise<T> => {
        const docRef = this.db.collection(collectionName).doc();
        const docData = {
          ...data,
          id: docRef.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await docRef.set(docData);
        const createdDoc = await docRef.get();
        return { id: createdDoc.id, ...createdDoc.data() } as T;
      },
      update: async (id: string, data: Partial<T>): Promise<T> => {
        const docRef = this.db.collection(collectionName).doc(id);
        await docRef.update({ 
          ...data, 
          updatedAt: admin.firestore.FieldValue.serverTimestamp() 
        });
        const updatedDoc = await docRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() } as T;
      },
      getAll: async (): Promise<T[]> => {
        const querySnapshot = await this.db.collection(collectionName).get();
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      },
    });

    // Initialize customers and brands repositories
    this.customers = createRepository<Customer>('customers');
    this.brands = createRepository<Brand>('brands');

    // Initialize visits repository with custom methods
    this.visits = {
      ...createRepository<Visit>('visits'),
      create: async (data: Omit<Visit, "id" | "timestamp">) => {
        const docRef = this.db.collection('visits').doc();
        const visitData = {
          ...data,
          id: docRef.id,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        };
        await docRef.set(visitData);
        const createdDoc = await docRef.get();
        return { id: createdDoc.id, ...createdDoc.data(), timestamp: new Date() } as Visit;
      },
      getByCustomer: async (customerId: string) => {
        const snapshot = await this.db.collection('visits')
          .where('customerId', '==', customerId)
          .orderBy('timestamp', 'desc')
          .get();
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        } as Visit));
      },
      getByBrand: async (brandId: string) => {
        const snapshot = await this.db.collection('visits')
          .where('brandId', '==', brandId)
          .orderBy('timestamp', 'desc')
          .get();
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        } as Visit));
      },
      getUniqueCustomersForBrand: async (brandId: string) => {
        const snapshot = await this.db.collection('visits')
          .where('brandId', '==', brandId)
          .get();
        const customerIds = new Set<string>();
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.customerId) {
            customerIds.add(data.customerId);
          }
        });
        return Array.from(customerIds);
      },
    };

    // Initialize rewards repository with custom methods
    this.rewards = {
      ...createRepository<Reward>('rewards'),
      create: async (data: Omit<Reward, "id" | "createdAt">) => {
        const docRef = this.db.collection('rewards').doc();
        const rewardData = {
          ...data,
          id: docRef.id,
          isRedeemed: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await docRef.set(rewardData);
        const createdDoc = await docRef.get();
        const docData = createdDoc.data();
        if (!docData) throw new Error('Failed to create reward');
        return { 
          id: createdDoc.id, 
          ...docData,
          createdAt: docData.createdAt?.toDate() || new Date()
        } as Reward;
      },
      getByCustomer: async (customerId: string) => {
        const snapshot = await this.db.collection('rewards')
          .where('customerId', '==', customerId)
          .get();
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          redeemedAt: doc.data().redeemedAt?.toDate()
        } as Reward));
      },
      getUnredeemed: async (customerId: string) => {
        const snapshot = await this.db.collection('rewards')
          .where('customerId', '==', customerId)
          .where('isRedeemed', '==', false)
          .get();
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          redeemedAt: doc.data().redeemedAt?.toDate()
        } as Reward));
      },
      redeem: async (id: string) => {
        const docRef = this.db.collection('rewards').doc(id);
        await docRef.update({
          isRedeemed: true,
          redeemedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const updatedDoc = await docRef.get();
        if (!updatedDoc.exists) return null;
        const docData = updatedDoc.data();
        if (!docData) return null;
        return {
          id: updatedDoc.id,
          ...docData,
          createdAt: docData.createdAt?.toDate() || new Date(),
          redeemedAt: docData.redeemedAt?.toDate()
        } as Reward;
      },
    };

    // Initialize campaigns repository with custom methods
    this.campaigns = {
      ...createRepository<Campaign>('campaigns'),
      create: async (data: Omit<Campaign, "id" | "createdAt">) => {
        const docRef = this.db.collection('campaigns').doc();
        const campaignData = {
          ...data,
          id: docRef.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await docRef.set(campaignData);
        const createdDoc = await docRef.get();
        const docData = createdDoc.data();
        if (!docData) throw new Error('Failed to create campaign');
        return {
          id: createdDoc.id,
          ...docData,
          createdAt: docData.createdAt?.toDate() || new Date(),
          startDate: docData.startDate?.toDate() || new Date(),
          endDate: docData.endDate?.toDate()
        } as Campaign;
      },
      getByBrand: async (brandId: string) => {
        const snapshot = await this.db.collection('campaigns')
          .where('brandId', '==', brandId)
          .get();
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          startDate: doc.data().startDate?.toDate() || new Date(),
          endDate: doc.data().endDate?.toDate()
        } as Campaign));
      },
      getActive: async (brandId?: string) => {
        let query = this.db.collection('campaigns')
          .where('isActive', '==', true);
        
        if (brandId) {
          query = query.where('brandId', '==', brandId) as admin.firestore.Query;
        }
        
        const snapshot = await query.get();
        const now = new Date();
        return snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            startDate: doc.data().startDate?.toDate() || new Date(),
            endDate: doc.data().endDate?.toDate()
          } as Campaign))
          .filter(campaign => {
            if (campaign.startDate > now) return false;
            if (campaign.endDate && campaign.endDate < now) return false;
            return true;
          });
      },
      delete: async (id: string) => {
        try {
          await this.db.collection('campaigns').doc(id).delete();
          return true;
        } catch (error) {
          console.error('Error deleting campaign:', error);
          return false;
        }
      },
    };
  }

  async connect(): Promise<void> {
    // Firebase initializes immediately, no need for explicit connection
    console.log('Firebase connected');
  }

  async disconnect(): Promise<void> {
    // Firebase doesn't require explicit disconnection
    console.log('Firebase disconnected');
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try to read a document to check if Firestore is accessible
      await this.db.collection('health').doc('check').get();
      return true;
    } catch (error) {
      console.error('Firebase health check failed:', error);
      return false;
    }
  }
}
