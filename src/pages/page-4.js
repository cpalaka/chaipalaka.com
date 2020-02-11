import React from 'react'
import SEO from '../components/seo'
import styled from 'styled-components'
import TransitionLink from '../components/TransitionLink'
import Page from '../components/Page'


const FourthPage = props => {
    return (

            <Page>
                <h1> BLAH TEST</h1>
                <p>Welcome to page 4</p>
                <TransitionLink to='/page-3' from='top'>
                    Back
                </TransitionLink>
            </Page>

    )
}

export default FourthPage
