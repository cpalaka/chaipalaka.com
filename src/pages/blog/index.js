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

const BlogPage = ({ data: { allMdx, allTags }, ...props }) => {
    const rawPostContent = allMdx.nodes

    const tags = allTags.tags

    const allPosts = rawPostContent.map(el => ({
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

    console.log(tags)
    return (
        <Page {...props}>
            <PageSection>
                <TagContainer>
                    {tags.map(tag => (
                        <Tag key={tag} onClick={() => dispatch({ type: 'selectTag', data: tag })}>{tag}</Tag>
                    ))}
                </TagContainer>

                {rawPostContent.map((el, i) => (
                    <div key={i}>
                        <div>{el.frontmatter.title}</div>
                        <div>{el.frontmatter.date}</div>
                        <div>{el.frontmatter.tags}</div>
                    </div>
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
        allTags {
            tags
        }
    }
`

export default BlogPage
