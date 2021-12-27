import { MysqlError } from "mysql"

import DBHelper from "@Global/DBHelper"
import { TokenDB, UserDB } from "@Interface/database"

/*
    Defining outside of functions causes a errors propably due to the fact that it is a circular dependacy with DBHelper, 
    need to look futher into this to avoid having to define this in every funtion
*/
//const tokenDBHelper = new DBHelper<TokenDB>("token")
//const userDBHelper = new DBHelper<UserDB>("user")

export interface IIsTokenValid {
    userId: number
    token: string,
    onSuccess: (isValid: boolean) => void,
    onError: (Error: MysqlError) => void
}

export interface IGetUserFromToken {
    token: string, 
    onSuccess: (user: UserDB | undefined) => void, 
    onError: (Error: MysqlError) => void
}

export interface IIsUserAdmin {
    token: string, 
    onSuccess: (isAdmin: boolean) => void, 
    onError: () => void
}

export const isTokenValid = (props: IIsTokenValid) => {
    const tokenDBHelper = new DBHelper<TokenDB>("token")
    tokenDBHelper.DeleteWhere({
        arguments: [
            {
                column: 'userId',
                comparison: '=',
                value: props.userId.toString(),
                join: 'AND'
            },
            {
                column: 'expiration_date',
                comparison: '<',
                value: 'NOW()'
            }
        ],
        onSuccess: () => {
            tokenDBHelper.GetWhere({
                arguments: [
                    {
                        column: 'userID',
                        comparison: '=',
                        value: props.userId.toString(),
                        join: 'AND'
                    },
                    {
                        column: 'token',
                        comparison: '=',
                        value: props.token
                    }
                ],
                onSuccess: (result) =>  result.length == 0 ? false : true,
                onError: props.onError
            })
        },
        onError: props.onError
    })
}

export const GetUserFromToken = (props: IGetUserFromToken) => {
    const tokenDBHelper = new DBHelper<TokenDB>("token")
    const userDBHelper = new DBHelper<UserDB>("user")
    
    tokenDBHelper.GetWhere({
        arguments: [
            {
                column: 'token',
                comparison: '=',
                value: props.token
            }
        ],
        onSuccess: (Result) => {
            if (Result.length == 0)
                return props.onSuccess(undefined)

            userDBHelper.Get({
                index: Result[0].userId,
                onSuccess: props.onSuccess,
                onError: props.onError
            })
        },
        onError: props.onError
    })
}

export const IsUserAdmin = (props: IIsUserAdmin) => {
    GetUserFromToken({
        token: props.token,
        onSuccess: (User) => props.onSuccess(User.isAdmin == '1'),
        onError: props.onError
    })
}