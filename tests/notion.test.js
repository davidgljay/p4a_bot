const NotionWrapper = require("../functions/apis/notion");

describe("NotionWrapper", () => {
  let notionWrapper;

  beforeEach(() => {
    // Mock @notionhq/client
    let mockClient = {
      Client: jest.fn().mockImplementation(() => ({
        databases: {
          query: jest.fn().mockResolvedValue({
            results: [],
          }),
        },
        pages: {
          retrieve: jest.fn().mockResolvedValue({
            id: "YOUR_ITEM_ID",
          }),
          create: jest.fn().mockResolvedValue({
            id: "NEW_ITEM_ID",
          }),
        },
      })),
    };

    // Initialize NotionWrapper with a valid token
    notionWrapper = new NotionWrapper("YOUR_NOTION_TOKEN");
    notionWrapper.client = mockClient.Client();
  });

  describe("query", () => {
    it("should return search results from the specified database", async () => {
      const databaseId = "YOUR_DATABASE_ID";
      const query = "search query";
      notionWrapper.client.databases.query.mockResolvedValue({
        results: [{ id: "test_restuls" }]
      });

      const searchResults = await notionWrapper.query(databaseId, query);

      // Assert that the search results are returned successfully
      expect(searchResults).toBeDefined();
      expect(searchResults.length).toBeGreaterThan(0);
    });
  });

  describe("get", () => {
    it("should return the item with the specified ID", async () => {
      const itemId = "YOUR_ITEM_ID";
      notionWrapper.client.pages.retrieve.mockResolvedValue({
        results: { id: itemId }
      });

      const item = await notionWrapper.get(itemId);

      // Assert that the item is returned successfully
      expect(item).toBeDefined();
      expect(item.id).toBe(itemId);
    });
  });

  describe("create", () => {
    it("should create a new item in the specified database", async () => {
      const databaseId = "YOUR_DATABASE_ID";
      const properties = {
        title: "New Item",
        description: "This is a new item",
      };

      const newItem = await notionWrapper.create(databaseId, properties);

      // Assert that the new item is created successfully
      expect(newItem).toBeDefined();
      expect(newItem.id).toBeDefined();
    });
  });

  // Add tests for other functions (findOrCreateItem, updateItemById, updateItemsByQuery) here
});
