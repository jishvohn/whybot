// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDG_1aXKSMuGjWHzBBiOms_mnvMzMC4YAE",
  authDomain: "whybot-c40ce.firebaseapp.com",
  projectId: "whybot-c40ce",
  storageBucket: "whybot-c40ce.appspot.com",
  messagingSenderId: "61893936107",
  appId: "1:61893936107:web:17e2528b3efbf1bea18fae",
  measurementId: "G-HZ7EYX7LZ9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
