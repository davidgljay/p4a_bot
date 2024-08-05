
const NotionWrapper = require('../apis/notion');
const functions = require('firebase-functions');
const moment = require('moment')
const fs = require('fs');
const path = require('path');
const clientConfig = require('../config/client_config.js');

async function sendScheduledEmails(client_org, testmode=false) {
    const yaml = require('js-yaml');
    const templates = yaml.load(fs.readFileSync(path.join(__dirname,'../config/event_email.yaml'), 'utf8'));
    const config = getConfig(client_org);
    let emails = [];
    for (const template of templates.emails) {
        const events = await checkUpcomingEvents(template.days, template.hours, config, testmode);
        let registrations = [];
        for (const event of events) {
            registrations = registrations.concat(await getEventRegistrations(event, config)); 
            emails = emails.concat(prepEmailsfromRegistrations(registrations, event, template, testmode));
        }
    }
    return emails;
}

// Function to check for events coming up in a certain number of days and hours
async function checkUpcomingEvents(days, hours, config, testmode) {
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
                },
                {
                    "property": config.eventsFields["tags"],
                    "multi_select": {
                        "contains": "Send Email"
                    }
                }
            ]
        };
        let events;
        if (testmode) {
            events = await config.notionClient.query(
                config.eventsDatabaseId,
                {
                    "property": config.eventsFields["tags"],
                    "multi_select": {
                        "contains": "Send Email"
                    }
                }, 
                1
            );        
        } else {
            events = await config.notionClient.query(config.eventsDatabaseId, filter);
        }
            // Perform any necessary logic with the events
        const cleanedEvents = [];
        for (const rawEvent of events) {
            console.log('Event:', rawEvent);
            const host_name = rawEvent.properties['Host Name'].rollup.array.reduce((acc, current, index, array) => {
                const name = current.title[0].plain_text;
                if (array.length == 1) {
                    return name;
                } else
                if (index === array.length - 1) {
                    return acc + ' and ' + name;
                } else {
                    return acc + ', ' + name;
                }
            }, '');
            //TODO: More elegant handling of phone numbers when there are multiple hosts.
            const host_phone = rawEvent.properties['Host Phone'].rollup.array.map((phone) => phone.phone_number).join(', ');

            // TODO: Replace fieldnames with lookupByID
            const event = {
                id: rawEvent.id,
                title: rawEvent.properties.Title.title[0].text.content,
                date: rawEvent.properties.Date.date.start,
                location: rawEvent.properties.Location.rich_text[0].text.content,
                host_name: host_name,
                host_phone: host_phone,
                parking_info: rawEvent.properties['Parking Info'].rich_text[0] ? '<li>' + rawEvent.properties['Parking Info'].rich_text[0].text.content + '</li>' : '',
                transit_info: rawEvent.properties['Transit Info'].rich_text[0] ? '<li>' + rawEvent.properties['Transit Info'].rich_text[0].text.content + '</li>' : '',
                gcal_link: rawEvent.properties['Calendar Confirm Link'].formula.string,
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
        const preppedRegistrations = [];
        for (const registration of registrations) {
            const fname = /[^ ]+/.exec(registration.properties.Name.formula.string) || ['Friend'];
            // console.log('Registration:', registration.properties.Name.formula, registration.properties.Email.rollup.array);
            if (registration.properties.Email.rollup.array.length > 0) {
            preppedRegistrations.push({
                id: registration.id,
                email: registration.properties.Email.rollup.array[0].email, 
                status: registration.properties.Status.select.name, 
                fname: fname[0],
            });
        }
        }
        return preppedRegistrations;
    } catch (error) {
        // Handle error
        console.error('Error getting event registrations:', error);
        throw error;
    }
}

function prepEmailsfromRegistrations(registrations, event, template, testmode) {
    const emails = [];
    for (const registration of registrations) {
        // Fill out the email template with the registration and event data
        if (template.status != registration.status) {
            continue;
        }
        const date = moment.parseZone(event.date)
        const weekday = date.format('dddd')
        const month_day = date.format('MMMM Do')
        const start_time = date.format('h:mm a')
        const body = template.body
            .replace(/{{email}}/g, registration.email)
            .replace(/{{fname}}/g, registration.fname)
            .replace(/{{title}}/g, event.title)
            .replace(/{{weekday}}/g, weekday)
            .replace(/{{month_day}}/g, month_day)
            .replace(/{{start_time}}/g, start_time)
            .replace(/{{event_location}}/g, event.location)
            .replace(/{{host_name}}/g, event.host_name)
            .replace(/{{host_phone}}/g, event.host_phone)
            .replace(/{{parking_info}}/g, event.parking_info)
            .replace(/{{transit_info}}/g, event.transit_info)
            .replace(/{{host_phone}}/g, event.host_phone)
            .replace(/{{gcal_link}}/g, event.gcal_link)
            .replace(/{{reg_id}}/g, registration.id);

        const subject = template.subject
            .replace('{{title}}', event.title);
        emails.push({
            to: testmode ? clientConfig.test_email : registration.email,
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