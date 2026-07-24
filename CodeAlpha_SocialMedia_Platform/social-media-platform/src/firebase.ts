import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeFirestore, memoryLocalCache, setLogLevel } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Suppress internal verbose/debug BloomFilter log noise from Firebase JS SDK
setLogLevel("error");

const firebaseConfig = {
  apiKey: "AIzaSyAmk3pEaD7_teCLva9yVkSLELF_I63Z7n4",
  authDomain: "social-media-335af.firebaseapp.com",
  projectId: "social-media-335af",
  storageBucket: "social-media-335af.firebasestorage.app",
  messagingSenderId: "982187345074",
  appId: "1:982187345074:web:2c9375c775a17480b875ab",
  measurementId: "G-C807Q9XDPP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: memoryLocalCache()
}, "ai-studio-socialmediaplatf-836b234a-5ccb-4c46-8285-e09239017116");
export const auth = getAuth(app);

// Gracefully handle Analytics loading since it might not be supported in some environment frames
export let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn("Analytics not supported or blocked in this environment:", err);
  });
}
