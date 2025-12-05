import * as admin from 'firebase-admin';

// Helper function to get Firebase service account from environment variables
function getServiceAccount(): admin.ServiceAccount | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Check if required fields are present
  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    type: process.env.FIREBASE_TYPE || 'service_account',
    project_id: projectId,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: clientEmail,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
    token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || 'googleapis.com'
  };
}

// Initialize Firebase Admin only if credentials are available
let isInitialized = false;

function initializeFirebaseAdmin(): void {
  if (admin.apps.length > 0) {
    isInitialized = true;
    return;
  }

  const serviceAccount = getServiceAccount();
  
  if (!serviceAccount) {
    console.warn('⚠️  Firebase credentials not found. Firebase Admin will not be initialized.');
    console.warn('   Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to enable Firebase.');
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    isInitialized = true;
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error);
    // Don't throw - allow app to continue without Firebase if it's optional
    const dbType = process.env.DB_TYPE || process.env.DATABASE_TYPE;
    if (dbType === 'firebase') {
      throw new Error('Firebase initialization failed but database type is set to firebase');
    }
  }
}

// Initialize on module load
initializeFirebaseAdmin();

// Initialize Firebase services (will throw if not initialized)
export function getFirebaseAuth() {
  if (!isInitialized) {
    throw new Error('Firebase Admin is not initialized. Check your environment variables.');
  }
  return admin.auth();
}

export function getFirebaseFirestore() {
  if (!isInitialized) {
    throw new Error('Firebase Admin is not initialized. Check your environment variables.');
  }
  return admin.firestore();
}

export function getFirebaseStorage() {
  if (!isInitialized) {
    throw new Error('Firebase Admin is not initialized. Check your environment variables.');
  }
  return admin.storage();
}

// Export services with lazy initialization
export const auth = isInitialized ? admin.auth() : null;
export const db = isInitialized ? admin.firestore() : null;
export const storage = isInitialized ? admin.storage() : null;

export default admin;
