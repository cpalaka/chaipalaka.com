import { useState, useEffect } from 'react'
import './NowPlaying.css'

interface Track {
    artist: string
    title: string
    album?: string
    mbid?: string
    albumArt?: string
    isNowPlaying: boolean
    ts?: string
}

interface NowPlayingApiResponse {
    track: Track | null
    stale: boolean
}

// Module-level promise: all <NowPlaying> instances on a page share one request.
let nowPlayingPromise: Promise<NowPlayingApiResponse> | null = null
function fetchNowPlaying(): Promise<NowPlayingApiResponse> {
    if (!nowPlayingPromise) {
        nowPlayingPromise = fetch('/api/now-playing').then(
            (r) => r.json() as Promise<NowPlayingApiResponse>,
        )
    }
    return nowPlayingPromise
}

export function NowPlaying() {
    const [data, setData] = useState<NowPlayingApiResponse | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchNowPlaying()
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return <span className="now-playing now-playing--placeholder">—</span>
    }

    const track = data?.track ?? null

    if (!track) {
        return <span className="now-playing now-playing--placeholder">—</span>
    }

    return (
        <div className="now-playing">
            {track.albumArt ? (
                <img
                    className="now-playing__art"
                    src={track.albumArt}
                    alt={track.album ? `${track.album} cover` : `${track.title} cover`}
                    loading="lazy"
                />
            ) : null}
            <div className="now-playing__body">
                {track.isNowPlaying ? (
                    <span className="now-playing__live">
                        <span className="now-playing__dot" aria-hidden="true" />
                        now playing
                    </span>
                ) : null}
                <p className="now-playing__title">{track.title}</p>
                <p className="now-playing__artist">{track.artist}</p>
            </div>
        </div>
    )
}
