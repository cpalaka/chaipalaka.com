import React, { useCallback, useState, useEffect } from 'react'
import styled from 'styled-components'
import superagent from 'superagent'
import config from '../../config'
import Spinner from 'react-spinkit'
import TransitionLink from './TransitionLink'

const NowPlayingContainer = styled.div`
    display: inline-flex;
    flex-direction: row;
    width: 40%;

    @media (max-width: 1024px) {
        width: 80%;
    }
    box-shadow: inset 0px 60px;
    color: ${props => props.theme.colors.secondary};
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;
`

const AlbumArt = styled.img`
    width: 100px;
    height: 100px;
`

const ArtistName = styled.h4`
    color: ${props => props.theme.colors.primaryAccent};
`

const SongName = styled.p`
    color: ${props => props.theme.colors.text};
    height: 22px;
`
const TrackInfo = styled.div`
    margin-top: 10px;
    margin-left: 10px;
    overflow: auto;
`

const HorizontalFlex = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin: 0px 10px;
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

const Play = styled.p`
    cursor: pointer;
    text-align: center;
    margin-right: 5px;
    text-decoration: underline;
    color: ${({ theme }) => theme.colors.secondary};
    :hover {
        color: ${({ theme }) => theme.colors.primaryAccent};
    }
`

const NowPlayingTitle = styled.div`
    text-align: center;
    font-size: 20px;
    // transform: translateX(-20%) rotateZ(-7deg);
    // transform: perspective(17px);
    z-index: 100;
    font-variant: small-caps;
    font-weight: bolder;

`

const NowPlayingDisplay = props => {
    const [songInfo, setSongInfo] = useState({ artist: null, songName: null, albumArt: null })
    useEffect(() => {
        superagent
            .get('http://ws.audioscrobbler.com/2.0/')
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
                // console.log(res)
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
                <AlbumArt src={songInfo.albumArt} />
                <VerticalFlex>
                    <TrackInfo>
                        <ArtistName>{songInfo.artist}</ArtistName>
                        <SongName>{songInfo.songName}</SongName>
                    </TrackInfo>
                    <HorizontalFlex>
                        <Play onClick={playSong}>Play</Play>
                        <More to='/log/music'>More</More>
                    </HorizontalFlex>
                </VerticalFlex>
            </NowPlayingContainer>
        </div>
    ) : (
        <Spinner name='line-scale' />
    )
}

export default NowPlayingDisplay
