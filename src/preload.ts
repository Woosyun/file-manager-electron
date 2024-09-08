import { findTagsByFileId } from "./backend/db";
import { FileT, TagT } from "./types";
import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('db', {
    search: (tags: string[]) => ipcRenderer.invoke('search', tags),
    getTagsByFileId: (fileId: bigint) => ipcRenderer.invoke('find-tags-by-file-id', fileId)
});

contextBridge.exposeInMainWorld('utils', {
    dropFiles: (files: string[], tags: string[]) => ipcRenderer.send('drop-files', files, tags),
    getFilePath: (file: File) => webUtils.getPathForFile(file)
});

export { };
declare global {
    interface Window {
        db: {
            search(tags: string[]): Promise<FileT[]>,
            getTagsByFileId(fileId: bigint): Promise<TagT[]>
        };
        utils: {
            dropFiles(files: string[], tags: string[]): void,
            getFilePath(file: File): string
        }
    }
}