import Error from '@Global/Error'
import FileSystem from '@Global/fileSystem/fileSystem'
import rest from '@Global/Rest'
import DBHelper from '@Global/DBHelper'
import RegexHelper from '@Global/RegexHelper'

import { UserDB } from '@Interface/database'

import express from 'express'

import { pbkdf2 } from 'crypto'

function hashPassword (password: string, onSuccess: (hash: string) => void, onError: () => void) {
    
    pbkdf2(password, "886b904b012dd099b6e951288e1ae6a313125ae9f8df5f31265d63cf94f244db", 420, 64, 'sha256', (err, derivedKey) => {
        if (err)
            onError()
        onSuccess(derivedKey.toString('hex'));
    });
}

const User = express.Router()

const UserDBHelper = new DBHelper<UserDB>("user");

User.get('/', async(req, res, next) => {
    UserDBHelper.GetAll({
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
            UserDBHelper.Create({
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
        UserDBHelper.Update({
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
    UserDBHelper.CountColumn({
        column: 'isAdmin',
        onSuccess: (length) => {
            if (length == 1 && isAdmin == "false") {
                UserDBHelper.Get({
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
    UserDBHelper.CountColumn({
        column: 'isAdmin',
        onSuccess: (length) => {
            if (length == 1) {
                UserDBHelper.Get({
                    index: parseInt(req.params.id),
                    onSuccess: (user) => {
                        if (user.isAdmin) {
                            rest.SendErrorInternalServer(res, Error.ArgumentError("Cant Remove Last Admin Permissions"))
                            return
                        }

                        UserDBHelper.Delete({
                            index: parseInt(req.params.id),
                            onSuccess: () => rest.SendSuccess(res, Error.SuccessError()),
                            onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
                        }) 
                    },
                    onError: (Message) => rest.SendErrorInternalServer(res, Error.ArgumentError(Message))
                })
            }
            else
                UserDBHelper.Delete({
                    index: parseInt(req.params.id),
                    onSuccess: () => rest.SendSuccess(res, Error.SuccessError()),
                    onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
                }) 
        },
        onError: (Message) => rest.SendErrorInternalServer(res, Error.ArgumentError(Message))
    })
})

export default User;