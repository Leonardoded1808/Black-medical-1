import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

async function test(dbId: string) {
    console.log("Testing with DB ID:", dbId);
    const app = initializeApp(firebaseConfig, dbId);
    const db = getFirestore(app, dbId);
    try {
        await setDoc(doc(db, 'test', 'test'), { hello: 'world' });
        console.log("SUCCESS with DB ID:", dbId);
    } catch(e: any) {
        console.error("FAIL with DB ID:", dbId, "--", e.message);
    }
    await deleteApp(app);
}

async function run() {
    await test("default");
    await test("(default)");
    process.exit(0);
}
run();
