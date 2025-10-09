import { createContext, useContext, useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth'
import { auth } from '../firebase/config'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Register new user with email verification
  async function signup(email, password, displayName) {
    // Check if email is from allowed domain
    if (!email.endsWith('@mvl-gym.de')) {
      throw new Error('Nur E-Mail-Adressen mit der Domain @mvl-gym.de sind erlaubt.')
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    // Update profile with display name
    await updateProfile(userCredential.user, {
      displayName: displayName
    })

    // Send verification email
    await sendEmailVerification(userCredential.user, {
      url: window.location.origin + '/login',
      handleCodeInApp: false
    })

    return userCredential.user
  }

  // Login user
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // Logout user
  function logout() {
    return signOut(auth)
  }

  // Resend verification email
  async function resendVerificationEmail() {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser, {
        url: window.location.origin + '/login',
        handleCodeInApp: false
      })
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    signup,
    login,
    logout,
    resendVerificationEmail
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
