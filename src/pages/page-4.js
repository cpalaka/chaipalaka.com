import React from "react"
import SEO from "../components/seo"
import styled from "styled-components"
import TransitionLink from "../components/TransitionLink"
import Page from "../components/Page"
import PageTransition from "../components/PageTransition"

const FourthPage = props => {
    return (
        <PageTransition {...props}>
            <Page>
                <h1> BLAH TEST</h1>
                <p>Welcome to page 4</p>
                <TransitionLink to="/page-3" from="top">
                    Back
                </TransitionLink>
            </Page>
        </PageTransition>
    )
}

export default FourthPage
