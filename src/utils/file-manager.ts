import fs from "fs/promises";
import Path from "path"
const rootDir = process.env.DIR as string;
export async function listOfFilesFromDir(child: string): Promise<string[]> {
    try {
        const files = await fs.readdir(Path.join(rootDir, child));
        return files;
    } catch (ex: any) {
        return [];
    }
}

export async function deleteFiles(paths: string[]): Promise<string[]> {
    const results: string[] = [];
    paths = paths.map(it => Path.join(rootDir, it));
    for (const path of paths) {
        try {
            await fs.unlink(path);
            results.push("successfully delete " + path);
        } catch (error: any) {
            results.push(error.message);
        }
    }
    return results;
}

export function renameFiles() {

}

export function moveFiles() {

}

export function archiveFiles() {

}