const mockTemplates = {
    emails: [{
        days: 7,
        hours: 10,
        status: "Accepted",
        subject: "Mock Subject 1",
        body: "This is the body of the first email."
    },
    {
        days: 1,
        hours: 10,
        status: "Needs Action",
        subject: "Let us know if you can make it to {{event_name}}!",
        body: "Can you make it {{fname}}? {{event_name}} is happening soon!"
    }]
};
jest.mock('js-yaml', () => {
    return {
        load: jest.fn().mockReturnValue(mockTemplates)
    }});
const mockNotionWrapper= {};
jest.mock("../functions/apis/notion", () => {
  return jest.fn().mockImplementation(() => mockNotionWrapper);
});
const NotionWrapper = require("../functions/apis/notion");
jest.mock("../functions/config/client_config.js", () => {
    const mockConfig = {
        "mock": {
            "token": "notion_secret",
            "contacts_db": {
                "id": "contacts_db_id",
                "fields": {
                "registrations": "reg_field",
                "dietary_restrictions": "diet_field",
                "email": "email_field",
                "allergies": "allergies_field",
                "location": "location_field",
                "chapters": "chapter_field",
                "hosted_events": "hosted_events_field",
                "impact_reports": "impact_field",
                "name": "title"
                }
            },
            "registrations_db": {
                "id": "registrations_db_id",
                "fields": {
                "status": "status_field",
                "event": "event_field",
                "contact": "contact_field",
                "title": "title",
                "event_gcalid": "gcid_field",
                "status_options": {
                    "accepted": "accepted_option",
                    "needsAction": "needs_action_option",
                    "tentative": "tentative_option",
                    "declined": "declined_option"
                }
                }
            },
            "events_db": {
                "id": "events_db_id",
                "fields": {
                "chapter": "chapter_field",
                "hosts": "hosts_field",
                "registrations": "registrations_field",
                "date": "date_field",
                "title": "title",
                "gcalid": "gcalid_field",
                "description": "description_field"
                }
            }
            },
        };
    return mockConfig;
});

const {sendScheduledEmails, checkUpcomingEvents, getConfig, getEventRegistrations, prepEmailsfromRegistrations} = require('../functions/handlers/email_response_handler');


