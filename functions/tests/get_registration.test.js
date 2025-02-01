const { lookupRegistration } = require("../handlers/get_registration");

const mockNotionWrapper = {};
jest.mock("../apis/notion.js", () => {
    return jest.fn().mockImplementation(() => mockNotionWrapper);
});

const clientConfig = {
        test_org: {
        registrations: {
            id: 'test_registration_db_id'
        },
        token: 'test_token'
    }
};

jest.mock('../config/client_config.js', () => (clientConfig));

jest.spyOn(console, 'error').mockImplementation((erorr) => {});

describe("lookupRegistration", () => {
    const client_org = "test_org";
    const registrationId = "test_registration_id";
    const mockRegistration = {
        id: registrationId,
        properties: {
            // Mock properties as per your schema
        },
        parent_database_id: "parent_db_id"
    };
    const mockChapterConfig = {
        registrations: {
            fields: {
                Event: "Event",
                Status: "Status",
                Name: "Name",
                "Dietary Requirements": "Dietary Requirements",
                "Dish Text": "Dish Text",
                "Dish Type": "Dish Type",
                "Event Start Time": "Event Start Time",
                "Event Location": "Event Location",
                Contact: "Contact"
            }
        }
    };
    const mockEventRegistrations = [
        {
            id: "event_registration_id_1",
            properties: {
                // Mock properties as per your schema
            }
        },
        {
            id: "event_registration_id_2",
            properties: {
                // Mock properties as per your schema
            }
        }
    ];

    beforeEach(() => {
        mockNotionWrapper.get = jest.fn();
        mockNotionWrapper.fb = {
            getChapterById: jest.fn()
        };
        mockNotionWrapper.findObjectById = jest.fn();
        mockNotionWrapper.query = jest.fn();
    });

    it("should return the correct registration data", async () => {
        mockNotionWrapper.get.mockResolvedValue(mockRegistration);
        mockNotionWrapper.fb.getChapterById.mockResolvedValue(mockChapterConfig);
        mockNotionWrapper.findObjectById.mockImplementation((properties, field) => {
            switch (field) {
                case "Event":
                    return {relation: [{id: "event_id"}]};
                case "Name":
                    return {formula: {string: "Test User"}};
                case "Dish Text":
                    return {rich_text: [{text: {content: "Dish description"}}]};
                case "Dish Type":
                    return {select: {name: "Salad"}};
                case "Status":
                    return {select: {name: "Accepted"}};
                case "Dietary Requirements":
                    return {rollup: {array: [{rich_text: [{text:{content: 'Allergic to peanuts'}}]}]}};
                case "Event Start Time":
                    return {rollup: {array: [{date: {start: "2022-01-01"}}]}};
                case "Event Location":
                    return {rollup: {array: [{rich_text: [{text: {content: "Event location"}}]}]}};
                case "Contact":
                    return {relation: [{id: "contact_id"}]};
                default:
                    return {};
            }
        });
        mockNotionWrapper.query.mockResolvedValue(mockEventRegistrations);

        const result = await lookupRegistration(registrationId, client_org);

        expect(mockNotionWrapper.get).toHaveBeenCalledWith(registrationId);
        expect(mockNotionWrapper.fb.getChapterById).toHaveBeenCalledWith(client_org, mockRegistration.parent_database_id);
        expect(mockNotionWrapper.query).toHaveBeenCalledWith(
            clientConfig[client_org].registrations.id,
            expect.objectContaining({
                property: mockChapterConfig.registrations.fields.Event,
                relation: {
                    contains: expect.any(String),
                },
            })
        );

        expect(result).toEqual(expect.objectContaining({
            id: registrationId,
            // Add more expectations based on the returned result
        }));
    });

    it("should return the correct registration data when the user's status, dietary requirements, and dish types are all undefined", async () => {
        mockNotionWrapper.get.mockResolvedValue(mockRegistration);
        mockNotionWrapper.fb.getChapterById.mockResolvedValue(mockChapterConfig);
        mockNotionWrapper.findObjectById.mockImplementation((properties, field) => {
            switch (field) {
                case "Event":
                    return {relation: [{id: "event_id"}]};
                case "Name":
                    return {formula: {string: "Test User"}};
                case "Dish Text":
                    return {rich_text: []};
                case "Dish Type":
                    return {select: undefined};
                case "Status":
                    return {select: undefined};
                case "Dietary Requirements":
                    return {rollup: {array: [{rich_text: []}]}};
                case "Event Start Time":
                    return {rollup: {array: [{date: {start: "2022-01-01"}}]}};
                case "Event Location":
                    return {rollup: {array: [{rich_text: [{text: {content: "Event location"}}]}]}};
                case "Contact":
                    return {relation: [{id: "contact_id"}]};
                default:
                    return {};
            }
        });
        mockNotionWrapper.query.mockResolvedValue(mockEventRegistrations);

        const result = await lookupRegistration(registrationId, client_org);

        expect(mockNotionWrapper.get).toHaveBeenCalledWith(registrationId);
        expect(mockNotionWrapper.fb.getChapterById).toHaveBeenCalledWith(client_org, mockRegistration.parent_database_id);
        expect(mockNotionWrapper.query).toHaveBeenCalledWith(
            clientConfig[client_org].registrations.id,
            expect.objectContaining({
                property: mockChapterConfig.registrations.fields.Event,
                relation: {
                    contains: expect.any(String),
                },
            })
        );

        expect(result).toEqual(expect.objectContaining({
            id: registrationId,
            // Add more expectations based on the returned result
        }));
    });

    it("should handle errors gracefully", async () => {
        mockNotionWrapper.get.mockRejectedValue(new Error("Test error"));

        const result = await lookupRegistration(registrationId, client_org);

        expect(result).toBeUndefined();
        expect(console.error).toHaveBeenCalledWith('Error looking up registration', expect.any(Error));
    });
});