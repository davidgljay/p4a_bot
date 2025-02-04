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
const clientConfig = require('../config/client_config.js');

async function handleGcalEvent(event, client_org) {
  const notionClient = new NotionWrapper(clientConfig[client_org].token);

  //TODO: replace config with db from queryChapterData

  // const config = {
  //   eventsDatabaseId: clientConfig[client_org].events_db.id,
  //   registrationsDatabaseId: clientConfig[client_org].registrations_db.id,
  //   contactsDatabaseId: clientConfig[client_org].contacts_db.id,
  //   eventsFields: clientConfig[client_org].events_db.fields,
  //   registrationFields: clientConfig[client_org].registrations_db.fields,
  //   contactFields: clientConfig[client_org].contacts_db.fields,
  // };
  try {
    await handleEventUpdate(event, notionClient, client_org);
    await handleRegistration(event, notionClient, client_org);
  } catch (error) {
    console.error("Error handling event and registration", error);
    throw error;
  }
}

// Function to check and create/update event in "events" database
async function handleEventUpdate(event, notionClient, client_org) {
  const eventFilter = ([gcalid]) => ({
    property: gcalid,
    rich_text: {
      equals: event.id,
    },
  });

  if (!event.host_email) {
    throw new Error("Host email not found.");
  };

  // Check if event already exists in "events" database
  const eventQueryResults = await notionClient.queryChapterData('events', ['GCalId'], eventFilter, client_org);
  const emailFilter = ([email]) => ({
    property: email,
    email: {
      equals: event.host_email
    },
  });

  const hostQueryResults = await notionClient.queryChapterData('contacts', ['Email'], emailFilter, client_org);
  if (hostQueryResults.length == 0) {
    throw new Error("Host not found.");
  };

  const chapter_config = hostQueryResults[0].chapter_config;
  const eventsDatabaseId = chapter_config.events.id;
  
  //If not, get the chapter of the host and create a new event there. If there is no host then throw an error.
  if (eventQueryResults.length == 0) {
    const results = await notionClient.create(eventsDatabaseId, formatProperties(chapter_config, event, hostQueryResults[0].results[0]));
  } else {
    const results = eventQueryResults[0].results;
    await notionClient.update(eventsDatabaseId, formatProperties(chapter_config, event, hostQueryResults[0].results[0]));
  }
}


function formatProperties (chapter_config, event, host) {
  return {
    [chapter_config.events.fields.Title]: {title: [{text: {content:event.summary}}]},
    [chapter_config.events.fields.Description]: {rich_text: [{text: {content: event.description,}}]},
    [chapter_config.events.fields.Date]: {date: {start: event.start["Event Begins"]}},
    [chapter_config.events.fields.GCalId]:  {rich_text: [{text: {content: event.id}}]},
    [chapter_config.events.fields.Location]: {rich_text: [{text: {content: event.location}}]},
    [chapter_config.events.fields.Host]: {relation: [{id: host.id}]},
  }
}


// Function to check and create/update registrations in "registrations" database
async function handleRegistration(event, notionClient, client_org) {

  const eventFilter = ([gcalid]) => ({  
    property: gcalid,
    rich_text: {
      equals: event.id,
    },
  });

  // Check if event already exists in "events" database
   const eventQueryResults= await notionClient.queryChapterData('events', ['GCalId'], eventFilter, client_org);

  if (!eventQueryResults || eventQueryResults.length == 0) {
    return new Error('Event not found when creating registration.')
  }

  const {chapter_config, results} = eventQueryResults[0];
  

  const registrationFilter = {
    property: chapter_config.registrations.fields['Event GCalId'],
    rollup: {
      any: {
        rich_text: {
          equals: event.id
        }
      }
    }
  };

  // Check if registration already exists in "registrations" database
  const registrations = await notionClient.query(chapter_config.registrations.id, registrationFilter);
  const registeredEmails = new Set();
  const emails = event.attendee_emails.split(",");
  const responseStatuses = event.attendee_statuses.split(",");
  const displayNames = event.attendee_names.split(",");
  for (let i = 0; i < registrations.length; i++) {
    const existingRegistration = registrations[i];
    for (let j = 0; j < emails.length; j++) {
      const email = emails[j];
      const responseStatus = responseStatuses[j];
      if (existingRegistration.properties.Email.rollup.array[0].email == email) {
        registeredEmails.add(email);
        if (existingRegistration.properties.Status.select.name == responseStatus) {
          continue;
        }
        await notionClient.update(existingRegistration.id, {
          [chapter_config.registrations.fields.Status]: {select: {id: responseStatus}},
        });
      }
    }
  }

  // Add registrations that aren't yet in the DB.
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    const responseStatus = responseStatuses[i];
    const displayName = displayNames[i] || "";
    if (!registeredEmails.has(email)) {
      // Check if contact already exists in "contacts" database, create it if it doesn't
      const filter = {
        property: chapter_config.contacts.fields.Email,
        email: {
          equals: email,
        },
      };
      const contact = {
        [chapter_config.contacts.fields.Email]: {email: email},
        [chapter_config.contacts.fields.Name]: {title: [{text: {content: displayName}}]},
      };
      const contactRecord = await notionClient.findOrCreate(chapter_config.contacts.id, filter, contact);
      const contactName = notionClient.findObjectById(contactRecord.properties, chapter_config.contacts.fields.Name).title[0].text.content;
      // Create new registration
      await notionClient.create(chapter_config.registrations.id, {
        [chapter_config.registrations.fields.Title]: {title: [{text: {content: contactName + " - " + event.summary}}]},
        [chapter_config.registrations.fields.Contact]: {relation: [{id: contactRecord.id}]},
        [chapter_config.registrations.fields.Event]: {relation:[{id: results[0].id}]},
        [chapter_config.registrations.fields.Status]: {select: {name: responseStatus}},
      });
    }
  }
}

module.exports = {
  handleEventUpdate,
  handleRegistration,
  handleGcalEvent
};
