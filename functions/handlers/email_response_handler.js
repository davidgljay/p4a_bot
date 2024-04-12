
const NotionWrapper = require("../apis/notion");
const functions = require('firebase-functions');

const notionClient = new NotionWrapper(functions.config().notion.token);

const eventsDatabaseId = functions.config().notion.events_db.id;
const registrationsDatabaseId = functions.config().notion.registrations_db.id;
const eventsFields = functions.config().notion.events_db.fields;
const registrationFields = functions.config().notion.registrations_db.fields;

// Function to check for events coming up in N days
async function checkUpcomingEvents(days) {
    try {
        // return a string for a date N days from now
        const date = new Date();
        date.setDate(date.getDate() + days);
        const dateString = date.toISOString().split('T')[0];
        console.log('Checking events for date:', dateString);
        const filter = {
            property: eventsFields["date"],
            date: {
                "equals": dateString
            }
        };
        const events = await notionClient.query(eventsDatabaseId, filter);
        // Perform any necessary logic with the events
        return events;
    } catch (error) {
        // Handle error
        console.error('Error checking upcoming events:', error);
        throw error;
    }
}

// Function to return registrations for events
async function getEventRegistrations(eventId) {
    const filter = {
        property: registrationFields["event"],
        relation: {
            contains: eventId
        }
    };
    try {
        const registrations = await notionClient.query(registrationsDatabaseId, filter);
        // Perform any necessary logic with the registrations
        const emails = [];
        for (const registration of registrations) {
            console.log('Registration:', registration)
            emails.push({email: registration.properties.Email.rollup.array[0].email, status: registration.properties.Status.select.name});
        }
        return emails;
    } catch (error) {
        // Handle error
        console.error('Error getting event registrations:', error);
        throw error;
    }
}

function prepEmailsfromRegistrations(registrations) {
}

module.exports = {
    checkUpcomingEvents,
    getEventRegistrations,
};