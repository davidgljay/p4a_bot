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
const expectedToken = `Bearer ${functions.config().custom.auth_token}`;

const {
  handleEventUpdate,
  handleRegistration} = require("./handlers/gcal_event_handler");
const initializeNotion = require("./handlers/notion_db_init");
const { on } = require('supertest/lib/test');

exports.gcal_event = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    logger.error("Invalid request method", {structuredData: true});
    return res.status(400).send("Invalid request method");
  }

  const authToken = req.headers["authorization"];


  if (authToken !== expectedToken) {
    logger.error("Unauthorized request", {structuredData: true});
    return res.status(403).send("Unauthorized");
  }

  const event = req.body;
  try {
    await handleEventUpdate(event);
    await handleRegistration(event);
  } catch (error) {
    logger.error("Error handling event and registration", error);
    return res.status(500).send("Error handling event and registration");
  }
  logger.info("Event and registration handled successfully", event);

  res.status(200).send("Success");
});

exports.initialize_notion = onRequest((req, res) => {
  if (req.method !== "POST") {
    logger.error("Invalid request method", {structuredData: true});
    return res.status(400).send("Invalid request method");
  }

  const authToken = req.headers["authorization"];

  if (authToken !== expectedToken) {
    logger.error("Unauthorized request", {structuredData: true});
    return res.status(403).send("Unauthorized, received tojen: " + authToken);
  }
  if (!req.body.parentPageId) {
    logger.error("No parent page ID provided", {structuredData: true});
    return res.status(400).send("No parent page ID provided");
  }
  const parentPageId = req.body.parentPageId;

  try {
    initializeNotion(parentPageId).then((databases) => {
      logger.info("Notion initialized successfully", databases);
      return res.status(200).send(JSON.stringify(databases));
    }) 
  } catch (error) {
    logger.error("Error initializing Notion", error);
    return res.status(500).send("Error initializing Notion");
  }
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// })
