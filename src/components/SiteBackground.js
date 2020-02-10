import React, { useRef, useState } from 'react'
import { useStaticQuery, graphql, Link } from 'gatsby'
import styled, { keyframes } from 'styled-components'
import Nav from './Nav'
import Header from './header'
import { Canvas, useFrame } from 'react-three-fiber'
import { SplineCurve } from 'three'
import * as THREE from 'three'
import ThreeButton from './ThreeButton'
import MeshLine from './MeshLine'
import TransitionLink from './TransitionLink'

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

    @media (max-width: 600px) {
        left: 2.5vw;
        width: 95vw;
    }
`

const Page = styled.div`
    height: 90vh;
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
    // 40% {
    //     background-color: rgba(50, 115, 220, 0.3);
    // }
    // 60% {
    //     background-color: rgba(50, 115, 220, 0.3);
    // }
    // 80% {
    //     background-color: rgba(50, 115, 220, 0.3);
    // }
    // 100% {
    //     background-color: rgba(50, 115, 220, 0.3);
    // }
`

const Logo = styled.span`
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

const Hero = styled.div`
    height: 0.5vh;
    background-color: blue;
`

const SiteBackground = ({ children, ...props }) => {
    return (
        <Site>
            <MeshLine />
            <ContentContainer>
                <Flexbox>
                    <Hero />
                    <Logo>
                        <LogoText>
                            <TransitionLink to='/' from='right'>
                                chaipalaka
                            </TransitionLink>
                        </LogoText>
                    </Logo>
                    <Page>{children}</Page>
                    <Logo right>
                        <LogoText>
                            <TransitionLink to='/blog' from='left'>
                                blog >
                            </TransitionLink>
                        </LogoText>
                    </Logo>
                </Flexbox>
            </ContentContainer>
        </Site>
    )
}

export default SiteBackground
