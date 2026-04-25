// import { firebaseConfig } from "./firebaseConfig";

async function startAuth() {
    firebase.initializeApp({
    apiKey: "AIzaSyBT48SncxcmQOKbORMkp0-awKHYoIjDil8",
    authDomain: "ragsystem-d497a.firebaseapp.com",
    projectId: "ragsystem-d497a",
    storageBucket: "ragsystem-d497a.firebasestorage.app",
    messagingSenderId: "376759758793",
    appId: "1:376759758793:web:d8eff59764cdf3c5190218",
    measurementId: "G-F5TB4YBEDS"
});

    // 2. Initialize the FirebaseUI Widget
    var ui = new firebaseui.auth.AuthUI(firebase.auth());

    var uiConfig = {
        callbacks: {
            signInSuccessWithAuthResult: function(authResult, redirectUrl) {
                authResult.user.getIdToken().then(token => {
                    localStorage.setItem("adminToken", token);
                    window.location.href = "/admin/dashboard"; 
                });
                return false; 
            },
            uiShown: function() {
                document.getElementById('loader').style.display = 'none';
            }
        },
        signInFlow: 'popup',
        signInOptions: [
            {provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
    requireDisplayName: false}
        ],
        tosUrl: '#',
        privacyPolicyUrl: '#'
    };

    ui.start('#firebaseui-auth-container', uiConfig);
}

startAuth();