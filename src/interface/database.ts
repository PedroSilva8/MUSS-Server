export interface AlbumDB {
    id?: number
    artist_id: number
    name: string
    description: string
}

export interface ArtistDB {
    id?: number
    name: string
}

export interface MusicDB {
    id?: number
    album_id: number
    name: string
    description: string
    length?: string
}

export interface UserDB {
    id?: number
    name: string
    password?: string
    isAdmin: "1" | "0"
}