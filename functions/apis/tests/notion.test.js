const NotionWrapper = require('../notion');
const { Client } = require('@notionhq/client');
const FirebaseWrapper = require('../firebase');

jest.mock('@notionhq/client');
jest.mock('../firebase');

describe('NotionWrapper', () => {
    let notionWrapper;
    let mockClient;
    let mockFirebaseClient;

    beforeEach(() => {
        mockClient = {
            databases: {
                query: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            pages: {
                retrieve: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
        };

        Client.mockImplementation(() => mockClient);

        mockFirebaseClient = {
            fb: jest.fn(),
            getChapterData: jest.fn(),
        };

        FirebaseWrapper.mockImplementation(() => mockFirebaseClient);

        notionWrapper = new NotionWrapper('fake-token', mockFirebaseClient);
    });

    test('query should return results on success', async () => {
        const mockResults = [{ id: '1' }, { id: '2' }];
        mockClient.databases.query.mockResolvedValue({ results: mockResults });

        const results = await notionWrapper.query('database_id', {});

        expect(results).toEqual(mockResults);
        expect(mockClient.databases.query).toHaveBeenCalledWith({
            database_id: 'database_id',
            filter: {},
            page_size: 100,
        });
    });

    test('get should return page on success', async () => {
        const mockPage = { id: '1' };
        mockClient.pages.retrieve.mockResolvedValue(mockPage);

        const page = await notionWrapper.get('page_id');

        expect(page).toEqual(mockPage);
        expect(mockClient.pages.retrieve).toHaveBeenCalledWith({ page_id: 'page_id' });
    });

    test('create should return created page on success', async () => {
        const mockPage = { id: '1' };
        mockClient.pages.create.mockResolvedValue(mockPage);

        const page = await notionWrapper.create('database_id', { title: 'Test' });

        expect(page).toEqual(mockPage);
        expect(mockClient.pages.create).toHaveBeenCalledWith({
            parent: { database_id: 'database_id' },
            properties: { title: 'Test' },
            children: [],
        });
    });

    test('update should return updated page on success', async () => {
        const mockPage = { id: '1' };
        mockClient.pages.update.mockResolvedValue(mockPage);

        const page = await notionWrapper.update('page_id', { title: 'Updated' });

        expect(page).toEqual(mockPage);
        expect(mockClient.pages.update).toHaveBeenCalledWith({
            page_id: 'page_id',
            properties: { title: 'Updated' },
        });
    });

    test('findOrCreate should return existing page if found', async () => {
        const mockResults = [{ id: '1' }];
        mockClient.databases.query.mockResolvedValue({ results: mockResults });

        const page = await notionWrapper.findOrCreate('database_id', {}, { title: 'Test' });

        expect(page).toEqual(mockResults[0]);
        expect(mockClient.databases.query).toHaveBeenCalledWith({
            database_id: 'database_id',
            filter: {},
            page_size: 100,
        });
    });

    test('findOrCreate should create new page if not found', async () => {
        const mockResults = [];
        const mockPage = { id: '1' };
        mockClient.databases.query.mockResolvedValue({ results: mockResults });
        mockClient.pages.create.mockResolvedValue(mockPage);

        const page = await notionWrapper.findOrCreate('database_id', {}, { title: 'Test' });

        expect(page).toEqual(mockPage);
        expect(mockClient.pages.create).toHaveBeenCalledWith({
            parent: { database_id: 'database_id' },
            properties: { title: 'Test' },
            children: [],
        });
    });

    test('createChildPage should return created child page on success', async () => {
        const mockPage = { id: '1' };
        mockClient.pages.create.mockResolvedValue(mockPage);

        const page = await notionWrapper.createChildPage('parent_id', { title: 'Child Page' });

        expect(page).toEqual(mockPage);
        expect(mockClient.pages.create).toHaveBeenCalledWith({
            parent: { page_id: 'parent_id' },
            properties: { title: 'Child Page' },
        });
    });

    test('createDatabase should return created database on success', async () => {
        const mockDatabase = { id: '1' };
        mockClient.databases.create.mockResolvedValue(mockDatabase);

        const database = await notionWrapper.createDatabase('parent_id', 'Test Database', {});

        expect(database).toEqual(mockDatabase);
        expect(mockClient.databases.create).toHaveBeenCalledWith({
            parent: { page_id: 'parent_id' },
            title: [{ text: { content: 'Test Database' } }],
            properties: {},
        });
    });

    test('updateDatabase should return updated database on success', async () => {
        const mockDatabase = { id: '1' };
        mockClient.databases.update.mockResolvedValue(mockDatabase);

        const database = await notionWrapper.updateDatabase('database_id', { title: 'Updated Database' });

        expect(database).toEqual(mockDatabase);
        expect(mockClient.databases.update).toHaveBeenCalledWith({
            database_id: 'database_id',
            properties: { title: 'Updated Database' },
        });
    });

    test('queryChapterData should return chapter data on success', async () => {
        const mockChapters = [{ id: '1', database_type: { id: 'db1', fields: { field1: 'field1_id' } } }];
        const mockResults = [{ id: 'result1' }];
        mockFirebaseClient.getChapterData.mockResolvedValue(mockChapters);
        mockClient.databases.query.mockResolvedValue({ results: mockResults });

        const results = await notionWrapper.queryChapterData('database_type', ['field1'], (fieldIds) => ({ field: fieldIds[0] }), 'client_org');

        expect(results).toEqual([{ chapter_config: mockChapters[0], results: mockResults }]);
        expect(mockFirebaseClient.getChapterData).toHaveBeenCalledWith('client_org');
        expect(mockClient.databases.query).toHaveBeenCalledWith({
            database_id: 'db1',
            filter: { field: 'field1_id' },
            page_size: 100,
        });
    });
});