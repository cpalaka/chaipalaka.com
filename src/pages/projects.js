import React from 'react'
import SEO from '../components/seo'
// import styled from 'styled-components'
import Page, { PageSection } from '../components/Page'

const ProjectsPage = props => (
    <Page {...props}>
        <SEO title='Projects' />
        <PageSection>
            <h1>Projects</h1>
        </PageSection>
    </Page>
)

export default ProjectsPage
