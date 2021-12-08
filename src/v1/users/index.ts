import Error from '@Global/Error'
import FileSystem from '@Global/fileSystem/fileSystem'
import rest from '@Global/Rest'
import DBHelper from '@Global/DBHelper'
import RegexHelper from '@Global/RegexHelper'

import { TokenDB, UserDB } from '@Interface/database'

import express from 'express'

import crypto, { pbkdf2 } from 'crypto'

function hashPassword (password: string, onSuccess: (hash: string) => void, onError: () => void) {
    
    pbkdf2(password, "886b904b012dd099b6e951288e1ae6a313125ae9f8df5f31265d63cf94f244db", 420, 64, 'sha256', (err, derivedKey) => {
        if (err)
            onError()
        onSuccess(derivedKey.toString('hex'));
    });
}

const User = express.Router()

const userDBHelper = new DBHelper<UserDB>("user");
const tokenDBHelper = new DBHelper<TokenDB>("token");

User.get('/', async(req, res, next) => {
    userDBHelper.GetAll({
        onSuccess: (Result) => rest.SendSuccess(res, Error.SuccessError(Result, Result.length)), 
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

User.post('/', async(req, res, next) => {
    const { name, password, isAdmin } = req.body

        //Check Arguments
        var invalidArguments = [];

        if (!RegexHelper.IsValidString(/^[\a-zA-ZÁ-ÿ0-9\-\_ -]{1,63}/, name))
            invalidArguments.push("name")
        if (!RegexHelper.IsValidString(/^[\a-zA-ZÁ-ÿ0-9\-\_ -]{1,63}/, password))
            invalidArguments.push("password")
        if (!RegexHelper.IsValidString(/^[\a-zA-ZÁ-ÿ0-9\-\_ -]{1,63}/, isAdmin))
            invalidArguments.push("description")        
    
        if (invalidArguments.length != 0) {
            res.status(500).send(Error.ArgumentError(invalidArguments))
            return;
        }

        hashPassword(password, (hash) => {
            userDBHelper.Create({
                data: {
                    name,
                    password: hash,
                    isAdmin : isAdmin ? "1" : "0"
                },
                onSuccess: (users) => rest.SendSuccess(res, Error.SuccessError(users)),
                onError: (Message) => rest.SendErrorInternalServer(res, Error.ArgumentError(Message))
            })
        },
        () => rest.SendErrorInternalServer(res, Error.ArgumentError("Failed to hash password")))
    
})

const UpdateUser = (index: number, password: string, name: string, isAdmin: string, res: any) => {
    hashPassword(password ? password : "", (hash) => {
        userDBHelper.Update({
            index: index,
            data: password && password != "" ? {
                name,
                password: hash,
                isAdmin: isAdmin == "true" ? "1" : '0'
            }: {
                name,
                isAdmin: isAdmin == "true"? "1" : '0'
            },
            onSuccess: () => rest.SendSuccess(res, Error.SuccessError()),
            onError: (Message) => rest.SendErrorInternalServer(res, Error.ArgumentError(Message))
        })
    }, 
    () => rest.SendErrorInternalServer(res, Error.ArgumentError("Failed to hash password")))
}

User.put('/:id(\\d+)', async(req, res, next) => {
    const { name, password, isAdmin } = req.body

    //Check Arguments
    var invalidArguments = [];

    if (!RegexHelper.IsValidString(/^[\a-zA-ZÁ-ÿ0-9\-\_ -]{1,63}/, name))
        invalidArguments.push("name")
    if (password && password != "" && !RegexHelper.IsValidString(/^[\a-zA-ZÁ-ÿ0-9\-\_ -]{1,63}/, password))
        invalidArguments.push("password")
    if (!RegexHelper.IsValidString(/^[\a-zA-ZÁ-ÿ0-9\-\_ -]{1,63}/, isAdmin))
        invalidArguments.push("description")        

    if (invalidArguments.length != 0) {
        res.status(500).send(Error.ArgumentError(invalidArguments))
        return;
    }

    //Check if is last admin
    userDBHelper.CountColumn({
        column: 'isAdmin',
        onSuccess: (length) => {
            if (length == 1 && isAdmin == "false") {
                userDBHelper.Get({
                    index: parseInt(req.params.id),
                    onSuccess: (user) => {
                        if (user.isAdmin) {
                            rest.SendErrorInternalServer(res, Error.ArgumentError("Cant Remove Last Admin Permissions"))
                            return
                        }

                        UpdateUser(parseInt(req.params.id), password, name, isAdmin, res)
                    },
                    onError: (Message) => rest.SendErrorInternalServer(res, Error.ArgumentError(Message))
                })
            }
            else
                UpdateUser(parseInt(req.params.id), password, name, isAdmin, res)
        },
        onError: (Message) => rest.SendErrorInternalServer(res, Error.ArgumentError(Message))
    })
})


User.delete('/:id(\\d+)', async(req, res, next) => {
    userDBHelper.CountColumn({
        column: 'isAdmin',
        onSuccess: (length) => {
            if (length == 1) {
                userDBHelper.Get({
                    index: parseInt(req.params.id),
                    onSuccess: (user) => {
                        if (user.isAdmin) {
                            rest.SendErrorInternalServer(res, Error.ArgumentError("Cant Remove Last Admin Permissions"))
                            return
                        }

                        userDBHelper.Delete({
                            index: parseInt(req.params.id),
                            onSuccess: () => rest.SendSuccess(res, Error.SuccessError()),
                            onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
                        }) 
                    },
                    onError: (Message) => rest.SendErrorInternalServer(res, Error.ArgumentError(Message))
                })
            }
            else
                userDBHelper.Delete({
                    index: parseInt(req.params.id),
                    onSuccess: () => rest.SendSuccess(res, Error.SuccessError()),
                    onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
                }) 
        },
        onError: (Message) => rest.SendErrorInternalServer(res, Error.ArgumentError(Message))
    })
})

User.get('/login', async(req, res, next) => {
    const { name, password } = req.query

    userDBHelper.GetWhere({
        arguments: [
            { 
                column: 'name',
                comparison: '=',
                value: name as string
            }
        ],
        onSuccess: (Result) => {
            if (Result.length == 0) {
                rest.SendErrorNotFound(res, Error.ArgumentError("User Dosn't Exist"))
                return;
            }

            hashPassword(password as string, (hash) => {
                if (Result[0].password == hash) {
                    var token = crypto.createHash('sha256').update(name + Math.random().toString() + Date.now().toString()).digest('base64')
                    
                    const date = new Date(Date.now())
                    date.setMonth(date.getMonth() + 1)

                    tokenDBHelper.Create({
                        data: {
                            userId: Result[0].id,
                            token: token,
                            expiration_date: date
                        },
                        onSuccess: () => rest.SendSuccess(res, Error.SuccessError(token)),
                        onError: (err) => rest.SendErrorInternalServer(res, Error.SQLError(err))
                    })
                }
                else
                    rest.SendErrorForbidden(res, Error.ArgumentError("Invalid Password"))
            },
            () => rest.SendErrorInternalServer(res, Error.EncondError("Failed to hash password")))
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

User.get('/token', async(req, res, next) => {
    const { token } = req.query

    tokenDBHelper.GetWhere({
        arguments: [
            {
                column: 'token',
                comparison: '=',
                value: token as string
            }
        ],
        onSuccess: (Result) => {
            if (Result.length == 0) {
                rest.SendErrorNotFound(res, Error.NotFoundError())
                return;
            }

            userDBHelper.Get({
                index: Result[0].userId,
                onSuccess: (user) => {
                    user.password = ""
                    rest.SendSuccess(res, Error.SuccessError(user))
                },
                onError: () => {}
            })
        },
        onError: () => { }
    })
})

export default User;