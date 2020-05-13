import React, { useState, useEffect, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import MeshLine from './MeshLine'
import TransitionLink from './TransitionLink'
import Nav from './Nav'
import { UnfoldMore } from '@styled-icons/material/UnfoldMore'
import { useGlobalDispatch, useGlobalState } from '../state'


const ContentContainer = styled.div`
    position: absolute;
    top: 0;
    left: ${({ openSideArea }) => (openSideArea ? '-80vw' : '0px')};
    // left: 0px;
    width: 100%;
    height: 100%;
    transition: left 1s;
`

const Site = styled.div``

const CanvasContainer = styled.div`
    position: fixed;
    top: 0;
    width: 100%;
    height: 100%;
`

const PageParent = styled.main`
    position: absolute;
    top: 0px;
    width: 100%;
    // height: 100%;
`

const OpenSectionContainer = styled.div`
    position: fixed;
    top: 0px;
    right: 0px;
    z-index: 100;

    // background: white;
    background-color: ${({ theme }) => `${theme.colors.background}`};
    // color: ${({ theme }) => `${theme.colors.navText}`} important!;

    width: 52px;
    height: 52px;
    border-left: ${({ theme }) => `3px solid ${theme.colors.borderBlack}`};
    border-bottom: ${({ theme }) => `3px solid ${theme.colors.borderBlack}`};
`
const OpenSectionIcon = styled(UnfoldMore)`
    transform: rotate(90deg) translate(10%, -10%);
    width: 40px;
    height: 40px;
    color: ${({ theme }) => `${theme.colors.navText}`};
    margin: auto;
`

const Layout = ({ children, ...props }) => {
    // detect screen width
    const [width, setWidth] = useState(null)

    useEffect(() => {
        setWidth(window.innerWidth)
        window.addEventListener('resize', e => setWidth(e.target.innerWidth))
        return () => {
            window.removeEventListener('resize', e => setWidth(e.target.innerWidth))
        }
    }, [])

    const [isWindows, setIsWindows] = useState(false)

    useEffect(() => {
        setIsWindows(window.navigator.userAgent.includes('Windows'))
    }, [])

    const isDesktop = width > 1024
    const dispatch = useGlobalDispatch()
    const state = useGlobalState()

    const infoSectionOpen = state.isInfoSectionOpen

    const toggleInfoSection = useCallback(() => {
        const isInfoSectionOpen = state.isInfoSectionOpen
        dispatch(({ type: 'setInfoSection', data: !isInfoSectionOpen }))
    }, [dispatch, state.isInfoSectionOpen])

    return (
        <Site>
            <CanvasContainer>
                <MeshLine />
            </CanvasContainer>
            <ContentContainer isDesktop={isDesktop} openSideArea={infoSectionOpen}>
                {!isDesktop ? (
                    <OpenSectionContainer>
                        <OpenSectionIcon onClick={toggleInfoSection} />
                    </OpenSectionContainer>
                ) : null}
                <InfoSection openSection={infoSectionOpen} isDesktop={isDesktop} isWindows={isWindows} />
                <Nav {...props} isDesktop={isDesktop} isWindows={isWindows} />
                <PageParent>{children}</PageParent>
            </ContentContainer>
        </Site>
    )
}

const RightArea = styled.div`
    height: 100vh;
    width: ${({ isDesktop, isWindows }) =>
        !isDesktop ? 'calc(83vw + 3px)' : isWindows ? 'calc(25vw - 17px)' : 'calc(25vw + 3px)'};

    background: ${({ stripeRotation, color1, color2, width }) =>
        `repeating-linear-gradient(${stripeRotation}deg, ${color1}, ${color1} ${width}px, ${color2} ${width}px, ${color2} ${width *
            2}px)`};

    border-left: ${({ theme }) => `3px dashed ${theme.colors.borderBlack}`};
    position: fixed;
    bottom: 0;
    left: ${({ isDesktop, isWindows, open }) =>
        isDesktop ? 'calc(75vw - 3px)' : open ? 'calc(17.5vw - 3px)' : 'calc(97.5vw - 3px)'};
    transition: width 1s, left 1s;
`

const InfoSection = ({ isDesktop, isWindows, openSection }) => {
    return (
        <>
            <RightArea
                isDesktop={isDesktop}
                isWindows={isWindows}
                open={openSection}
                stripeRotation={45}
                color1='rgba(255,255,255,1)'
                color2='rgba(242, 242, 242,0.7)'
                width='30'
            />
        </>
    )
}

export default Layout
