import React, { useReducer } from 'react'
// import SEO from '../components/seo'
import styled from 'styled-components'
import TransitionLink from '../../components/TransitionLink'
import Page, { PageSection } from '../../components/Page'
import { graphql } from 'gatsby'

const Tag = styled.div`
    width: auto;
    height: 30px;
    // padding: 0 10px;
    :hover {
        color: ${props => props.theme.colors.secondary};
        cursor: pointer;
        box-shadow: 2px 2px;
        :active {
            color: ${props => props.theme.colors.primaryAccent};
        }
    }
`

const TagContainer = styled.div`
    width: 100%;
    height: 100%;
    overflow: auto;

    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
`

function reducer(state, action) {
    switch (action.type) {
        case 'test':
            return { ...state }
        case 'selectTag':
            console.log('tag selected', action)
            return { ...state }
        default:
            return state
    }
}

const BlogPage = ({ data: { allMdx }, ...props }) => {
    const tags = allMdx.nodes
        .map(el => el.frontmatter.tags.split(','))
        .reduce((acc, el) => acc.concat(el), [])
        .filter((el, i, self) => self.indexOf(el) === i)
        .sort()

    const allPosts = allMdx.nodes.map(el => ({
        title: el.frontmatter.title,
        date: el.frontmatter.date,
        tags: el.frontmatter.tags,
    }))

    const initialState = {
        allPosts: allPosts,
        selectedPosts: [],
        selectedTags: [],
        selectedYears: [],
    }

    const [state, dispatch] = useReducer(reducer, initialState)

    console.log(state)
    return (
        <Page {...props}>
            <PageSection>
                <TagContainer>
                    {tags.map(tag => (
                        <Tag onClick={() => dispatch({ type: 'selectTag', data: tag })}>{tag}</Tag>
                    ))}
                </TagContainer>

                {allMdx.nodes.map(el => (
                    <>
                        <div>{el.frontmatter.title}</div>
                        <div>{el.frontmatter.date}</div>
                        <div>{el.frontmatter.tags}</div>
                    </>
                ))}
                <h1>Hi from the second page</h1>
                <p>Welcome to page 2</p>
            </PageSection>
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
                    date
                    tags
                }
            }
        }
    }
`

export default BlogPage
