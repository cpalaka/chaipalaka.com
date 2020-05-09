import React, { useReducer, useState, useContext } from 'react'
import styled from 'styled-components'

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

const BlogFilter = ({ allTags, state, dispatch, showLoader }) => {
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

export default BlogFilter
