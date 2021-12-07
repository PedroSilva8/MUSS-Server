import { MysqlError } from "mysql";

import DBHelper from "@Global/DBHelper";
import { TokenDB } from "@Interface/database";

const tokenDBHelper = new DBHelper<TokenDB>("token");

export interface IIsTokenValid {
    userId: number
    token: string,
    onSuccess: (isValid: boolean) => void,
    onError: (Error: MysqlError) => void
}

export const isTokenValid = (props: IIsTokenValid) => {
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