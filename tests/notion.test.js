const NotionWrapper = require("../functions/apis/notion");

describe("NotionWrapper", () => {
  let notionWrapper;
  let mockClient;

  beforeEach(() => {
    // Mock @notionhq/client
    mockClient = {
      Client: jest.fn().mockImplementation(() => ({
        databases: {
          query: jest.fn().mockResolvedValue({
            results: [],
          }),
          create: jest.fn().mockResolvedValue({
            id: "NEW_DATABASE_ID",
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

  describe("createDatabase", () => {
    it("should create a new database with the specified title and properties", async () => {
      const parentId = "YOUR_PARENT_ID";
      const title = "New Database";
      const properties = {
        property1: "Value 1",
        property2: "Value 2",
      };

      const newDatabase = await notionWrapper.createDatabase(parentId, title, properties);

      // Assert that the new database is created successfully
      expect(notionWrapper.client.databases.create).toHaveBeenCalledWith({parent: {page_id:parentId}, title: [{text: {content: "New Database"}}], properties});
      expect(newDatabase).toBeDefined();
      expect(newDatabase.id).toEqual('NEW_DATABASE_ID');
    });
  });

  describe("createChildPage", () => {
    it("should create a new child page under the specified parent", async () => {
      const parentId = "YOUR_PARENT_ID";
      const properties = {
        title: "Child Page",
        description: "This is a child page",
      };

      const newChildPage = await notionWrapper.createChildPage(parentId, properties);

      // Assert that the new child page is created successfully
      expect(notionWrapper.client.pages.create).toHaveBeenCalledWith({parent: {page_id:parentId}, properties});
      expect(newChildPage.id).toEqual("NEW_ITEM_ID");
    });
  });
});