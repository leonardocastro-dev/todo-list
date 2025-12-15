import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  deleteUser
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { doc, setDoc } from 'firebase/firestore'

const user = ref<User | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
let authInitialized = false

export const useAuth = () => {
  const { $auth, $firestore } = useNuxtApp()

  if (!authInitialized) {
    authInitialized = true

    $auth.onAuthStateChanged((newUser) => {
      user.value = newUser
      loading.value = false
    })
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
      loading.value = false // ← Só em caso de erro
      if (e.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password', {
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

  const register = async (name: string, email: string, password: string) => {
    try {
      loading.value = true
      error.value = null

      const result = await createUserWithEmailAndPassword(
        $auth,
        email,
        password
      )
      const createdUser = result.user

      const userData = {
        name: name,
        email: email,
        createdAt: new Date().toISOString()
      }

      const userRef = doc($firestore, `users/${createdUser.uid}`)
      await setDoc(userRef, userData)

      user.value = createdUser

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
      tasksStore.$reset()
      projectStore.$reset()

      await signOut($auth)
      user.value = null

      navigateTo('/')
    } catch (e: any) {
      loading.value = false

      error.value = e.message
    }
  }

  return {
    user,
    loading,
    error,
    login,
    register,
    logout
  }
}
