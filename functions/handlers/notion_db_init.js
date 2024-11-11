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
            dietary_requirements: {
                type: 'rich_text',
                rich_text: {}                
            },
            phone: {
                type: 'phone_number',
                phone_number: {}
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
            date: {
                type: 'date',
                date: {}
            },
            location: {
                type: 'rich_text',
                rich_text: {}
            },
            gcalid: {
                type: 'rich_text',
                rich_text: {}
            },
            description: {
                type: 'rich_text',
                rich_text: {}
            },
            tags: {
                type: 'multi_select',
                multi_select: {
                    options: [
                    { name: 'Send Email' }
                    ],
                }
            },
            parking_info: {
                type: 'rich_text',
                rich_text: {}
            },
            transit_info: {
                type: 'rich_text',
                rich_text: {}
            },
            status: {
                type: 'select',
                select: {
                    options: [
                    { name: 'Confirmed' },
                    { name: 'Cancelled' },
                    { name: 'Tentative' },
                    { name: 'Pending' },
                    { name: 'Completed' },
                ],
            }
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
                    { name: 'accepted' },
                    { name: 'declined' },
                    { name: 'tentative'},
                    { name: 'need to invite' },
                    { name: 'invited' },
                ],
            }
            }
    };

    const eventsRelations = (contacts_database_id) => ({
        host: {
            type: 'relation',
            relation: {
                database_id: contacts_database_id,
                type: 'dual_property',
                dual_property: {
                    synced_property_name: 'Contact'
                }
            }
        }
    });

    const registrationsRelations =(contacts_database_id, events_database_id) => ({
        event: {
            type: 'relation',
            relation: {
                database_id: events_database_id,
                type: 'dual_property',
                dual_property: {
                    synced_property_name: 'Event'
                }
            }
        },
        contact: {
            type: 'relation',
            relation: {
                database_id: contacts_database_id,
                type: 'dual_property',
                dual_property: {
                    synced_property_name: 'Contact'
                }
            }
        }
    });

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

    const addRelations = createDatabases.then((databases) => {
        const [contacts, events, registrations ] = databases;
        return notionClient.updateDatabase(events.id, eventsRelations(contacts.id))
            .then(response => console.log("Event DB Update", response))
            .then((updatedEvents) => delay(2000, updatedEvents))
            .then((updatedEvents) => notionClient.updateDatabase(registrations.id, registrationsRelations(contacts.id, events.id)).then(updatedRegistrations => [contacts, updatedEvents, updatedRegistrations]))
    }).catch((error) => {
        console.error('Error creating databases:', error);
        throw error;
    });

    return addRelations
        

    // return createDatabases.then((databases) => {
    //     const [contacts, events, registrations ] = databases;
    //     console.log('Databases created:', databases);
    //     return { contacts, events, registrations };
    // }).catch((error) => {
    //     console.error('Error creating databases:', error);
    //     throw error;
    // });
}

module.exports = initializeNotion;