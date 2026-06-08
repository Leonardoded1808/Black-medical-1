import { db, addDocument, saveDocument, subscribeToCollection } from './services/firebaseService.js';
import { getDocs, collection, doc, setDoc } from 'firebase/firestore';

async function test() {
    console.log("Testing Firestore...");
    try {
        await saveDocument('test', 'test-id', { message: 'hello world' });
        console.log("Write success!");

        const snaps = await getDocs(collection(db, 'test'));
        console.log("Read success! Docs count:", snaps.size);
    } catch (e: any) {
        console.error("Firestore error:", e.message);
    }
}

test();
