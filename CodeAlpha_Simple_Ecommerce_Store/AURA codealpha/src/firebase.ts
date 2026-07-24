import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDVzhtkPGsbUFNCiPz4P1qSihS9ph5v-PE",
  authDomain: "aura-e-commerce-9fc90.firebaseapp.com",
  projectId: "aura-e-commerce-9fc90",
  storageBucket: "aura-e-commerce-9fc90.firebasestorage.app",
  messagingSenderId: "68199919535",
  appId: "1:68199919535:web:d08a04c8077fc94c7f895a",
  measurementId: "G-SPJ7EMRFWH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
