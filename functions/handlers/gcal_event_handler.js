// Expects an object with the following:
// {
//  "id": "Event Gcal ID",
//   "summary": "Event summary",
//   "location": "Event location",
//   "description": "Event description",
//   "start": "Event start time",
//   "end": "Event end time",
//  "attendee_emails": ["email1", "email2"],
//  "attendee_names": ["name1", "name2"],
//   "attendee_responses": ["response1", "response2"],
//   "link": "Event link",
//   "duration": "Event duration"
// }

const NotionWrapper = require("../apis/notion");
const functions = require('firebase-functions');

async function handleGcalEvent(event, client_org) {
  const notionClient = new NotionWrapper(functions.config().notion[client_org].token);
  const config = {
    eventsDatabaseId: functions.config().notion[client_org].events_db.id,
    registrationsDatabaseId: functions.config().notion[client_org].registrations_db.id,
    contactsDatabaseId: functions.config().notion[client_org].contacts_db.id,
    eventsFields: functions.config().notion[client_org].events_db.fields,
    registrationFields: functions.config().notion[client_org].registrations_db.fields,
    contactFields: functions.config().notion[client_org].contacts_db.fields,
  };
  try {
    await handleEventUpdate(event, config, notionClient);
    await handleRegistration(event, config, notionClient);
  } catch (error) {
    console.error("Error handling event and registration", error);
    throw error;
  }
  console.log("Event and registration handled successfully", event);
}

// Function to check and create/update event in "events" database
async function handleEventUpdate(event, config, notionClient) {
  const filter = {
    property: config.eventsFields.gcalid,
    rich_text: {
      equals: event.id,
    },
  };

  // Check if event already exists in "events" database
  const results = await notionClient.query(config.eventsDatabaseId, filter);
  const properties = {
    [config.eventsFields.title]: {title: [{text: {content:event.summary}}]},
    [config.eventsFields.description]: {rich_text: [{text: {content: event.description,}}]},
    [config.eventsFields.date]: {date: {start: event.start["Event Begins"]}},
    [config.eventsFields.gcalid]:  {rich_text: [{text: {content: event.id}}]},
  }

  if (results.length > 0) {
    const existingEvent = results[0];
    console.log("Updating existing event", existingEvent.id, event.id)

    // Update existing event
    await notionClient.update(existingEvent.id, properties);
  } else {
    console.log("Creating new event", event.id)
    // Create new event
    await notionClient.create(config.eventsDatabaseId, properties);
  }
}


// Function to check and create/update registrations in "registrations" database
async function handleRegistration(event, config, notionClient) {

  const eventFilter = {
    property: config.eventsFields.gcalid,
    rich_text: {
      equals: event.id,
    },
  };

  // Check if event already exists in "events" database
  const eventResults = await notionClient.query(config.eventsDatabaseId, eventFilter);

  const registrationFilter = {
    property: config.registrationFields.event_gcalid,
    rollup: {
      any: {
        rich_text: {
          equals: event.id
        }
      }
    }
  };

  // Check if registration already exists in "registrations" database
  const results = await notionClient.query(config.registrationsDatabaseId, registrationFilter);
  const registeredEmails = new Set();
  for (let i = 0; i < results.length; i++) {
    const existingRegistration = results[i];
    for (let j = 0; j < event.attendees.length; j++) {
      const {email, responseStatus} = event.attendees[j];
      if (existingRegistration.properties.Email.rollup.array[0].email == email) {
        registeredEmails.add(email);
        await notionClient.update(existingRegistration.id, {
          [config.registrationFields.status]: {select: {id: config.registrationFields.status_options[responseStatus]}},
        });
      }
    }
  }

  console.log('Registered Emails', registeredEmails)
  // Add registrations that aren't yet in the DB.
  for (let i = 0; i < event.attendees.length; i++) {
    var {email, displayName, responseStatus} = event.attendees[i];
    if (!registeredEmails.has(email)) {
      // Check if contact already exists in "contacts" database, create it if it doesn't
      const filter = {
        property: config.contactFields.email,
        email: {
          equals: email,
        },
      };
      displayName = displayName || "";
      const contact = {
        [config.contactFields.email]: {email: email},
        [config.contactFields.name]: {title: [{text: {content: displayName}}]},
      };
      const contactRecord = await notionClient.findOrCreate(config.contactsDatabaseId, filter, contact);
      // Create new registration
      await notionClient.create(config.registrationsDatabaseId, {
        [config.registrationFields.title]: {title: [{text: {content: displayName + " - " + event.summary}}]},
        [config.registrationFields.contact]: {relation: [{id: contactRecord.id}]},
        [config.registrationFields.event]: {relation:[{id: eventResults[0].id}]},
        [config.registrationFields.status]: {select: {id: config.registrationFields.status_options[responseStatus]}},
      });
    }
  }
}

module.exports = {
  handleEventUpdate,
  handleRegistration,
  handleGcalEvent
};
