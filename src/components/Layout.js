import React, { useState, useEffect, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import MeshLine from './MeshLine'
import TransitionLink from './TransitionLink'
import Nav from './Nav'
import { UnfoldMore } from '@styled-icons/material/UnfoldMore'
import { useGlobalDispatch, useGlobalState } from '../state'
import InfoSection from './InfoSection'

const ContentContainer = styled.div`
    position: absolute;
    top: 0;
    left: ${({ openSideArea, isDesktop }) => isDesktop ? '0px' : (openSideArea ? '-80vw' : '0px')};
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
    height: 100%;
`

const OpenSectionContainer = styled.div`
    position: fixed;
    top: ${({shouldShow}) => shouldShow ? `0px` : '-60px'};
    right: 0px;
    z-index: 100;

    background-color: ${({ theme }) => `${theme.colors.navItemBackground}`};

    width: 52px;
    height: 52px;

    box-shadow: ${({ theme }) => `0px 2px 15px -9px ${theme.colors.blur}`};
    transform: rotate(1deg);

    transition: top 1s;
`
const OpenSectionIcon = styled(UnfoldMore)`
    transform: rotate(90deg) translate(11%, -15%);
    width: 40px;
    height: 40px;
    color: ${({ theme }) => `${theme.colors.navText}`};
    :active {
        color: ${({ theme }) => `${theme.colors.secondary}`};
    }
    margin: auto;
`

const GlassExterior = styled.div`
    position: fixed;
    top: 0px;
    left: ${({ isDesktop, openSideArea }) => (isDesktop ? '23vw' : (openSideArea ? '-79vw' : '1vw'))};
    height: 100vh;
    width: ${({ isDesktop }) => (isDesktop ? '54vw' : '98vw')};
    background: ${({ theme }) => `${theme.colors.pageBackground}`};
    transition: ${({ isDesktop }) => isDesktop ? 'initial' : `left 1s`};
    box-shadow: 0px 0px 10px -5px #040f0f;
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
        dispatch({ type: 'setInfoSection', data: !isInfoSectionOpen })
    }, [dispatch, state.isInfoSectionOpen])

    const shouldShow = state.nowPlayingVideo || state.onPost

    return (
        <Site>
            <CanvasContainer>
                <MeshLine />
            </CanvasContainer>
            <GlassExterior isDesktop={isDesktop} openSideArea={infoSectionOpen} />
            <ContentContainer isDesktop={isDesktop} openSideArea={infoSectionOpen}>
                {!isDesktop ? (
                    <OpenSectionContainer shouldShow={shouldShow}>
                        <OpenSectionIcon onClick={toggleInfoSection} />
                    </OpenSectionContainer>
                ) : null}
                <InfoSection
                    openSection={infoSectionOpen}
                    isDesktop={isDesktop}
                    isWindows={isWindows}
                    state={state}
                />
                <Nav {...props} isDesktop={isDesktop} isWindows={isWindows} />
                <PageParent>{children}</PageParent>
            </ContentContainer>
        </Site>
    )
}

export default Layout
