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
        const path = Path.join(rootDir, child);
        const files = await fsAsync.readdir(path);
        const fileInfos: FileInfo[] = [];
        for (const file of files) {
            const fileInfo = await getFileDetails(Path.join(path, file));
            fileInfos.push(fileInfo)
        }
        return fileInfos;
    } catch (ex: any) {
        console.log(ex);
        return [];
    }
}

export async function mkdir(name: string, currentDir: string): Promise<FileInfo[]> {
    try {
        const path = Path.join(rootDir, currentDir, name);
        await fsAsync.mkdir(path);

    } catch (error) {

    }
    const result = await listOfFilesFromDir(currentDir);
    return result;
}

export async function deleteFiles(paths: string[]): Promise<StatusInfo<string>[]> {
    const results: StatusInfo<string>[] = [];
    // paths = paths.map(it => Path.join(rootDir, it));
    for (const path of paths) {
        try {
            const file = Path.join(rootDir, path)
            const fileInfo = await getFileDetails(file);
            if (fileInfo.isDirectory) {
                await fsAsync.rm(file, {
                    recursive: true
                });
            } else {
                await fsAsync.unlink(file);
            }

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
    //paths = paths.map(it => Path.join(rootDir, it));
    let count = 0;
    for (const path of paths) {
        try {
            const oldFile = Path.join(rootDir, path);
            const parent = Path.dirname(oldFile);
            const ext = Path.extname(oldFile);  // with .ext
            let newName = name;
            if (count !== 0) {
                newName = Path.parse(name).name + "-" + count + Path.extname(name);
            }
            let newPath = Path.join(parent, newName);
            for (let idx = 0; ; idx++) {
                if (!fs.existsSync(newPath)) {
                    break;
                }
                newPath = Path.join(parent, idx + "_" + newName);
            }
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
            const name = Path.basename(path);
            const movedPath = Path.join(rootDir, moveDir, name);
            await fsAsync.rename(path, movedPath);
        } catch (error: any) {
            // console.log(error);
        }
    }
    const results = await listOfFilesFromDir(currentDir);
    return results;
}

export async function moveUploadFiles(files: {
    path: string,
    name: string
}[], currentDir: string): Promise<FileInfo[]> {
    for (const file of files) {
        try {
            const name = file.name;
            const movedPath = Path.join(rootDir, currentDir, name);
            await fsAsync.rename(file.path, movedPath);
        } catch (error: any) {
            // console.log(error);
        }
    }
    const results = await listOfFilesFromDir(currentDir);
    return results;
}

export async function archiveFiles(paths: string[], currentDir: string, name: string): Promise<FileInfo[]> {
    const outputPath = Path.join(rootDir, currentDir, name + ".zip");
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
        zlib: { level: 0 } // Sets the compression level.
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
        const fileInfo = await getFileDetails(file);
        if (fileInfo.isDirectory) {
            archive.directory(file, fileInfo.name)
        } else {
            archive.file(file, {
                name: Path.basename(file)
            })
        }

    }

    await archive.finalize();
    const results = await listOfFilesFromDir(currentDir);
    return results;
}

export async function getFileDetails(path: string): Promise<FileInfo> {
    //console.log('getFileDetails ->', path);
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