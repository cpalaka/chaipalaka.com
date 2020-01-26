import React from "react"
import SEO from "../components/seo"
import styled from "styled-components"
import TransitionLink from "../components/TransitionLink"
import Page from "../components/Page"
import PageTransition from "../components/PageTransition"

const ThirdPage = props => {
    return (
        <PageTransition {...props}>
            <Page>
                <h1>BLAH TEST BLAH TEST</h1>
                <p>Welcome to page 3</p>
                <TransitionLink to="/page-2" from="right">
                    Back
                </TransitionLink>
                <TransitionLink to="/page-4" from="bottom">
                    Up
                </TransitionLink>
            </Page>
        </PageTransition>
    )
}

export default ThirdPage
