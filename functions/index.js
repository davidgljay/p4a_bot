/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require('firebase-functions');
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const {
  handleEventUpdate,
  handleRegistration} = require("./handlers/gcal_event_handler");

exports.gcal_event = onRequest((req, res) => {
  if (req.method !== "POST") {
    logger.error("Invalid request method", {structuredData: true});
    return res.status(400).send("Invalid request method");
  }

  const authToken = req.headers["authorization"];
  const expectedToken = `Bearer ${functions.config.CUSTOM_AUTH_TOKEN}`;

  if (authToken !== expectedToken) {
    logger.error("Unauthorized request", {structuredData: true});
    return res.status(403).send("Unauthorized");
  }

  const event = req.body;
  try {
    handleEventUpdate(event);
    handleRegistration(event);
  } catch (error) {
    logger.error("Error handling event and registration", error);
    return res.status(500).send("Error handling event and registration");
  }
  logger.info("Event and registration handled successfully", event);

  res.status(200).send("Success");
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
