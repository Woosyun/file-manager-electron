import { FileT } from "./types";
import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('db', {
    search: (tags: string[]) => ipcRenderer.invoke('search', tags)
});

contextBridge.exposeInMainWorld('utils', {
    dropFiles: (files: string[], tags: string[]) => ipcRenderer.send('drop-files', files, tags),
    getFilePath: (file: File) => webUtils.getPathForFile(file)
});

export { };
declare global {
    interface Window {
        db: {
            search(tags: string[]): Promise<FileT[]>
        };
        utils: {
            dropFiles(files: string[], tags: string[]): void,
            getFilePath(file: File): string
        }
    }
}