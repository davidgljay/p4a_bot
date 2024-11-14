const { initializeApp, firestore } = require('firebase-admin');
const clientConfig = require('../config/client_config.js');

const firebaseConfig = {

    apiKey: clientConfig.p4c.firebase.api_key,
    authDomain: "potlucks4change.firebaseapp.com",
    projectId: "potlucks4change",
    storageBucket: "potlucks4change.firebasestorage.app",
    messagingSenderId: "442075127657",
    appId: "1:44s2075127657:web:db58d715887aed671927f8"
  
  };

function initializeFirebase() {
    initializeApp(firebaseConfig);
    return firestore();
}

module.exports = { initializeFirebase };