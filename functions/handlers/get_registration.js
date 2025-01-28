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
        // Todo: replace with getChapterData
        //TODO: Add dietary requirements, event start time, event location to registration DB as rollups
        const notionClient = new NotionWrapper(clientConfig[client_org].token);
        const config = {
          registrationsDatabaseId: clientConfig[client_org].registrations_db.id,
          registrationFields: clientConfig[client_org].registrations_db.fields,
        };
        const findObjectById = notionClient.findObjectById;

        // TODO: Implement as a Promise.all to improve responsiveness
        const registration = await notionClient.get(id);
        //TODO: check appopriate format for parent DB id
        const chapter_config = await notionClient.fb.getChapterById(client_org, registration.parent_database_id)
        const fields = chapter_config.registrations.fields;
        const properties = registration.properties;
        const event_id = findObjectById(properties, fields.Event).relation[0].id;


        // Get all registrations for the event
        const event_filter = {
            property: fields.Event,
            relation: {
                contains: event_id,
            },
        };
        const event_registrations_raw = await notionClient.query(config.registrations.id, event_filter);
        let event_registrations = [];

        for (let i = 0; i < event_registrations_raw.length; i++) {
            const event_registration = event_registrations_raw[i];
            const reg_properties = event_registration.properties;


            if ((findObjectById(reg_properties, fields.Status).select && findObjectById(reg_properties, fields['Dietary Requirements']).select.name === 'declined') || findObjectById(reg_properties, fields['Dietary Requirements']).rollup.array[0] == undefined) {
                continue;
            }
            event_registrations.push({
                status: findObjectById(reg_properties, fields.Status).select ? findObjectById(reg_properties, fields.Status).select.name : 'tentative',
                name: findObjectById(reg_properties, fields.Name).formula.string,
                is_user: event_registration.id.replace(/-/g, '') === id,
                dish_text: findObjectById(reg_properties, fields['Dish Text']).rich_text.length > 0 ? findObjectById(reg_properties, fields['Dish Text']).rich_text[0].text.content : null,
                dish_type: findObjectById(reg_properties, fields['Dish Type']).select ? findObjectById(reg_properties, fields['Dish Type']).select.name : null,
                diet_req: findObjectById(reg_properties, fields['Dietary Requirements']).rollup.array[0].rich_text.length > 0 ? findObjectById(reg_properties, fields['Dietary Requirements']).rollup.array[0].rich_text[0].text.content : null,
            });
        }

        const dish_types = [
            {type: 'salad', need: 2},
            {type: 'entree', need: 2}, 
            {type: 'dessert', need: 2}, 
            {type: 'alcoholic drink', need: 2},
            {type: 'nonalcoholic drink', need: 2}
        ]

        const result = {
            id: registration.id,
            status: findObjectById(properties, fields.status).select ? findObjectById(properties, fields.Status).select.name : 'tentative',
            fname: findObjectById(properties, fields.Name) && findObjectById(properties, fields.Name).formula.string.split(' ')[0],
            event_start: findObjectById(properties, fields['Event Start Time']).rollup.array[0].date.start,
            event_address: findObjectById(properties, fields['Event Location']).rollup.array.length > 0 ? findObjectById(properties, fields['Event Location']).rollup.array[0].rich_text[0].text.content : null,
            user_contact_id: findObjectById(properties,fields['Contact']).relation[0].id,
            user_diet_req: findObjectById(properties, fields['Dietary Requirements']).rollup.array[0].rich_text.length > 0 ? findObjectById(properties, fields['Dietary Requirements']).rollup.array[0].rich_text[0].text.content : null,
            user_dish_text: findObjectById(properties, fields['Dish Text']t).rich_text.length > 0 ? findObjectById(properties, fields['Dish Text']t).rich_text[0].text.content : null,
            user_dish_type: findObjectById(properties, fields['Dish Type']).select ? findObjectById(properties, fields['Dish Type']).select.name : null,
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