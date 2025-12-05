import { auth } from '../config/firebase';

export interface FirebaseUser {
  uid: string;
  email?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified: boolean;
  disabled: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

export const createUser = async (userData: {
  email?: string;
  phoneNumber?: string;
  password?: string;
  displayName?: string;
}): Promise<FirebaseUser> => {
  try {
    const userRecord = await auth.createUser({
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      password: userData.password,
      displayName: userData.displayName,
      emailVerified: false,
      disabled: false,
    });

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      phoneNumber: userRecord.phoneNumber,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      },
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUser = async (uid: string): Promise<FirebaseUser | null> => {
  try {
    const userRecord = await auth.getUser(uid);
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      phoneNumber: userRecord.phoneNumber,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      },
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

export const updateUser = async (
  uid: string,
  userData: {
    email?: string;
    phoneNumber?: string;
    displayName?: string;
    photoURL?: string;
    emailVerified?: boolean;
    disabled?: boolean;
  }
): Promise<FirebaseUser> => {
  try {
    const userRecord = await auth.updateUser(uid, userData);
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      phoneNumber: userRecord.phoneNumber,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      },
    };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (uid: string): Promise<boolean> => {
  try {
    await auth.deleteUser(uid);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

export const verifyIdToken = async (idToken: string) => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return { valid: true, decodedToken };
  } catch (error) {
    return { valid: false, error: 'Invalid or expired token' };
  }
};
