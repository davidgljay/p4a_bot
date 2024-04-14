
const NotionWrapper = require("../apis/notion");
const functions = require('firebase-functions');
const fs = require('fs');
const yaml = require('js-yaml');

const notionClient = new NotionWrapper(functions.config().notion.p4c.token);

const eventsDatabaseId = functions.config().notion.p4c.events_db.id;
const registrationsDatabaseId = functions.config().notion.p4c.registrations_db.id;
const eventsFields = functions.config().notion.p4c.events_db.fields;
const registrationFields = functions.config().notion.p4c.registrations_db.fields;

// Function to check for events coming up in N days
async function checkUpcomingEvents(days, hours) {
    try {
        // return a string for a date N days from now
        // TODO: Because one of these emails is sent two hours before we need to return all events w/in the next 2 days and then identify by number of hours
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
        const cleanedEvents = [];
        for (rawEvent in events) {
            const event = {
                id: rawEvent.id,
                title: rawEvent.properties.Title.title[0].text.content,
                date: rawEvent.properties.Date.date.start,
                location: rawEvent.properties.Location.rich_text[0].text.content,
            };
            cleanedEvents.push(event);
        }
        return cleanedEvents;
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
            const fname = registration.properties.Name.title[0].text.content || 'Friend'
            emails.push({email: registration.properties.Email.rollup.array[0].email, status: registration.properties.Status.select.name, fname: registration.properties.Name.title[0].text.content});
        }
        return emails;
    } catch (error) {
        // Handle error
        console.error('Error getting event registrations:', error);
        throw error;
    }
}

function prepEmailsfromRegistrations(registrations, event, templates, days) {
    for (registration in registrations) {
        // Send email to registration.email with template
        const body = templates[days][registration.status].body
            .replace['{{email}}', registration.email]
            .replace['{{fname}}', registration.fname]
            .replace['{{event_name}}', event.title]
            .replace['{{event_date}}', event.date]
            .replace['{{event_location}}', event.location];
        const subject = templates[days][registration.status].subject.replace['{{event_name}}', event.title];
        return {
            to: registration.email,
            subject: subject,
            body: body,        
        };
    }
}

async function sendScheduledEmails() {


}

module.exports = {
    checkUpcomingEvents,
    getEventRegistrations,
    prepEmailsfromRegistrations
};