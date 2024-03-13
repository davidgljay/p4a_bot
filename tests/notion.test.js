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

  describe("searchDatabase", () => {
    it("should return search results from the specified database", async () => {
      const databaseId = "YOUR_DATABASE_ID";
      const query = "search query";
      notionWrapper.client.databases.query.mockResolvedValue({
        results: [{ id: "test_restuls" }]
      });

      const searchResults = await notionWrapper.searchDatabase(databaseId, query);

      // Assert that the search results are returned successfully
      expect(searchResults).toBeDefined();
      expect(searchResults.length).toBeGreaterThan(0);
    });
  });

  describe("getItemById", () => {
    it("should return the item with the specified ID", async () => {
      const itemId = "YOUR_ITEM_ID";

      const item = await notionWrapper.getItemById(itemId);

      // Assert that the item is returned successfully
      expect(item).toBeDefined();
      expect(item.id).toBe(itemId);
    });
  });

  describe("createItem", () => {
    it("should create a new item in the specified database", async () => {
      const databaseId = "YOUR_DATABASE_ID";
      const properties = {
        title: "New Item",
        description: "This is a new item",
      };

      const newItem = await notionWrapper.createItem(databaseId, properties);

      // Assert that the new item is created successfully
      expect(newItem).toBeDefined();
      expect(newItem.id).toBeDefined();
    });
  });

  // Add tests for other functions (findOrCreateItem, updateItemById, updateItemsByQuery) here
});
