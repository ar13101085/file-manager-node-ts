import express, { Request, Response, NextFunction } from 'express';
import { archiveFiles, deleteFiles, listOfFilesFromDir, mkdir, moveFiles, moveUploadFiles, renameFiles } from '../../../utils/file-manager';
import formidable from "formidable"
const router = express.Router();
router.post("/files", async (req: Request, res: Response, next: NextFunction) => {
    const path = req.body.path;
    const results = await listOfFilesFromDir(path);
    res.send(results);
});

router.post("/create-dir", async (req: Request, res: Response, next: NextFunction) => {
    const currentDir = req.body.currentDir;
    const name = req.body.name;
    const results = await mkdir(name, currentDir);
    res.send(results);
});

router.post("/delete-files", async (req: Request, res: Response, next: NextFunction) => {
    const paths = req.body.paths;
    const results = await deleteFiles(paths);
    res.send(results);
});

router.post("/rename-files", async (req: Request, res: Response, next: NextFunction) => {
    const paths = req.body.paths;
    const name = req.body.name;
    const results = await renameFiles(paths, name);
    res.send(results);
});


router.post("/move-files", async (req: Request, res: Response, next: NextFunction) => {
    const paths = req.body.paths;
    const moveDir = req.body.moveDir;
    const currentDir = req.body.currentDir;
    const results = await moveFiles(paths, moveDir, currentDir);
    res.send(results);
});

router.post("/archive-files", async (req: Request, res: Response, next: NextFunction) => {
    const paths = req.body.paths;
    const name = req.body.name;
    const currentDir = req.body.currentDir;
    const results = await archiveFiles(paths, currentDir, name);
    res.send(results);
});

router.post("/upload-files", async (req: Request, res: Response, next: NextFunction) => {
    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
        if (err || !files.file) {
            res.status(400).send(err);
            return;
        }
        //@ts-ignore
        const result = await moveUploadFiles(files.file.map ? files.file.map((it: any) => ({ path: it.filepath, name: it.originalFilename })) : [{ path: files.file.filepath, name: files.file.originalFilename }], fields.dir);
        res.send(result)
    });

});
export { router as fileHandlerRouter };