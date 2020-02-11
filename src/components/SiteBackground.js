import React, { useRef, useState } from 'react'
import { useStaticQuery, graphql, Link } from 'gatsby'
import styled, { keyframes } from 'styled-components'
import Nav from './Nav'
import { Canvas, useFrame } from 'react-three-fiber'
import { SplineCurve } from 'three'
import * as THREE from 'three'
import MeshLine from './MeshLine'
import TransitionLink from './TransitionLink'
import Page from './Page'

const Flexbox = styled.div`
    display: flex;
    flex-direction: column;
    height: 100vh;
`

const ContentContainer = styled.div`
    position: absolute;

    width: 50vw;
    left: 25vw;
    top: 0;
    backdrop-filter: blur(7px);

    display: flex;
    flex-direction: column;
    height: 100vh;
    // align-
    justify-content: space-between;

    @media (max-width: 600px) {
        left: 2.5vw;
        width: 95vw;
    }
`

const colorAnim = keyframes`
    0% {
        background-color: rgba(50, 115, 220, 0.3);
    }
    50% {
        background-color: rgba(150, 11, 20, 0.3);
    }
    100% {
        background-color: rgba(50, 115, 220, 0.3);
    }
`

const Logo = styled.span`
    // height: 5vh;
    cursor: pointer;
    display: inline-flex;
    align-self: ${props => (props.right ? 'flex-end' : 'flex-start')};

    :hover {
        animation-name: ${colorAnim};
        animation-duration: 4s;
        animation-iteration-count: infinite;
    }
`

const LogoText = styled.h1`
    color: black;
    // letter-spacing: 0.3em;
    // font-variant: small-caps;
`

const SiteNav = styled.div`
    height: 5vh;
    // background-color: red;
`

const Site = styled.div`
    height: 100vh;
    width: 100vw;
`

const Highlight = styled.div`
    height: 0.5vh;
    background-color: blue;
`

const FlexboxH = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`

const FlexboxH2 = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    // align-items: center;
    width: 50%;
    // margin-right: 10%;
`

const SectionText = styled.div`
    color: ${props => props.match ? 'blue' : 'initial'}
`

const NavBar = props => {
    console.log(props)
    return (
        <FlexboxH2>
            <TransitionLink to='/career' from='bottom'>
                <SectionText match={props.path === '/career/'}>career</SectionText>
            </TransitionLink>
            <TransitionLink to='/projects' from='bottom'>
                <SectionText match={props.path === '/projects/'}>projects</SectionText>
            </TransitionLink>
            <TransitionLink to='/log' from='bottom'>
                <SectionText match={props.path === '/log/'}>log</SectionText>
            </TransitionLink>
        </FlexboxH2>
    )
}


const SiteBackground = ({ children, ...props }) => {
    console.log(props)
    return (
        <Site>
            <MeshLine />
            <ContentContainer>
                {/* <Flexbox> */}
                

                <Logo>
                    <TransitionLink to='/' from='right'>
                        <h1>chaipalaka</h1>
                    </TransitionLink>
                </Logo>

                {children}
                
                <FlexboxH>
                    <NavBar {...props} />

                    <Logo right>
                        <TransitionLink to='/blog' from='left'>
                            <h1>blog ></h1>
                        </TransitionLink>
                    </Logo>
                </FlexboxH>
                <Highlight />
                {/* </Flexbox> */}
            </ContentContainer>
        </Site>
    )
}

export default SiteBackground
