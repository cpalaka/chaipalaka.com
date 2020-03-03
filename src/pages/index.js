import React, { useCallback, useState } from 'react'
import SEO from '../components/seo'
import styled from 'styled-components'
import TransitionLink from '../components/TransitionLink'
import Page from '../components/Page'
import PageTransition from '../components/Page'
import { motion } from 'framer-motion'
import { useGlobalDispatch, useGlobalState } from '../state'

const HomePage = styled.div`
    padding: 10px;
`

const MainHeading = styled.p`
    text-align: left;
    font-size: 24px;
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
    // font-weight: bold;
    font-style: italic;
`

const FullName = styled.span`
    :hover {
        ::after {
            content: 'tanya';
        }
    }
`

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.5} },
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

const IndexPage = props => {
    const dispatch = useGlobalDispatch()
    const state = useGlobalState()

    const [step, setStep] = useState(0)

    const toggleTheme = useCallback(() => {
        const theme = state.theme === 'light' ? 'dark' : 'light'
        dispatch({ type: 'setTheme', theme })
    }, [dispatch, state.theme])
    //

    return (
        <Page {...props}>
            <HomePage>
                <motion.div variants={container} initial='hidden' animate='show'>
                    {text.slice(0, step + 1).map((el, i) => (
                        <motion.div variants={item} key={i}>
                            {el[0]}
                        </motion.div>
                    ))}
                </motion.div>

                <RevealMore onClick={() => setStep(s => s+1)}>{text[step][1]}</RevealMore>
            </HomePage>
        </Page>
    )
}

export default IndexPage
