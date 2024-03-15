const NotionWrapper = require('../apis/notion');

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

const eventsDatabaseId = 'YOUR_EVENTS_DATABASE_ID'; // Replace with your actual database ID
const registrationsDatabaseId = 'YOUR_REGISTRATIONS_DATABASE_ID'; // Replace with your actual database ID
const contactsDatabaseId = 'YOUR_CONTACTS_DATABASE_ID'; // Replace with your actual database ID

// Function to check and create/update event in "events" database
async function handleEventUpdate(event) {

    const filter = {
            property: 'gcalid',
            text: {
                equals: event.id
            }
    }

    // Check if event already exists in "events" database
    const results = await NotionWrapper.query(eventsDatabaseId, filter);

    if (results.length > 0) {
        const existingEvent = results[0];
        // Update existing event
        // TODO: handle matching with notion field IDs
        await NotionWrapper.update(existingEvent.id, {
            summary: event.summary,
            description: event.description,
            link: event.link,
            duration: event.duration,
            location: event.location,
            start: event.start,
            end: event.end
        });
    } else {
        // Create new event
        await NotionWrapper.create(eventsDatabaseId, {
            id: event.id,
            summary: event.summary,
            description: event.description,
            link: event.link,
            location: event.location,
            duration: event.duration,
            start: event.start,
            end: event.end
        });
    }
}

// Function to check and create attendees in "contacts" database
// This is probably not necessary, as we can just create contacts as we create registrations.
// async function handleAttendees(event) {
//     const contactsDatabaseId = 'YOUR_CONTACTS_DATABASE_ID'; // Replace with your actual database ID

//     for (let i = 0; i < event.attendee_emails.length; i++) {
//         const email = event.attendee_emails[i];
//         const name = event.attendee_names[i];

//         const filter = {
//             property: 'email',
//             text: {
//                 equals: email
//             }
//         } //TODO: Is there a way to do this more efficiently through a big or filter?

//         // Check if attendee already exists in "contacts" database
//         const results = await NotionWrapper.query(contactsDatabaseId, filter);

//         if (results.length === 0) {
//             // Create new attendee
//             await NotionWrapper.create(contactsDatabaseId, {
//                 email,
//                 name
//             });
//         }
//         // TODO: Handle case where we don't yet have someone's name, though this seems edge right now.
//     }
// }



// Function to check and create/update registrations in "registrations" database
async function handleRegistration(event) {

    const filter = {
            property: 'event',
            text: {
                equals: event.id
            }
        }

    // Check if registration already exists in "registrations" database
    const results = await NotionWrapper.query(registrationsDatabaseId, filter);

    let registeredEmails = new Set();
    for (let i = 0; i < results.length; i++) {
        const existingRegistration = results[i];
        for (let j = 0; j < event.attendee_emails.length; j++) {
            const email = event.attendee_emails[j];
            if (existingRegistration.email == email) {
                registeredEmails.add(email);
                if (existingRegistration.response !== event.attendee_responses[j]) {
                    await NotionWrapper.update(existingRegistration.id, {
                        response: event.attendee_responses[j]
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
                property: 'email',
                text: {
                    equals: email
                }
            };
            const contact = {
                email,
                name: event.attendee_names[i]
            };
            const contactRecord = await NotionWrapper.findOrCreate(contactsDatabaseId, filter, contact);
            // Create new registration
            await NotionWrapper.create(registrationsDatabaseId, {
                user: contactRecord.id,
                event: event.id,
                response: event.attendee_responses[i]
            });
        }

    }
}

module.exports = {
    handleEventUpdate,
    handleRegistration
};