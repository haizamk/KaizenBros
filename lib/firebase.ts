import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocFromServer,
  getDocs,
  writeBatch,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence internal gRPC idle disconnect warnings from Firestore SDK
setLogLevel('silent');

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Simple connection test on startup
async function testConnection() {
  try {
    const testDoc = doc(db, 'test', 'connection');
    await getDocFromServer(testDoc);
    console.log("Firebase connection established successfully.");
  } catch {
    // Non-fatal initial check
  }
}
testConnection();

// Live sync helper with graceful stream reconnection handling
export function syncCollection(
  collectionName: string, 
  onUpdate: (data: any[]) => void, 
  onError?: (err: Error) => void
) {
  try {
    const colRef = collection(db, collectionName);
    return onSnapshot(colRef, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((doc) => {
        items.push({ ...doc.data(), id_str: doc.id });
      });
      onUpdate(items);
    }, (error) => {
      // Gracefully ignore transient idle stream disconnections
      if (error?.code === 'cancelled' || error?.message?.includes('CANCELLED') || error?.message?.includes('idle stream') || error?.code === 'unavailable') {
        return;
      }
      console.warn(`Snapshot update for ${collectionName}:`, error.message);
      if (onError) onError(error);
    });
  } catch (e: any) {
    console.warn(`Listener attachment for ${collectionName}:`, e.message);
    return () => {};
  }
}

// Helper function to prune large data_url fields (>400KB) to strictly observe Firestore 1MB document limit
function prunePayloadForFirestore(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'string' && obj.length > 400000 && obj.startsWith('data:')) {
      return '[Dokumen Lampiran Disimpan Tempatan / Base64 Melebihi Limit Firestore 1MB]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => prunePayloadForFirestore(item));
  }

  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string' && val.length > 400000 && (key.includes('data') || key.includes('doc') || val.startsWith('data:'))) {
      result[key] = '[Dokumen Lampiran Disimpan Tempatan / Base64 Melebihi Limit Firestore 1MB]';
    } else {
      result[key] = prunePayloadForFirestore(val);
    }
  }
  return result;
}

// Save or update document safely without exceeding Firestore 1MB limit
export async function saveDocument(collectionName: string, docId: string, data: any) {
  try {
    const docRef = doc(db, collectionName, docId);
    let cleanData = JSON.parse(JSON.stringify(data));
    
    // Check if total serialized JSON size exceeds 700KB (~700,000 bytes)
    const jsonStr = JSON.stringify(cleanData);
    if (jsonStr.length > 700000) {
      cleanData = prunePayloadForFirestore(cleanData);
    }

    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (error: any) {
    console.warn(`Initial save warning to ${collectionName}/${docId}:`, error?.message);
    
    // Fallback: If document size exceeded 1MB quota or any payload error occurred
    if (error?.message?.includes('exceeds the maximum allowed size') || error?.message?.includes('1,048,576') || error?.message?.includes('size')) {
      try {
        const pruned = prunePayloadForFirestore(JSON.parse(JSON.stringify(data)));
        const docRef = doc(db, collectionName, docId);
        await setDoc(docRef, pruned, { merge: true });
        console.log(`Successfully saved pruned document to ${collectionName}/${docId}`);
        return true;
      } catch (retryErr: any) {
        console.error(`Error saving pruned document to ${collectionName}/${docId}:`, retryErr);
      }
    }
    return false;
  }
}

// Delete document
export async function removeDocument(collectionName: string, docId: string) {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}/${docId}:`, error);
    throw error;
  }
}

// Clear whole collection helper for the Full Reset options
export async function clearCollection(collectionName: string) {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const batch = writeBatch(db);
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error(`Error clearing collection ${collectionName}:`, error);
    throw error;
  }
}
