import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Syncs a collection with Firestore in real-time.
 * If the collection in Firestore is empty and local items exist, it automatically seeds Firestore.
 */
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  initialLocalItems: T[],
  onData: (items: T[]) => void
) {
  const colRef = collection(db, collectionName);

  // Check if collection is empty initially and seed if needed
  getDocs(colRef).then((snapshot) => {
    if (snapshot.empty && initialLocalItems && initialLocalItems.length > 0) {
      console.log(`[Firebase] Seeding ${collectionName} with ${initialLocalItems.length} initial items...`);
      const batch = writeBatch(db);
      initialLocalItems.forEach((item) => {
        const docRef = doc(db, collectionName, item.id);
        batch.set(docRef, item);
      });
      batch.commit().catch((err) => console.warn(`[Firebase] Error seeding ${collectionName}:`, err));
    }
  }).catch((err) => {
    console.warn(`[Firebase] Error checking collection ${collectionName}:`, err);
  });

  // Listen to real-time updates
  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as T);
        });
        onData(items);
      }
    },
    (error) => {
      console.warn(`[Firebase] Snapshot error on ${collectionName}:`, error);
    }
  );

  return unsubscribe;
}

/**
 * Saves or updates a single item in Firestore.
 */
export async function saveDocumentToFirestore<T extends { id: string }>(
  collectionName: string,
  item: T
) {
  try {
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (err) {
    console.warn(`[Firebase] Error saving document to ${collectionName}:`, err);
  }
}

/**
 * Saves multiple items in a batch.
 */
export async function saveBatchToFirestore<T extends { id: string }>(
  collectionName: string,
  items: T[]
) {
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, item, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn(`[Firebase] Error batch saving to ${collectionName}:`, err);
  }
}
