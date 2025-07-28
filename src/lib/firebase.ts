// Import the functions you need from the SDKs you need
import {initializeApp, getApps, getApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyCcNK7pWwyRIBmi8wzjSnnhLCGe5M7sMBM',
  authDomain: 'wanderchat-bssh4.firebaseapp.com',
  projectId: 'wanderchat-bssh4',
  storageBucket: 'wanderchat-bssh4.firebasestorage.app',
  messagingSenderId: '406504659096',
  appId: '1:406504659096:web:8154baf84926fc055558ed',
  measurementId: '',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export {app, auth};
