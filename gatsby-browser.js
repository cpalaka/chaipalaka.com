/**
 * Implement Gatsby's Browser APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/browser-apis/
 */

// You can delete this file if you're not using it
import React from "react"
import './src/components/RootWrapper'
import RootWrapper from "./src/components/RootWrapper"

export const wrapRootElement = ({ element }) => 
    <RootWrapper>
        {element}
    </RootWrapper>
