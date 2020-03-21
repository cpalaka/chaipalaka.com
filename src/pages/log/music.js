import React, { useState } from 'react'
import styled from 'styled-components'
import Page from '../../components/Page'
import superagent from 'superagent'
import { ChevronDown } from '@styled-icons/boxicons-solid/ChevronDown'
import { Lastfm } from '@styled-icons/entypo-social/Lastfm'
import Loader from '../../components/Loader'
import config from '../../../config'

const MusicLogPage = props => {
    const [weeklySongs, setWeeklySongs] = useState({ isLoading: false })
    const [monthlyAlbums, setMonthlyAlbums] = useState({ isLoading: false })
    const [monthlyArtists, setMonthlyArtists] = useState({ isLoading: false })
    const [allTimeArtists, setAllTimeArtists] = useState({ isLoading: false })

    const commonRequest = superagent
        .get('https://ws.audioscrobbler.com/2.0/')
        .query({ limit: '10' })
        .query({ format: 'json' })
        .query({ user: config.lastfmUserName })
        .query({ api_key: config.lastfmAPIkey })

    const fetchWeeklySongs = () => {
        setWeeklySongs({ isLoading: true })
        commonRequest
            .query({ method: 'user.gettoptracks' })
            .query({ period: '7day' })
            .then(res => {
                const data = res.body.toptracks.track
                const tracks = data.map(el => ({
                    artist: el.artist.name,
                    song: el.name,
                    albumArt: el.image[2]['#text'],
                    playCount: el.playcount,
                    type: 'track',
                }))
                setWeeklySongs(p => ({ data: tracks, isLoading: false }))
            })
    }

    const fetchMonthlyAlbums = () => {
        setMonthlyAlbums({ isLoading: true })
        commonRequest
            .query({ method: 'user.gettopalbums' })
            .query({ period: '1month' })
            .then(res => {
                const data = res.body.topalbums.album
                const albums = data.map(el => ({
                    artist: el.artist.name,
                    album: el.name,
                    albumArt: el.image[2]['#text'],
                    playCount: el.playcount,
                    type: 'album',
                }))
                setMonthlyAlbums(p => ({ data: albums, isLoading: false }))
            })
    }

    const fetchMonthlyArtists = () => {
        setMonthlyArtists({ isLoading: true })
        commonRequest
            .query({ method: 'user.gettopartists' })
            .query({ period: '1month' })
            .then(res => {
                const data = res.body.topartists.artist
                const artists = data.map(el => ({
                    artist: el.name,
                    albumArt: el.image[3]['#text'],
                    playCount: el.playcount,
                    type: 'artist',
                }))
                setMonthlyArtists(p => ({ data: artists, isLoading: false }))
            })
    }

    const fetchAllTimeArtists = () => {
        setAllTimeArtists({ isLoading: true })
        commonRequest
            .query({ method: 'user.gettopartists' })
            .query({ period: 'overall' })
            .then(res => {
                const data = res.body.topartists.artist
                const artists = data.map(el => ({
                    artist: el.name,
                    albumArt: el.image[3]['#text'],
                    playCount: el.playcount,
                    type: 'artist',
                }))
                setAllTimeArtists(p => ({ data: artists, isLoading: false }))
            })
    }

    return (
        <Page {...props}>
            <h3>/log/music</h3>
            <MusicSection
                sectionTitle='Songs Stuck In My Head'
                fetch={fetchWeeklySongs}
                data={weeklySongs}
            />
            <MusicSection
                sectionTitle='Albums of the Month'
                fetch={fetchMonthlyAlbums}
                data={monthlyAlbums}
            />
            <MusicSection
                sectionTitle='Artists you might want to check out'
                fetch={fetchMonthlyArtists}
                data={monthlyArtists}
            />
            <MusicSection
                sectionTitle='Favorite of All Time'
                fetch={fetchAllTimeArtists}
                data={allTimeArtists}
            />
            <p>Powered by Last.fm</p>
            <LastfmIcon />
        </Page>
    )
}

const SectionHead = styled.div`
    height: 50px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    :hover {
        color: ${props => props.theme.colors.secondary};
        cursor: pointer;
        box-shadow: 2px 2px;
    }
`

const SectionContent = styled.div`
    height: ${({ show }) => (show ? '350px' : '0px')};
    transition: height 1s;
`

const IconStyles = props => ({
    color: props.theme.colors.text,
    width: '30px',
    height: '30px',
})

const LastfmIcon = styled(Lastfm)(props => IconStyles(props))
const DownArrowIcon = styled(ChevronDown)(props => IconStyles(props))

const MusicSection = ({ sectionTitle, fetch, data }) => {
    const [showContent, setShowContent] = useState(false)
    const isLoading = data.isLoading
    const content = data.data
    const openSection = () => {
        setShowContent(v => !v)
        if (!content) {
            fetch()
        }
    }
    console.log(isLoading)
    return (
        <>
            <SectionHead onClick={openSection}>
                <p>{sectionTitle}</p>
                <DownArrowIcon />
            </SectionHead>
            <SectionContent show={showContent}>
                {showContent ? (
                    isLoading ? (
                        <Loader />
                    ) : (
                        content.map((el, i) => <SectionRow key={el + i} {...el} />)
                    )
                ) : null}
            </SectionContent>
        </>
    )
}

const HorizontalFlex = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`
const SectionRow = ({ type, albumArt, artist, playCount, ...props }) => {
    return (
        <HorizontalFlex>
            <img src={albumArt} width='30px' height='30px' />
            <p>{artist}</p>
            {type === 'track' ? <p>{props.song}</p> : null}
            {type === 'album' ? <p>{props.album}</p> : null}
            <p>{playCount}</p>
        </HorizontalFlex>
    )
}


export default MusicLogPage
