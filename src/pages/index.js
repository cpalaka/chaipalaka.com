import React, { useCallback } from 'react'
import SEO from '../components/seo'
import styled from 'styled-components'
import TransitionLink from '../components/TransitionLink'
import Page from '../components/Page'
import PageTransition from '../components/Page'

import { useGlobalDispatch, useGlobalState } from '../state'

const Title = styled.h1`
    font-size: 46px;
    color: palevioletred;
    padding-bottom: 40px;
`

const Title2 = styled.p`
    font-size: 46px;
    color: palevioletred;
    padding-bottom: 40px;
`

const Content = styled.p`
    text-align: justify;
`

const IndexPage = props => {
    const dispatch = useGlobalDispatch()
    const state = useGlobalState()

    const toggleTheme = useCallback(() => {
        const theme = state.theme === 'light' ? 'dark' : 'light'
        dispatch({ type: 'setTheme', theme })
    }, [dispatch, state.theme])

    return (
        
            <Page {...props}>
                <h3> Hey, im chai palaka and this is my website!</h3>
                <p>This might have some more pertinent info about me - make me look relatively employable to any hungry recruiters.</p>
                <p>Probably a picture here as well.</p>
                <TransitionLink to='/page-2' from='left'>
                    Page 2
                </TransitionLink>
                <TransitionLink to='/page-4' from='bottom'>
                    Page 4
                </TransitionLink>
            </Page>
        
    )
}

export default IndexPage
