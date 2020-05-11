import React, { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import MeshLine from './MeshLine'
import TransitionLink from './TransitionLink'
import Nav from './Nav'

const ContentContainer = styled.div`
    position: absolute;
    top: 0;

    width: 100%;
    height: 100%;
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
    // height: 100%;
`

const RightBorder = styled.div`
    height: 100vh;
    background: transparent;
    position: fixed;
    bottom: 40px;
    right: ${({ isDesktop, isWindows }) =>
        !isDesktop ? '2.5vw' : isWindows ? 'calc(25vw - 17px)' : '25vw'};
    border-right: ${({ theme }) => `3px dashed ${theme.colors.borderBlack}`};
    transition: right 1s;
`

const RightArea = styled.div`
    height: 100vh;
    width: ${({ isDesktop, isWindows }) => (!isDesktop ? '2.5vw' : isWindows ? 'calc(25vw - 17px)' : '25vw')};

    background: ${({ stripeRotation, color1, color2, width }) =>`repeating-linear-gradient(${stripeRotation}deg, ${color1}, ${color1} ${width}px, ${color2} ${width}px, ${color2} ${width *2}px)`};
        
    // background: rgba(255, 255, 255, 0.9);

    position: fixed;
    bottom: 0;
    right: 0;
    transition: width 1s;
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

    return (
        <Site>
            <CanvasContainer>
                <MeshLine />
            </CanvasContainer>
            <ContentContainer>
                <RightBorder isDesktop={isDesktop} isWindows={isWindows} />
                <RightArea
                    isDesktop={isDesktop}
                    isWindows={isWindows}
                    stripeRotation={45}
                    color1='rgba(255,255,255,0)'
                    color2='rgba(242, 242, 242,0.4)'
                    width='30'
                />
                <Nav {...props} isDesktop={isDesktop} isWindows={isWindows} />
                <PageParent>{children}</PageParent>
            </ContentContainer>
        </Site>
    )
}

export default Layout
