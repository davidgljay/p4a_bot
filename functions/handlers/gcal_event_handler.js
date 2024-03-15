const NotionWrapper = require("../apis/notion");
require("dotenv").config();

const notionClient = new NotionWrapper(process.env.NOTION_TOKEN);

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

const eventsDatabaseId = process.env.EVENTS_DATABASE_ID;
const registrationsDatabaseId = process.env.REGISTRATIONS_DATABASE_ID;
const contactsDatabaseId = process.env.CONTACTS_DATABASE_ID;

// Function to check and create/update event in "events" database
async function handleEventUpdate(event) {
  const filter = {
    property: "gcalid",
    text: {
      equals: event.id,
    },
  };

  // Check if event already exists in "events" database
  const results = await notionClient.query(eventsDatabaseId, filter);

  if (results.length > 0) {
    const existingEvent = results[0];
    // Update existing event
    await notionClient.update(existingEvent.id, {
      summary: event.summary,
      description: event.description,
      link: event.link,
      duration: event.duration,
      location: event.location,
      start: event.start,
      end: event.end,
      gcalid: event.id,
    });
  } else {
    // Create new event
    await notionClient.create(eventsDatabaseId, {
      id: event.id,
      summary: event.summary,
      description: event.description,
      link: event.link,
      location: event.location,
      duration: event.duration,
      start: event.start,
      end: event.end,
      gcalid: event.id,
    });
  }
}


// Function to check and create/update registrations in "registrations" database
async function handleRegistration(event) {
  const filter = {
    property: "event",
    text: {
      equals: event.id,
    },
  };

  // Check if registration already exists in "registrations" database
  const results = await notionClient.query(registrationsDatabaseId, filter);

  const registeredEmails = new Set();
  for (let i = 0; i < results.length; i++) {
    const existingRegistration = results[i];
    for (let j = 0; j < event.attendee_emails.length; j++) {
      const email = event.attendee_emails[j];
      if (existingRegistration.email == email) {
        registeredEmails.add(email);
        if (existingRegistration.response !== event.attendee_responses[j]) {
          await notionClient.update(existingRegistration.id, {
            response: event.attendee_responses[j],
          });
        }
      }
    }
  }

  // Add registrations that aren't yet in the DB.
  for (let i = 0; i < event.attendee_emails.length; i++) {
    const email = event.attendee_emails[i];
    if (!registeredEmails.has(email)) {
      // Check if contact already exists in "contacts" database, create it if it doesn't
      const filter = {
        property: "email",
        text: {
          equals: email,
        },
      };
      const contact = {
        email,
        name: event.attendee_names[i],
      };
      const contactRecord = await notionClient.findOrCreate(contactsDatabaseId, filter, contact);
      // Create new registration
      await notionClient.create(registrationsDatabaseId, {
        user: contactRecord.id,
        event: event.id,
        response: event.attendee_responses[i],
      });
    }
  }
}

module.exports = {
  handleEventUpdate,
  handleRegistration,
};
