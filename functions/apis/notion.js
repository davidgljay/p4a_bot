const {Client, APIErrorCode} = require("@notionhq/client");

class NotionWrapper {
  constructor(token) {
    this.client = new Client({auth: token});
  }

  async query(databaseId, filter) {
    try {
      const response = await this.client.databases.query({
        database_id: databaseId,
        filter,
      });

      return response.results;
    } catch (error) {
      if (error.code === APIErrorCode.ObjectNotFound) {
        return [];
      } else {
        console.error("Error searching database:", error);
        throw error;
      }
    }
  }

  async get(itemId) {
    try {
      const response = await this.client.pages.retrieve({page_id: itemId});
      return response;
    } catch (error) {
      console.error("Error retrieving item:", error);
      throw error;
    }
  }

  async create(databaseId, properties) {
    try {
      const response = await this.client.pages.create({
        parent: {database_id: databaseId},
        properties,
      });

      return response;
    } catch (error) {
      console.error("Error creating item:", error);
      throw error;
    }
  }

  async findOrCreate(databaseId, query, properties) {
    try {
      const searchResults = await this.query(databaseId, query);

      if (searchResults.length > 0) {
        return searchResults[0];
      } else {
        return this.create(databaseId, properties);
      }
    } catch (error) {
      console.error("Error finding or creating item:", error);
      throw error;
    }
  }

  async update(itemId, updates) {
    try {
      const response = await this.client.pages.update({
        page_id: itemId,
        properties: updates,
      });

      return response;
    } catch (error) {
      console.error("Error updating item:", error);
      throw error;
    }
  }

  async updateByQuery(databaseId, query, updates) {
    try {
      const searchResults = await this.query(databaseId, query);

      for (const item of searchResults) {
        await this.update(item.id, updates);
      }
    } catch (error) {
      console.error("Error updating items:", error);
      throw error;
    }
  }

  async createChildPage(parentId, properties) {
    try {
      const response = await this.client.pages.create({
        parent: { page_id: parentId },
        properties,
      });
      return response;
    } catch (error) {
      console.error("Error creating child page:", error);
      throw error;
    }
  }

  
  async createDatabase(parentId, title, properties) {
    try {
      const response = await this.client.databases.create({
        parent: { page_id: parentId },
        title: [{ text: { content: title } }],
        properties,
      });
      return response;
    } catch (error) {
      console.error("Error creating database:", error);
      throw error;
    }
  }

}

module.exports = NotionWrapper;
