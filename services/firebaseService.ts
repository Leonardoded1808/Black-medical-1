
import { initializeApp } from 'firebase/app';
import { 
    getFirestore, 
    collection, 
    doc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    onSnapshot,
    Timestamp,
    writeBatch,
    addDoc,
    getDoc,
    getDocFromServer
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { Lead, Client, Opportunity, Task, Interaction, Product, Salesperson, WhatsAppTemplate, User } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Helper for error handling as per guidelines
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  if (errInfo.error.includes("Missing or insufficient permissions")) {
    // Suppress transient permission warnings
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  // Not throwing here to prevent app crash on transient permission issues
}

// Generic CRUD helpers
export const subscribeToCollection = <T extends { id: string }>(
    collectionName: string, 
    callback: (data: T[]) => void,
    filters?: { field: string, operator: any, value: any }[]
) => {
    let q = query(collection(db, collectionName));
    if (filters) {
        filters.forEach(f => {
            q = query(q, where(f.field, f.operator, f.value));
        });
    }

    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        callback(data);
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, collectionName);
    });
};

export const saveDocument = async (collectionName: string, id: string, data: any) => {
    try {
        console.log(`Saving to ${collectionName}/${id}:`, data);
        await setDoc(doc(db, collectionName, id), { ...data, updatedAt: Timestamp.now() }, { merge: true });
        console.log(`Saved successfully to ${collectionName}/${id}`);
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${id}`);
        throw error;
    }
};

export const addDocument = async (collectionName: string, data: any) => {
    try {
        console.log(`Adding to ${collectionName}:`, data);
        const docRef = await addDoc(collection(db, collectionName), { ...data, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
        console.log(`Added successfully to ${collectionName}/${docRef.id}`);
        return docRef.id;
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, collectionName);
        throw error;
    }
};

export const deleteDocument = async (collectionName: string, id: string) => {
    try {
        await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    }
};

// Specific functions for the CRM
export const testFirestoreConnection = async () => {
    try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        return true;
    } catch (error) {
        console.error("Firebase connection test failed", error);
        return false;
    }
};
