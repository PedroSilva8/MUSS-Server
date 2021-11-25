import Error from '@Global/Error'
import FileSystem from '@Global/fileSystem/fileSystem'
import rest from '@Global/Rest'
import DBHelper from '@Global/DBHelper'
import RegexHelper from '@Global/RegexHelper'

import express from 'express'
import { decompress } from 'lz-string'
import { AlbumDB } from '../album'

const Music = express.Router()

const Directory = "music"

export interface MusicDB {
    id?: number
    album_id: number
    name: string
    description: string
}

const MusicDBHelper = new DBHelper<MusicDB>("music");
const AlbumDBHelper = new DBHelper<AlbumDB>("album");

Music.get('/', async(req, res, next) => {
    MusicDBHelper.GetAll({
        onSuccess: (Result) => rest.SendSuccess(res, Error.SuccessError(Result, Result.length)),
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Music.post('/', async(req, res, next) => {
    const { album_id, name, description, music, cover } = req.body;

    //Check Arguments
    var invalidArguments = [];

    if (!RegexHelper.IsValidString(/^[\a-zA-ZÁ-ÿ0-9\-\_ -]{1,63}/, name))
        invalidArguments.push("name")
    if (!RegexHelper.IsInt(album_id))
        invalidArguments.push("artist")
    if (!RegexHelper.IsValidString(/^[\a-zA-ZÁ-ÿ0-9\-\_ -]{1,63}/, description))
        invalidArguments.push("description")        

    if (invalidArguments.length != 0) {
        res.status(500).send(Error.ArgumentError(invalidArguments));
        return;
    }

    //Check File
    var dCover = decompress(unescape(cover));
    var dMusic = decompress(unescape(music));

    if (!dMusic) {
        rest.SendErrorBadRequest(res, Error.DecodeError())
        return;
    }

    if (!/[A-Za-z0-9+/=]/.test(dMusic) || dMusic.split('base64,').length != 2) {
        rest.SendErrorBadRequest(res, Error.ArgumentError("Invalid music Sent"))
        return;
    }

    if (dCover && (dCover != "" && (!/[A-Za-z0-9+/=]/.test(dCover) || dCover.split('base64,').length != 2))) {
        rest.SendErrorBadRequest(res, Error.ArgumentError("Invalid Image Sent"))
        return;
    }

    MusicDBHelper.Create({
        data: { album_id: album_id, name: name, description: description },
        onSuccess: (Result) => {
            FileSystem.MakeDir({
                Dir: `${Directory}/${Result[0].id}_${name}/`,
                onSuccess: () => {
                    if (dCover)
                        FileSystem.Write({
                            fileName: `${Directory}/${Result[0].id}_${name}/${Result[0].id}.png`,
                            data: dCover.split('base64,')[1],
                            options: 'base64',
                            onSuccess: () => rest.SendSuccess(res, Error.SuccessError(Result, Result.length)),
                            onError: (Message) => rest.SendErrorInternalServer(res, Error.ArgumentError(Message))
                        });
                    if (dMusic)
                        FileSystem.Write({
                            fileName: `${Directory}/${Result[0].id}_${name}/${Result[0].id}.mp3`,
                            data: dMusic.split('base64,')[1],
                            options: 'base64',
                            onSuccess: () => rest.SendSuccess(res, Error.SuccessError(Result, Result.length)),
                            onError: (Message) => rest.SendErrorInternalServer(res, Error.ArgumentError(Message))
                        });  
                },
                onError: () => rest.SendErrorInternalServer(res, Error.FSCreateError())
            })
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Music.delete('/:id(\\d+)', async(req, res, next) => {

})

Music.put('/:id(\\d+)', async(req, res, next) => {

})

Music.get('/:id(\\d+)/image', async(req, res, next) => {
    MusicDBHelper.Get({
        index: parseInt(req.params.id),
        onSuccess: (musicResult) => {
            if (musicResult) {
                AlbumDBHelper.Get({
                    index: musicResult.album_id,
                    onSuccess: (albumResult) => {
                        FileSystem.Exists({
                            file: `${Directory}/${req.params.id}_${albumResult .name}/${req.params.id}.png`,
                            onSuccess: () => res.sendFile(`${FileSystem.baseURL}/${Directory}/${req.params.id}_${albumResult.name}/${req.params.id}.png`),
                            onError: () => res.sendFile(`${FileSystem.baseURL}/album/images/${albumResult.id}.png`),
                        })
                    }
                })
            }
            else
                rest.SendErrorNotFound(res, Error.ArgumentError())
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Music.put('/:id(\\d+)/image', async(req, res, next) => {

})

Music.get('/:id(\\d+)/music', async(req, res, next) => {

})

Music.put('/:id(\\d+)/music', async(req, res, next) => {

})

export default Music;