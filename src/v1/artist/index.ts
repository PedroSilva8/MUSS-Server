import Error from '@Global/Error'
import FileSystem from '@Global/fileSystem/fileSystem'
import rest from '@Global/Rest'
import DBHelper from '@Global/DBHelper'

import { ArtistDB } from '@Interface/database'

import express from 'express'
import { IsUserAdmin } from '../token'
import RegexHelper from '@Global/RegexHelper'

const Artist = express.Router()

const Directory = "artist"

const ArtistDBHelper = new DBHelper<ArtistDB>("artist");

Artist.get('/', async(req, res, next) => {
    var { page, search } = req.query;

    if (isNaN(parseInt(page as string)))
        page = undefined

    ArtistDBHelper.GetAll({
        limit: 20,
        offset: (page ? parseInt(page as string) * 20 : 0),
        arguments: search ? [ {
            column: "name",
            comparison: "LIKE",
            value: `%${search as string}%`
        } ] : [],
        onSuccess: (Result) => rest.SendSuccess(res, Error.SuccessError(Result, Result.length)),
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    }) 
})

Artist.get('/:id(\\d+)', async(req, res, next) => {
    ArtistDBHelper.Get({
        index: parseInt(req.params.id),
        onSuccess: (Result) => rest.SendSuccess(res, Error.SuccessError([Result])),
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    }) 
})


Artist.get('/pages', async(req, res, next) => {
    var { PageLength } = req.query
    
    if (!RegexHelper.IsInt(PageLength as string))
        PageLength = '20'

    ArtistDBHelper.GetPages({
        pageLength: parseInt(PageLength as string),
        onSuccess: (Result) => rest.SendSuccess(res, Error.SuccessError({ TotalPages: Result })),
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Artist.post('/', async(req, res, next) => {
    const { name, image, token } = req.body;

    IsUserAdmin({
        token: token,
        onSuccess: (result) => {
            if (!result)
                return rest.SendErrorForbidden(res, Error.PermissionError())
            //Check Name
            var TName: boolean = /^[\a-zA-ZÁ-ÿ0-9\-\_ -]{1,255}/.test(name);

            if (!TName)
                return res.status(500).send(Error.ArgumentError([{Title: "1"}]));
        
            //Check File
            var FinalImage = unescape(image);
        
            if (!FinalImage)
                return rest.SendErrorBadRequest(res, Error.DecodeError())
        
            if (!/[A-Za-z0-9+/=]/.test(FinalImage) || FinalImage.split('base64,').length != 2)
                return rest.SendErrorBadRequest(res, Error.ArgumentError("Invalid Image Sent"))
        
            ArtistDBHelper.Create({
                data: { name: name },
                onSuccess: (Result) => {
                    if (FinalImage) //For some reason if i don't do this check the program acusses FinalImage to be possible null when we already checked before
                        FileSystem.Write({
                            fileName: `${Directory}/images/${Result[0].id}.png`,
                            data: FinalImage.split('base64,')[1],
                            options: 'base64',
                            onSuccess: () => rest.SendSuccess(res, Error.SuccessError(Result, Result.length)),
                            onError: (Message) => rest.SendErrorInternalServer(res, Error.ArgumentError(Message))
                        });  
                },
                onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
            })            
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Artist.delete('/:id(\\d+)', async(req, res, next) => {
    const { token } = req.body;

    IsUserAdmin({
        token: token,
        onSuccess: (result) => {
            if (!result)
                return rest.SendErrorForbidden(res, Error.PermissionError())
            ArtistDBHelper.Delete({
                index: parseInt(req.params.id),
                onSuccess: () => {
                    FileSystem.Delete({
                        fileName: `${Directory}/images/${req.params.id}.png`,
                        onSuccess: () => rest.SendSuccess(res, Error.SuccessError()),
                        onError: () => rest.SendErrorInternalServer(res, Error.FSDeleteError())
                    })
                },
                onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
            })       
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Artist.put('/:id(\\d+)', async(req, res, next) => {
    const { name, token } = req.body;

    IsUserAdmin({
        token: token,
        onSuccess: (result) => {
            if (!result)
                return rest.SendErrorForbidden(res, Error.PermissionError())

            var TName: boolean = /^[\a-zA-ZÁ-ÿ0-9\-\_ -]{1,255}/.test(name);
            
            if (!TName)
                return res.status(500).send(Error.ArgumentError([{Title: "1"}]))
            
            ArtistDBHelper.Update({
                index: parseInt(req.params.id),
                data: { id: parseInt(req.params.id), name: name },
                onSuccess: () => rest.SendSuccess(res, Error.SuccessError()),
                onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
            })      
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Artist.get('/:id(\\d+)/image', async(req, res, next) => {
    ArtistDBHelper.Exists({
        index: parseInt(req.params.id),
        onSuccess: (exists) => {
            if (exists)
                res.sendFile(`${FileSystem.baseURL}/${Directory}/images/${req.params.id}.png`)
            else
                rest.SendErrorNotFound(res, Error.ArgumentError())
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Artist.put('/:id(\\d+)/image', async(req, res, next) => {
    const { file, token } = req.body;

    IsUserAdmin({
        token: token,
        onSuccess: (result) => {
            if (!result)
                return rest.SendErrorForbidden(res, Error.PermissionError())

            if (!file || file == "")
                return rest.SendErrorBadRequest(res, Error.ArgumentError("No Image Received"))
        
            ArtistDBHelper.Exists({
                index: parseInt(req.params.id),
                onSuccess: (exists) => {
                    if (!exists) {
                        rest.SendErrorNotFound(res, Error.ArgumentError())
                        return;
                    }
                    
                    FileSystem.VerifyBase64File({
                        File: file,
                        onSuccess: (cover) => {
                            FileSystem.Write({
                                fileName: `${Directory}/images/${req.params.id}.png`,
                                data: cover.split('base64,')[1],
                                options: 'base64',
                                onSuccess: () => rest.SendSuccess(res, Error.SuccessError()),
                                onError: (Message) => rest.SendErrorInternalServer(res, Error.ArgumentError(Message))
                            });
                        },
                        onError: () => rest.SendErrorInternalServer(res, Error.DecodeError())
                    })
                },
                onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
            })      
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

export default Artist;