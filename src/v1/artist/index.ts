import Error from '@Global/Error'
import FileSystem from '@Global/fileSystem/fileSystem'
import rest from '@Global/Rest'
import DBHelper from '@Global/DBHelper'

import { ArtistDB } from '@Interface/database'

import express from 'express'
import { decompress } from 'lz-string'

const Artist = express.Router()

const Directory = "artist"

const ArtistDBHelper = new DBHelper<ArtistDB>("artist");

Artist.get('/', async(req, res, next) => {
    ArtistDBHelper.GetAll({
        onSuccess: (Result) => rest.SendSuccess(res, Error.SuccessError(Result, Result.length)),
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    }) 
})

Artist.post('/', async(req, res, next) => {
    const { name, file } = req.body;

    //Check Name
    var TName: boolean = /^[\a-zA-ZÁ-ÿ0-9\-\_ -]{1,255}/.test(name);

    if (!TName) {
        res.status(500).send(Error.ArgumentError([{Title: "1"}]));
        return;
    }

    //Check File
    var FinalImage = unescape(file);

    if (!FinalImage) {
        rest.SendErrorBadRequest(res, Error.DecodeError())
        return;
    }

    if (!/[A-Za-z0-9+/=]/.test(FinalImage) || FinalImage.split('base64,').length != 2) {
        rest.SendErrorBadRequest(res, Error.ArgumentError("Invalid Image Sent"))
        return;
    }

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
})

Artist.delete('/:id(\\d+)', async(req, res, next) => {
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
})

Artist.put('/:id(\\d+)', async(req, res, next) => {
    const { name } = req.body;

    var TName: boolean = /^[\a-zA-ZÁ-ÿ0-9\-\_ -]{1,255}/.test(name);

    if (!TName) {
        res.status(500).send(Error.ArgumentError([{Title: "1"}]));
        return;
    }

    ArtistDBHelper.Update({
        index: parseInt(req.params.id),
        data: { id: parseInt(req.params.id), name: name },
        onSuccess: () => rest.SendSuccess(res, Error.SuccessError()),
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
    const { file } = req.body;

    if (!file || file == "") {
        rest.SendErrorBadRequest(res, Error.ArgumentError("No Image Received"))
        return;
    }

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
})

export default Artist;