import React, { useReducer, useState, useContext } from 'react'
import styled from 'styled-components'
import TransitionLink from '../../components/TransitionLink'
import Page, { PageSection } from '../../components/Page'
import { graphql, useStaticQuery } from 'gatsby'
import Loader from '../../components/Loader'
import Img from 'gatsby-image'
import { ThemeContext } from 'styled-components'

const Tag = styled.div`
    width: 100%;
    height: 50px;
    color: ${props => (props.selected ? props.theme.colors.primaryAccent : 'initial')};
    border: ${props =>
        props.selected ? '1px solid ' + props.theme.colors.primaryAccent : 'initial'};
    border-radius: 11px;
    display: inline-block;
    padding: 3px;
    :hover {
        color: ${props => props.theme.colors.secondary};
        // text-decoration: underline;
        cursor: pointer;
        // background-color: white;
        // border: ${props => '1px solid ' + props.theme.colors.secondary};

        :active {
            color: ${props => props.theme.colors.primaryAccent};
        }
    }
    box-sizing: border-box;
`

const TagContainer = styled.div`
    // width: 100%;
    height: 50px;
    padding-bottom: 17px;
    overflow: auto hidden;

    display: flex;
    justify-content: space-between;
    // flex-wrap: wrap;
    box-sizing: border-box;
`

const TagLabel = styled.p`
    // border: 1px solid black;
    // height: 30px;
    // width: 50px;
    // position: relative;
    // top: 0px;
    transform: rotate(-90deg);
`

const OptionsContainer = styled.div`
    display: flex;
    justify-content: flex-start;
    opacity: ${({ showOptions }) => (showOptions ? '1' : '0')};
    pointer-events: ${({ showOptions }) => (showOptions ? 'initial' : 'none')};
    transition: opacity 1s;
`

const FilterSectionContainer = styled.div`
    // height: auto;
    height: ${({ showOptions }) => (showOptions ? '80px' : '30px')};
    transition: height 1s;
`

const FilterPostsButton = styled.div`
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none;
    width: 100%;
    height: 30px;
    text-align: center;
    font-weight: ${({ showOptions }) => (showOptions ? 'bold' : 'normal')};
    :hover {
        background-color: ${props => props.theme.colors.secondary};
        cursor: pointer;
    }
`

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
                    <BlogList>
                        {state.selectedPosts.map((el, i) => (
                            <BlogItem key={i} postdata={el} />
                        ))}
                    </BlogList>
                )}
            </PageSection>
        </Page>
    )
}

//return -degree to degree
const getRandomRotation = degree => {
    let rand = Math.random()
    if (rand < 0.5) {
        return ((rand / 0.5) * degree * -1).toString()
    } else {
        return (((rand - 0.5) / 0.5) * degree).toString()
    }
}

const BlogItemDiv = styled.div`
    height: 150px;
    background: ${({ stripeRotation, color1, color2, width }) =>
        `repeating-linear-gradient(${stripeRotation}deg, ${color1}, ${color1} ${width}px, ${color2} ${width}px, ${color2} ${width *
            2}px)`};
    background-clip: content-box;

    margin-top: 15px;
    margin-bottom: 15px;

    padding: 15px;
    box-sizing: border-box;
    border: 1px dashed #e8e8e8;

    cursor: pointer;
    :hover {
        border: ${({color2}) => `2px solid ${color2}`};
        box-shadow: ${({color2}) => `7px 7px ${color2}`};
        transform: translate(-4px, -4px);
    }
    transition: box-shadow 0.5s, transform 1s;
`

const BlogImage = styled.div`
    height: 140px;
    width: 140px;
    // margin: auto;
    transform: ${({ rot }) => 'rotate(' + rot + 'deg) translateY(-40px)'};
    :hover {
        height: 150px;
        width: 150px;
        transform: translateY(-45px);
    }
    transition: height 1s, width 1s, transform 1s;
`

const BlogImageContainer = styled.div`
    height: 150px;
    width: 150px;
    border: 2px solid black;
`

const BlogTitle = styled.p`
    font-size: 14px;
    letter-spacing: 3px;
`

const Date = styled.div`
    position: relative;
    top: -13px;
    left: -13px;
    color: #9e9fa8;
    display: inline-block;
    background-color: white;
    // border: 1px solid grey;
    font-size: 13px;
    transform: rotate(-4deg);
`

const Inner = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`

const BlogItem = ({ postdata }) => {
    const themeContext = useContext(ThemeContext)
    const { date, excerpt, infopic, slug, tags, title, wordCount } = postdata
    const imageRotation = getRandomRotation(5)
    const type = slug.split('/')[2]

    return (
        <BlogItemDiv
            stripeRotation={getRandomRotation(360)}
            width={40 * Math.random()}
            color1={themeContext.blogColors[type].primary}
            color2={themeContext.blogColors[type].secondary}
        >
            <Date>{date}</Date>
            <Inner>
                <BlogTitle>{title}</BlogTitle>
                <BlogImage rot={imageRotation}>
                    <Img fluid={infopic.node.childImageSharp.fluid} alt='Gatsby Docs are awesome' />
                </BlogImage>
            </Inner>
        </BlogItemDiv>
    )
}

const FilterSection = ({ allTags, state, dispatch, showLoader }) => {
    const [showOptions, setShowOptions] = useState(false)

    return (
        <FilterSectionContainer showOptions={showOptions}>
            <FilterPostsButton showOptions={showOptions} onClick={() => setShowOptions(v => !v)}>
                Filter Posts
            </FilterPostsButton>
            <OptionsContainer showOptions={showOptions}>
                <TagLabel>Tags</TagLabel>
                <TagContainer>
                    {allTags.map(tag => (
                        <Tag
                            key={tag}
                            onClick={() => {
                                dispatch({ type: 'selectTag', data: tag })
                                showLoader()
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
        allFile(filter: { relativeDirectory: { eq: "blog/intro" } }) {
            edges {
                node {
                    id
                    childImageSharp {
                        fluid(maxWidth: 150, maxHeight: 150) {
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
