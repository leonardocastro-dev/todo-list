import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
    measurementId: config.public.firebaseMeasurementId,
    databaseURL: config.public.firebaseDatabaseURL
  }

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const database = getDatabase(app)

  return {
    provide: {
      firebase: app,
      auth: auth,
      database: database
    }
  }
})
