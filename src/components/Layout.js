import React, { useState, useEffect, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import MeshLine from './MeshLine'
import TransitionLink from './TransitionLink'
import Nav from './Nav'
import { UnfoldMore } from '@styled-icons/material/UnfoldMore'
import { useGlobalDispatch, useGlobalState } from '../state'
import InfoSection from './InfoSection'
import Helmet from 'react-helmet'
import favicon from '../../images/favicon.ico'

const ContentContainer = styled.div`
    position: absolute;
    top: 0;
    left: ${({ openSideArea }) => (openSideArea ? '-80vw' : '0px')};
    // left: 0px;
    width: ${({ isDesktop }) => (isDesktop ? '75vw' : '100%')};
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
    // width: 100%;
    height: 100%;
    // background: white;
`

const OpenSectionContainer = styled.div`
    position: fixed;
    top: 0px;
    right: 10px;
    z-index: 100;

    // background: white;
    background-color: ${({ theme }) => `${theme.colors.background}`};
    // color: ${({ theme }) => `${theme.colors.navText}`} important!;

    width: 52px;
    height: 52px;

    // border-left: ${({ theme }) => `3px solid ${theme.colors.borderBlack}`};
    // border-bottom: ${({ theme }) => `3px solid ${theme.colors.borderBlack}`};
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
        dispatch({ type: 'setInfoSection', data: !isInfoSectionOpen })
    }, [dispatch, state.isInfoSectionOpen])

    return (
        <Site>
            <Helmet>
                <link rel='icon' href={favicon} />
            </Helmet>
            <CanvasContainer>
                <MeshLine />
            </CanvasContainer>
            <ContentContainer isDesktop={isDesktop} openSideArea={infoSectionOpen}>
                {!isDesktop ? (
                    <OpenSectionContainer>
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
