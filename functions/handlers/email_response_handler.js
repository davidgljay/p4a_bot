
const NotionWrapper = require('../apis/notion');
const functions = require('firebase-functions');
const fs = require('fs');
const path = require('path');
const clientConfig = require('../config/client_config.js');
const { event } = require('firebase-functions/v1/analytics');

async function sendScheduledEmails(client_org) {
    const yaml = require('js-yaml');
    const templates = yaml.load(fs.readFileSync(path.join(__dirname,'../config/event_email.yaml'), 'utf8'));
    const config = getConfig(client_org);
    let emails = [];
    for (const template of templates.emails) {
        const events = await checkUpcomingEvents(template.days, template.hours, config);
        let registrations = [];
        for (const event of events) {
            registrations = registrations.concat(await getEventRegistrations(event, config)); 
        }
        emails = emails.concat(prepEmailsfromRegistrations(registrations, event, template));
    }
    return emails;
}

// Function to check for events coming up in a certain number of days and hours
async function checkUpcomingEvents(days, hours, config) {
    try {
        // return a string for a date N days and M hours from now
        const date = new Date();
        date.setDate(date.getDate() + days);
        date.setHours(date.getHours() + hours);
        const dateString = date.toISOString();
        const hourLaterDate = new Date(date)
        hourLaterDate.setHours(date.getHours() + 1);
        const hourLaterDateString = hourLaterDate.toISOString();
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
        const events = await config.notionClient.query(config.eventsDatabaseId, filter);
        // Perform any necessary logic with the events
        const cleanedEvents = [];
        for (const rawEvent of events) {
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
async function getEventRegistrations(event, config) {

    const filter = {
        property: config.registrationFields["event"],
        relation: {
            contains: event.id
        }
    };
    try {
        const registrations = await config.notionClient.query(config.registrationsDatabaseId, filter);
        // Perform any necessary logic with the registrations
        const emails = [];
        for (const registration of registrations) {
            const fname = /[^ ]+/.exec(registration.properties.Name.formula.string) || ['Friend'];
            emails.push({
                email: registration.properties.Email.rollup.array[0].email, 
                status: registration.properties.Status.select.name, 
                fname:fname[0]
            });
        }
        return emails;
    } catch (error) {
        // Handle error
        console.error('Error getting event registrations:', error);
        throw error;
    }
}

function prepEmailsfromRegistrations(registrations, event, template) {
    const emails = [];
    for (const registration of registrations) {
        // Fill out the email template with the registration and event data
        if (template.status != registration.status) {
            continue;
        }
        const body = template.body
            .replace('{{email}}', registration.email)
            .replace('{{fname}}', registration.fname)
            .replace('{{event_name}}', event.title)
            .replace('{{event_date}}', event.date)
            .replace('{{event_location}}', event.location);
        const subject = template.subject
            .replace('{{event_name}}', event.title);
        emails.push({
            to: registration.email,
            subject,
            body,        
        });
    }
    return emails;
}

function getConfig(client_org) {
    return {
        notionClient: new NotionWrapper(clientConfig[client_org].token),
        eventsDatabaseId: clientConfig[client_org].events_db.id,
        registrationsDatabaseId: clientConfig[client_org].registrations_db.id,
        contactsDatabaseId: clientConfig[client_org].contacts_db.id,
        eventsFields: clientConfig[client_org].events_db.fields,
        registrationFields: clientConfig[client_org].registrations_db.fields,
        contactFields: clientConfig[client_org].contacts_db.fields,
      };
};

module.exports = {
    getConfig,
    checkUpcomingEvents,
    getEventRegistrations,
    prepEmailsfromRegistrations,
    sendScheduledEmails
};