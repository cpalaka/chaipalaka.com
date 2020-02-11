import React from 'react'
// import SEO from '../components/seo'
// import styled from 'styled-components'
import TransitionLink from '../components/TransitionLink'
import Page from '../components/Page'
import PageTransition from '../components/PageTransition'

const ProjectsPage = props => {
    return (
        <PageTransition {...props}>
            <Page>
                <h1>Projects</h1>
            </Page>
        </PageTransition>
    )
}

export default ProjectsPage
