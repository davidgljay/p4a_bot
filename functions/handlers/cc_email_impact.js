// This function strips reply text from a group reply email and adds it to the Impact database in Notion.

const NotionWrapper = require("../apis/notion");
const config = require('../config/client_config.js');

async function stripAndAddToImpact(client_org, emailAddress, emailBody) {
    const clientConfig = config[client_org];
    // Strip reply text from email
    const strippedEmail = stripReplyText(emailBody);
    const contactId = await getContactFromEmail(emailAddress, clientConfig);

    // Add stripped email to Impact database in Notion
    await addToImpactDatabase(strippedEmail, contactId, clientConfig);
}

function stripReplyText(email) {
    // Logic to strip reply text from email
    const lines = email.split('\n');
    const filteredLines = lines.filter(line => !line.startsWith('>'));
    const strippedEmail = filteredLines.join('\n');
    console.log(strippedEmail);

    return strippedEmail;
}

async function getContactFromEmail(emailAddress, clientConfig) {

    const formattedEmailAddress = emailAddress.match(/[^ ]+@[^ ]+/)[0];
    const name = emailAddress.match(/<([^>]+)>/) ? emailAddress.match(/<([^>]+)>/)[1] : '';
    const notionClient = new NotionWrapper(clientConfig.token);
    console.log(formattedEmailAddress, name);
    const filter = {
        property: clientConfig.contacts_db.fields.email,
        email: {
            equals: formattedEmailAddress,
        },
    };
    const properties = {
        [clientConfig.contacts_db.fields.name]: {title: [{text: {content: name}}]},
        [clientConfig.contacts_db.fields.email]: {email: formattedEmailAddress},
    };

    const results = await notionClient.findOrCreate(clientConfig.contacts_db.id, filter, properties);
    // console.log('Contact:', results);
    return results.id;

}

async function addToImpactDatabase(email, contactId, clientConfig) {
    console.log('Adding to Impact database:', email, contactId);
    const summary = email.split('. ')[0];
    // Add email to Impact database in Notion
    const notionClient = new NotionWrapper(clientConfig.token);
    const properties = {
        [clientConfig.impact_db.fields.title]: {title: [{text: {content: summary}}]},
        [clientConfig.impact_db.fields.contact]: {relation: [{id: contactId}]},
    }

        // Define content for the body of the new page
        const children = [
            {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                content: email
                            }
                        }
                    ]
                }
            }
        ];
    // console.log('Adding to Impact database:', JSON.stringify(properties), JSON.stringify(children));

    await notionClient.create(clientConfig.impact_db.id, properties, children);
}

module.exports = { 
    stripAndAddToImpact,
    stripReplyText,
    getContactFromEmail,
    addToImpactDatabase
 };