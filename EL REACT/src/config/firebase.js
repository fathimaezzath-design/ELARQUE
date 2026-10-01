import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDD3Od6ZgAwbwrNqG2H7VmMnhzFvJP5y6Q",
  authDomain: "elarque-df522.firebaseapp.com",
  projectId: "elarque-df522",
  appId: "1:918431950834:web:68ae3975dcdde5c2ca2d6b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();