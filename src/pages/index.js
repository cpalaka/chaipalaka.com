import React, { useCallback, useState } from 'react'
import SEO from '../components/seo'
import styled from 'styled-components'
import TransitionLink from '../components/TransitionLink'
import Page from '../components/Page'

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

const HomePage = styled.div`
    padding: 10px;
`

const Picture = styled.div`
    height: auto;
    width: 50%;
    margin: auto;
`

const MainHeading = styled.p`
    text-align: center;
    font-size: 24px;
    margin-bottom: 5px;
`

const RevealText = styled.p`
    text-align: left;
    font-size: 18px;
    margin-bottom: 2px;
`

const RevealMore = styled.div`
    cursor: pointer;
    position: absolute;

    right: 15px;
    bottom: 10px;

    text-decoration: underline;
    :hover {
        color: ${({ theme }) => theme.colors.primaryAccent};
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
const IconStyles = props => ({
    color: props.theme.colors.text,
    width: '30px',
    height: '30px',
    ':hover': {
        color: props.theme.colors.primaryAccent,
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
`

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.5 } },
}

const item = {
    hidden: { opacity: 0, y: -20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'tween',
            duration: 0.5,
            ease: 'easeOut',
        },
    },
}

const text = [
    [
        <MainHeading>
            Hullo. You have reached{' '}
            <Bolded>
                <FullName>Chai</FullName> Palaka
            </Bolded>
            's personal website.
        </MainHeading>,
        'Who?',
    ],
    [<RevealText>I'm a Software Developer currently living in Tempe, Arizona</RevealText>, 'Eh?'],
    [<RevealText>I'm a software developer currently living in Tempe, Arizona</RevealText>, 'oh?'],
    [<RevealText>I'm a software developer currently living in Tempe, Arizona</RevealText>, 'HMMM?'],
]

// facebook, twitter, github, linkedin, email
const IndexPage = props => {
    const dispatch = useGlobalDispatch()
    const state = useGlobalState()

    const [step, setStep] = useState(0)

    const toggleTheme = useCallback(() => {
        const theme = state.theme === 'light' ? 'dark' : 'light'
        dispatch({ type: 'setTheme', theme })
    }, [dispatch, state.theme])
    //

    const data = useStaticQuery(graphql`
        query MyQuery {
            file(relativePath: { eq: "gradpic.jpg" }) {
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
            <HomePage>
                {/* <Picture><Img fluid={data.file.childImageSharp.fluid} alt='Me in the desert!' /></Picture> */}

                {/* <div> New stuff: </div> */}

                {/* <motion.div variants={container} initial='hidden' animate='show'>
                    {text.slice(0, step + 1).map((el, i) => (
                        <motion.div variants={item} key={i}>
                            {el[0]}
                        </motion.div>
                    ))}
                </motion.div>

                <RevealMore onClick={() => setStep(s => s + 1)}>{text[step][1]}</RevealMore> */}
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
            </HomePage>
        </Page>
    )
}

export default IndexPage
