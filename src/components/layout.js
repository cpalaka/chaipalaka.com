/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import styled from 'styled-components'

import Header from "./header"
import "./layout.css"

const SimpleLayout = styled.div`
    background-color: azure;
    height: 100vh;
    width: 100vw;
`

const ChildrenWrapper = styled.div`
    border: 2px solid black;
    width: 50%;
    height: 95%;
    margin: auto;
`

const Layout = ({ children }) => {
    const data = useStaticQuery(graphql`
        query SiteTitleQuery {
            site {
                siteMetadata {
                    title
                }
            }
        }
    `)

    return (
        // <>
        //     <Header siteTitle={data.site.siteMetadata.title} />
        //     <div
        //         style={{
        //             margin: `0 auto`,
        //             maxWidth: 960,
        //             padding: `0px 1.0875rem 1.45rem`,
        //             paddingTop: 0,
        //         }}
        //     >
        //         <main>{children}</main>
        //         <footer>
        //             © {new Date().getFullYear()}, Built with
        //             {` `}
        //             <a href="https://www.gatsbyjs.org">Gatsby</a>
        //         </footer>
        //     </div>
        // </>
        // put sample canvas / webgl bg here
        <SimpleLayout>
            {/* <ChildrenWrapper> */}
                {children}
            {/* </ChildrenWrapper> */}
        </SimpleLayout>
    )
}

export default Layout
