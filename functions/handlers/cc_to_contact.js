//Receives a set of contacts from an email and creates contact records in Notion for them if they do not already exist.
//Adds these contacts to a chapter if the sender is already a member of a chapter.
// Expects the following JSON structure:
// {
//   "sender": "email",
//   "to": ["email1", "email2", ...],
//   "cc": ["email1", "email2", ...],
// }

const NotionWrapper = require('../apis/notion');
const clientConfig = require('../config/client_config');

async function createContactsFromEmail({sender, to, cc, client_org}) {
    const notionClient = new NotionWrapper(clientConfig[client_org].token);
    const config = {
      contactsDatabaseId: clientConfig[client_org].contacts_db.id,
      contactFields: clientConfig[client_org].contacts_db.fields,
    };

    // Check if sender is a member of a chapter
    const {isContact, chapterId } = await checkForChapter(sender, config, notionClient);
    if (!isContact) {
        return;
    }

    // Create contact records in Notion for each email
    const contacts = [...to, ...cc];
    for (const email of contacts) {
        const properties = {
            [config.contactFields.email]: {email: email['Email Address']},
            [config.contactFields.chapters]: {relation: chapterId ? [{id: chapterId}] : []},
            [config.contactFields.name]: {title: [{text: {content: email['Sender Name'] || ""}}]},
        };
        const filter = {
            property: config.contactFields.email,
            email: {
                equals: email['Email Address'],
            },
        };
        await notionClient.findOrCreate(config.contactsDatabaseId, filter, properties);
    }
}

async function checkForChapter(email, config, notionClient) {
    // Check if the sender is a member of a chapter
    const filter = {
        property: config.contactFields.email,
        email: {
            equals: email,
        },
    };

    const results = await notionClient.query(config.contactsDatabaseId, filter);
    if (results.length === 0) {
        return { isContact: false};
    }

    // Return the chapter, return false if they are not a member or not in a chapter
    const chapter = notionClient.findObjectById(results[0].properties, config.contactFields.chapters);
    const chapterId = chapter.relation.length > 0 ? chapter.relation[0].id : null;
    return { isContact: true, chapterId };
}

module.exports = { createContactsFromEmail };
