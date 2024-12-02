const { initializeApp, firestore } = require('firebase-admin');
const clientConfig = require('../config/client_config.js');


class FirebaseWrapper {

    constructor() {
      const firebaseConfig = {
        apiKey: clientConfig.p4c.firebase.api_key,
        authDomain: "potlucks4change.firebaseapp.com",
        projectId: "potlucks4change",
        storageBucket: "potlucks4change.firebasestorage.app",
        messagingSenderId: "442075127657",
        appId: "1:44s2075127657:web:db58d715887aed671927f8"
      
      };
      initializeApp(firebaseConfig);
      this.fb = firestore();
    }


    async getChapterData(client_org) {
        return await this.fb.collection(client_org).get().then(
            snapshot => {
                let chapters = [];
                snapshot.forEach(doc => {
                    chapters.push(doc.data());
                });
                return chapters
            }
        )
    }
}

module.exports = FirebaseWrapper;