import express from 'express'
import cors from 'cors'

import database from '@Database/Database'

import Artist from './v1/artist'
import Album from './v1/album'

const app = express();
const PORT = 3000;

database.CreatePool({
    connectionLimit: 10,
    database: "music_server",
    host: "192.168.2.170",
    password: "root",
    user: "root"
});

app.use(express.json({limit: '120mb'}));
app.use(express.urlencoded({limit: '120mb', extended: true }));
app.use(cors());
app.use('/api/1/artist', Artist);
app.use('/api/1/album', Album);
 
// tslint:disable-next-line:no-console
app.listen(PORT, () => console.log(`it's alive on http://localhost:${PORT}`));