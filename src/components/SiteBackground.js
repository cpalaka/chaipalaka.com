/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import styled from "styled-components"

import Header from "./header"

const SimpleLayout = styled.div`
    background-color: ${({theme}) => theme.colors.background};
    height: 100vh;
    width: 100vw;
`

const SiteBackground = ({ children }) => {
    return (
        // put sample canvas / webgl bg here
        <SimpleLayout>
            {/* <ChildrenWrapper> */}
            {children}
            {/* </ChildrenWrapper> */}
        </SimpleLayout>
    )
}

export default SiteBackground
