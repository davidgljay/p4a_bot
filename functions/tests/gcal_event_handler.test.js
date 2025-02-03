const { handleGcalEvent, handleEventUpdate, handleRegistration } = require('../handlers/gcal_event_handler');
const NotionWrapper = require('../apis/notion');
const clientConfig = require('../config/client_config');

jest.mock('../apis/notion');
jest.mock('../config/client_config');

describe('gcal_event_handler', () => {
    let notionClient;
    let event;
    let client_org;

    beforeEach(() => {
        notionClient = new NotionWrapper();

        notionClient.findObjectById.mockImplementation((obj, id) => {
            for (let key in obj) {
                  if (obj[key].id == id) {
                      return obj[key];
                  }
              }
        });
        client_org = 'test_org';
        event = {
            id: 'test_event_id',
            summary: 'Test Event',
            location: 'Test Location',
            description: 'Test Description',
            start: '2023-10-10T10:00:00Z',
            end: '2023-10-10T12:00:00Z',
            attendee_emails: 'email1@example.com,email2@example.com',
            attendee_names: 'Name1,Name2',
            attendee_statuses: 'accepted,declined',
            link: 'http://example.com',
            duration: '2 hours',
            host_email: 'host@example.com'
        };
        host = {
            id: 'host_id'
        }
        clientConfig[client_org] = {
            token: 'test_token',
            events: { id: 'events_db_id', fields: { Title: 'Title', Description: 'Description', Date: 'Date', GCalId: 'GCalId', Location: 'Location', Host: 'Host' } },
            registrations: { id: 'registrations_db_id', fields: { Title: 'Title', Contact: 'Contact', Event: 'Event', Status: 'Status' } },
            contacts: { id: 'contacts_db_id', fields: { Email: 'Email', Name: 'Name' } }
        };
        contact = {id:'contact_id', properties: {notionId: {id: 'Name', title:[{text: {content: 'Test User'}}]}}};
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('handleEventUpdate should create a new event if it does not exist', async () => {
        notionClient.queryChapterData.mockResolvedValueOnce([]);
        notionClient.queryChapterData.mockResolvedValueOnce([{ chapter_config: clientConfig[client_org], results: [host] }]);

        await handleEventUpdate(event, notionClient, client_org);

        expect(notionClient.create).toHaveBeenCalledTimes(1);
        expect(notionClient.create).toHaveBeenCalledWith(clientConfig[client_org].events.id, expect.any(Object));
    });

    test('handleEventUpdate should update an existing event if it exists', async () => {
        notionClient.queryChapterData.mockResolvedValueOnce([{ id: 'existing_event_id' }]);
        notionClient.queryChapterData.mockResolvedValueOnce([{ chapter_config: clientConfig[client_org], results: [host]  }]);

        await handleEventUpdate(event, notionClient, client_org);

        expect(notionClient.update).toHaveBeenCalledTimes(1);
        expect(notionClient.update).toHaveBeenCalledWith(clientConfig[client_org].events.id, expect.any(Object));
    });

    test('handleEventUdpate should return the appropriate error when the host is not found', async () => {
        notionClient.queryChapterData.mockResolvedValueOnce([{ chapter_config: clientConfig[client_org], results: [{ id: 'event_id' }] }]);
        notionClient.queryChapterData.mockResolvedValueOnce([]);
        notionClient.query.mockResolvedValueOnce([]);
        notionClient.findOrCreate.mockResolvedValue(contact);

        await expect(handleEventUpdate(event, notionClient, client_org)).rejects.toThrow('Host not found');

        expect(notionClient.queryChapterData).toHaveBeenCalledTimes(2);
    });

    test('handleRegistration should create new registrations if they do not exist', async () => {
        notionClient.queryChapterData.mockResolvedValueOnce([{ chapter_config: clientConfig[client_org], results: [event] }]);
        notionClient.query.mockResolvedValueOnce([]);
        notionClient.findOrCreate.mockResolvedValue(contact);


        await handleRegistration(event, notionClient, client_org);

        expect(notionClient.create).toHaveBeenCalledTimes(2);
        expect(notionClient.create).toHaveBeenCalledWith(clientConfig[client_org].registrations.id, expect.any(Object));
    });

    test('handleRegistration should not update existing registrations if they exist and the status has not changed', async () => {
        notionClient.queryChapterData.mockResolvedValueOnce([{ chapter_config: clientConfig[client_org], results: [{ id: 'event_id' }] }]);
        notionClient.query.mockResolvedValueOnce([{ id: 'registration_id', properties: { Email: { rollup: { array: [{ email: 'email1@example.com' }] } }, Status: { select: { name: 'accepted' } } } }]);
        notionClient.findOrCreate.mockResolvedValue(contact);

        await handleRegistration(event, notionClient, client_org);

        expect(notionClient.update).toHaveBeenCalledTimes(0);
    });

    test('handleRegistration should update existing registrations if they exist and the status has changed', async () => {
        notionClient.queryChapterData.mockResolvedValueOnce([{ chapter_config: clientConfig[client_org], results: [{ id: 'event_id' }] }]);
        notionClient.query.mockResolvedValueOnce([{ id: 'registration_id', properties: { Email: { rollup: { array: [{ email: 'email1@example.com' }] } }, Status: { select: { name: 'declined' } } } }]);
        notionClient.findOrCreate.mockResolvedValue(contact);

        await handleRegistration(event, notionClient, client_org);

        expect(notionClient.update).toHaveBeenCalledTimes(1);
        expect(notionClient.update).toHaveBeenCalledWith('registration_id', expect.any(Object));
    });
});