describe('email_response_handler', () => {
    const config = getConfig('mock');
    beforeEach(() => {
        mockNotionWrapper.query = jest.fn();
        mockNotionWrapper.update = jest.fn();
        mockNotionWrapper.create = jest.fn();
        mockNotionWrapper.findOrCreate = jest.fn();
      });
    describe('checkUpcomingEvents', () => {
        it('should return data of the expected format from notion after receiving the expected filter', async () => {
            const mockNotionData = [{ id: '1' , properties: { Title: { title: [{ text: { content: 'Event 1' } }] }, Date: { date: { start: '2022-01-01' } } } },
            { id: '2', properties: { Title: { title: [{ text: { content: 'Event 2' } }] }, Date: { date: { start: '2023-02-03' } } } }];
            mockNotionWrapper.query.mockResolvedValue(mockNotionData);
            const result = await checkUpcomingEvents(7, 12, config);

            const expectedData = [{ id: '1', title: 'Event 1', date: '2022-01-01' }, { id: '2', title: 'Event 2', date: '2023-02-03'}];

            expect(result).toEqual(expectedData);
            expect(mockNotionWrapper.query).toHaveBeenCalledWith('events_db_id', {"and": [{date: {"on_or_after": expect.any(String)}, property: "date_field"}, {date: {"on_or_before": expect.any(String)}, property: "date_field"}]});
        });

        it('should return an empty array when no data is returned from notion', async () => {
            mockNotionWrapper.query.mockResolvedValue([]);

            const result = await checkUpcomingEvents(7, 24, config);
            expect(result).toEqual([]);
        });
    });

    describe('getEventRegistrations', () => {
        const mockNotionData = [{ id: '1', properties: { Name: { formula: { string: "Bunbun Bunny"} }, Email: { rollup: { array: [{ email: 'bunbun@mock.test' } ] } } , Status: { select: { name: "Accepted"} } } }, 
        { id: '2', properties: { Name: { formula: { string: ""} }, Email: { rollup: { array: [{ email: 'totoro@mock.test' } ] } } , Status: { select: { name: "Declined"} } } } ];

        const mockEvent = { id: '1', title: 'Event 1', date: '2022-01-01' };

        it('should return data of the expected format from notion', async () => {
            mockNotionWrapper.query.mockResolvedValue(mockNotionData);
            const result = await getEventRegistrations(mockEvent, config);
            const expectedData = [{ email: 'bunbun@mock.test', fname: 'Bunbun', status: 'Accepted'}, { email: 'totoro@mock.test', fname: 'Friend', status: 'Declined'}];
            expect(mockNotionWrapper.query).toHaveBeenCalledWith('registrations_db_id', {
                property: "event_field",
                relation: {
                    contains: "1"
                }
            });
            expect(result).toEqual(expectedData);
        });

        it('should return an empty array when no data is returned from notion', async () => {
            mockNotionWrapper.query.mockResolvedValue([]);

            const result = await getEventRegistrations(mockEvent, config);

            expect(result).toEqual([]);
        });
    });

    describe('prepEmailsfromRegistrations', () => {
        const mockEvent = { id: '1', title: 'Event 1', date: '2022-01-01' };
        const mockRegistrations = [{ email: 'bunbun@mock.test', fname: 'Bunbun', status: 'Accepted'}, { email: 'totoro@mock.test', fname: 'Friend', status: 'Needs Action'}];
        const templates = mockTemplates;
        it('should return properly formatted emails for the appropriate hour, day and status', () => {
            const template = templates.emails[0];

            const result = prepEmailsfromRegistrations(mockRegistrations, mockEvent, template);

            expect(result).toEqual([{"body": "This is the body of the first email.", "subject": "Mock Subject 1", "to": "bunbun@mock.test"}] );
        });

        it('should return an email with properly substituted text', () => {
            const template = templates.emails[1];

            const result = prepEmailsfromRegistrations(mockRegistrations, mockEvent, template);

            expect(result).toEqual([{"body": "Can you make it Friend? Event 1 is happening soon!", "subject": "Let us know if you can make it to Event 1!", "to": "totoro@mock.test"}] );
        });

        it('should return an empty array when registrations is empty', () => {
            const days = 7;
            const hours = 10;

            const result = prepEmailsfromRegistrations([], mockEvent, templates, days, hours);

            expect(result).toEqual([]);
        });

        it('should return an empty array when there is no tempalte for that time and status', () => {
            const days = 8;
            const hours = 8;

            const result = prepEmailsfromRegistrations(mockRegistrations, mockEvent, templates, days, hours);

            expect(result).toEqual([]);
        });
    });

    describe('sendScheduledEmails', () => {
        const mockEvent = { id: '1', title: 'Event 1', date: '2022-01-01' };
        const mockRegistrations = [{ email: 'bunbun@mock.test', fname: 'Bunbun', status: 'Accepted'}, { email: 'totoro@mock.test', fname: 'Friend', status: 'Needs Action'}];

        beforeEach(() => {
            const mockNotionEventData = [{ id: '1' , properties: { Title: { title: [{ text: { content: 'Event 1' } }] }, Date: { date: { start: '2022-01-01' } } } },
            { id: '2', properties: { Title: { title: [{ text: { content: 'Event 2' } }] }, Date: { date: { start: '2023-02-03' } } } }];
            const mockNotionRegistrationData = [{ id: '1', properties: { Name: { formula: { string: "Bunbun Bunny"} }, Email: { rollup: { array: [{ email: 'bunbun@mock.test' } ] } } , Status: { select: { name: "Accepted"} } } }, 
            { id: '2', properties: { Name: { formula: { string: ""} }, Email: { rollup: { array: [{ email: 'totoro@mock.test' } ] } } , Status: { select: { name: "Declined"} } } } ];
            mockNotionWrapper.query.mockResolvedValueOnce(mockNotionEventData);
            mockNotionWrapper.query.mockResolvedValueOnce(mockNotionRegistrationData);
            mockNotionWrapper.query.mockResolvedValueOnce(mockNotionRegistrationData);
            mockNotionWrapper.query.mockResolvedValueOnce(mockNotionEventData);
            mockNotionWrapper.query.mockResolvedValueOnce(mockNotionRegistrationData);
            mockNotionWrapper.query.mockResolvedValueOnce(mockNotionRegistrationData);
            mockNotionWrapper.query.mockResolvedValueOnce(mockNotionEventData);
            mockNotionWrapper.query.mockResolvedValueOnce(mockNotionRegistrationData);
            mockNotionWrapper.query.mockResolvedValueOnce(mockNotionRegistrationData);


        });
        it('should return properly formatted emails for the indicated organization', async () => {
            const result = await sendScheduledEmails('mock');

            expect(mockNotionWrapper.query).toHaveBeenCalledWith('events_db_id', {"and": [{date: {"on_or_after": expect.any(String)}, property: "date_field"}, {date: {"on_or_before": expect.any(String)}, property: "date_field"}]});
            expect(mockNotionWrapper.query).toHaveBeenCalledWith('registrations_db_id', {
                property: "event_field",
                relation: {
                    contains: "1"
                }
            });
            expect(mockNotionWrapper.query).toHaveBeenCalledWith('registrations_db_id', {
                property: "event_field",
                relation: {
                    contains: "2"
                }
            });
            expect(result[0].to).toEqual("bunbun@mock.test");
        });

        
    });
});
