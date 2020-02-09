import React from 'react'
import SEO from '../components/seo'
import styled from 'styled-components'
import TransitionLink from '../components/TransitionLink'
import Page from '../components/Page'
import PageTransition from '../components/PageTransition'

const SecondPage = props => {
    return (
        <PageTransition {...props}>
            <Page>
                <h1>Hi from the second page</h1>
                <p>Welcome to page 2</p>
                <TransitionLink to='/' from='right'>
                    Back
                </TransitionLink>
                <TransitionLink to='/page-3' from='left'>
                    FOrward
                </TransitionLink>
            </Page>
        </PageTransition>
    )
}

export default SecondPage
