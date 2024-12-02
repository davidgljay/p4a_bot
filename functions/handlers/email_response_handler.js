
const NotionWrapper = require('../apis/notion');
const functions = require('firebase-functions');
const moment = require('moment')
const fs = require('fs');
const path = require('path');
const clientConfig = require('../config/client_config.js');

async function sendScheduledEmails(client_org, testmode=false) {
    const yaml = require('js-yaml');
    const templates = yaml.load(fs.readFileSync(path.join(__dirname,'../config/event_email.yaml'), 'utf8'));
    const notionClient =  new NotionWrapper(clientConfig[client_org].token)
    let emails = [];
    for (const template of templates.emails) {
        const cleaned_events_by_chapter = await checkUpcomingEvents(template.days, template.hours, notionClient, client_org, testmode);
        let registrations = [];
        for (const {events, chapter_config} of cleaned_events_by_chapter) {
            for (const event of events) {
                registrations = registrations.concat(await getEventRegistrations(event, chapter_config, notionClient)); 
                emails = emails.concat(prepEmailsfromRegistrations(registrations, event, template, testmode));
            }
        }
    }
    return emails;
}

// Function to check for events coming up in a certain number of days and hours
async function checkUpcomingEvents(days, hours, notionClient, client_org, testmode) {
    try {
        // return a string for a date N days and M hours from now
        const date = new Date();
        date.setDate(date.getDate() + days);
        date.setHours(date.getHours() + hours);
        const dateString = date.toISOString();
        const hourLaterDate = new Date(date)
        hourLaterDate.setHours(date.getHours() + 1);
        const hourLaterDateString = hourLaterDate.toISOString();

        let filter = ([date, tags]) => ({
            "and": [
                {
                  "property": date,
                  "date": {
                    "on_or_after": dateString
                  }
                },
                {
                  "property": date,
                  "date": {
                    "on_or_before": hourLaterDateString
                  }
                },
                {
                    "property": tags,
                    "multi_select": {
                        "contains": "Send Email"
                    }
                }
            ]
        });
        if (testmode) {
            filter = ([date, tags]) => ({
                "property": tags,
                "multi_select": {
                    "contains": "Send Email"
                }
            });
        }
        const events_by_chapter = await notionClient.queryChapterData('events', ['Date', 'Tags'], filter, client_org);
        const cleaned_events_by_chapter = [];
        for (const {chapter_config, results} of events_by_chapter) {
            const cleaned_events = [];
            for (const rawEvent of results) {
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

                //TODO: Add calendar confirm link, Host Name, Host Phone to chapter instantiation script.
                //TODO: Add Name to Registration database instantiation script

                //TODO: More elegant handling of phone numbers when there are multiple hosts.
                const host_phone = rawEvent.properties['Host Phone'].rollup.array.map((phone) => phone.phone_number).join(', ');

                const parking_info_field = chapter_config.events.fields['Parking Info'];
                const transit_info_field = chapter_config.events.fields['Transit Info'];
                
                // const calendar_confirm_link_field = chapter_config.events.fields['Calendar Confirm Link'];

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
                cleaned_events.push(event);
            }
            cleaned_events_by_chapter.push({chapter_config: chapter_config, events: cleaned_events});
        }
        return cleaned_events_by_chapter;
    } catch (error) {
        // Handle error
        console.error('Error checking upcoming events:', error);
        throw error;
    }
}

// Function to return registrations for events
//TODO: Confirm that registrations are being returned correctly
async function getEventRegistrations(event, chapter_config, notionClient) {

    const filter = {
        property: chapter_config.registrations.fields.Event,
        relation: {
            contains: event.id
        }
    };
    try {
        const registrations = await notionClient.query(chapter_config.registrations.id, filter);
        // Perform any necessary logic with the registrations
        const preppedRegistrations = [];
        for (const registration of registrations) {
            const fname = /[^ ]+/.exec(registration.properties.Name.formula.string) || ['Friend'];
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

module.exports = {
    checkUpcomingEvents,
    getEventRegistrations,
    prepEmailsfromRegistrations,
    sendScheduledEmails
};