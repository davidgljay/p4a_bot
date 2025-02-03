const { initializeApp, firestore } = require('firebase-admin');
const FirebaseWrapper = require('../firebase');
const clientConfig = require('../../config/client_config');

jest.mock('firebase-admin', () => {
    const firestoreMock = {
        collection: jest.fn().mockReturnThis(),
        get: jest.fn()
    };
    return {
        initializeApp: jest.fn(),
        firestore: jest.fn(() => firestoreMock)
    };
});

describe('FirebaseWrapper', () => {
    let firebaseWrapper;
    const client_org = 'test_org';
    const mockChapters = [
        { id: 'chapter1', name: 'Chapter 1' },
        { id: 'chapter2', name: 'Chapter 2' }
    ];

    beforeEach(() => {
        firebaseWrapper = new FirebaseWrapper();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize Firebase app with correct config', () => {
            expect(initializeApp).toHaveBeenCalledWith({
                apiKey: clientConfig.p4c.firebase.api_key,
                authDomain: "potlucks4change.firebaseapp.com",
                projectId: "potlucks4change",
                storageBucket: "potlucks4change.firebasestorage.app",
                messagingSenderId: "442075127657",
                appId: "1:44s2075127657:web:db58d715887aed671927f8"
            });
        });

        it('should initialize firestore', () => {
            expect(firestore).toHaveBeenCalled();
        });
    });

    describe('getChapterData', () => {
        it('should return chapter data', async () => {
            firestore().collection().get.mockResolvedValue(
                [
                    {data: ()=>(mockChapters[0])},
                    {data: ()=>(mockChapters[1])},
                ]
            );

            const result = await firebaseWrapper.getChapterData(client_org);

            expect(firestore().collection).toHaveBeenCalledWith(client_org);
            expect(result).toEqual(mockChapters);
        });

        it('should handle errors gracefully', async () => {
            firestore().collection().get.mockRejectedValue(new Error('Test error'));

            await expect(firebaseWrapper.getChapterData(client_org)).rejects.toThrow('Test error');
        });
    });

    describe('getChapterById', () => {
        it('should return chapter by id', async () => {
            const mockChapter = { id: 'chapter1', name: 'Chapter 1' };
            firestore().collection().get.mockResolvedValue(mockChapter);

            const result = await firebaseWrapper.getChapterById(client_org, 'chapter1');

            expect(firestore().collection).toHaveBeenCalledWith(client_org);
            expect(firestore().collection().get).toHaveBeenCalledWith('chapter1');
            expect(result).toEqual(mockChapter);
        });

        it('should handle errors gracefully', async () => {
            firestore().collection().get.mockRejectedValue(new Error('Test error'));

            await expect(firebaseWrapper.getChapterById(client_org, 'chapter1')).rejects.toThrow('Test error');
        });
    });
});