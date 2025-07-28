// Import the functions you need from the SDKs you need
import {initializeApp, getApps, getApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'TODO: Your api key',
  authDomain: 'TODO: Your auth domain',
  projectId: 'TODO: Your project id',
  storageBucket: 'TODO: Your storage bucket',
  messagingSenderId: 'TODO: Your messaging sender id',
  appId: 'TODO: Your app id',
  measurementId: 'TODO: Your measurement id',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export {app, auth};
