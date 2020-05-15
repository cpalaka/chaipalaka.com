import React, { useState, useEffect, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { useGlobalDispatch, useGlobalState } from '../state'
import config from '../../config'
import { DiscussionEmbed } from 'disqus-react'

const RightArea = styled.div`
    height: 100vh;
    width: ${({ isDesktop, isWindows }) =>
        !isDesktop ? 'calc(83vw + 3px)' : isWindows ? 'calc(25vw - 17px)' : 'calc(25vw + 3px)'};

    background: rgba(255, 255, 255, 0.9);

    border-left: ${({ theme }) => `3px solid ${theme.colors.borderBlack}`};
    position: fixed;
    bottom: 0;
    left: ${({ isDesktop, isWindows, open }) =>
        isDesktop ? 'calc(75vw - 3px)' : open ? 'calc(17.5vw - 2px)' : 'calc(97.5vw - 2px)'};
    transition: width 1s, left 1s;

    padding: 62px 10px 10px 10px;
`

const NowPlayingVideoContainer = styled.iframe``

const NowPlayingVideo = ({ src }) => {
    const dispatch = useGlobalDispatch()
    const closeVideo = useCallback(() => {
        dispatch({ type: 'setNowPlayingVideo', videoId: null })
    }, [dispatch])

    return (
        <>
            <p onClick={closeVideo}>close</p>
            <NowPlayingVideoContainer
                src={`https://www.youtube.com/embed/${src}`}
                width='100%'
                height={120}
            ></NowPlayingVideoContainer>
        </>
    )
}

const PostOutline = ({ list }) => {
    const scrollTo = y => {
        window.scrollTo({ top: y - 62, left: 0, behavior: 'smooth' })
    }
    return (
        <>
            {list.map((el, i) => (
                <div key={i} onClick={() => scrollTo(el.scrollOffset)}>
                    {el.sectionTitle}
                </div>
            ))}
        </>
    )
}

const DisqusContainer = styled.div`
    height: 40vh;
    width: 90%;
    position: absolute;
    bottom: 50px;
    overflow: scroll;
    border: 1px solid grey;
`

const DisqusComments = ({ slug }) => {
    const disqusConfig = {
        shortname: config.disqusShortName,
        config: { identifier: slug },
    }

    return (
        <DisqusContainer>
            <DiscussionEmbed {...disqusConfig} />
        </DisqusContainer>
    )
}

const InfoSection = ({ isDesktop, isWindows, openSection, state }) => {
    console.log(state)
    return (
        <RightArea
            isDesktop={isDesktop}
            isWindows={isWindows}
            open={openSection}
            stripeRotation={45}
            color1='rgba(255,255,255,1)'
            color2='rgba(242, 242, 242,0.7)'
            width='60'
        >
            {state.nowPlayingVideo ? <NowPlayingVideo src={state.nowPlayingVideo} /> : null}
            {state.postAnchors ? <PostOutline list={state.postAnchors} /> : null}
            {state.onPost ? <DisqusComments slug={state.onPost} /> : null}
        </RightArea>
    )
}

export default InfoSection
