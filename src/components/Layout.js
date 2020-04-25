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
    width: 100%;
    height: 100%;
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
