import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDTge-QQKB2aY-ZRZqtuDq8PcpBiErmfWQ",
  authDomain: "seminarkurs-lernapp.firebaseapp.com",
  projectId: "seminarkurs-lernapp",
  storageBucket: "seminarkurs-lernapp.firebasestorage.app",
  messagingSenderId: "640778470963",
  appId: "1:640778470963:web:ce209272262574ac95c546"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)
export default app
