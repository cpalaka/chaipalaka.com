import React, { useReducer, useState, useContext } from 'react'
import styled from 'styled-components'
import Page, { PageSection } from '../../components/Page'
import { graphql } from 'gatsby'
import Loader from '../../components/Loader'
import BlogFilter from '../../components/BlogFilter'
import BlogListItem from '../../components/BlogListItem'
import SEO from '../../components/seo'

const Space = styled.div`
    height: 17px;
`

const BlogList = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`

function reducer(state, action) {
    switch (action.type) {
        case 'test':
            return { ...state }
        case 'selectTag':
            console.log('tag selected', action)

            let modTags =
                state.selectedTags.find(el => el === action.data) === undefined
                    ? [...state.selectedTags, action.data] // add it to selectedTags
                    : state.selectedTags.filter(el => el !== action.data) //remove it from selectedTags

            let modPosts =
                modTags.length > 0
                    ? state.allPosts.filter(el =>
                          modTags.every(tag => el.tags.find(t => t === tag) !== undefined)
                      )
                    : state.allPosts

            return { ...state, selectedTags: modTags, selectedPosts: modPosts }
        default:
            return state
    }
}

const BlogPage = ({ data: { allMdx, allTags, allFile }, ...props }) => {
    const rawPostContent = allMdx.nodes

    const tags = allTags.tags

    const allPosts = rawPostContent.map(el => ({
        title: el.frontmatter.title,
        date: el.frontmatter.date,
        tags: el.frontmatter.tags.split(','),
        infopic: allFile.edges.find(e => e.node.relativePath === el.frontmatter.infopic),
        slug: el.fields.slug,
        excerpt: el.excerpt,
        wordCount: el.wordCount.words,
    }))

    const initialState = {
        allPosts: allPosts,
        selectedPosts: allPosts,
        selectedTags: [],
        selectedYears: [],
    }

    const [state, dispatch] = useReducer(reducer, initialState)
    const [loader, setLoader] = useState(false)

    const setLoaderToFalse = () => {
        setLoader(false)
    }

    const showLoader = () => {
        setLoader(true)
        window.setTimeout(setLoaderToFalse, 500)
    }

    // console.log(state)
    return (
        <Page {...props}>
            <Space />
            <SEO title='Words' />
            <PageSection padding='0px'>
                <BlogFilter
                    allTags={tags}
                    state={state}
                    dispatch={dispatch}
                    showLoader={showLoader}
                />
            </PageSection>

            <PageSection>
                {loader ? (
                    <Loader />
                ) : (
                    <BlogList>
                        {state.selectedPosts.map((el, i) => (
                            <BlogListItem key={i} postdata={el} />
                        ))}
                    </BlogList>
                )}
            </PageSection>
            {/* <PageSection>
                <BlogList>
                    {state.selectedPosts.map((el, i) => (
                        <BlogListItem key={i} postdata={el} />
                    ))}
                </BlogList>
            </PageSection> */}
        </Page>
    )
}

export const allPostsQuery = graphql`
    query AllPostsQuery {
        allMdx(sort: { fields: frontmatter___date, order: DESC }) {
            nodes {
                id
                frontmatter {
                    title
                    date(formatString: "MMMM D, Y")
                    tags
                    infopic
                }
                fields {
                    slug
                }
                excerpt
                wordCount {
                    words
                }
            }
        }
        allTags {
            tags
        }
        allFile(filter: { relativeDirectory: { eq: "words/intro" } }) {
            edges {
                node {
                    id
                    childImageSharp {
                        fluid(maxHeight: 150, maxWidth: 150) {
                            ...GatsbyImageSharpFluid
                        }
                    }
                    relativePath
                }
            }
        }
    }
`

export default BlogPage
