import express from 'express'
import cors from 'cors'

import database from '@Database/Database'

import Artist from './v1/artist'
import Album from './v1/album'
import Music from './v1/music'
import Feed from './v1/feed'
import User from './v1/users'

const app = express();
const PORT = 3000;

database.CreatePool({
    connectionLimit: 10,
    database: "music_server",
    host: "localhost",
    password: "root",
    user: "root"
});

app.use(express.json({limit: '1000mb'}));
app.use(express.urlencoded({limit: '1000mb', extended: true }));
app.use(cors());
app.use('/api/1/artist', Artist);
app.use('/api/1/album', Album);
app.use('/api/1/music', Music);
app.use('/api/1/feed', Feed);
app.use('/api/1/user', User);

app.listen(PORT, () => console.log(`it's alive on http://localhost:${PORT}`));