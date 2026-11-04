
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCikNa6v6ch5nPxERRuFTwuWQJCSdkkVcc",
  authDomain: "elarque-ba1f9.firebaseapp.com",
  projectId: "elarque-ba1f9",
  storageBucket: "elarque-ba1f9.firebasestorage.app",
  messagingSenderId: "884244680418",
  appId: "1:884244680418:web:894c2dcee99cf3faff58bb"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
