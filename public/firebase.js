
// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// import { firebaseConfig } from "./firebaseConfig";

let auth;

export async function getFirebaseContext() {
    if (auth) return { auth };
    // console.log(firebaseConfig)
    //  let firebaseConfig=firebaseConfig;
    
    const app = initializeApp({
    apiKey: "AIzaSyBT48SncxcmQOKbORMkp0-awKHYoIjDil8",
    authDomain: "ragsystem-d497a.firebaseapp.com",
    projectId: "ragsystem-d497a",
    storageBucket: "ragsystem-d497a.firebasestorage.app",
    messagingSenderId: "376759758793",
    appId: "1:376759758793:web:d8eff59764cdf3c5190218",
    measurementId: "G-F5TB4YBEDS"
});
    auth = getAuth(app);
    
    return { auth };
}