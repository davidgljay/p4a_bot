const functions = require('firebase-functions');
const {  handleEventUpdate, handleRegistration } = require('./handlers/gcal_event_handler');
require('dotenv').config();

exports.gcal_event = functions.https.onRequest((req, res) => {
    if (req.method !== 'POST') {
        return res.status(400).send('Invalid request method');
    }

    const authToken = req.headers['authorization'];
    const expectedToken = `Bearer ${process.env.CUSTOM_AUTH_TOKEN}`;

    if (authToken !== expectedToken) {
        return res.status(403).send('Unauthorized');  }

    const event = req.body;
    handleEventUpdate(event);
    handleRegistration(event);

    res.status(200).send('Success');
});