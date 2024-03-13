const { Client, APIErrorCode } = require("@notionhq/client")

class NotionWrapper {
    constructor(token) {
        this.client = new Client({ auth: token });
    }

    async searchDatabase(databaseId, query) {
        try {
            const response = await this.client.databases.query({
                database_id: databaseId,
                filter: {
                    property: 'title',
                    text: {
                        contains: query
                    }
                }
            });

            return response.results;
        } catch (error) {   
            if (error.code === APIErrorCode.ObjectNotFound) {
                const response = [];
            } else {
            console.error('Error searching database:', error);
            throw error;
            }
        }
    }

    async getItemById(itemId) {
        try {
            const response = await this.client.pages.retrieve({ page_id: itemId });
            return response;
        } catch (error) {
            console.error('Error retrieving item:', error);
            throw error;
        }
    }

    async createItem(databaseId, properties) {
        try {
            const response = await this.client.pages.create({
                parent: { database_id: databaseId },
                properties
            });

            return response;
        } catch (error) {
            console.error('Error creating item:', error);
            throw error;
        }
    }

    async findOrCreateItem(databaseId, query, properties) {
        try {
            const searchResults = await this.searchDatabase(databaseId, query);

            if (searchResults.length > 0) {
                return searchResults[0];
            } else {
                return this.createItem(databaseId, properties);
            }
        } catch (error) {
            console.error('Error finding or creating item:', error);
            throw error;
        }
    }

    async updateItemById(itemId, updates) {
        try {
            const response = await this.client.pages.update({
                page_id: itemId,
                properties: updates
            });

            return response;
        } catch (error) {
            console.error('Error updating item:', error);
            throw error;
        }
    }

    async updateItemsByQuery(databaseId, query, updates) {
        try {
            const searchResults = await this.searchDatabase(databaseId, query);

            for (const item of searchResults) {
                await this.updateItemById(item.id, updates);
            }
        } catch (error) {
            console.error('Error updating items:', error);
            throw error;
        }
    }
}

module.exports = NotionWrapper;