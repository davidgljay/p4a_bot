const test = require('firebase-functions-test')();
const mockNotionWrapper= {};
jest.mock("../functions/apis/notion", () => {
  return jest.fn().mockImplementation(() => mockNotionWrapper);
});

test.mockConfig( {
  notion: {
    TOKEN: 'TOKEN',
    EVENTS_DATABASE_ID: 'mockEventsDatabaseId',
    REGISTRATIONS_DATABASE_ID: 'mockRegistrationsDatabaseId',
    CONTACTS_DATABASE_ID: 'mockContactsDatabaseId',
  }
});
const functions = require('firebase-functions');
const NotionWrapper = require("../functions/apis/notion");
const {
  handleEventUpdate,
  handleRegistration,
} = require("../functions/handlers/gcal_event_handler");


describe("glcal_event_handler", () => {
  const notionClient = new NotionWrapper(functions.config().notion.TOKEN);

  const config = {
    eventsDatabaseId: 'eventsDatabaseId',
    registrationsDatabaseId: 'registrationsDatabaseId',
    contactsDatabaseId: 'contactsDatabaseId',
    eventsFields: {
      title: 'title',
      description: 'description',
      date: 'date',
      gcalid: 'gcalid',
    },
    registrationFields: {
      "status": "status",
      "event": "event",
      "contact": "contact",
      "title": "title",
      "event_gcalid": "event_gcalid",
      "status_options": {
        "accepted": "accepted",
        "needsAction": "needAction",
        "tentative": "tentative",
        "declined": "declined",
        "response1": "response1",
        "response2": "response2",
      }

    },
    contactFields: {
      "registrations": "registrations",
      "email": "email",
      "name": "name"
    },
  
}
  

describe("handleEventUpdate", () => {
  const event = {
    id: "Event Gcal ID",
    summary: "Event summary",
    location: "Event location",
    description: "Event description",
    start: {"Event Begins" : "Event start time"},
    end: "Event end time",
    attendee_emails: ["email1", "email2"],
    attendee_names: ["name1", "name2"],
    attendee_responses: ["response1", "response2"],
    link: "Event link",
    duration: "Event duration",
  };
  

  beforeEach(() => {
    mockNotionWrapper.query = jest.fn();
    mockNotionWrapper.update = jest.fn();
    mockNotionWrapper.create = jest.fn();
    mockNotionWrapper.findOrCreate = jest.fn();
  });

  it("should call update function if NotionWrapper.query returns a result", async () => {
    const existingEvent = { id: "existingEventId" };
    mockNotionWrapper.query.mockResolvedValueOnce([existingEvent]);

    await handleEventUpdate(event, config, notionClient);

    expect(notionClient.query).toHaveBeenCalledWith(
      "eventsDatabaseId",
      expect.objectContaining({
        property: "gcalid",
        rich_text: {
          equals: event.id,
        },
      })
    );
    expect(notionClient.update).toHaveBeenCalledWith(existingEvent.id, {
      "title": { "title": [{ "text": { "content": event.summary}}]},
      "description": { "rich_text": [{"text": { "content": event.description}}]},
      "date": { "date": { "start": "Event start time"}},
      "gcalid": {"rich_text": [{ "text": { "content": event.id}}]},
    });
    expect(notionClient.create).not.toHaveBeenCalled();
  });

  it("should call create function if notionClient.query returns no results", async () => {
    notionClient.query.mockResolvedValueOnce([]);

    await handleEventUpdate(event, config, notionClient);

    expect(notionClient.query).toHaveBeenCalledWith(
      "eventsDatabaseId",
      expect.objectContaining({
        property: "gcalid",
        rich_text: {
          equals: event.id,
        },
      })
    );
    expect(notionClient.create).toHaveBeenCalledWith("eventsDatabaseId", {
      "title": { "title": [{ "text": { "content": event.summary}}]},
      "description": { "rich_text": [{"text": { "content": event.description}}]},
      "date": { "date": { "start": "Event start time"}},
      "gcalid": {"rich_text": [{ "text": { "content": event.id}}]},
    });
    expect(notionClient.update).not.toHaveBeenCalled();
  });
});

describe("handleRegistration", () => {
  const registrationsDatabaseId = "mockRegistrationsDatabaseId";
  const contactsDatabaseId  = "mockContactsDatabaseId";


  
  var event;

  beforeEach(() => {
    event = {
      id: "Event Gcal ID",
      attendee_emails: "email1,email2",
      attendee_names: "name1,name2",
      attendee_statuses: "response1,response2",
    };
    mockNotionWrapper.query = jest.fn();
    mockNotionWrapper.update = jest.fn();
    mockNotionWrapper.create = jest.fn();
    mockNotionWrapper.findOrCreate = jest.fn();
  });

  it("should not create or update if registration already exists and the response is the same", async () => {
    const contactRecords = [{ id: "contactId", email: "email1", name: "name1" }];
    mockNotionWrapper.findOrCreate.mockResolvedValue(contactRecords);
    const existingRegistrations = [{ id: "existingRegistrationId" , "properties": {"Email": {"rollup": { "array": [{"email": "email1"}]}}, "Status": {"select": { "id": "response1", "name": "response1"}}} }, { id: "existingRegistrationId2" , "properties": {"Email": {"rollup": { "array": [{"email": "email2"}]}},  "Status": {"select": { "id": "response2",  "name": "response2"}}}} ];
    mockNotionWrapper.query.mockResolvedValue(existingRegistrations);

    await handleRegistration(event, config, notionClient);

    expect(mockNotionWrapper.query).toHaveBeenCalledWith(
      "registrationsDatabaseId",
      expect.objectContaining({
        property: "event_gcalid",
        rollup: {
          any: {
            rich_text: { equals: "Event Gcal ID",}
        },
      }})
    );
    expect(mockNotionWrapper.update).not.toHaveBeenCalled();
    expect(mockNotionWrapper.create).not.toHaveBeenCalled();
    expect(mockNotionWrapper.findOrCreate).not.toHaveBeenCalled();
  });

  it("should update if registration exists with different response", async () => {
    const existingRegistrations = [
      { id: "existingRegistrationId" , "properties": {"Email": {"rollup": { "array": [{"email": "email1"}]}}, "Status": {"select": { "name": "response2"}}} }, 
      { id: "existingRegistrationId2" , "properties": {"Email": {"rollup": { "array": [{"email": "email2"}]}},  "Status": {"select": { "name": "response2"}}}} 
    ];

    mockNotionWrapper.query.mockResolvedValue(existingRegistrations);

    await handleRegistration(event, config, notionClient);

    expect(mockNotionWrapper.query).toHaveBeenCalledWith(
      "registrationsDatabaseId",
      expect.objectContaining({
        property: "event_gcalid",
        rollup: {
          any: {
            rich_text: {
              equals: event.id,
            }
          }
        },
      })
    );
    expect(mockNotionWrapper.update).toHaveBeenCalledWith(
      existingRegistrations[0].id,
      {
        status: { select: { id: "response1" } },
      }
    );
    expect(mockNotionWrapper.create).not.toHaveBeenCalled();
    expect(mockNotionWrapper.findOrCreate).not.toHaveBeenCalled();
  });

  it("should find or create a contact and create a new registration if one doesn't exist", async () => {
    const newContact = { id: "newContactId" };
    mockNotionWrapper.query.mockResolvedValueOnce([event]);
    mockNotionWrapper.query.mockResolvedValueOnce([]);
    mockNotionWrapper.findOrCreate.mockResolvedValue(newContact);

    await handleRegistration(event, config, notionClient);

    expect(mockNotionWrapper.query).toHaveBeenCalledWith(
      "registrationsDatabaseId",
      expect.objectContaining({
        property: "event_gcalid",
        rollup: {
          any: {
            rich_text: {
              equals: event.id,
            }
          }
        },
      })
    );
    expect(mockNotionWrapper.update).not.toHaveBeenCalled();
    expect(mockNotionWrapper.create).toHaveBeenCalledWith("registrationsDatabaseId", {
      contact: { relation: [ {id: "newContactId"}]},
      event: { relation: [{ id: event.id}]},
      status: { select: { id: "response1"}},
      title: { title: [{ text: { content: "name1 - undefined"}}]},
    });
    expect(mockNotionWrapper.findOrCreate).toHaveBeenCalledWith(
      "contactsDatabaseId",
      expect.objectContaining({
        property: "email",
        email: {
          equals: "email1",
        },
      }),
      {
        email: { email: "email1"},
        name: {title: [{text: {content:"name1"}}]},
      }
    );
  });
});
});