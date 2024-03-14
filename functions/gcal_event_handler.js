const NotionWrapper = require('../apis/notion');

// Expects an object with the following:
// {
//  "id": "Event ID",
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

// Function to check and create/update event in "events" database
async function handleEventUpdate(event) {
    const eventsDatabaseId = 'YOUR_EVENTS_DATABASE_ID'; // Replace with your actual database ID

    // Check if event already exists in "events" database
    const existingEvent = await NotionWrapper.getEvent(eventsDatabaseId, event.id);

    if (existingEvent) {
        // Update existing event
        await NotionWrapper.updateEvent(existingEvent.id, {
            summary: event.summary,
            description: event.description,
            link: event.link,
            duration: event.duration,
            start: event.start,
            end: event.end
        });
    } else {
        // Create new event
        await NotionWrapper.createEvent(eventsDatabaseId, {
            id: event.id,
            summary: event.summary,
            description: event.description,
            link: event.link,
            duration: event.duration,
            start: event.start,
            end: event.end
        });
    }
}

// Function to check and create attendees in "contacts" database
async function handleAttendees(event) {
    const contactsDatabaseId = 'YOUR_CONTACTS_DATABASE_ID'; // Replace with your actual database ID

    for (let i = 0; i < event.attendee_emails.length; i++) {
        const email = event.attendee_emails[i];
        const name = event.attendee_names[i];

        // Check if attendee already exists in "contacts" database
        const existingAttendee = await NotionWrapper.getAttendee(contactsDatabaseId, email);

        if (!existingAttendee) {
            // Create new attendee
            await NotionWrapper.createAttendee(contactsDatabaseId, {
                email,
                name
            });
        }
    }
}

// Function to check and create/update registration in "registrations" database
async function handleRegistration(user, event) {
    const registrationsDatabaseId = 'YOUR_REGISTRATIONS_DATABASE_ID'; // Replace with your actual database ID

    // Check if registration already exists in "registrations" database
    const existingRegistration = await NotionWrapper.getRegistration(registrationsDatabaseId, user, event.id);

    if (existingRegistration) {
        // Update existing registration
        await NotionWrapper.updateRegistration(existingRegistration.id, {
            user,
            event: event.id,
            response: event.attendee_responses[user]
        });
    } else {
        // Create new registration
        await NotionWrapper.createRegistration(registrationsDatabaseId, {
            user,
            event: event.id,
            response: event.attendee_responses[user]
        });
    }
}

module.exports = {
    handleEventUpdate,
    handleAttendees,
    handleRegistration
};