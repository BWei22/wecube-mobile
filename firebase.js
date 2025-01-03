// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDYb4aSYo2bUTjyhVYMKNBykxSJtt_21Po",
    authDomain: "wecube-e0d78.firebaseapp.com",
    projectId: "wecube-e0d78",
    storageBucket: "wecube-e0d78.appspot.com",
    messagingSenderId: "412392652109",
    appId: "1:412392652109:web:bc3ad839badcf48e85cb04",
    measurementId: "G-3J43PF4YX8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
