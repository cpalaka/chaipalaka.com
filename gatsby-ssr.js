/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/ssr-apis/
 */

// You can delete this file if you're not using it
import React from 'react'
import './src/components/RootWrapper'
import RootWrapper from './src/components/RootWrapper'

export const wrapPageElement = ({ element, ...props }) => (
    <RootWrapper pageProps={props.props}>{element}</RootWrapper>
)
