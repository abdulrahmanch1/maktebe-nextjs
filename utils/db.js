import { openDB } from 'idb';

const DB_NAME = 'dar-alquraa-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'books';

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        },
    });
};

export const saveBookToOffline = async (book, coverBlob, pdfBlob) => {
    const db = await initDB();
    // Calculate size
    const size = (coverBlob?.size || 0) + (pdfBlob?.size || 0);

    const item = {
        ...book,
        coverBlob,
        pdfBlob,
        savedAt: new Date().toISOString(),
        size,
    };

    await db.put(STORE_NAME, item);
    return item;
};

export const getOfflineBook = async (id) => {
    const db = await initDB();
    return db.get(STORE_NAME, id);
};

export const getAllOfflineBooks = async () => {
    const db = await initDB();
    return db.getAll(STORE_NAME);
};

export const deleteOfflineBook = async (id) => {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
};

export const getStorageUsage = async () => {
    const books = await getAllOfflineBooks();
    const totalBytes = books.reduce((acc, book) => acc + (book.size || 0), 0);
    return totalBytes;
};
