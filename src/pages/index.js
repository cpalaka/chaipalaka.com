import React, { useCallback, useState, useEffect } from 'react'
import SEO from '../components/seo'
import styled from 'styled-components'
import TransitionLink from '../components/TransitionLink'
import Page, { PageSection } from '../components/Page'

import AnimatedButton from '../components/AnimatedButton'
import { motion } from 'framer-motion'
import { useGlobalDispatch, useGlobalState } from '../state'

import { useStaticQuery, graphql } from 'gatsby'
import Img from 'gatsby-image'

import { Facebook as FacebookLogo } from '@styled-icons/boxicons-logos/Facebook'
import { Twitter as TwitterLogo } from '@styled-icons/boxicons-logos/Twitter'
import { Github as GithubLogo } from '@styled-icons/boxicons-logos/Github'
import { Linkedin as LinkedinLogo } from '@styled-icons/boxicons-logos/Linkedin'
import { MailSend as MailIcon } from '@styled-icons/boxicons-regular/MailSend'

import NowPlayingDisplay from '../components/NowPlayingDisplay'

const HomePage = styled.div`
    padding: 10px;
`

const MainHeading = styled.p`
    text-align: center;
    font-size: 24px;
    margin-bottom: 5px;
`

const RevealMore = styled.div`
    cursor: pointer;
    text-align: center;
    text-decoration: underline;
    padding-bottom: 15px;
    :hover {
        color: ${({ theme }) => theme.colors.secondary};
    }
`

const Bolded = styled.span`
    font-weight: bold;
    font-style: italic;
    color: ${props => props.theme.colors.secondary};
`

const FullName = styled.span`
    :hover {
        ::after {
            content: 'tanya';
        }
    }
`

const InfoBox = styled.div`
    display: flex;
    flex-direction: row;
    padding: 15px 0px;

    @media (max-width: 1024px) {
        flex-direction: column;
    }
`

const InfoText = styled.p`
    margin-right: 30px;
    padding-bottom: 15px;
    width: 100%;
    text-align: justify;
    @media (max-width: 1024px) {
        margin: 0px;
    }
`

const Picture = styled.div`
    width: 30vw;
    margin: auto;
    @media (max-width: 1024px) {
        width: 75vw;
    }
`

const WhatsNew = styled.h3`
    text-align: center;
`

const IconStyles = props => ({
    color: props.theme.colors.text,
    width: '30px',
    height: '30px',
    ':hover': {
        color: props.theme.colors.secondary,
        cursor: 'pointer',
        'box-shadow': '2px 2px',
    },
})

const FacebookIcon = styled(FacebookLogo)(props => IconStyles(props))
const TwitterIcon = styled(TwitterLogo)(props => IconStyles(props))
const GithubIcon = styled(GithubLogo)(props => IconStyles(props))
const LinkedinIcon = styled(LinkedinLogo)(props => IconStyles(props))
const EmailIcon = styled(MailIcon)(props => IconStyles(props))

const IconSet = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 8px;
`

const item = {
    hidden: { opacity: 0, y: -50, display: 'none' },
    show: {
        opacity: 1,
        y: 0,
        display: 'block',
        transition: {
            type: 'tween',
            duration: 1,
            ease: 'easeOut',
        },
    },
}

const Box = styled.div`
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(255, 255, 255, 0.9);
    width: 100px;
    height: 100px;
`

const IndexPage = props => {
    const dispatch = useGlobalDispatch()
    const state = useGlobalState()

    const [showAboutSec, setShowAboutSec] = useState(false)

    const toggleTheme = useCallback(() => {
        const theme = state.theme === 'light' ? 'dark' : 'light'
        dispatch({ type: 'setTheme', theme })
    }, [dispatch, state.theme])
    //

    const data = useStaticQuery(graphql`
        query MyQuery {
            file(relativePath: { eq: "moose.jpg" }) {
                childImageSharp {
                    # Specify the image processing specifications right in the query.
                    fluid {
                        ...GatsbyImageSharpFluid
                    }
                }
            }
        }
    `)

    return (
        <Page {...props}>
            <SEO />
            <PageSection top>
                <MainHeading>
                    Hullo. You have reached{' '}
                    <Bolded>
                        <FullName>Chai</FullName> Palaka
                    </Bolded>
                    's personal website.
                </MainHeading>

                <IconSet>
                    <a href='https://www.facebook.com/chaitanya.palaka'>
                        <FacebookIcon href='www.google.com' />
                    </a>
                    <a href='https://twitter.com/sincosan'>
                        <TwitterIcon />
                    </a>
                    <a href='https://github.com/cpalaka'>
                        <GithubIcon />
                    </a>
                    <a href='https://www.linkedin.com/in/cpalaka/'>
                        <LinkedinIcon />
                    </a>
                    <a href='mailto:cpalaka@gmail.com'>
                        <EmailIcon />
                    </a>
                </IconSet>

                <RevealMore onClick={() => setShowAboutSec(v => !v)}>
                    {showAboutSec ? 'less' : 'about me'}
                </RevealMore>

                <motion.div
                    variants={item}
                    animate={showAboutSec ? 'show' : 'hidden'}
                    initial='hidden'
                >
                    <InfoBox>
                        <InfoText>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                            commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
                            velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
                            occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                            mollit anim id est laborum.
                        </InfoText>
                        <Picture>
                            <Img fluid={data.file.childImageSharp.fluid} alt='Me in the desert!' />
                        </Picture>
                    </InfoBox>
                </motion.div>
            </PageSection>
            <PageSection >
                <NowPlayingDisplay />
            </PageSection>
        </Page>
    )
}

export default IndexPage
