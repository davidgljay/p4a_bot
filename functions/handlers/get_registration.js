// Should return data of format:

// {
//   fname: First name of the registered user,
//   event_start: Start time of the event,
//   event_address: address of the event,
//   status: Registered user status,
//   user_diet_req: Dietary requirements of the registered user,
//   user_dish_type: Dish type of the registered user,
//   user_dish_text: Dish text of the registered user,
//   dishtypes: array of dish types with the number needed of each dish.
//   event_registrations: [{
//     status: Status of the registered user,
//     name: Name of the registered user,
//     dish_text: Dish of the registered user,
//     dish_type: Dish type of the registered user,
//     diet_req: Dietary requirements of the registered user,
// }]
// }



const { event } = require("firebase-functions/v1/analytics");
const NotionWrapper = require("../apis/notion.js");
const clientConfig = require('../config/client_config.js');

// Function to lookup object in "registrations" database
async function lookupRegistration(id, client_org) {
    try {
        const notionClient = new NotionWrapper(clientConfig[client_org].token);
        const config = {
          registrationsDatabaseId: clientConfig[client_org].registrations_db.id,
          registrationFields: clientConfig[client_org].registrations_db.fields,
        };
        // TODO: Implement as a Promise.all to improve responsiveness
        const registration = await notionClient.get(id);
        const properties = registration.properties;
        const event_id = notionClient.findObjectById(properties, config.registrationFields.event).relation[0].id;

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
                status: notionClient.findObjectById(event_registration.properties, config.registrationFields.status).select.name,
                name: event_registration.properties['Name'].formula.string,
                is_user: event_registration.id.replace(/-/g, '') === id,
                dish_text: event_registration.properties['Dish'].rich_text.length > 0 ? event_registration.properties['Dish'].rich_text[0].text.content : null,
                dish_type: event_registration.properties['Dish Type'].select ? event_registration.properties['Dish Type'].select.name : null,
                diet_req: event_registration.properties['Dietary Requirements'].rollup.array.length > 0 ? event_registration.properties['Dietary Requirements'].rollup.array[0].rich_text[0].text.content : null,
            });
        }

        const dish_types = [
            {type: 'salad', need: 2},
            {type: 'entree', need: 2}, 
            {type: 'dessert', need: 2}, 
            {type: 'alcoholic drink', need: 2},
            {type: 'nonalcoholic drink', need: 2}
        ]

        // TODO: Update database schema to include all fields so that fields can be called by ID rather than by name.
        const result = {
            id: registration.id,
            status: notionClient.findObjectById(properties, config.registrationFields.status).select.name,
            fname: properties['Name'] && properties['Name'].formula.string.split(' ')[0],
            event_start: properties['Event Start Time'].rollup.array[0].date.start,
            event_address: properties['Event Location'].rollup.array.length > 0 ? properties['Event Location'].rollup.array[0].rich_text[0].text.content : null,
            user_contact_id: notionClient.findObjectById(properties,config.registrationFields.contact).relation[0].id,
            user_diet_req: properties['Dietary Requirements'].rollup.array.length > 0 ? properties['Dietary Requirements'].rollup.array[0].rich_text[0].text.content : null,
            user_dish_text: properties['Dish'].rich_text.length > 0 ? properties['Dish'].rich_text[0].text.content : null,
            user_dish_type: properties['Dish Type'].select ? properties['Dish Type'].select.name : null,
            event_registrations,
            dish_types
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