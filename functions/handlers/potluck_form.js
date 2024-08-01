// Expects data of format:

// {
//     client_org: The client organization,
//     registration_id: The ID of the registration to update,
//     user_dish_type: The type of dish the user is bringing,
//     user_diet_reqs: The user's dietary requirements,
//     user_dish_text: the text of the dish that the user is bringing,
//     status
//   })

const NotionWrapper = require("../apis/notion.js");
const clientConfig = require('../config/client_config.js');

async function potluck_form({client_org, registration_id, user_dish_type, user_diet_reqs, user_dish_text, status}) {
    try {
        const notionClient = new NotionWrapper(clientConfig[client_org].token);
        const config = {
          registrationsDatabaseId: clientConfig[client_org].registrations_db.id,
          registrationFields: clientConfig[client_org].registrations_db.fields,
          contactsDatabaseId: clientConfig[client_org].contacts_db.id,
          contactFields: clientConfig[client_org].contacts_db.fields,
        };

        const registration = await notionClient.get(registration_id);
        const contact_id = notionClient.findObjectById(registration.properties, config.registrationFields.contact).relation[0].id;
        const contact = await notionClient.get(contact_id);
        console.log(contact);
        const registration_updates = {
            [config.registrationFields.dish_type]: {select: {name: user_dish_type}},
            [config.registrationFields.dish_text]: {rich_text: [{text: {content: user_dish_text || ''}}]},
            [config.registrationFields.status]: {select: {name: status}},
        }
        const contact_updates = {
            [config.contactFields.diet_reqs]: {rich_text: [{text: {content: user_diet_reqs || ''}}]},
        }
    
        //Save the updated registration
        await notionClient.update(registration_id, registration_updates);

        // Save the updated contact
        await notionClient.update(contact_id, contact_updates);
        
        console.log("Contact and registration updated successfully");
    } catch (error) {
        console.error("Failed to update contact:", error);
    }
}

module.exports = {
    potluck_form
};
