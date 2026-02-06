
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Tieto kľúče sú vo webových aplikáciách verejne prístupné, 
// ale Google odporúča ich "skryť" pred botmi na GitHube a obmedziť v GCP konzole.
const firebaseConfig = {
  // Fix: Use type assertion to access env property on ImportMeta to resolve TypeScript error "Property 'env' does not exist on type 'ImportMeta'".
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyDRBlzUzEJfX_kHgZPw2jjj-bj3Z5AtyWQ",
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
