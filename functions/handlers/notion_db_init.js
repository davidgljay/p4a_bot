const NotionWrapper = require('../apis/notion.js');
const clientConfig = require('../config/client_config.js');

function initializeNotion(parentPageId, client_org) {
    const notionClient = new NotionWrapper(clientConfig[client_org].token);
    const contactsSchema = {
            email: {
                type: 'email',
                email: {}
            },
            name: {
                type: 'title',
                title: {}
            },
            dietary_restrictions: {
                type: 'multi_select',
                multi_select: {
                    options: [
                        { name: 'Vegetarian' },
                        { name: 'Vegan' },
                        { name: 'Gluten-free' },
                        { name: 'Kosher' },
                        { name: 'Halal' },
                    ],
                },
                    
            },
            allergies: {
                type: 'rich_text',
                rich_text: {}
            },
            location: {
                type: 'rich_text',
                rich_text: {}
            },
    };

    const eventsSchema = {
            title: {
                type: 'title',
                title: {}
            },
            time: {
                type: 'date',
                date: {}
            },
            location: {
                type: 'rich_text',
                rich_text: {}
            }
    };

    const eventsRelations = {
        host: {
            type: 'relation',
            collection_id: 'contacts_database_id',
            property_name: 'name',
        }
    };

    const registrationsSchema = {
            title: {
                type: 'title',
                title: {}
            },
            status: {
                type: 'select',
                select: {
                    options: [
                    { name: 'Confirmed' },
                    { name: 'Registered' },
                    { name: 'Confirmed'},
                    { name: 'Attended' },
                    { name: 'Regrets' },
                ],
            }
            }
    };

    const registrationsRelations = {
        event: {
            type: 'relation',
            relation: {
                database_id: 'events_database_id',
            }
        },
        contact: {
            type: 'relation',
            collection_id: 'contacts_database_id',
            property_name: 'name',
        }
    };

    // const chaptersSchema = {
    //         charter: {
    //             type: 'url',
    //             url: {},
    //         },
    //         name: {
    //             type: 'title',
    //             title: {}
    //         }
    // };

    // const chaptersRelations = {
    //     leads: {
    //         type: 'relation',
    //         relation: {
    //             database_id: 'contacts_database_id',
    //         }
    //     },
    //     cohosts: {
    //         type: 'relation',
    //         relation: {
    //             database_id: 'contacts_database_id',
    //         }
    //     },
    //     dinners: {
    //         type: 'relation',
    //         collection_id: 'events_database_id',
    //         property_name: 'title',
    //     },
    //     impact: {
    //         type: 'relation',
    //         collection_id: 'impact_reports_database_id',
    //         property_name: 'title',
    //     }
    // }

    // const impactReportsSchema = {
    //         summary: {
    //             type: 'title',
    //             title: {}
    //         },
    //         created_on: {
    //             type: "created_time",
    //             created_time: {}
    //         },
    //         tags: {
    //             type: 'multi_select',
    //             multi_select: {
    //                 options: [
    //                 { name: 'Funding' },
    //                 { name: 'Conversation' },
    //                 { name: 'Support' },
    //                 ],
    //             }
    //         }
    // };

    // const impactReportsRelations = {
    //     created_by: {
    //         type: 'relation',
    //         collection_id: 'contacts_database_id',
    //         property_name: 'name',
    //     }
    // };


    function delay(ms, value) {
        return new Promise(resolve => setTimeout(() => resolve(value), ms));
    }



    const createDatabases = notionClient.createDatabase(parentPageId, 'Contacts', contactsSchema)
    .then((contacts) => delay(2000, contacts))
    .then((contacts) => notionClient.createDatabase(parentPageId, 'Events', eventsSchema).then(events => [contacts, events]))
    .then(data => delay(2000, data))
    .then(([contacts, events]) => notionClient.createDatabase(parentPageId, 'Registrations', registrationsSchema).then(registrations => [contacts, events, registrations]))


    return createDatabases.then((databases) => {
        const [contacts, events, registrations ] = databases;
        console.log('Databases created:', databases);
        return { contacts, events, registrations };
    }).catch((error) => {
        console.error('Error creating databases:', error);
        throw error;
    });
}

module.exports = initializeNotion;