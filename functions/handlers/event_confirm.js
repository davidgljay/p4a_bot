// Updates an registration status in Notion. 
// This function is used when we don't have appropriate permissions to update the event in Gcal.
const NotionWrapper = require("../apis/notion.js");
const clientConfig = require('../config/client_config.js');

const updateRegistrationStatus = async (registrationId, status, client_org) => {
    try {
        const notionClient = new NotionWrapper(clientConfig[client_org].token);
        notionClient.update(registrationId, {
            [clientConfig[client_org].registrations_db.fields.status]: {
                select: {
                    name: status,
                },
            },
        });

        // Return success message
        return "Registration status updated successfully";
    } catch (error) {
        // Handle error
        console.error("Error updating registration status:", error);
        throw new Error("Failed to update registration status");
    }
};

module.exports = { updateRegistrationStatus };