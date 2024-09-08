import { FileT, TagT } from "./types";
import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('db', {
    getTagsByFileId: (fileId: bigint) => ipcRenderer.invoke('find-tags-by-file-id', fileId)
});

contextBridge.exposeInMainWorld('utils', {
    search: (tags: string[]) => ipcRenderer.invoke('search', tags),
    dropFiles: (files: string[], tags: string[]) => ipcRenderer.send('drop-files', files, tags),
    deleteFile: (file: FileT) => ipcRenderer.send('delete-file', file),
    getFilePath: (file: File) => webUtils.getPathForFile(file),
    openPath: (filePath: string) => ipcRenderer.invoke('open-path', filePath)
});

export { };
declare global {
    interface Window {
        db: {
            getTagsByFileId(fileId: bigint): Promise<TagT[]>
        };
        utils: {
            search(tags: string[]): Promise<FileT[]>,
            dropFiles(files: string[], tags: string[]): void,
            deleteFile(file: FileT): void,
            getFilePath(file: File): string,
            openPath(filePath: string): Promise<string>
        }
    }
}