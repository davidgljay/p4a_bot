const jest = require('jest-mock');
const { findObjectById, createObject, updateObjectById, findOrCreateObject, findAndUpdateObject, deleteObjectById } = require('../functions/apis/notion');

describe('Notion API Tests', () => {
  // Mock the Notion client
  const notionClientMock = {
    // Mock the necessary methods
    blocks: {
      retrieve: jest.fn(),
      appendChildren: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  // Mock the Notion client initialization
  jest.mock('notion-client', () => ({
    Client: jest.fn().mockImplementation(() => notionClientMock),
  }));

  // Test the findObjectById function
  describe('findObjectById', () => {
    it('should retrieve a Notion object by ID', async () => {
      // Mock the necessary data
      const databaseId = 'databaseId';
      const objectId = 'objectId';
      const expectedObject = { id: objectId, title: 'Test Object' };

      // Mock the Notion client's retrieve method
      notionClientMock.blocks.retrieve.mockResolvedValue(expectedObject);

      // Call the findObjectById function
      const result = await findObjectById(databaseId, objectId);

      // Verify the result
      expect(result).toEqual(expectedObject);
      expect(notionClientMock.blocks.retrieve).toHaveBeenCalledWith({ blockId: objectId });
    });
  });

  // Test the createObject function
  describe('createObject', () => {
    it('should create a new Notion object', async () => {
      // Mock the necessary data
      const databaseId = 'databaseId';
      const properties = { title: 'New Object' };
      const expectedObject = { id: 'newObjectId', ...properties };

      // Mock the Notion client's create method
      notionClientMock.blocks.create.mockResolvedValue(expectedObject);

      // Call the createObject function
      const result = await createObject(databaseId, properties);

      // Verify the result
      expect(result).toEqual(expectedObject);
      expect(notionClientMock.blocks.create).toHaveBeenCalledWith({ parent: { database_id: databaseId }, properties });
    });
  });

  // Test the updateObjectById function
  describe('updateObjectById', () => {
    it('should update a Notion object by ID', async () => {
      // Mock the necessary data
      const databaseId = 'databaseId';
      const objectId = 'objectId';
      const properties = { title: 'Updated Object' };
      const expectedObject = { id: objectId, ...properties };

      // Mock the Notion client's update method
      notionClientMock.blocks.update.mockResolvedValue(expectedObject);

      // Call the updateObjectById function
      const result = await updateObjectById(databaseId, objectId, properties);

      // Verify the result
      expect(result).toEqual(expectedObject);
      expect(notionClientMock.blocks.update).toHaveBeenCalledWith({ blockId: objectId, properties });
    });
  });

  // Test the findOrCreateObject function
  describe('findOrCreateObject', () => {
    it('should find an existing Notion object or create a new one', async () => {
      // Mock the necessary data
      const databaseId = 'databaseId';
      const properties = { title: 'Existing Object' };
      const expectedObject = { id: 'existingObjectId', ...properties };

      // Mock the Notion client's retrieve method
      notionClientMock.blocks.retrieve.mockResolvedValue(expectedObject);

      // Call the findOrCreateObject function
      const result = await findOrCreateObject(databaseId, properties);

      // Verify the result
      expect(result).toEqual(expectedObject);
      expect(notionClientMock.blocks.retrieve).toHaveBeenCalledWith({ database_id: databaseId, filter: { property: 'title', text: { equals: properties.title } } });
      expect(notionClientMock.blocks.create).not.toHaveBeenCalled();
    });

    it('should create a new Notion object if it does not exist', async () => {
      // Mock the necessary data
      const databaseId = 'databaseId';
      const properties = { title: 'New Object' };
      const expectedObject = { id: 'newObjectId', ...properties };

      // Mock the Notion client's retrieve method to return null
      notionClientMock.blocks.retrieve.mockResolvedValue(null);

      // Mock the Notion client's create method
      notionClientMock.blocks.create.mockResolvedValue(expectedObject);

      // Call the findOrCreateObject function
      const result = await findOrCreateObject(databaseId, properties);

      // Verify the result
      expect(result).toEqual(expectedObject);
      expect(notionClientMock.blocks.retrieve).toHaveBeenCalledWith({ database_id: databaseId, filter: { property: 'title', text: { equals: properties.title } } });
      expect(notionClientMock.blocks.create).toHaveBeenCalledWith({ parent: { database_id: databaseId }, properties });
    });
  });

  // Test the findAndUpdateObject function
  describe('findAndUpdateObject', () => {
    it('should find and update a Notion object by ID', async () => {
      // Mock the necessary data
      const databaseId = 'databaseId';
      const objectId = 'objectId';
      const properties = { title: 'Updated Object' };
      const expectedObject = { id: objectId, ...properties };

      // Mock the Notion client's retrieve method
      notionClientMock.blocks.retrieve.mockResolvedValue(expectedObject);

      // Mock the Notion client's update method
      notionClientMock.blocks.update.mockResolvedValue(expectedObject);

      // Call the findAndUpdateObject function
      const result = await findAndUpdateObject(databaseId, objectId, properties);

      // Verify the result
      expect(result).toEqual(expectedObject);
      expect(notionClientMock.blocks.retrieve).toHaveBeenCalledWith({ blockId: objectId });
      expect(notionClientMock.blocks.update).toHaveBeenCalledWith({ blockId: objectId, properties });
    });
  });

  // Test the deleteObjectById function
  describe('deleteObjectById', () => {
    it('should delete a Notion object by ID', async () => {
      // Mock the necessary data
      const databaseId = 'databaseId';
      const objectId = 'objectId';

      // Call the deleteObjectById function
      await deleteObjectById(databaseId, objectId);

      // Verify the delete method was called with the correct parameters
      expect(notionClientMock.blocks.delete).toHaveBeenCalledWith({ blockId: objectId });
    });
  });
});
