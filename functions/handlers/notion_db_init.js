const NotionWrapper = require('../apis/notion.js');
const functions = require('firebase-functions');
const notionClient = new NotionWrapper(functions.config().notion.token);

function initializeNotion(parentPageId) {
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

    const chaptersSchema = {
            charter: {
                type: 'url',
                url: {},
            },
            name: {
                type: 'title',
                title: {}
            }
    };

    const chaptersRelations = {
        leads: {
            type: 'relation',
            relation: {
                database_id: 'contacts_database_id',
            }
        },
        cohosts: {
            type: 'relation',
            relation: {
                database_id: 'contacts_database_id',
            }
        },
        dinners: {
            type: 'relation',
            collection_id: 'events_database_id',
            property_name: 'title',
        },
        impact: {
            type: 'relation',
            collection_id: 'impact_reports_database_id',
            property_name: 'title',
        }
    }

    const impactReportsSchema = {
            summary: {
                type: 'title',
                title: {}
            },
            created_on: {
                type: "created_time",
                created_time: {}
            },
            tags: {
                type: 'multi_select',
                multi_select: {
                    options: [
                    { name: 'Funding' },
                    { name: 'Conversation' },
                    { name: 'Support' },
                    ],
                }
            }
    };

    const impactReportsRelations = {
        created_by: {
            type: 'relation',
            collection_id: 'contacts_database_id',
            property_name: 'name',
        }
    };


    const chaptersDB = notionClient.createDatabase(parentPageId, 'Chapters', chaptersSchema);
    const impactReportsDB = notionClient.createDatabase(parentPageId, 'Impact Reports', impactReportsSchema);
    const contactDB = notionClient.createDatabase(parentPageId, 'Contacts', contactsSchema);
    const eventsDB = notionClient.createDatabase(parentPageId, 'Events', eventsSchema);
    const registrationDB = notionClient.createDatabase(parentPageId, 'Registrations', registrationsSchema);

    const promiseArray = [contactDB, eventsDB, registrationDB, chaptersDB, impactReportsDB]
    var delay = 0
    const increment = 5000
    const delayedPromiseArray = []
    for (promise in promiseArray) {
        var delayedPromise = new Promise(resolve => setTimeout(resolve, delay)).then(promise)
        delay += increment
        console.log(delay)
        delayedPromiseArray.push(delayedPromise)
    }

    return Promise.all(delayedPromiseArray).then((databases) => {
        const [contacts, events, registrations, chapters, impactReports] = databases;
        return { contacts, events, registrations, chapters, impactReports };
    })
}

module.exports = initializeNotion;