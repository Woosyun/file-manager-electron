import { FileT, TagT } from "../types";

import fs from 'fs';
import path from 'path';
import { createFile, createTagFile, createTag, findTagId, findAll, findAllByTags, removeFile } from './db';
import { app } from "electron";

export function getUserDataPath(): string {
    return app.getPath('userData');
}

export async function setFiles(files: string[], tags: string[]) {
    try {
        // console.log('(utils/dropFiles) files: ', files);
        console.log('(utils/dropFiles) tags: ', tags);

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        //TODO: change __dirname to root directory of application.

        const toPath = path.join(getUserDataPath(), 'objects', year.toString(), month.toString());
        const currentDate = today.toISOString();

        const tagIds = await Promise.all(tags.map(async (tag: string) => {
            const tagId = await getTag(tag);
            return tagId;
        }));
        console.log('(utils/setFiles) tagIds: ', tagIds);

        files.forEach(file => {
            setFile(file, tagIds, toPath, currentDate);
        })
    } catch (error: any) {
        console.error('Cannot set files: ' + error.message);
    }
}

async function setFile(filePath: string, tagIds: bigint[], targetDir: string, currentDate: string) {
    try {
        const fileName = path.basename(filePath);
        fs.mkdirSync(targetDir, { recursive: true });
        const toPath = path.join(targetDir, fileName);
        fs.copyFileSync(filePath, toPath);

        const file = {
            name: fileName,
            path: toPath,
            lastModified: currentDate
        }
        const fileId: bigint = await createFile(file);

        tagIds.forEach(tagId => {
            createTagFile(tagId, fileId)
                .catch((error: any) => console.error('Cannot create tag_file: ' + error.message));
        });
    } catch (error: any) {
        console.error('Cannot set file: ' + error.message);
    }
}

function getTag(tagName: string): Promise<bigint> {
    return new Promise((resolve: any, reject: any) => {
        findTagId(tagName)
            .then(resolve)
            .catch((err: any) => {
                createTag(tagName)
                    .then(resolve)
                    .catch(reject)
            });
    });
}

export async function search(tags: string[]): Promise<FileT[]> {
    if (!tags || tags.length === 0) {
        return findAll();
    } else {
        return findAllByTags(tags);
    }
}

export async function deleteFile(file: FileT): Promise<void> {
    try {
        fs.rmSync(file.path);
        await removeFile(file.id);
    } catch (error: any) {
        console.error('Cannot delete file: ' + error.message);
    }
}