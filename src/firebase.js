import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB2zW5med-I4bmLWUclBdSE2bPhh40Rb4o",
  authDomain: "broadcastapp-d0a43.firebaseapp.com",
  projectId: "broadcastapp-d0a43",
  storageBucket: "broadcastapp-d0a43.firebasestorage.app",
  messagingSenderId: "623566130693",
  appId: "1:623566130693:web:5ee3d60e0bf573af66166c",
  measurementId: "G-JX8G2HZ7FX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

