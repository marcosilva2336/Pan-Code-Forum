import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAMxWOPGLwX-ZV-3qA5c6XiNP7NrCFMpJk",
    authDomain: "instagram-clone-28abd.firebaseapp.com",
    projectId: "instagram-clone-28abd",
    storageBucket: "instagram-clone-28abd.appspot.com",
    messagingSenderId: "332347118791",
    appId: "1:332347118791:web:03f5f4f06ca1a20ededae2",
    measurementId: "G-X0KDR19SLH"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { db, auth, storage, serverTimestamp, functions };
