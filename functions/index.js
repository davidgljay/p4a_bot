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
const expectedToken = `Bearer ${process.env.AUTH_TOKEN}`;

const {handleGcalEvent} = require("./handlers/gcal_event_handler");
const initializeNotion = require("./handlers/notion_db_init");
const { sendScheduledEmails } = require("./handlers/email_response_handler");
const { lookupRegistration } = require("./handlers/get_registration");
const { potluck_form } = require("./handlers/potluck_form");
const { googleAuthUrl, googleAuthCallback } = require("./handlers/google_auth_url");
const { updateRegistrationStatus } = require("./handlers/event_confirm");

exports.prepemails = onRequest(async (req, res) => {
  try {
    const emails = await sendScheduledEmails(req.body.client_org);
    res.status(200).send(emails);

    //TODO: Add Auth token check
  }
  catch (error) {
    logger.error("Error preparing emails", error);
    res.status(500).send("Error preparing emails: " + error.message);
  }
});

exports.gcalevent = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    logger.error("Invalid request method", {structuredData: true});
    return res.status(400).send("Invalid request method");
  }

  const authToken = req.headers["authorization"];


  if (authToken !== expectedToken) {
    logger.error("Unauthorized request", {structuredData: true});
    return res.status(403).send("Unauthorized");
  }

  const event = req.body.event;
  const client_org = req.body.client_org;
  try {
    await handleGcalEvent(event, client_org);
  } catch (error) {
    logger.error("Error handling event and registration", error);
    return res.status(500).send("Error handling event and registration");
  }
  logger.info("Event and registration handled successfully", event);

  res.status(200).send("Success");
});

exports.initializenotion = onRequest((req, res) => {
  if (req.method !== "POST") {
    logger.error("Invalid request method", {structuredData: true});
    return res.status(400).send("Invalid request method");
  }

  const authToken = req.headers["authorization"];

  if (authToken !== expectedToken) {
    logger.error("Unauthorized request", {structuredData: true});
    return res.status(403).send("Unauthorized, received token: " + authToken);
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

exports.get_registration = onRequest(async (req, res) => {
  if (req.method !== "GET") {
    logger.error("Invalid request method", {structuredData: true});
    return res.status(400).send("Invalid request method");
  }

  const id = req.query.id;
  const client_org = req.query.client_org;

  try {
    const registration = await lookupRegistration(id, client_org);
    res.status(200).send(JSON.stringify(registration));
  } catch (error) {
    logger.error("Error looking up registration", error);
    res.status(500).send("Error looking up registration");
  }
});

exports.potluck_form = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    logger.error("Invalid request method", {structuredData: true});
    return res.status(400).send("Invalid request method");
  }

  try {
    await potluck_form(req.body);
    res.status(200).send("Success");
  } catch (error) {
    logger.error("Error uploading form", error);
    res.status(500).send("Error uploading form");
  }
});

exports.event_confirm = onRequest(async (req, res) => {
  if (req.method !== "GET") {
    logger.error("Invalid request method", {structuredData: true});
    return res.status(400).send("Invalid request method");
  }

  const registrationId = req.query.id;
  const status = req.query.status;
  const client_org = req.query.client_org;

  try {
    const result = await updateRegistrationStatus(registrationId, status, client_org);
    res.status(200).send(result);
  } catch (error) {
    logger.error("Error updating registration status", error);
    res.status(500).send("Error updating registration status");
  }
});

exports.google_auth = onRequest(async (req, res) => {
  if (req.method !== "GET") {
    logger.error("Invalid request method", {structuredData: true});
    return res.status(400).send("Invalid request method");
  }

  try {
    const auth_url = googleAuthUrl();
    res.redirect(auth_url);
  } catch (error) {
    logger.error("Error handling Google auth", error);
    res.status(500).send("Error handling Google auth");
  }
});

exports.google_auth_callback = onRequest(async (req, res) => {
  if (req.method !== "GET") {
    logger.error("Invalid request method", {structuredData: true});
    return res.status(400).send("Invalid request method");
  }

  try {
    console.log('Code code:', req.query);
    const code = req.query.code;
    // Now that we have the code, use that to acquire tokens.
    googleAuthCallback(code);
    res.status(200).send("Success");
  } catch (error) {
    logger.error("Error handling Google auth callback", error);
    res.status(500).send("Error handling Google auth callback");
  }
});
