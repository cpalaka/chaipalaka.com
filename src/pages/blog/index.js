import React from 'react'
// import SEO from '../components/seo'
// import styled from 'styled-components'
import TransitionLink from '../../components/TransitionLink'
import Page from '../../components/Page'

const BlogPage = props => {
    return (

            <Page {...props}>
                <h1>Hi from the second page</h1>
                <p>Welcome to page 2</p>
                <TransitionLink to='/' from='right'>
                    Back
                </TransitionLink>
                <TransitionLink to='/page-3' from='left'>
                    FOrward
                </TransitionLink>
            </Page>

        
    )
}

export default BlogPage
