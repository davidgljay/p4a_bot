/**
 * Initializes Notion databases and sets up relations between them.
 * 
 * @param {string} parentPageId - The ID of the parent page where the databases will be created.
 * @param {string} client_org - The client organization identifier to fetch the corresponding token from the configuration.
 * 
 * @returns {Promise<Object>} - A promise that resolves to an object containing the formatted schema of the created databases.
 * 
 * @throws {Error} - Throws an error if there is an issue creating or updating the databases.
 * 
 * @example
 * const parentPageId = 'some-page-id';
 * const client_org = 'some-client-org';
 * 
 */


const NotionWrapper = require('../apis/notion.js');
const clientConfig = require('../config/client_config.js');

// function testfb() {
//     fbadmin.initializeApp(firebaseConfig);
//     const db = fbadmin.firestore();
//     db.collection('p4c').doc('test_chapter').set({test: 'test'}).then(() => console.log('Document written'));
// }

function initializeNotion(parentPageId, client_org) {
    const notionClient = new NotionWrapper(clientConfig[client_org].token);
    const contactsSchema = {
            "Email": {
                type: 'email',
                email: {}
            },
            "Name": {
                type: 'title',
                title: {}
            },
            "Dietary Requirements": {
                type: 'rich_text',
                rich_text: {}                
            },
            "Phone": {
                type: 'phone_number',
                phone_number: {}
            },

            "Location": {
                type: 'rich_text',
                rich_text: {}
            },
            "Dietary Requirements": {
                type: 'rich_text',
                rich_text: {}
            },
    };

    const eventsSchema = {
            "Title": {
                type: 'title',
                title: {}
            },
            "Date": {
                type: 'date',
                date: {}
            },
            "Location": {
                type: 'rich_text',
                rich_text: {}
            },
            "GCalId": {
                type: 'rich_text',
                rich_text: {}
            },
            "Description": {
                type: 'rich_text',
                rich_text: {}
            },
            "Tags": {
                type: 'multi_select',
                multi_select: {
                    options: [
                    { name: 'Send Email' }
                    ],
                }
            },
            "Parking Info": {
                type: 'rich_text',
                rich_text: {}
            },
            "Transit Info": {
                type: 'rich_text',
                rich_text: {}
            },
            "Status": {
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
        "Title": {
            type: 'title',
            title: {}
        },
        "Status": {
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
        },
        "Dish Type": {
            type: 'select',
            select: {
                options: [
                { name: 'salad' },
                { name: 'entree' },
                { name: 'dessert' },
                { name: 'alcoholic dink' },
                { name: 'nonalcoholic drink' },
                { name: 'appetizer'}
            ],
            }
        },
        "Dish Text": {
            type: 'rich_text',
            rich_text: {}
        }
    };

    const eventsRelations = (contacts_database_id) => ({
        "Host": {
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
        "Event": {
            type: 'relation',
            relation: {
                database_id: events_database_id,
                type: 'dual_property',
                dual_property: {
                    synced_property_name: 'Event'
                }
            }
        },
        "Contact": {
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

    function formatDBSchema(dbInfo) {
        const schema = {
            id: dbInfo.id,
            fields: {}
        }
        for (const [key, value] of Object.entries(dbInfo.properties)) {
            schema.fields[key] = value.id;
        }
        return schema;
    }



    const createDatabases = notionClient.createDatabase(parentPageId, 'Contacts', contactsSchema)
    .then((contacts) => delay(2000, contacts))
    .then((contacts) => notionClient.createDatabase(parentPageId, 'Events', eventsSchema).then(events => [contacts, events]))
    .then(data => delay(2000, data))
    .then(([contacts, events]) => notionClient.createDatabase(parentPageId, 'Registrations', registrationsSchema).then(registrations => [contacts, events, registrations]))

    const addRelations = createDatabases.then((databases) => {
        const [contacts, events, registrations ] = databases;
        return notionClient.updateDatabase(events.id, eventsRelations(contacts.id))
            .then((updatedEvents) => delay(2000, updatedEvents))
            .then((updatedEvents) => notionClient.updateDatabase(registrations.id, registrationsRelations(contacts.id, events.id)).then(updatedRegistrations => [contacts, updatedEvents, updatedRegistrations]))
    });

    const addRollups = addRelations.then(([contacts, events, registrations]) => {
        return notionClient.updateDatabase(registrations.id, {
            "Event GCalId": {
                type: 'rollup',
                rollup: {
                    rollup_property_name: 'GCalId',
                    relation_property_name: 'Event',
                    relation_property_id: registrations.properties['Event'].id,
                    rollup_property_id: events.properties['GCalId'].id,
                    function: 'show_original'
                }
            }
        })
        .then((updatedRegistrations) => [contacts, events, updatedRegistrations]);
    });

    return addRollups.then(([contacts, events, registrations ]) => {
        return { 
            contacts: formatDBSchema(contacts), 
            events: formatDBSchema(events),
            registrations: formatDBSchema(registrations)
        };
    })
    .then(schema =>  notionClient.fb.collection('p4c').doc(parentPageId).set(schema))
    .catch((error) => {
        console.error('Error creating databases:', error);
        throw error;
    });
    
}

module.exports = {initializeNotion};