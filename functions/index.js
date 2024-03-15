/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

const {
  handleEventUpdate,
  handleRegistration} = require("./handlers/gcal_event_handler");
require("dotenv").config();

exports.gcal_event = onRequest((req, res) => {
  if (req.method !== "POST") {
    return res.status(400).send("Invalid request method");
  }

  const authToken = req.headers["authorization"];
  const expectedToken = `Bearer ${process.env.CUSTOM_AUTH_TOKEN}`;

  if (authToken !== expectedToken) {
    return res.status(403).send("Unauthorized");
  }

  const event = req.body;
  handleEventUpdate(event);
  handleRegistration(event);

  res.status(200).send("Success");
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
