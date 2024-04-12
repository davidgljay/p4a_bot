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

const notionClient = new NotionWrapper(functions.config().notion.token);

const eventsDatabaseId = functions.config().notion.events_db.id;
const registrationsDatabaseId = functions.config().notion.registrations_db.id;
const contactsDatabaseId = functions.config().notion.contacts_db.id;
const eventsFields = functions.config().notion.events_db.fields;
const registrationFields = functions.config().notion.registrations_db.fields;
const contactFields = functions.config().notion.contacts_db.fields;

// Function to check and create/update event in "events" database
async function handleEventUpdate(event) {
  const filter = {
    property: eventsFields.gcalid,
    rich_text: {
      equals: event.id,
    },
  };

  // Check if event already exists in "events" database
  const results = await notionClient.query(eventsDatabaseId, filter);
  const properties = {
    [eventsFields.title]: {title: [{text: {content:event.summary}}]},
    [eventsFields.description]: {rich_text: [{text: {content: event.description,}}]},
    [eventsFields.date]: {date: {start: event.start["Event Begins"]}},
    [eventsFields.gcalid]:  {rich_text: [{text: {content: event.id}}]},
  }

  if (results.length > 0) {
    const existingEvent = results[0];
    console.log("Updating existing event", existingEvent.id, event.id)

    // Update existing event
    await notionClient.update(existingEvent.id, properties);
  } else {
    console.log("Creating new event", event.id)
    // Create new event
    await notionClient.create(eventsDatabaseId, properties);
  }
}


// Function to check and create/update registrations in "registrations" database
async function handleRegistration(event) {

  const eventFilter = {
    property: eventsFields.gcalid,
    rich_text: {
      equals: event.id,
    },
  };

  // Check if event already exists in "events" database
  const eventResults = await notionClient.query(eventsDatabaseId, eventFilter);

  const registrationFilter = {
    property: registrationFields.event_gcalid,
    rollup: {
      any: {
        rich_text: {
          equals: event.id
        }
      }
    }
  };

  // Check if registration already exists in "registrations" database
  const results = await notionClient.query(registrationsDatabaseId, registrationFilter);
  const registeredEmails = new Set();
  for (let i = 0; i < results.length; i++) {
    const existingRegistration = results[i];
    for (let j = 0; j < event.attendee_emails.length; j++) {
      const email = event.attendee_emails[j];
      if (existingRegistration.properties.Email.rollup.array[0].email == email) {
        registeredEmails.add(email);
        if (existingRegistration.response !== event.attendee_responses[j]) {
          await notionClient.update(existingRegistration.id, {
            [registrationFields.status]: {select: {id: registrationFields.status_options[event.attendee_responses[j]]}},
          });
        }
      }
    }
  }

  console.log('Registered Emails', registeredEmails)
  // Add registrations that aren't yet in the DB.
  for (let i = 0; i < event.attendee_emails.length; i++) {
    const email = event.attendee_emails[i];
    if (!registeredEmails.has(email)) {
      // Check if contact already exists in "contacts" database, create it if it doesn't
      const filter = {
        property: contactFields.email,
        email: {
          equals: email,
        },
      };
      const contact = {
        [contactFields.email]: {email: email},
        [contactFields.name]: {title: [{text: {content:event.attendee_names[i]}}]},
      };
      const contactRecord = await notionClient.findOrCreate(contactsDatabaseId, filter, contact);
      // Create new registration
      await notionClient.create(registrationsDatabaseId, {
        [registrationFields.contact]: {relation: [{id: contactRecord.id}]},
        [registrationFields.event]: {relation:[{id: eventResults[0].id}]},
        [registrationFields.status]: {select: {id: registrationFields.status_options[event.attendee_responses[i]]}},
      });
    }
  }
}

module.exports = {
  handleEventUpdate,
  handleRegistration,
};
