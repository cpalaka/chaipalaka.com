import React, { useState, useEffect, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { useGlobalDispatch, useGlobalState } from '../state'

const RightArea = styled.div`
    height: 100vh;
    width: ${({ isDesktop, isWindows }) =>
        !isDesktop ? 'calc(83vw + 3px)' : isWindows ? 'calc(25vw - 17px)' : 'calc(25vw + 3px)'};

    background: ${({ stripeRotation, color1, color2, width, theme }) =>
        `repeating-linear-gradient(${stripeRotation}deg, ${theme.colors.background}, ${
            theme.colors.background
        } ${width}px, ${color2} ${width}px, ${color2} ${width * 2}px)`};

    border-left: ${({ theme }) => `3px dashed ${theme.colors.borderBlack}`};
    position: fixed;
    bottom: 0;
    left: ${({ isDesktop, isWindows, open }) =>
        isDesktop ? 'calc(75vw - 3px)' : open ? 'calc(17.5vw - 3px)' : 'calc(97.5vw - 3px)'};
    transition: width 1s, left 1s;

    padding: 62px 10px 10px 10px;
    // z-index: 80;
`

const TestBox = styled.div`
    width: 100px;
    height: 100px;
    position: relative;
    top: 0px;
    left: 0px;
    background-color: red;
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
                width={300}
                height={300}
            ></NowPlayingVideoContainer>
        </>
    )
}

const InfoSection = ({ isDesktop, isWindows, openSection, state }) => {
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
        </RightArea>
    )
}

export default InfoSection
