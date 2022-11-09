import { filesize } from "filesize";
import fsAsync from "fs/promises";
import fs from "fs";
import moment from "moment";
import Path from "path"
import { StatusInfo } from "../types/status-info";
import archiver, { } from "archiver";
const rootDir = process.env.DIR as string;
export async function listOfFilesFromDir(child: string): Promise<FileInfo[]> {
    try {
        const files = await fsAsync.readdir(Path.join(rootDir, child));
        const fileInfos: FileInfo[] = [];
        for (const file of files) {
            const fileInfo = await getFileDetails(file);
            fileInfos.push(fileInfo)
        }
        return fileInfos;
    } catch (ex: any) {
        return [];
    }
}

export async function deleteFiles(paths: string[]): Promise<StatusInfo<string>[]> {
    const results: StatusInfo<string>[] = [];
    paths = paths.map(it => Path.join(rootDir, it));
    for (const path of paths) {
        try {
            const file = Path.join(rootDir, path)
            await fsAsync.unlink(file);
            results.push({
                isSuccess: true,
                msg: 'deleted',
                data: path
            });
        } catch (error: any) {
            results.push({
                isSuccess: false,
                msg: error.message
            });
        }
    }
    return results;
}

export async function renameFiles(paths: string[], name: string): Promise<StatusInfo<FileInfo>[]> {
    const results: StatusInfo<FileInfo>[] = [];
    paths = paths.map(it => Path.join(rootDir, it));
    let count = 0;
    for (const path of paths) {
        try {
            const oldFile = Path.join(rootDir, path);
            const parent = Path.dirname(oldFile);
            const ext = Path.extname(oldFile);  // with .ext
            let newName = name;
            if (count !== 0) {
                newName = name + "-" + count;
            }
            const newPath = Path.join(parent, newName)
            await fsAsync.rename(oldFile, newPath);
            const fileInfo = await getFileDetails(newPath);
            results.push({
                isSuccess: true,
                msg: "successfully rename",
                data: fileInfo
            });
            count++;
        } catch (error: any) {
            results.push({
                isSuccess: false,
                msg: error.message
            });
        }
    }
    return results;
}

export async function moveFiles(paths: string[], moveDir: string, currentDir: string): Promise<FileInfo[]> {
    paths = paths.map(it => Path.join(rootDir, it));
    for (const path of paths) {
        try {
            await fsAsync.rename(path, moveDir);
        } catch (error: any) {
        }
    }
    const results = await listOfFilesFromDir(currentDir);
    return results;
}

export async function archiveFiles(paths: string[], currentDir: string, name: string): Promise<FileInfo[]> {
    const outputPath = Path.join(rootDir, currentDir, name + ".zip");
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    archive.on('warning', function (err) {
        /* if (err.code === 'ENOENT') {
            // log warning
        } else {
            // throw error
            throw err;
        } */
        console.log(err);
    });

    // good practice to catch this error explicitly
    archive.on('error', function (err) {
        throw err;
    });
    archive.pipe(output);

    for (const path of paths) {
        const file = Path.join(rootDir, path);
        archive.file(Path.basename(file), {
            name: Path.basename(file)
        })
    }

    await archive.finalize();
    const results = await listOfFilesFromDir(currentDir);
    return results;
}

export async function getFileDetails(path: string): Promise<FileInfo> {
    const stat = await fsAsync.stat(path);
    const fileInfo: FileInfo = {
        isDirectory: stat.isDirectory(),
        name: Path.basename(path),
        relativePath: Path.relative(rootDir, path),
        size: filesize(stat.size) as string,
        creatingTime: moment(stat.ctime).format("DD-MM-YYYY hh:mm:ss")

    };
    return fileInfo;
}