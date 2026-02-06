import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDRBlzUzEJfX_kHgZPw2jjj-bj3Z5AtyWQ",
  authDomain: "ideaspark-5eae0.firebaseapp.com",
  projectId: "ideaspark-5eae0",
  storageBucket: "ideaspark-5eae0.firebasestorage.app",
  messagingSenderId: "125129416664",
  appId: "1:125129416664:web:7bc071cfbdac5910bc5cad",
  measurementId: "G-EMFETD7C5M"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();