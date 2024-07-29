const { event } = require("firebase-functions/v1/analytics");
const NotionWrapper = require("../apis/notion.js");
const clientConfig = require('../config/client_config.js');

// Function to iterate through object keys and check condition
function findObjectById(obj, id) {
    for (let key in obj) {
        if (obj[key].id === id) {
            return obj[key];
        }
    }
}

// Function to lookup object in "registrations" database
async function lookupRegistration(id, client_org) {
    try {
        const notionClient = new NotionWrapper(clientConfig[client_org].token);
        const config = {
          registrationsDatabaseId: clientConfig[client_org].registrations_db.id,
          registrationFields: clientConfig[client_org].registrations_db.fields,
        };
        const registration = await notionClient.get(id);
        const properties = registration.properties;
        const event_id = findObjectById(properties, config.registrationFields.event).relation[0].id;

        // Get all registrations for the event
        const event_filter = {
            property: config.registrationFields.event,
            relation: {
                contains: event_id,
            },
        };
        const event_registrations_raw = await notionClient.query(config.registrationsDatabaseId, event_filter);
        let event_registrations = [];
        for (let i = 0; i < event_registrations_raw.length; i++) {
            const event_registration = event_registrations_raw[i];
            event_registrations.push({
                status: findObjectById(event_registration.properties, config.registrationFields.status).select.name,
                name: event_registration.properties['Name'].formula.string,
                dish: event_registration.properties['Dish'].rich_text.length > 0 ? event_registration.properties['Dish'].rich_text[0].text.content : null,
                dish_type: event_registration.properties['Dish Type'].select ? event_registration.properties['Dish Type'].select.name : null,
            });
        }

        // TODO: Update database schema to include all fields, avoiding calling out fields by name.
        const result = {
            id: registration.id,
            status: findObjectById(properties, config.registrationFields.status).select.name,
            name: properties['Name'].formula.string,
            contact_id: findObjectById(properties,config.registrationFields.contact).relation[0].id,
            event_id: findObjectById(properties, config.registrationFields.event).relation[0].id,
            dish: properties['Dish'].rich_text.length > 0 ? properties['Dish'].rich_text[0].text.content : null,
            dish_type: properties['Dish Type'].select ? properties['Dish Type'].select.name : null,
            event_start: properties['Event Start Time'].rollup.array[0].date.start,
            event_location: properties['Event Location'].rollup.array.length > 0 ? properties['Event Location'].rollup.array[0].rich_text[0].text.content : null,
            contact_diet: properties['Dietary Requirements'].rollup.array.length > 0 ? properties['Dietary Requirements'].rollup.array[0].rich_text[0].text.content : null,
            event_registrations
            };

        // Return the resulting object
        return result;
    } catch (error) {
        console.log('Error looking up registration', error);
        // Handle any errors that occur during the lookup
        // ...
    }
}

// Export the function
module.exports = {
    lookupRegistration
};