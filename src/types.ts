export type FileT = {
    id?: bigint,
    name: string,
    path: string,
    lastModified: string
};

export type TagT = {
    id?: bigint,
    name: string,
    fileCount: number
};