import DBHelper from '@Global/DBHelper';
import Error from '@Global/Error'
import rest from '@Global/Rest'

import { AlbumDB } from '@Interface/database';

import express from 'express'

const Feed = express.Router()

const AlbumDBHelper = new DBHelper<AlbumDB>("album");

Feed.get('/latest', async(req, res, next) => {
    AlbumDBHelper.GetAll({
        limit: 20,
        orderBy: {
            orderBy: 'id',
            orderDir: 'DESC',
        },
        onSuccess: (Result) => rest.SendSuccess(res, Error.SuccessError(Result, Result.length)), 
        onError: () => rest.SendErrorInternalServer(res, Error.SQLError())
    })
})

export default Feed;