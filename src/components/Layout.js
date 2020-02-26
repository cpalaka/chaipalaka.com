import React, { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import MeshLine from './MeshLine'
import TransitionLink from './TransitionLink'
import Nav from './Nav'

/*TODO:
* 
* 3. open main nav below navbar via icon on mobile
 */

const ContentContainer = styled.div`
    position: absolute;
    top: 0;

    width: 60vw;
    left: 20vw;

    height: 100%;

    @media (max-width: 1024px) {
        left: 2.5vw;
        width: 95vw;
    }
`

const Site = styled.div`
    // height: 100%;
    // width: auto;
    // overflow: scroll;
`

const CanvasContainer = styled.div`
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
`

const PageParent = styled.div`
    position: absolute;
    top: 50px;
`

const Layout = ({ children, ...props }) => {
    return (
        <Site>
            <CanvasContainer>
                <MeshLine />
            </CanvasContainer>
            <ContentContainer>
                <Nav {...props} />
                <PageParent>{children}</PageParent>
            </ContentContainer>
        </Site>
    )
}

export default Layout
