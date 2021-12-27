import $ from 'jquery'

import Database from '@Database/Database'
import { MysqlError } from 'mysql';

export interface IDBArgument {
    column: string
    value: string
    comparison: string
    join?: 'OR' | 'AND'
}

export interface IDBOrderBy {
    orderBy: string
    orderDir?: 'ASC' | 'DESC'
}

export interface IDBHelperGetAll {
    target: string
    arguments?: IDBArgument[]
    orderBy?: IDBOrderBy
    limit?: number
    offset?: string
    onSuccess?: (Message: any) => void
    onError?: (Message: MysqlError) => void
}

export interface IDBHelperGetWithId {
    index: string | number
    target: string
    onSuccess?: (Message: any) => void
    onError?: (Message: MysqlError) => void
}

export interface IDBHelperGetWith {
    value: string
    column: string
    target: string
    onSuccess?: (Message: any) => void
    onError?: (Message: MysqlError) => void
}

export interface IDBHelperCreate {
    target: string
    data: { [index: string]: string; }
    onSuccess?: (Message: any) => void
    onError?: (Message: MysqlError) => void
}

export interface IDBHelperUpdate {
    index: string
    target: string
    data: { [index: string]: string; }
    onSuccess?: (Message: any) => void
    onError?: (Message: MysqlError) => void
}

export interface IDBHelperUpdateWithAuth {
    index: string
    userId: number
    target: string
    data: { [index: string]: string; }
    onSuccess?: (Message: any) => void
    onError?: (Message: MysqlError) => void
}

export interface IDBHelperDeleteWithId {
    index: string
    target: string
    onSuccess?: (Message: any) => void
    onError?: (Message: MysqlError) => void
}

export interface IDBHelperCustom {
    query: string
    arguments: string[]
    onSuccess?: (Message: any) => void
    onError?: (Message: MysqlError) => void
}

export default class DatabaseHelper {
    static Custom = (props: IDBHelperCustom) => {
        Database.SimpleQuery({ 
            query: props.query,
            arguments: props.arguments,
            onError: props.onError,
            onSuccess: props.onSuccess
        });
    }

    static GetAll = (props: IDBHelperGetAll) => {

        var WhereStatement = "";

        if (props.arguments && props.arguments.length != 0) {
            WhereStatement = "WHERE "
            props.arguments.forEach(e => WhereStatement += "`" + e.column + "`" + e.comparison + "\"" + e.value + "\" " + (e.join ? e.join : ""))
            WhereStatement = WhereStatement.substring(0, WhereStatement.lastIndexOf(" ") + 1)
        }
        
        var OrderBy = ""

        if (props.orderBy) {
            OrderBy = "ORDER BY `" + props.orderBy.orderBy + "`"
            if (props.orderBy.orderDir)
                OrderBy += " " + props.orderBy.orderDir
        }

        var limit = ""

        if (props.limit) {
            limit = "LIMIT "
            if (props.offset)
                limit += props.offset + ","
            limit += props.limit
        }
        
        Database.SimpleQuery({
            query: `SELECT * FROM \`${props.target}\` ${WhereStatement} ${OrderBy} ${limit}`,
            onSuccess: props.onSuccess,
            onError: props.onError
        });
    }

    static GetWithId = (props: IDBHelperGetWithId) => {
        Database.SimpleQuery({ 
            query: `SELECT * FROM \`${props.target}\` WHERE \`id\`=?`,
            arguments: [ props.index.toString() ],
            onSuccess: props.onSuccess,
            onError: props.onError
        });
    }

    static GetWith = (props: IDBHelperGetWith) => {
        Database.SimpleQuery({ 
            query: `SELECT * FROM \`${props.target}\` WHERE \`${props.column}\`=?`,
            arguments: [ props.value ],
            onSuccess: props.onSuccess,
            onError: props.onError
        });
    }

    static Create = (props: IDBHelperCreate) => {
        var setQuery = "";
        var argumentPlacers = "";
        var Arguments = [];

        for (let key in props.data) {
            setQuery += `, \`${key}\``;
            argumentPlacers += ",?";
            Arguments.push(props.data[key]);
        }

        argumentPlacers = argumentPlacers.slice(1);
        setQuery = setQuery.slice(1);

        Database.SimpleQuery({ 
            query: `INSERT INTO \`${props.target}\` (${setQuery}) VALUES (${argumentPlacers}) RETURNING *`,
            arguments: Arguments,
            onError: props.onError,
            onSuccess: props.onSuccess
        });
    }

    static UpdateWithId = (props: IDBHelperUpdate) => {
        var setQuery = "";
        var Arguments = [];        
        for (let key in props.data) {
            if (props.data[key]) {
                setQuery += `, \`${key}\`=?`
                Arguments.push(props.data[key]);
            }
        }

        Arguments.push(props.index);
        setQuery = setQuery.slice(1);

        Database.SimpleQuery({ 
            query: `UPDATE ${props.target} SET ${setQuery} WHERE id=?`,
            arguments: Arguments,
            onSuccess: props.onSuccess,
            onError: props.onError
        });
    }

    static UpdateWithIdAndAuth = (props: IDBHelperUpdateWithAuth) => {
        var setQuery = "";
        var Arguments = [];        
        for (let key in props.data) {
            if (props.data[key]) {
                setQuery += `, \`${key}\`=?`
                Arguments.push(props.data[key]);
            }
        }

        Arguments.push(props.index, props.userId.toString());
        setQuery = setQuery.slice(1);

        Database.SimpleQuery({ 
            query: `UPDATE ${props.target} SET ${setQuery} WHERE id=? AND userId=?`,
            arguments: Arguments,
            onSuccess: props.onSuccess,
            onError: props.onError
        });
    }

    static DeleteWithId = (props: IDBHelperDeleteWithId) => {
        Database.SimpleQuery({ 
            query: `DELETE FROM \`${props.target}\` WHERE \`id\`=?`,
            arguments: [ props.index ],
            onSuccess: props.onSuccess,
            onError: props.onError
        });
    }

    static CreateOrUpdate = () => {
        Database.SimpleQuery({
            query: ``,
            arguments: []
        })
    }
}