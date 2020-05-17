import React, { useEffect } from 'react'
import SEO from '../../components/seo'
// import styled from 'styled-components'
import Page, {PageSection} from '../../components/Page'
import superagent from 'superagent'

const BoogsLogPage = props => {
    useEffect(() => {
        superagent
            .get('https://frozen-dusk-92791.herokuapp.com/goodreads/favorites')
            .then(res => console.log(''))
    }, [])

    return (
        <Page {...props}>
            <SEO title='log/books' />
            <PageSection>
                <h1>Books</h1>
            </PageSection>
        </Page>
    )
}

export default BoogsLogPage
