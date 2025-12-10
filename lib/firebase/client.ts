import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"

// Initialize Firebase app only once in the client
const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDhEOv_zlKV5GX2vfPTssWwGPlRSS3lW-w",
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "care360-next.firebaseapp.com",
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "care360-next",
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "care360-next.appspot.com",
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "460794560574",
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:460794560574:web:488b4f87c7f272a778d16f",
	measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-X37CW4B76R",
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)


