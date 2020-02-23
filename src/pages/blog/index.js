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
            </Page>
    )
}

export default BlogPage
