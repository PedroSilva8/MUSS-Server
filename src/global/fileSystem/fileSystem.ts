import fs from 'fs'
import glob from 'glob'

export interface IExistsProps {
    file: string
    onSuccess?: () => void
    onError?: (Message: NodeJS.ErrnoException | null) => void
}

export interface IWriteFileProps {
    fileName: string
    data: string
    options: fs.WriteFileOptions
    onSuccess?: () => void
    onError?: (Message: NodeJS.ErrnoException | null) => void
}

export interface IReadFileProps {
    fileName: string
    options?: fs.WriteFileOptions
    onSuccess?: (File: string | Buffer) => void
    onError?: (Message: NodeJS.ErrnoException | null) => void
}

export interface IRenameFileProps {
    oldFileName: string
    newFileName: string
    onSuccess?: () => void
    onError?: (Message: NodeJS.ErrnoException | null) => void
}

export interface IFindFileProps {
    regex: string
    targetFolder: string
    onSuccess?: (Files: string[]) => void
    onError?: (Message: NodeJS.ErrnoException | null) => void
}

export interface IDeleteFileProps {
    fileName: string
    onSuccess?: () => void
    onError?: (Message: NodeJS.ErrnoException | null) => void
}

export interface ITouchFileProps {
    fileName: string
    onSuccess?: () => void
    onError?: (Message: NodeJS.ErrnoException | null) => void
}

export interface IMakeDirProps {
    Dir: string
    onSuccess?: () => void
    onError?: (Message: NodeJS.ErrnoException | null) => void
}

export interface IQueryResult {
    code: 'success' | 'error'
    message: any
}

class FileSystem {
    static baseURL = require.main?.path;

    static toValidFileName = (name: string) => { return name.replace(/[^a-zA-Z0-9_]/gm, "_").toLowerCase() };

    static Exists = (props: IExistsProps) => {
        fs.stat(props.file, (err, stat) => {
            if (err == null) {
                if (props.onSuccess)
                    props.onSuccess()
                return
            }
            else if (props.onError)
                props.onError(err)
        })
    }

    static Write = (props: IWriteFileProps) => {
        fs.writeFile(`${FileSystem.baseURL}/${props.fileName}`, props.data, props.options, 
            (error) => {
                if (error && props.onError != undefined)
                    props.onError(error);
                else if (props.onSuccess != undefined)
                    props.onSuccess();
            });        
    }

    static Read = (props: IReadFileProps) => {
        fs.readFile(`${FileSystem.baseURL}/${props.fileName}`, props.options, (error, data) => { 
            if (error && props.onError != undefined)
                props.onError(error);
            else if (props.onSuccess != undefined)
                props.onSuccess(data);
        });
    }

    static Rename = (props: IRenameFileProps) => {
        fs.rename(FileSystem.baseURL + props.oldFileName, FileSystem.baseURL + props.newFileName, function (err) {
            if (err && props.onError)
                props.onError(err);
            else if (props.onSuccess)
                props.onSuccess();
        })
    }

    static Find = (props: IFindFileProps) => {
        glob(props.regex,{cwd: FileSystem.baseURL + props.targetFolder }, (err, files) => {
            if (err && props.onError)
                props.onError(err);
            else if (props.onSuccess)
                props.onSuccess(files);
        });
    }

    static Delete = (props: IDeleteFileProps) => {
        fs.unlink(`${FileSystem.baseURL}/${props.fileName}`, (err) => {
            if (err && props.onError)
                props.onError(err);
            else if (props.onSuccess)
                props.onSuccess();
        });
    }

    static Touch = (props: ITouchFileProps) => {
        fs.open(`${FileSystem.baseURL}/${props.fileName}`, 'w', (err) => {
            if (err) {
                if (props.onError)
                    props.onError(err);
                return;
            }

            if (props.onSuccess)
                props.onSuccess();
        });
    }

    static MakeDir = (props: IMakeDirProps) => {
        if (!fs.existsSync(`${FileSystem.baseURL}/${props.Dir}`))
            fs.mkdir(`${FileSystem.baseURL}/${props.Dir}`, { recursive: true }, (err) => {
                if (err) {
                    if (props.onError)
                        props.onError(err);
                    return;
                }
    
                if (props.onSuccess)
                    props.onSuccess();
            })
    }
}

export default FileSystem;