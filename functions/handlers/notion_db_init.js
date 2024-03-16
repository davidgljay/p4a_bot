const notionWrapper = require('/apis/notion.js');

function createDatabases(parentPageId) {
    const contactsSchema = {
        title: 'Contacts',
        properties: {
            email: {
                type: 'email',
            },
            name: {
                type: 'title',
            },
            dietary_restrictions: {
                type: 'multi_select',
                options: [
                    { name: 'Vegetarian' },
                    { name: 'Vegan' },
                    { name: 'Gluten-free' },
                    { name: 'Kosher' },
                    { name: 'Halal' },
                ],
            },
            allergies: {
                type: 'text'
            },
            location: {
                type: 'text',
            },
        },
    };

    const eventsSchema = {
        title: 'Events',
        properties: {
            time: {
                type: 'date',
            },
            location: {
                type: 'text',
            },
            host: {
                type: 'relation',
                collection_id: 'contacts_database_id',
                property_name: 'name',
            },
        },
    };

    const registrationsSchema = {
        title: 'Registrations',
        properties: {
            event: {
                type: 'relation',
                collection_id: 'events_database_id',
                property_name: 'title',
            },
            contact: {
                type: 'relation',
                collection_id: 'contacts_database_id',
                property_name: 'name',
            },
            status: {
                type: 'select',
                options: [
                    { name: 'Confirmed' },
                    { name: 'Registered' },
                    { name: 'Confirmed'},
                    { name: 'Attended' },
                    { name: 'Regrets' },
                ],
            },
        },
    };

    notionWrapper.createDatabase(parentPageId, contactsSchema);
    notionWrapper.createDatabase(parentPageId, eventsSchema);
    notionWrapper.createDatabase(parentPageId, registrationsSchema);
}

module.exports = createDatabases;