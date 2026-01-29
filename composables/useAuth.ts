import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  deleteUser
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { doc, setDoc, getDoc } from 'firebase/firestore'

export interface UserProfile {
  username: string
  photoURL?: string
}

const user = ref<User | null>(null)
const userProfile = ref<UserProfile | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
let authInitialized = false

export const useAuth = () => {
  const { $auth, $firestore } = useNuxtApp()

  const fetchUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc($firestore, 'users', uid))
      if (userDoc.exists()) {
        userProfile.value = userDoc.data() as UserProfile
      } else {
        userProfile.value = null
      }
    } catch (e) {
      console.error('Error fetching user profile:', e)
      userProfile.value = null
    }
  }

  if (!authInitialized) {
    authInitialized = true

    $auth.onAuthStateChanged(async (newUser) => {
      user.value = newUser
      if (newUser) {
        await fetchUserProfile(newUser.uid)
      } else {
        userProfile.value = null
      }
      loading.value = false
    })
  }

  const checkUsername = async (username: string): Promise<boolean> => {
    try {
      const response = await $fetch('/api/auth/check-username', {
        method: 'POST',
        body: { username }
      })
      return response.available
    } catch (error) {
      console.error('Error checking username:', error)
      return false
    }
  }

  const login = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = null
      const result = await signInWithEmailAndPassword($auth, email, password)
      user.value = result.user

      const tasksStore = useTaskStore()
      const projectStore = useProjectStore()
      const workspaceStore = useWorkspaceStore()
      tasksStore.$reset()
      projectStore.$reset()
      workspaceStore.clearLocalData()
      localStorage.removeItem('localProjects')

      navigateTo('/workspaces')
      toast.success('Login successful', {
        style: { background: '#6ee7b7' },
        duration: 3000
      })
    } catch (e: any) {
      loading.value = false
      if (
        e.code === 'auth/invalid-credential' ||
        e.code === 'auth/wrong-password' ||
        e.code === 'auth/user-not-found'
      ) {
        toast.error('Invalid email or password', {
          style: { background: '#fda4af' },
          duration: 3000
        })
      } else if (e.code === 'auth/too-many-requests') {
        toast.error('Too many failed login attempts. Please try again later.', {
          style: { background: '#fda4af' },
          duration: 4000
        })
      } else if (e.code === 'auth/network-request-failed') {
        toast.error('Network error. Please check your connection.', {
          style: { background: '#fda4af' },
          duration: 3000
        })
      } else {
        toast.error(
          'An error occurred while logging in. Please try again later.',
          {
            style: { background: '#fda4af' },
            duration: 3000
          }
        )
        console.error('Error logging in:', e)
      }
    }
  }

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      loading.value = true
      error.value = null

      const isUsernameAvailable = await checkUsername(username)
      if (!isUsernameAvailable) {
        toast.error(
          'This username is already taken. Please choose a different one.',
          {
            style: { background: '#fda4af' },
            duration: 4000
          }
        )
        loading.value = false
        return
      }

      const result = await createUserWithEmailAndPassword(
        $auth,
        email,
        password
      )
      const createdUser = result.user

      const publicData = {
        username: username
      }

      const privateData = {
        email: email,
        createdAt: new Date().toISOString()
      }

      const publicRef = doc($firestore, `users/${createdUser.uid}`)
      const privateRef = doc($firestore, `users_private/${createdUser.uid}`)

      await setDoc(publicRef, publicData)
      await setDoc(privateRef, privateData)

      user.value = createdUser
      userProfile.value = { username }

      const tasksStore = useTaskStore()
      const projectStore = useProjectStore()
      tasksStore.$reset()
      projectStore.$reset()
      localStorage.removeItem('localProjects')

      navigateTo('/workspaces')
      toast.success('Registration successful!', {
        style: { background: '#6ee7b7' },
        duration: 3000
      })
    } catch (e: any) {
      loading.value = false

      if (e instanceof Error && $auth.currentUser) {
        try {
          await deleteUser($auth.currentUser)
          console.warn('Rolled back auth user due to DB failure.')
        } catch (rollbackErr) {
          console.error('Failed to rollback auth user:', rollbackErr)
        }
      }

      if (e.code === 'auth/email-already-in-use') {
        toast.error('This email is already in use', {
          style: { background: '#fda4af' },
          duration: 3000
        })
      } else {
        toast.error(
          'An error occurred during registration. Please try again later.',
          {
            style: { background: '#fda4af' },
            duration: 3000
          }
        )
        console.error('Error registering:', e)
      }
    }
  }

  const logout = async () => {
    try {
      loading.value = true
      error.value = null

      const tasksStore = useTaskStore()
      const projectStore = useProjectStore()
      const workspaceStore = useWorkspaceStore()

      tasksStore.$reset()
      projectStore.$reset()
      workspaceStore.clearLocalData()

      await signOut($auth)
      user.value = null
      userProfile.value = null

      navigateTo('/')
    } catch (e: any) {
      loading.value = false

      error.value = e.message
    }
  }

  return {
    user,
    userProfile,
    loading,
    error,
    login,
    register,
    logout,
    checkUsername
  }
}
