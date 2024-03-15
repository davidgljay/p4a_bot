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
  

describe("handleEventUpdate", () => {
  const eventsDatabaseId = "mockEventsDatabaseId";
  const event = {
    id: "Event Gcal ID",
    summary: "Event summary",
    location: "Event location",
    description: "Event description",
    start: "Event start time",
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

    await handleEventUpdate(event);

    expect(notionClient.query).toHaveBeenCalledWith(
      eventsDatabaseId,
      expect.objectContaining({
        property: "gcalid",
        text: {
          equals: event.id,
        },
      })
    );
    expect(notionClient.update).toHaveBeenCalledWith(existingEvent.id, {
      summary: event.summary,
      description: event.description,
      link: event.link,
      duration: event.duration,
      location: event.location,
      start: event.start,
      end: event.end,
      gcalid: event.id,
    });
    expect(notionClient.create).not.toHaveBeenCalled();
  });

  it("should call create function if notionClient.query returns no results", async () => {
    notionClient.query.mockResolvedValueOnce([]);

    await handleEventUpdate(event);

    expect(notionClient.query).toHaveBeenCalledWith(
      eventsDatabaseId,
      expect.objectContaining({
        property: "gcalid",
        text: {
          equals: event.id,
        },
      })
    );
    expect(notionClient.create).toHaveBeenCalledWith(eventsDatabaseId, {
      id: event.id,
      summary: event.summary,
      description: event.description,
      link: event.link,
      location: event.location,
      duration: event.duration,
      start: event.start,
      end: event.end,
      gcalid: event.id,
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
      attendee_emails: ["email1", "email2"],
      attendee_names: ["name1", "name2"],
      attendee_responses: ["response1", "response2"],
    };
    mockNotionWrapper.query = jest.fn();
    mockNotionWrapper.update = jest.fn();
    mockNotionWrapper.create = jest.fn();
    mockNotionWrapper.findOrCreate = jest.fn();
  });

  it("should not create or update if registration already exists and the response is the same", async () => {
    const existingRegistrations = [{ id: "existingRegistrationId" , email: "email1", response: "response1" }, { id: "existingRegistrationId2" , email: "email2", response: "response2" }];
    mockNotionWrapper.query.mockResolvedValueOnce(existingRegistrations);

    await handleRegistration(event);

    expect(mockNotionWrapper.query).toHaveBeenCalledWith(
      registrationsDatabaseId,
      expect.objectContaining({
        property: "event",
        text: {
          equals: event.id,
        },
      })
    );
    expect(mockNotionWrapper.update).not.toHaveBeenCalled();
    expect(mockNotionWrapper.create).not.toHaveBeenCalled();
    expect(mockNotionWrapper.findOrCreate).not.toHaveBeenCalled();
  });

  it("should update if registration exists with different response", async () => {
    const existingRegistrations = [
      { id: "existingRegistrationId", email: "email1", response: "oldResponse"},
      { id: "existingRegistrationId2" , email: "email2", response: "response2" }
    ];
    mockNotionWrapper.query.mockResolvedValue(existingRegistrations);

    await handleRegistration(event);

    expect(mockNotionWrapper.query).toHaveBeenCalledWith(
      registrationsDatabaseId,
      expect.objectContaining({
        property: "event",
        text: {
          equals: event.id,
        },
      })
    );
    expect(mockNotionWrapper.update).toHaveBeenCalledWith(
      existingRegistrations[0].id,
      {
        response: event.attendee_responses[0],
      }
    );
    expect(mockNotionWrapper.create).not.toHaveBeenCalled();
    expect(mockNotionWrapper.findOrCreate).not.toHaveBeenCalled();
  });

  it("should find or create a contact and create a new registration if one doesn't exist", async () => {
    const newContact = { id: "newContactId" };
    mockNotionWrapper.query.mockResolvedValue([]);
    mockNotionWrapper.findOrCreate.mockResolvedValue(newContact);

    await handleRegistration(event);

    expect(mockNotionWrapper.query).toHaveBeenCalledWith(
      registrationsDatabaseId,
      expect.objectContaining({
        property: "event",
        text: {
          equals: event.id,
        },
      })
    );
    expect(mockNotionWrapper.update).not.toHaveBeenCalled();
    expect(mockNotionWrapper.create).toHaveBeenCalledWith(registrationsDatabaseId, {
      user: newContact.id,
      event: event.id,
      response: event.attendee_responses[0],
    });
    expect(mockNotionWrapper.findOrCreate).toHaveBeenCalledWith(
      contactsDatabaseId,
      expect.objectContaining({
        property: "email",
        text: {
          equals: event.attendee_emails[0],
        },
      }),
      {
        email: event.attendee_emails[0],
        name: event.attendee_names[0],
      }
    );
  });
});
});