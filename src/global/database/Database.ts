import mysql from 'mysql'

var pool: mysql.Pool | undefined;

export interface IQueryProps {
    query: string
    arguments?: string[]
    onSuccess?: (Message: any) => void
    onError?: (Message: any) => void
}

export interface IQueryResult {
    code: 'success' | 'error'
    message: any
}

export interface ICreatePool {
    user: string,
    password: string,
    database: string,
    host: string,
    connectionLimit: number
}

class database {

    static CreatePool = (props: ICreatePool) => {
        pool = mysql.createPool(props);
    }

    static Query = (props: IQueryProps) => {
        return new Promise<IQueryResult>((resolve) => {
            pool?.query(props.query, props.arguments, (err, results) => {
                if (err)
                    return resolve({code:'error', message: err});
                return resolve({code:'success', message: results});
            })
        });
    }

    static SimpleQuery = async (props: IQueryProps) => {
        return new Promise<IQueryResult>((resolve) => {
            pool?.query(props.query, props.arguments, (err, results) => {
                if (err && props.onError)
                    props.onError(err);
                else if (props.onSuccess)
                    props.onSuccess(results);
            })
        });
    }

    static IsEmpty = (Result: any) => {
        if (Object.keys(Result).length == 0)
            return true;
        else
            return false;
    }
}

export default database;