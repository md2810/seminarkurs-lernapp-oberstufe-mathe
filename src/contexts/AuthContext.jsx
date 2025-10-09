import { createContext, useContext, useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail
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

  // Update user's display name
  async function updateUserProfile(displayName) {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: displayName
      })
      // Trigger re-render by updating currentUser
      setCurrentUser({ ...auth.currentUser })
    }
  }

  // Update user's email
  async function updateUserEmail(newEmail, currentPassword) {
    if (!auth.currentUser) {
      throw new Error('Kein angemeldeter Benutzer')
    }

    // Check if email is from allowed domain
    if (!newEmail.endsWith('@mvl-gym.de')) {
      throw new Error('Nur E-Mail-Adressen mit der Domain @mvl-gym.de sind erlaubt.')
    }

    // Re-authenticate user before email change (security requirement)
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    )
    await reauthenticateWithCredential(auth.currentUser, credential)

    // Update email
    await updateEmail(auth.currentUser, newEmail)

    // Send verification email to new address
    await sendEmailVerification(auth.currentUser, {
      url: window.location.origin + '/login',
      handleCodeInApp: false
    })
  }

  // Update user's password
  async function updateUserPassword(currentPassword, newPassword) {
    if (!auth.currentUser) {
      throw new Error('Kein angemeldeter Benutzer')
    }

    // Re-authenticate user before password change (security requirement)
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    )
    await reauthenticateWithCredential(auth.currentUser, credential)

    // Update password
    await updatePassword(auth.currentUser, newPassword)
  }

  // Reset password via email
  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email, {
      url: window.location.origin + '/login',
      handleCodeInApp: false
    })
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
    resendVerificationEmail,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
