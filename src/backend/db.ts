import { FileT, TagT } from "../types";
import Database from 'better-sqlite3';
const db = new Database('database.db');
db.pragma('journal_mode = WAL');

export async function init() {
    try {
        db.exec(`CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY,
            path TEXT NOT NULL,
            name TEXT NOT NULL,
            last_modified TEXT NOT NULL
            )`);
        db.exec(`CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            file_count INTEGER NOT NULL
            )`);
        db.exec(`CREATE TABLE IF NOT EXISTS tag_file (
            tag_id INTEGER,
            file_id INTEGER,
            FOREIGN KEY(file_id) REFERENCES files(id),
            FOREIGN KEY(tag_id) REFERENCES tags(id),
            PRIMARY KEY (tag_id, file_id)
            )`);
        
    } catch (error) {
        console.log('cannot create tables: ' + error);
    }
}

export async function search(tags: string[]): Promise<FileT[]> {
    console.log('(db/search)searching for tags: ', tags);
    
    try {
        if (!tags || tags.length === 0) {
            return searchAll();
        } else {
            return searchTags(tags);
        }
    } catch (error: any) {
        console.error('Cannot search: ' + error.message);
    }
}

async function searchTags(tags: string[]): Promise<FileT[]> {
    // Dynamically create placeholders for the tags
    const placeholders = tags.map(() => '?').join(',');

    // Prepare the SQL query with LIMIT and OFFSET for pagination
    const stmt = db.prepare(`
        SELECT f.*
        FROM files f
        JOIN tag_file tf ON f.id = tf.file_id
        JOIN tags t ON t.id = tf.tag_id
        WHERE t.name IN (${placeholders})
        GROUP BY f.id
        HAVING COUNT(DISTINCT t.id) >= ?
    `);

    // Execute the query with tags, pageSize, and pageNumber * pageSize
    const result = stmt.all([...tags, tags.length]);

    return result.map(getFileT);
}
async function searchAll(): Promise<FileT[]> {
    const stmt = db.prepare(`
        SELECT f.*
        FROM files f
        `);
    const result = stmt.all();
    return result.map(getFileT);
}
function getFileT(prev: {id: bigint, name: string, path: string, last_modified: string}): FileT {
    return {
        ...prev,
        lastModified: new Date(prev.last_modified).toLocaleDateString()
    }
}

export async function createFile(file: FileT): Promise<bigint> {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT INTO files (name, path, last_modified)
            VALUES (?, ?, ?)
        `);
        const info = stmt.run(file.name, file.path, file.lastModified);
        if (info.lastInsertRowid) {
            if (typeof info.lastInsertRowid === 'number') {
                const bigintId = BigInt(info.lastInsertRowid);
                resolve(bigintId);
            } else {
                resolve(info.lastInsertRowid);
            }
        }
        else
            reject('Cannot create file');
    });
}
export async function createTag(tag: string): Promise<bigint> {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT INTO tags (name, file_count)
            VALUES (?, ?)
            `);
        const info = stmt.run(tag, 0);
        if (info.lastInsertRowid) {
            if (typeof info.lastInsertRowid === 'number') {
                const bigintId = BigInt(info.lastInsertRowid);
                resolve(bigintId);
            } else {
                resolve(info.lastInsertRowid);
            }
        }
        else
            reject('Cannot create tag');
    });
}
export async function findTag(tag: string): Promise<TagT> {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            SELECT *
            FROM tags
            WHERE name = ?
        `);
        const result = stmt.get(tag) as TagT;
        if (result) {
            resolve(result);
        } else {
            reject('Tag not found');
        }
    });
}
export async function createTagFile(tagId: bigint, fileId: bigint) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT INTO tag_file (tag_id, file_id)
            VALUES (?, ?)
            `);
        const info = stmt.run(tagId, fileId);
        if (info.changes)
            resolve(info.changes);
        else
            reject('Cannot create tag_file');
    });
}