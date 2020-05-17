import React from 'react'
import SEO from '../../components/seo'
// import styled from 'styled-components'
import Page, { PageSection } from '../../components/Page'

const ArticlesLogPage = props => (
    <Page {...props}>
        <SEO title='log/articles' />
        <PageSection>
            <h1>Articles</h1>
        </PageSection>
    </Page>
)

export default ArticlesLogPage
