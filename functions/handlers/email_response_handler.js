
const NotionWrapper = require("../apis/notion");
const functions = require('firebase-functions');
const fs = require('fs');
const yaml = require('js-yaml');
const clientConfig = require('../config/client_config.js');



// Function to check for events coming up in a certain number of days and hours
async function checkUpcomingEvents(days, hours, client_org) {
    const notionClient = new NotionWrapper(clientConfig[client_org].token);
    const config = {
        eventsDatabaseId: clientConfig[client_org].events_db.id,
        registrationsDatabaseId: clientConfig[client_org].registrations_db.id,
        contactsDatabaseId: clientConfig[client_org].contacts_db.id,
        eventsFields: clientConfig[client_org].events_db.fields,
        registrationFields: clientConfig[client_org].registrations_db.fields,
        contactFields: clientConfig[client_org].contacts_db.fields,
      };

    try {
        // return a string for a date N days and M hours from now
        const date = new Date();
        date.setDate(date.getDate() + days);
        date.setHours(date.getHours() + hours);
        const dateString = date.toISOString();
        const hourLaterDate = new Date(date)
        hourLaterDate.setHours(date.getHours() + 1);
        const hourLaterDateString = hourLaterDate.toISOString();
        console.log('Checking events for date:', dateString);
        const filter = {
            "and": [
                {
                  "property": config.eventsFields["date"],
                  "date": {
                    "on_or_after": dateString
                  }
                },
                {
                  "property": config.eventsFields["date"],
                  "date": {
                    "on_or_before": hourLaterDateString
                  }
                }
            ]
        };
        const events = await notionClient.query(config.eventsDatabaseId, filter);
        // Perform any necessary logic with the events
        const cleanedEvents = [];
        for (const rawEvent of events) {
            console.log(rawEvent.properties.Title.title[0].text.content)
            const event = {
                id: rawEvent.id,
                title: rawEvent.properties.Title.title[0].text.content,
                date: rawEvent.properties.Date.date.start,
            };
            if (rawEvent.properties.Location) {
                event.location = rawEvent.properties.Location.rich_text[0].plain_text;
            }
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