import Error from '@Global/Error'
import FileSystem from '@Global/fileSystem/fileSystem'
import rest from '@Global/Rest'
import DBHelper from '@Global/DBHelper'
import RegexHelper from '@Global/RegexHelper'

import { AlbumDB, MusicDB } from '@Interface/database'

import express from 'express'
import getAudioDurationInSeconds from 'get-audio-duration'
import { IsUserAdmin } from '../token'

const Music = express.Router()

const Directory = "music"

const MusicDBHelper = new DBHelper<MusicDB>("music");
const AlbumDBHelper = new DBHelper<AlbumDB>("album");

const updateMusicLength = (music: MusicDB, file: string) => {
    getAudioDurationInSeconds(`${FileSystem.baseURL}/${file}`).then((duration) => {
        MusicDBHelper.Update({
            index: music.id,
            data: {
                ...music,
                length: new Date(duration * 1000).toISOString().substr(11, 8)
            }
        })
    })
}

Music.get('/', async(req, res, next) => {
    const album_id = req.query.album_id as string;
    var { search } = req.query;

    if (isNaN(parseInt(album_id)) || parseInt(album_id) < 0) {
        MusicDBHelper.GetAll({ 
            arguments: search ? [ {
                column: "name",
                comparison: "LIKE",
                value: `%${search as string}%`
            } ] : [],
            onSuccess: (Result) => rest.SendSuccess(res, Error.SuccessError(Result, Result.length)), 
            onError: () => rest.SendErrorInternalServer(res, Error.SQLError()) })
        return
    }

    MusicDBHelper.GetWhere({
        arguments: [{
            column: 'album_id',
            value: album_id,
            comparison: '=',
        },
            ...(search ? [{
                column: "name",
                comparison: "LIKE",
                value: `%${search as string}%`
            }] : [])
        ],
        onSuccess: (Result) => rest.SendSuccess(res, Error.SuccessError(Result, Result.length)), 
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Music.get('/:id(\\d+)', async(req, res, next) => {
    MusicDBHelper.Get({
        index: parseInt(req.params.id),
        onSuccess: (Result) => rest.SendSuccess(res, Error.SuccessError([Result])),
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    }) 
})

Music.post('/', async(req, res, next) => {
    const { album_id, name, description, music, cover, token } = req.body;

    IsUserAdmin({
        token: token,
        onSuccess: (result) => {
            if (!result)
                return rest.SendErrorForbidden(res, Error.PermissionError())
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
            var dCover = unescape(cover);
            var dMusic = unescape(music);
        
            if (!dMusic) {
                rest.SendErrorBadRequest(res, Error.DecodeError())
                return;
            }
        
            if (!/[A-Za-z0-9+/=]/.test(dMusic) || dMusic.split('base64,').length != 2) {
                rest.SendErrorBadRequest(res, Error.ArgumentError("Invalid music Sent"))
                return;
            }
        
            if (cover && (dCover != "" && (!/[A-Za-z0-9+/=]/.test(dCover) || dCover.split('base64,').length != 2))) {
                rest.SendErrorBadRequest(res, Error.ArgumentError("Invalid Image Sent"))
                return;
            }
        
            MusicDBHelper.Create({
                data: { album_id: album_id, name: name, description: description, length: "00:00:00" },
                onSuccess: (Result) => {
                    FileSystem.MakeDir({
                        Dir: `${Directory}/${Result[0].id}/`,
                        onSuccess: () => {
                            var coverError = false
                            if (cover)
                                FileSystem.Write({
                                    fileName: `${Directory}/${Result[0].id}/${Result[0].id}.png`,
                                    data: dCover.split('base64,')[1],
                                    options: 'base64',
                                    onError: (Message) => { rest.SendErrorInternalServer(res, Error.ArgumentError(Message)); coverError = true }
                                });
                            if (dMusic)
                                FileSystem.Write({
                                    fileName: `${Directory}/${Result[0].id}/${Result[0].id}.mp3`,
                                    data: dMusic.split('base64,')[1],
                                    options: 'base64',
                                    onSuccess: () => { 
                                        if (coverError)
                                            return;
                                        updateMusicLength(Result[0], `${Directory}/${Result[0].id}/${Result[0].id}.mp3`)
                                        rest.SendSuccess(res, Error.SuccessError(Result, Result.length)) 
                                    },
                                    onError: (Message) => (!coverError) ? rest.SendErrorInternalServer(res, Error.ArgumentError(Message)) : () => { }
                                });
                        },
                        onError: () => rest.SendErrorInternalServer(res, Error.FSCreateError())
                    })
                },
                onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
            })      
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Music.put('/:id(\\d+)', async(req, res, next) => {
    const { album_id, name, description, token } = req.body;

    IsUserAdmin({
        token: token,
        onSuccess: (result) => {
            if (!result)
                return rest.SendErrorForbidden(res, Error.PermissionError())
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
        
            MusicDBHelper.Update({
                index: parseInt(req.params.id),
                data: {
                    album_id: album_id,
                    description: description,
                    name: name
                },
                onSuccess: () => rest.SendSuccess(res, Error.SuccessError()),
                onError: (Message) => rest.SendErrorInternalServer(res, Error.ArgumentError(Message))
            })      
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Music.delete('/:id(\\d+)', async(req, res, next) => {
    const { token } = req.body

    IsUserAdmin({
        token: token,
        onSuccess: (result) => {
            if (!result)
                return rest.SendErrorForbidden(res, Error.PermissionError())
            MusicDBHelper.Exists({
                index: parseInt(req.params.id),
                onSuccess: (Exists) => {
                    if (!Exists) {
                        rest.SendErrorNotFound(res, Error.ArgumentError())
                        return
                    }
        
                    FileSystem.Delete({
                        fileName: `${Directory}/${req.params.id}`,
                        onSuccess: () => {
                            MusicDBHelper.Delete({
                                index: parseInt(req.params.id),
                                onSuccess: () => rest.SendSuccess(res, Error.SuccessError()),
                                onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
                            })
                        },
                        onError: () => rest.SendErrorInternalServer(res, Error.FSDeleteError())
                    })
                },
                onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
            })      
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Music.get('/:id(\\d+)/image', async(req, res, next) => {
    MusicDBHelper.Get({
        index: parseInt(req.params.id),
        onSuccess: (Music) => {
            if (Music) {
                AlbumDBHelper.Get({
                    index: Music.album_id,
                    onSuccess: (albumResult) => {
                        FileSystem.Exists({
                            file: `${Directory}/${req.params.id}/${req.params.id}.png`,
                            onSuccess: () => res.sendFile(`${FileSystem.baseURL}/${Directory}/${req.params.id}/${req.params.id}.png`),
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
    const { file, token } = req.body;

    IsUserAdmin({
        token: token,
        onSuccess: (result) => {
            if (!result)
                return rest.SendErrorForbidden(res, Error.PermissionError())
            if (!file || file == "") {
                rest.SendErrorBadRequest(res, Error.ArgumentError("No Image Received"))
                return;
            }
        
            MusicDBHelper.Exists({
                index: parseInt(req.params.id),
                onSuccess: (Exists) => {
                    if (!Exists) {
                        rest.SendErrorNotFound(res, Error.ArgumentError())
                        return;
                    }

                    FileSystem.VerifyBase64File({
                        File: file,
                        onSuccess: (cover) => {
                            FileSystem.Write({
                                fileName: `${Directory}/${req.params.id}/${req.params.id}.png`,
                                data: cover.split('base64,')[1],
                                options: 'base64',
                                onSuccess: () => rest.SendSuccess(res, Error.SuccessError()),
                                onError: (Message) => rest.SendErrorInternalServer(res, Error.ArgumentError(Message))
                            })   
                        },
                        onError: () => rest.SendErrorInternalServer(res, Error.FSSaveError())
                    })
                },
                onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
            })            
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Music.get('/:id(\\d+)/music', async(req, res, next) => {
    MusicDBHelper.Exists({
        index: parseInt(req.params.id),
        onSuccess: (Exists) => {
            if (!Exists) {
                rest.SendErrorNotFound(res, Error.ArgumentError())
                return
            }
            res.sendFile(`${FileSystem.baseURL}/${Directory}/${req.params.id}/${req.params.id}.mp3`)
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

Music.put('/:id(\\d+)/music', async(req, res, next) => {
    const { file, token } = req.body;

    IsUserAdmin({
        token: token,
        onSuccess: (result) => {
            if (!result)
                return rest.SendErrorForbidden(res, Error.PermissionError())
            if (!file || file == "") {
                rest.SendErrorBadRequest(res, Error.ArgumentError("No Image Received"))
                return;
            }
        
            MusicDBHelper.Get({
                index: parseInt(req.params.id),
                onSuccess: (Music) => {
                    if (!Music) {
                        rest.SendErrorNotFound(res, Error.ArgumentError())
                        return;
                    }
                    
                    FileSystem.VerifyBase64File({
                        File: file,
                        onSuccess: (musicFile) => {
                            FileSystem.Write({
                                fileName: `${Directory}/${req.params.id}/${req.params.id}.mp3`,
                                data: musicFile.split('base64,')[1],
                                options: 'base64',
                                onSuccess: () => {
                                    updateMusicLength(Music, `${Directory}/${req.params.id}/${req.params.id}.mp3`)
                                    rest.SendSuccess(res, Error.SuccessError())
                                },
                                onError: (Message) => rest.SendErrorInternalServer(res, Error.ArgumentError(Message))
                            })   
                        },
                        onError: () => rest.SendErrorInternalServer(res, Error.FSSaveError())
                    })
                },
                onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
            })            
        },
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

export default Music;