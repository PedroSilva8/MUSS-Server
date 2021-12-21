import DatabaseHelper, { IDBArgument, IDBOrderBy } from '@Database/DatabaseHelper'
import { MysqlError } from 'mysql';

export interface IGetPagesLeft {
    pageLength: number,
    onSuccess?: (Result: number) => void
    onError?: (Error: MysqlError) => void
}

export interface ICustom<T> {
    query: string,
    arguments: string[],
    onSuccess?: (Result: T[]) => void
    onError?: (Error: MysqlError) => void
}

export interface IGetAll<T> {
    limit?: number
    offset?: number
    orderBy?: IDBOrderBy
    arguments?: IDBArgument[]
    onSuccess?: (Result: T[]) => void
    onError?: (Error: MysqlError) => void
}

export interface IGetWith<T> {
    arguments: IDBArgument[]
    orderBy?: IDBOrderBy
    onSuccess?: (Result: T[]) =>  void
    onError?: (Error: MysqlError) => void
}

export interface IGet<T> {
    index: number
    onSuccess?: (Result: T | undefined) => void
    onError?: (Error: MysqlError) => void
}

export interface IGetWithAuth<T> {
    index: number
    token: string
    onSuccess?: (Result: T | undefined) => void
    onError?: (Error: MysqlError) => void
}


export interface IExists<T> {
    index: number,
    onSuccess?: (Result: boolean) => void
    onError?: (Error: MysqlError) => void
}

export interface IUpdate<T> {
    index: number
    data: T
    onSuccess?: () => void
    onError?: (Error: MysqlError) => void
}

export interface ICreate<T> {
    data: T
    onSuccess?: (Result: T[]) => void
    onError?: (Error: MysqlError) => void
}

export interface ICountColumn<T> {
    column: string,
    onSuccess?: (Result: number) => void
    onError?: (Error: MysqlError) => void
}

export interface IDelete {
    index: number,
    onSuccess?: () => void
    onError?: (Error: MysqlError) => void
}

export interface IDeleteWhere {
    arguments: IDBArgument[],
    onSuccess?: () => void
    onError?: (Error: MysqlError) => void
}

export default class DBHelper<T extends {}> {
    Target: string = "";

    constructor(target: string) {
        this.Target = target;
    }

    DataToValue = (data: any) : T | undefined => {
        if (!data)
            return undefined;
        return data
    }

    DataToList = (data: any) : T[] => {
        var List: T[] = []
        if (data.forEach)
            data.forEach((value: any) => {
                var Value = this.DataToValue(value);
                if (Value)
                    List.push(Value)
            })
        return List
    }

    GetPages = (props: IGetPagesLeft) => {
        DatabaseHelper.Custom({
            query: `SELECT CEIL(COUNT(*) / ${props.pageLength}) as 'Pages' FROM \`${this.Target}\``,
            arguments: [],
            onSuccess: (Result) => (props.onSuccess && Result[0].Pages ? props.onSuccess(parseInt(Result[0].Pages)) : props.onError),
            onError: props.onError
        })
    }

    Custom = (props: ICustom<T>) => {
        DatabaseHelper.Custom({
            query: props.query,
            arguments: props.arguments,
            onSuccess: (data) => (props.onSuccess ? props.onSuccess(this.DataToList(data)) : props.onError),
            onError: props.onError
        })
    }

    GetAll = (props: IGetAll<T>) => {
        DatabaseHelper.GetAll({
            target: this.Target,
            limit: props.limit,
            offset: props.offset?.toString(),
            orderBy: props.orderBy,
            arguments: props.arguments,
            onSuccess: (data) => { if (props.onSuccess) props.onSuccess(this.DataToList(data)) },
            onError: props.onError
        })
    }

    GetWhere = (props: IGetWith<T>) => {
        DatabaseHelper.GetAll({
            target: this.Target,
            arguments: props.arguments,
            orderBy: props.orderBy,
            onSuccess: (data) => { if (props.onSuccess) props.onSuccess(this.DataToList(data)) },
            onError: props.onError
        })
    }

    Get = (props: IGet<T>) => {
        DatabaseHelper.GetWithId({
            index: props.index,
            target: this.Target,
            onSuccess: (data) => { if (props.onSuccess) { var list = this.DataToList(data); props.onSuccess(list && list.length >= 1 ? list[0] : undefined)} },
            onError: props.onError
        })
    }

    GetWithAuth = (props: IGetWithAuth<T>) => {
        DatabaseHelper.Custom({
            query: "SELECT `" + this.Target + "`.* FROM `user`, `token`, `" + this.Target + "` WHERE `" + this.Target + "`.`userId`=`user`.`id` AND `token`=? AND `" + this.Target + "`.`id`=?",
            arguments: [ props.token, props.index.toString() ],
            onSuccess: (data) => { if (props.onSuccess) { var list = this.DataToList(data); props.onSuccess(list && list.length >= 1 ? list[0] : undefined)} },
            onError: props.onError
        })
    }

    Exists = (props: IExists<T>) => {
        DatabaseHelper.GetWithId({
            index: props.index,
            target: this.Target,
            onSuccess: (data) => { if (props.onSuccess) { var list = this.DataToList(data); props.onSuccess(list && list.length >= 1 ? true : false)} },
            onError: props.onError
        })
    }

    Update = (props: IUpdate<T>) => {
        DatabaseHelper.UpdateWithId({
            target: this.Target,
            index: props.index.toString(),
            data: {...props.data, id: undefined},
            onSuccess: props.onSuccess,
            onError: props.onError
        })
    }

    Create = (props: ICreate<T>) => {
        DatabaseHelper.Create({
            target: this.Target,
            data: props.data,
            onSuccess: (data) => { if (props.onSuccess) props.onSuccess(this.DataToList(data)) },
            onError: props.onError
        })
    }

    Delete = (props: IDelete) => {
        DatabaseHelper.DeleteWithId({
            index: props.index.toString(),
            target: this.Target,
            onSuccess: props.onSuccess,
            onError: props.onError
        })
    }

    DeleteWhere = (props: IDeleteWhere) => {
        var WhereStatement = "";
        if (props.arguments && props.arguments.length != 0) {
            WhereStatement = "WHERE "
            props.arguments.forEach(e => WhereStatement += "`" + e.column + "`" + e.comparison + "\"" + e.value + "\" " + (e.join ? e.join : ""))
            WhereStatement = WhereStatement.substring(0, WhereStatement.lastIndexOf(" ") + 1)
        }

        DatabaseHelper.Custom({
            query: "DELETE FROM `" + this.Target + "` " + WhereStatement,
            arguments: [],
            onSuccess: props.onSuccess,
            onError: props.onError
        })
    }

    CountColumn = (props: ICountColumn<T>) =>  {
        DatabaseHelper.Custom({
            query: "SELECT SUM(`" + props.column + "`) as " + props.column + " FROM `user`",
            arguments: [],
            onSuccess: (data) => { if (props.onSuccess) props.onSuccess(data[0].isAdmin) },
            onError: props.onError
        })
    }
}