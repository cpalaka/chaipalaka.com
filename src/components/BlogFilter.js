import React, { useReducer, useState, useContext } from 'react'
import styled from 'styled-components'

const Tag = styled.div`
    width: 100%;
    height: 30px;

    color: ${props => (props.selected ? props.theme.colors.secondary : 'initial')};
    
    box-shadow: ${props => (props.selected ? `0px 2px ${props.theme.colors.secondary}` : 'none')};
    font-weight: ${props => (props.selected ? `bold` : 'normal')};

    display: inline-block;
    padding: 0px 5px;
    cursor: pointer;

    :hover {
        color: ${props => props.theme.colors.secondary};
        box-shadow: ${({ theme }) => `0px 4px ${theme.colors.secondary}`}
    }
    transition: box-shadow 0.4s, color 0.5s;
    margin: 0px 2px;
`

const TagContainer = styled.div`
    // height: auto;
    padding-bottom: 10px;
    overflow: auto hidden;

    display: flex;
    justify-content: space-between;
`

const TagLabel = styled.p`
    transform: rotate(-90deg);
`

const OptionsContainer = styled.div`
    display: flex;
    height: 50px;
    justify-content: flex-start;
    opacity: ${({ showOptions }) => (showOptions ? '1' : '0')};
    pointer-events: ${({ showOptions }) => (showOptions ? 'initial' : 'none')};
    transition: opacity 1s;
    margin: 0px 5px;
`

const FilterSectionContainer = styled.div`
    height: ${({ showOptions }) => (showOptions ? '90px' : '30px')};
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
