import React, { useEffect } from 'react'
// import SEO from '../components/seo'
// import styled from 'styled-components'
import Page from '../../components/Page'
import superagent from 'superagent'

const BoogsLogPage = props => {
    useEffect(() => {
        superagent
            .get('https://frozen-dusk-92791.herokuapp.com/goodreads/favorites')
            .then(res => console.log(res))
    }, [])

    return (
        <Page {...props}>
            <h1>Books</h1>
        </Page>
    )
}

export default BoogsLogPage
