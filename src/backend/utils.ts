import { TagT } from "../types";

import fs from 'fs';
import path from 'path';
import {createFile, createTagFile, createTag, findTag} from './db';

export async function setFiles(files: string[], tags: string[]) {
    try {
        console.log('(utils/dropFiles) files: ', files);
        console.log('(utils/dropFiles) tags: ', tags);

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const toPath = path.join(__dirname, 'objects', year.toString(), month.toString());
        const currentDate = today.toISOString();

        const tagIds = await Promise.all(tags.map(async (tag: string) => {
            const tagId = await getTag(tag);
            return tagId.id!;
        }));
        console.log('(utils/setFiles) tagIds: ', tagIds);

        files.forEach(file => {
            setFile(file, tagIds, toPath, currentDate);
        })
    } catch (error: any) {
        console.error('Cannot set files: ' + error.message);
    }
}

async function setFile(filePath: string, tagIds: bigint[], toPath: string, currentDate: string) {
    try {
        const fileName = path.basename(filePath);
        fs.mkdirSync(toPath, { recursive: true });
        fs.copyFileSync(filePath, path.join(toPath, fileName));

        const file = {
            name: fileName,
            path: filePath,
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

function getTag(tagName: string): Promise<TagT> {
    return new Promise((resolve: any, reject: any) => {
        findTag(tagName)
            .then(resolve)
            .catch((err: any) => {
                createTag(tagName)
                    .then(resolve)
                    .catch(reject)
            });
    });
}

function copyFile(from: string, to: string): void {
    try {
        fs.copyFileSync(from, to);
    } catch (error) {
        console.error('(utils/copyFile): ' + error);
    }
}