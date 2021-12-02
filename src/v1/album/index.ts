import Error from '@Global/Error'
import FileSystem from '@Global/fileSystem/fileSystem'
import rest from '@Global/Rest'
import DBHelper from '@Global/DBHelper'
import RegexHelper from '@Global/RegexHelper'

import { AlbumDB } from '@Interface/database'

import express from 'express'
import { decompress } from 'lz-string'

const Album = express.Router()

const Directory = "album"

const AlbumDBHelper = new DBHelper<AlbumDB>("album");

Album.get('/', async(req, res, next) => {
    AlbumDBHelper.GetAll({
        onSuccess: (Result) => rest.SendSuccess(res, Error.SuccessError(Result, Result.length)),
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    }) 
})

Album.get('/:id(\\d+)', async(req, res, next) => {
    AlbumDBHelper.Get({
        index: parseInt(req.params.id),
        onSuccess: (Result) => rest.SendSuccess(res, Error.SuccessError([Result])),
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    }) 
})

Album.post('/', async(req, res, next) => {
    const { name, artist_id, description, file } = req.body;

    //Check Arguments
    var invalidArguments = [];

    if (!RegexHelper.IsValidString(/^[\a-zA-ZÁ-ÿ0-9\-\_ -]{1,63}/, name))
        invalidArguments.push("name")
    if (!RegexHelper.IsInt(artist_id))
        invalidArguments.push("artist")
    if (!RegexHelper.IsValidString(/^[\a-zA-ZÁ-ÿ0-9\-\_ -]{1,63}/, description))
        invalidArguments.push("description")        

    if (invalidArguments.length != 0) {
        res.status(500).send(Error.ArgumentError(invalidArguments));
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

    AlbumDBHelper.Create({
        data: { artist_id: artist_id, name: name, description: description },
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

Album.delete('/:id(\\d+)', async(req, res, next) => {
    AlbumDBHelper.Delete({
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

Album.put('/:id(\\d+)', async(req, res, next) => {
    const { name, artist_id, description } = req.body;

    //Check Arguments
    var invalidArguments = [];

    if (!RegexHelper.IsValidString(/^[\a-zA-ZÁ-ÿ0-9\-\_ -]{1,63}/, name))
        invalidArguments.push("name")
    if (!RegexHelper.IsInt(artist_id))
        invalidArguments.push("artist")
    if (!RegexHelper.IsValidString(/^[\a-zA-ZÁ-ÿ0-9\-\_ -]{1,63}/, description))
        invalidArguments.push("description")        

    if (invalidArguments.length != 0) {
        res.status(500).send(Error.ArgumentError(invalidArguments));
        return;
    }

    AlbumDBHelper.Update({
        index: parseInt(req.params.id),
        data: { id: parseInt(req.params.id), artist_id: artist_id, name: name, description: description },
        onSuccess: () => rest.SendSuccess(res, Error.SuccessError()),
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Album.get('/:id(\\d+)/image', async(req, res, next) => {
    AlbumDBHelper.Exists({
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

Album.put('/:id(\\d+)/image', async(req, res, next) => {
    const { file } = req.body;

    if (!file || file == "") {
        rest.SendErrorBadRequest(res, Error.ArgumentError("No Image Received"))
        return;
    }

    AlbumDBHelper.Exists({
        index: parseInt(req.params.id),
        onSuccess: (exists) => {
            if (!exists) {
                rest.SendErrorNotFound(res, Error.ArgumentError())
                return;
            }
            
            var FinalImage = unescape(file);

            if (!FinalImage) {
                rest.SendErrorBadRequest(res, Error.DecodeError())
                return;
            }
            
            if (!/[A-Za-z0-9+/=]/.test(FinalImage) || FinalImage.split('base64,').length != 2) {
                rest.SendErrorBadRequest(res, Error.ArgumentError("Invalid Image Sent"))
                return;
            }

            FileSystem.Write({
                fileName: `${Directory}/images/${req.params.id}.png`,
                data: FinalImage.split('base64,')[1],
                options: 'base64',
                onSuccess: () => rest.SendSuccess(res, Error.SuccessError()),
                onError: (Message) => rest.SendErrorInternalServer(res, Error.ArgumentError(Message))
            });
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

export default Album;