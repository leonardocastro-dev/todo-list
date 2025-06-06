import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  deleteUser
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { ref as dbRef, set } from 'firebase/database'
import { useTaskStore } from '~/store'

export const useAuth = () => {
  const { $auth, $database } = useNuxtApp()
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const login = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = null
      const result = await signInWithEmailAndPassword($auth, email, password)
      user.value = result.user

      const tasksStore = useTaskStore()
      tasksStore.$reset()
      localStorage.removeItem('localTasks')

      navigateTo('/')
      toast.success('Login successful', {
        style: { background: '#6ee7b7' },
        duration: 3000
      })
    } catch (e: any) {
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
    } finally {
      loading.value = false
    }
  }

  const register = async (email: string, password: string) => {
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
        email: email,
        createdAt: new Date().toISOString()
      }

      const userRef = dbRef($database, `users/${createdUser.uid}`)
      await set(userRef, userData)

      user.value = createdUser

      const tasksStore = useTaskStore()
      tasksStore.$reset()
      localStorage.removeItem('localTasks')

      navigateTo('/')
      toast.success('Registration successful!', {
        style: { background: '#6ee7b7' },
        duration: 3000
      })
    } catch (e: any) {
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
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      loading.value = true
      error.value = null

      const tasksStore = useTaskStore()
      tasksStore.$reset()

      await signOut($auth)
      user.value = null
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  $auth.onAuthStateChanged((newUser) => {
    user.value = newUser
  })

  return {
    user,
    loading,
    error,
    login,
    register,
    logout
  }
}
