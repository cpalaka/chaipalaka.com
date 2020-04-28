import React, { useReducer, useState } from 'react'
import styled from 'styled-components'
import TransitionLink from '../../components/TransitionLink'
import Page, { PageSection } from '../../components/Page'
import { graphql } from 'gatsby'
import Loader from '../../components/Loader'

const Tag = styled.div`
    width: auto;
    height: 30px;
    color: ${props => (props.selected ? props.theme.colors.primaryAccent : 'initial')};
    border-radius: 10px;
    display: inline-block;
    padding: 3px;
    :hover {
        color: ${props => props.theme.colors.secondary};
        text-decoration: underline;
        cursor: pointer;
        background-color: white;
        // border: ${props => '1px solid ' + props.theme.colors.secondary};

        :active {
            color: ${props => props.theme.colors.primaryAccent};
        }
    }
    box-sizing: border-box;
`

const TagContainer = styled.div`
    width: 100%;
    height: 50px;
    overflow: auto;

    display: flex;
    justify-content: space-around;
    // flex-wrap: wrap;
    box-sizing: border-box;
`

const OptionsContainer = styled.div`
    opacity: ${({ showOptions }) => (showOptions ? '1' : '0')};
    transition: opacity 1s;
`

const FilterSectionContainer = styled.div`
    // height: auto;
    height: ${({ showOptions }) => (showOptions ? '70px' : '30px')};
    transition: height 1s;
`

const FilterPostsButton = styled.div`
    width: 100%;
    height: 30px;
    text-align: center;
    :hover {
        background-color: ${props => props.theme.colors.secondary};
        cursor: pointer;
    }
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

const BlogPage = ({ data: { allMdx, allTags }, ...props }) => {
    const rawPostContent = allMdx.nodes

    const tags = allTags.tags

    const allPosts = rawPostContent.map(el => ({
        title: el.frontmatter.title,
        date: el.frontmatter.date,
        tags: el.frontmatter.tags.split(','),
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
        window.setTimeout(setLoaderToFalse, 200)
    }

    console.log(state)
    return (
        <Page {...props}>
            <PageSection padding='0px'>
                <FilterSection
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
                    state.selectedPosts.map((el, i) => (
                        <div key={i} animate>
                            <TransitionLink to={el.slug}>{el.title}</TransitionLink>
                            <div>{el.date}</div>
                            <div>{el.tags}</div>
                        </div>
                    ))
                )}
            </PageSection>
        </Page>
    )
}

const FilterSection = ({ allTags, state, dispatch, showLoader }) => {
    const [showOptions, setShowOptions] = useState(false)

    return (
        <FilterSectionContainer showOptions={showOptions}>
            <FilterPostsButton onClick={() => setShowOptions(v => !v)}>
                Filter Posts
            </FilterPostsButton>
            <OptionsContainer showOptions={showOptions}>
                <TagContainer>
                    {allTags.map(tag => (
                        <Tag
                            key={tag}
                            onClick={() => {
                                dispatch({ type: 'selectTag', data: tag })
                                // showLoader()
                            }}
                            selected={state.selectedTags.find(t => t === tag)}
                        >
                            {tag}
                        </Tag>
                    ))}
                </TagContainer>
            </OptionsContainer>
        </FilterSectionContainer>
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
    }
`

export default BlogPage
