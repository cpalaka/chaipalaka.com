import React, { useCallback, useState, useEffect } from 'react'
import SEO from '../components/seo'
import styled from 'styled-components'
import TransitionLink from '../components/TransitionLink'
import Page from '../components/Page'

import AnimatedButton from '../components/AnimatedButton'
import { motion } from 'framer-motion'
import { useGlobalDispatch, useGlobalState } from '../state'

import { useStaticQuery, graphql } from 'gatsby'
import { MDXRenderer } from 'gatsby-plugin-mdx'

const BlogPostTemplate = props => {
    console.log(props)
    return (
        <Page {...props}>
            <MDXRenderer>{props.pageContext.body}</MDXRenderer>
        </Page>
    )
}

export default BlogPostTemplate
