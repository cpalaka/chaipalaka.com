import React, { useCallback, useState, useEffect } from 'react'
import styled from 'styled-components'
import superagent from 'superagent'
import config from '../../config'
import TransitionLink from './TransitionLink'
import Loader from './Loader'
import { Play } from '@styled-icons/boxicons-regular/Play'

const NowPlayingContainer = styled.div`
    display: inline-flex;
    flex-direction: row;
    min-width: 200px;
    width: auto;
    height: auto;

    box-shadow: inset 0px 60px;
    color: ${props => props.theme.colors.secondary};
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;
`

const ArtistName = styled.h4`
    color: ${props => props.theme.colors.primaryAccent};
`

const SongName = styled.p`
    color: ${props => props.theme.colors.text};
    font-size: 13px;
`
const TrackInfo = styled.div`
    margin: 10px 10px;
`

const HorizontalFlex = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin: 0px 10px;
    align-items: center;
`

const VerticalFlex = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
`

const More = styled(TransitionLink)`
    cursor: pointer;
    text-align: center;
    margin-right: 5px;
    text-decoration: underline;
    :hover {
        color: ${({ theme }) => theme.colors.secondary};
    }
`

const NowPlayingTitle = styled.div`
    text-align: center;
    font-size: 20px;
    z-index: 100;
    font-variant: small-caps;
    font-weight: bolder;
`

const IconStyles = props => ({
    color: props.theme.colors.text,
    width: '30px',
    height: '30px',
    ':hover': {
        color: props.theme.colors.secondary,
        cursor: 'pointer',
        'box-shadow': '2px 2px',
    },
})

const PlayIcon = styled(Play)(props => IconStyles(props))

const NowPlayingDisplay = props => {
    const [songInfo, setSongInfo] = useState({ artist: null, songName: null, albumArt: null })
    const [videoId, setVideoId] = useState(null)

    useEffect(() => {
        superagent
            .get('https://ws.audioscrobbler.com/2.0/')
            .query({ method: 'user.getrecenttracks' })
            .query({ limit: '1' })
            .query({ format: 'json' })
            .query({ user: config.lastfmUserName })
            .query({ api_key: config.lastfmAPIkey })
            .then(res => {
                const data = res.body.recenttracks.track[0]
                let artist = data.artist['#text']
                let songName = data.name
                let albumArt = data.image[3]['#text']
                setSongInfo({ artist: artist, songName: songName, albumArt: albumArt })
            })
    }, [])

    const playSong = () => {
        superagent
            .get('https://www.googleapis.com/youtube/v3/search')
            .query({ part: 'snippet' })
            .query({ maxResults: '1' })
            .query({ key: config.googleAPIkey })
            .query({ q: `${songInfo.artist} ${songInfo.songName}` })
            .then(res => {
                // console.log(res.body.items[0].id.videoId)
                // setVideoId(res.body.items[0].id.videoId)
                const URL = 'https://www.youtube.com/watch?v=' + res.body.items[0].id.videoId
                if (window) {
                    window.open(URL, '_blank')
                }
            })
    }

    return songInfo.artist ? (
        <div>
            <NowPlayingTitle>listening to:</NowPlayingTitle>
            <NowPlayingContainer>
                <img
                    src={songInfo.albumArt}
                    alt={`Album art for ${songInfo.artist} - ${songInfo.songName}`}
                    width='100px'
                    height='100px'
                />
                <VerticalFlex>
                    <TrackInfo>
                        <ArtistName>{songInfo.artist}</ArtistName>
                        <SongName>{songInfo.songName}</SongName>
                    </TrackInfo>
                    <HorizontalFlex>
                        <PlayIcon onClick={playSong}>Play</PlayIcon>
                        <More to='/log/music'>More</More>
                    </HorizontalFlex>
                </VerticalFlex>
            </NowPlayingContainer>
            {/* {videoId ? (
                <iframe
                    width='420'
                    height='315'
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                ></iframe>
            ) : null} */}
        </div>
    ) : (
        <Loader />
    )
}

export default NowPlayingDisplay
