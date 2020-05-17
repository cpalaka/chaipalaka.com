import React, { useCallback, useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import TransitionLink from '../components/TransitionLink'
import Page, { PageSection } from '../components/Page'

import AnimatedButton from '../components/AnimatedButton'
import { motion } from 'framer-motion'
import { useGlobalDispatch, useGlobalState } from '../state'

import { graphql } from 'gatsby'
import { MDXProvider } from '@mdx-js/react'
import { MDXRenderer } from 'gatsby-plugin-mdx'

import SEO from './seo'

const PostSection = styled.p`
    font-size: 15px;
    font-weight: bold;
`

const Anchor = props => <PostSection className='anchor'>{props.children}</PostSection>
const shortcodes = { TransitionLink, Anchor }

const BlogPostTemplate = ({ data: { mdx }, ...props }) => {
    const pathSlug = props.path
    const dispatch = useGlobalDispatch()

    const setCurrentPostAnchors = useCallback(
        anchors => {
            dispatch({ type: 'setPostAnchors', anchors: anchors })
        },
        [dispatch]
    )

    const setCurrentPost = useCallback(
        (slug) => {
            dispatch({ type: 'setOnPost', post: slug })
        },
        [dispatch]
    )

    const removeCurrentPostAnchors = useCallback(
        () => {
            dispatch({ type: 'removePostAnchors' })
        },
        [dispatch]
    )


    useEffect(() => {
        const elements = document.getElementsByClassName('anchor')
        const postAnchors = Array.from(elements).map(el => ({
            sectionTitle: el.innerText,
            scrollOffset: el.offsetTop,
        }))
        setCurrentPostAnchors(postAnchors)
        setCurrentPost(pathSlug)
        return () => { 
            removeCurrentPostAnchors()
            setCurrentPost(null)
        }
    }, [])

    return (
        <Page {...props}>
            <SEO title={mdx.frontmatter.title} image={mdx.frontmatter.infopic} />
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
                infopic
            }
            excerpt
            wordCount {
                words
            }
        }
    }
`

export default BlogPostTemplate
