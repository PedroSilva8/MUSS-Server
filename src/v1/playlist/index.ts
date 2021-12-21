import Error from '@Global/Error'
import FileSystem from '@Global/fileSystem/fileSystem'
import rest from '@Global/Rest'
import DBHelper from '@Global/DBHelper'
import RegexHelper from '@Global/RegexHelper'

import { MusicDB, PlaylistDB, UserDB } from '@Interface/database'

import express from 'express'
import getAudioDurationInSeconds from 'get-audio-duration'
import { GetUserFromToken } from '../token'
import DatabaseHelper from '@Global/database/DatabaseHelper'

const Playlist = express.Router()

const Directory = "playlist"

const MusicDBHelper = new DBHelper<MusicDB>("music");
const UserDBHelper = new DBHelper<UserDB>("album");
const PlaylistDBHelper = new DBHelper<PlaylistDB>("playlist");

Playlist.get('/', async(req, res, next) => {
    var { token } = req.query

    GetUserFromToken({
        token: token as string,
        onSuccess: (user) => {
            if (!user.id || user.id == -1)
                return rest.SendErrorForbidden(res, Error.PermissionError("Token Invalid"))

            PlaylistDBHelper.GetWhere({
                arguments: [{
                    column: 'userId',
                    comparison: '=',
                    value: user.id.toString()
                }],
                onSuccess: (Result) => rest.SendSuccess(res, Error.SuccessError(Result)),
                onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
            })
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Playlist.post('/', async(req, res, next) => {
    var { token } = req.body

    GetUserFromToken({
        token: token as string,
        onSuccess: (user) => {
            if (!user.id || user.id == -1)
                return rest.SendErrorForbidden(res, Error.PermissionError("Token Invalid"))
                
            PlaylistDBHelper.Create({
                data: {
                    userId: user.id,
                    name: "New Playlist",
                    description: ""
                },
                onSuccess: (Result) => rest.SendSuccess(res, Error.SuccessError(Result)),
                onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
            })
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Playlist.get('/:id(\\d+)', async(req, res, next) => {
    var { token } = req.query

    PlaylistDBHelper.GetWithAuth({
        index: parseInt(req.params.id),
        token: token as string,
        onSuccess: (Data) => rest.SendSuccess(res, Error.SuccessError([Data])),
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})


Playlist.get('/:id(\\d+)/image', async(req, res, next) => {
    MusicDBHelper.Custom({
        query: 'SELECT `music`.`album_id` FROM `playlist`, `playlist_music`, `music` WHERE `playlist`.`id`=? AND `playlist`.`id`=`playlist_music`.`playlistId` AND `playlist_music`.`musicId`=`music`.`id`',
        arguments: [ req.params.id ],
        onSuccess: (Result) => {
            if (Result.length == 0)
                res.sendFile(`${FileSystem.baseURL}/${Directory}/default.png`)
            else
                res.sendFile(`${FileSystem.baseURL}/album/images/${Result[0].album_id}.png`)
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

export default Playlist;