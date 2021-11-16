export default class Error {
    static GetErroCode = ( type: 'SUCCESS' | 'ARGUMENTS' | 'SQL_ARGUMENT' | 'SQL_ERROR' | 'FS' | 'ANOTHER' | 'ENCODING' | 'NOT_FOUND') => {
        switch (type) {
            case 'SUCCESS':
                return 0;
            case 'ARGUMENTS':
                return 1;
            case 'SQL_ARGUMENT':
                return 2;
            case 'SQL_ERROR':
                return 3;
            case 'FS':  
                return 4;
            case 'ENCODING':
                return 5;
            case 'NOT_FOUND':
                return 6;
            case 'ANOTHER':
                return -1;
        }
    }

    static GenerateErrorMesssage = (code: number, error: string, size: number = 0, data: any) => {
        return { status: code, error: error, size: size, data: data}
    }

    static SuccessError = (Data?: any, DataSize?: number) => {
        return Error.GenerateErrorMesssage(Error.GetErroCode('SUCCESS'), 'Success', DataSize, Data)
    }

    static ArgumentError = (Data?: any, DataSize?: number) => {
        return Error.GenerateErrorMesssage(Error.GetErroCode('ARGUMENTS'), 'Invalid Arguments', DataSize, Data)
    }

    static NotFoundError = (Data?: any, DataSize?: number) => {
        return Error.GenerateErrorMesssage(Error.GetErroCode('NOT_FOUND'), 'Object Not Found', DataSize, Data)
    }

    static SQLError = (Data?: any, DataSize?: number) => {
        return Error.GenerateErrorMesssage(Error.GetErroCode('SQL_ERROR'), 'An SQL Error Occoured', DataSize, Data)
    }

    static SQLArgumentError = (Data?: any, DataSize?: number) => {
        return Error.GenerateErrorMesssage(Error.GetErroCode('SQL_ARGUMENT'), 'An Invalid Argument Was Recived', DataSize, Data)
    }

    static FSRenameError = (Data?: any, DataSize?: number) => {
        return Error.GenerateErrorMesssage(Error.GetErroCode('FS'), 'Faild To Rename Original', DataSize, Data)
    }

    static FSDeleteError = (Data?: any, DataSize?: number) => {
        return Error.GenerateErrorMesssage(Error.GetErroCode('FS'), 'Faild To Delete File', DataSize, Data)
    }

    static FSSaveError = (Data?: any, DataSize?: number) => {
        return Error.GenerateErrorMesssage(Error.GetErroCode('FS'), 'Faild To Save File', DataSize, Data)
    }

    static FSFindError = (Data?: any, DataSize?: number) => {
        return Error.GenerateErrorMesssage(Error.GetErroCode('FS'), 'Faild To Find File', DataSize, Data)
    }

    static FSCreateError = (Data?: any, DataSize?: number) => {
        return Error.GenerateErrorMesssage(Error.GetErroCode('FS'), 'Faild To Create File', DataSize, Data)
    }

    static EncondError = (Data? : any, DataSize?: number) => {
        return Error.GenerateErrorMesssage(Error.GetErroCode('ENCODING'), 'Failed To Encode Data', DataSize, Data)
    }

    static DecodeError = (Data? : any, DataSize?: number) => {
        return Error.GenerateErrorMesssage(Error.GetErroCode('ENCODING'), 'Failed To Decode Data', DataSize, Data)
    }
}