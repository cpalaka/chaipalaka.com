import React, { useCallback, useState, useEffect } from 'react'
import SEO from '../components/seo'
import styled from 'styled-components'
import TransitionLink from '../components/TransitionLink'
import Page, { PageSection } from '../components/Page'

import AnimatedButton from '../components/AnimatedButton'
import { motion } from 'framer-motion'
import { useGlobalDispatch, useGlobalState } from '../state'

import { graphql } from 'gatsby'
import { MDXProvider } from '@mdx-js/react'
import { MDXRenderer } from 'gatsby-plugin-mdx'

const shortcodes = { TransitionLink }

const BlogPostTemplate = ({ data: { mdx }, ...props }) => {
    // console.log(mdx)
    return (
        <Page {...props}>
            <PageSection top>
                <MDXProvider components={shortcodes}>
                    <MDXRenderer>{mdx.body}</MDXRenderer>
                </MDXProvider>
            </PageSection>
        </Page>
    )
}

export const pageQuery = graphql`
    query BlogPostQuery($id: String) {
        mdx(id: { eq: $id }) {
            id
            body
            frontmatter {
                title
                date(formatString: "MMMM D, Y")
                tags
            }
            excerpt
            wordCount {
                words
            }
        }
    }
`

export default BlogPostTemplate
