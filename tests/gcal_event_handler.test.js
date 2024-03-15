const NotionWrapper = require("../functions/apis/notion");
const {
  handleEventUpdate,
  handleRegistration,
} = require("../functions/handlers/gcal_event_handler");

describe("handleEventUpdate", () => {
  const eventsDatabaseId = "YOUR_EVENTS_DATABASE_ID";
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
    NotionWrapper.query = jest.fn();
    NotionWrapper.update = jest.fn();
    NotionWrapper.create = jest.fn();
  });

  it("should call update function if NotionWrapper.query returns a result", async () => {
    const existingEvent = { id: "existingEventId" };
    NotionWrapper.query.mockResolvedValue([existingEvent]);

    await handleEventUpdate(event);

    expect(NotionWrapper.query).toHaveBeenCalledWith(
      eventsDatabaseId,
      expect.objectContaining({
        property: "gcalid",
        text: {
          equals: event.id,
        },
      })
    );
    expect(NotionWrapper.update).toHaveBeenCalledWith(existingEvent.id, {
      summary: event.summary,
      description: event.description,
      link: event.link,
      duration: event.duration,
      location: event.location,
      start: event.start,
      end: event.end,
    });
    expect(NotionWrapper.create).not.toHaveBeenCalled();
  });

  it("should call create function if NotionWrapper.query returns no results", async () => {
    NotionWrapper.query.mockResolvedValue([]);

    await handleEventUpdate(event);

    expect(NotionWrapper.query).toHaveBeenCalledWith(
      eventsDatabaseId,
      expect.objectContaining({
        property: "gcalid",
        text: {
          equals: event.id,
        },
      })
    );
    expect(NotionWrapper.create).toHaveBeenCalledWith(eventsDatabaseId, {
      id: event.id,
      summary: event.summary,
      description: event.description,
      link: event.link,
      location: event.location,
      duration: event.duration,
      start: event.start,
      end: event.end,
    });
    expect(NotionWrapper.update).not.toHaveBeenCalled();
  });
});

describe("handleRegistration", () => {
  const registrationsDatabaseId = "YOUR_REGISTRATIONS_DATABASE_ID";
  const contactsDatabaseId  = "YOUR_CONTACTS_DATABASE_ID";

  var event;

  beforeEach(() => {
    event = {
      id: "Event Gcal ID",
      attendee_emails: ["email1", "email2"],
      attendee_names: ["name1", "name2"],
      attendee_responses: ["response1", "response2"],
    };
  
    NotionWrapper.query = jest.fn();
    NotionWrapper.update = jest.fn();
    NotionWrapper.create = jest.fn();
    NotionWrapper.findOrCreate = jest.fn();
  });

  it("should not create or update if registration already exists and the response is the same", async () => {
    const existingRegistrations = [{ id: "existingRegistrationId" , email: "email1", response: "response1" }, { id: "existingRegistrationId2" , email: "email2", response: "response2" }];
    NotionWrapper.query.mockResolvedValueOnce(existingRegistrations);

    await handleRegistration(event);

    expect(NotionWrapper.query).toHaveBeenCalledWith(
      registrationsDatabaseId,
      expect.objectContaining({
        property: "event",
        text: {
          equals: event.id,
        },
      })
    );
    expect(NotionWrapper.update).not.toHaveBeenCalled();
    expect(NotionWrapper.create).not.toHaveBeenCalled();
    expect(NotionWrapper.findOrCreate).not.toHaveBeenCalled();
  });

  it("should update if registration exists with different response", async () => {
    const existingRegistrations = [
      { id: "existingRegistrationId", email: "email1", response: "oldResponse"},
      { id: "existingRegistrationId2" , email: "email2", response: "response2" }
    ];
    NotionWrapper.query.mockResolvedValue(existingRegistrations);

    await handleRegistration(event);

    expect(NotionWrapper.query).toHaveBeenCalledWith(
      registrationsDatabaseId,
      expect.objectContaining({
        property: "event",
        text: {
          equals: event.id,
        },
      })
    );
    expect(NotionWrapper.update).toHaveBeenCalledWith(
      existingRegistrations[0].id,
      {
        response: event.attendee_responses[0],
      }
    );
    expect(NotionWrapper.create).not.toHaveBeenCalled();
    expect(NotionWrapper.findOrCreate).not.toHaveBeenCalled();
  });

  it("should find or create a contact and create a new registration if one doesn't exist", async () => {
    const newContact = { id: "newContactId" };
    NotionWrapper.query.mockResolvedValue([]);
    NotionWrapper.findOrCreate.mockResolvedValue(newContact);

    await handleRegistration(event);

    expect(NotionWrapper.query).toHaveBeenCalledWith(
      registrationsDatabaseId,
      expect.objectContaining({
        property: "event",
        text: {
          equals: event.id,
        },
      })
    );
    expect(NotionWrapper.update).not.toHaveBeenCalled();
    expect(NotionWrapper.create).toHaveBeenCalledWith(registrationsDatabaseId, {
      user: newContact.id,
      event: event.id,
      response: event.attendee_responses[0],
    });
    expect(NotionWrapper.findOrCreate).toHaveBeenCalledWith(
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