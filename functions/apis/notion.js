
const { Client } = require('notion-client');

// Initialize the Notion client
const notion = new Client();

// Function to find a Notion object in a specific database by ID
async function findObjectById(databaseId, id) {
    try {
        const response = await notion.getRecordValue({
            table: 'block',
            id,
        });
        // Return the found object
        return response;
    } catch (error) {
        console.error('Error finding object by ID:', error);
        throw error;
    }
}

// Function to find objects in a specific database based on a query
async function findObjectsByQuery(databaseId, query) {
    try {
        const response = await notion.search({
            query: query,
            sort: {
                direction: 'ascending',
                timestamp: 'last_edited_time',
            },
            filter: {
                property: 'database_id',
                value: {
                    database_id: databaseId,
                },
            },
        });
        // Return the found objects
        return response.results;
    } catch (error) {
        console.error('Error finding objects by query:', error);
        throw error;
    }
}

// Function to create a new Notion object in a specific database
async function createObject(databaseId, properties) {
    try {
        const response = await notion.createRecord('block', {
            parent: { database_id: databaseId },
            properties,
        });
        // Return the created object
        return response;
    } catch (error) {
        console.error('Error creating object:', error);
        throw error;
    }
}

// Function to update a Notion object in a specific database by ID
async function updateObjectById(databaseId, id, properties) {
    try {
        const response = await notion.updateRecordValues({
            requests: [
                {
                    id,
                    table: 'block',
                    properties,
                },
            ],
        });
        // Return the updated object
        return response.results[0];
    } catch (error) {
        console.error('Error updating object by ID:', error);
        throw error;
    }
}

// Function to find or create a Notion object in a specific database
async function findOrCreateObject(databaseId, properties) {
    try {
        // Check if the object already exists
        const existingObject = await findObjectById(databaseId);
        if (existingObject) {
            // Return the existing object
            return existingObject;
        } else {
            // Create a new object
            const createdObject = await createObject(databaseId, properties);
            return createdObject;
        }
    } catch (error) {
        console.error('Error finding or creating object:', error);
        throw error;
    }
}

// Function to find and update a Notion object in a specific database
async function findAndUpdateObject(databaseId, id, properties) {
    try {
        // Find the object by ID
        const foundObject = await findObjectById(databaseId, id);
        if (foundObject) {
            // Update the object
            const updatedObject = await updateObjectById(databaseId, id, properties);
            return updatedObject;
        } else {
            throw new Error('Object not found');
        }
    } catch (error) {
        console.error('Error finding and updating object:', error);
        throw error;
    }
}

// Function to delete a Notion object in a specific database by ID
async function deleteObjectById(databaseId, id) {
    try {
        await notion.deleteRecord(id);
        console.log('Object deleted successfully');
    } catch (error) {
        console.error('Error deleting object by ID:', error);
        throw error;
    }
}

// Export the functions
module.exports = {
    findObjectById,
    createObject,
    updateObjectById,
    findOrCreateObject,
    findAndUpdateObject,
    deleteObjectById,
};
