import React, { useReducer, useState, useContext } from 'react'
import styled from 'styled-components'
import Img from 'gatsby-image'
import { ThemeContext } from 'styled-components'
import TransitionLink from './TransitionLink'

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
    height: 120px;
    background: ${({ stripeRotation, color1, color2, width }) =>
        `repeating-linear-gradient(${stripeRotation}deg, ${color1}, ${color1} ${width}px, ${color2} ${width}px, ${color2} ${width *
            2}px)`};
    background-clip: content-box;

    margin: 15px 35px;

    @media (max-width: 1024px) {
        margin: 15px 0px;
    }

    padding: 15px;
    box-sizing: border-box;
    border: 1px dashed #e8e8e8;

    cursor: pointer;
    :hover {
        border: ${({ color2 }) => `2px solid ${color2}`};
        box-shadow: ${({ color2 }) => `7px 7px ${color2}`};
        transform: translate(-4px, -4px);
    }
    transition: box-shadow 0.5s, transform 1s;
`

const BlogImage = styled.div`
    height: 140px;
    width: 140px;
    // margin: auto;
    transform: ${({ rot }) => 'rotate(' + rot + 'deg) translateY(-30px)'};
    :hover {
        height: 150px;
        width: 150px;
        transform: translateY(-35px);
    }

    @media (max-width: 1024px) {
        transform: ${({ rot }) => 'rotate(' + rot + 'deg) translateY(-15px)'};
        :hover {
            transform: translateY(-20px);
        }
    }

    transition: height 1s, width 1s, transform 1s;
`

const BlogTitle = styled.p`
    font-size: 18px;
    letter-spacing: 1px;
    // position: relative;
    // left: -10px;
    display: inline;
`

const WordCount = styled.p`
    font-size: 13px;
    letter-spacing: 1px;
    // position: relative;
    // left: -10px;
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

const InnerHorizontal = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    height: 100%;
    width: 100%;
`

const VerticalFlex = styled.div`
    display: flex;
    flex-direction: column;
    // justify-content: space-between;
    height: 100%;
    width: 100%;
    position: relative;
    top: -15px;
    left: -5px;
`

const BlogListItem = ({ postdata }) => {
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
            <InnerHorizontal>
                <VerticalFlex>
                    <BlogTitle>{title}</BlogTitle>
                    <WordCount>{`${wordCount} words`}</WordCount>
                </VerticalFlex>
                <BlogImage rot={imageRotation}>
                    <Img fluid={infopic.node.childImageSharp.fluid} alt='Gatsby Docs are awesome' />
                </BlogImage>
            </InnerHorizontal>
        </BlogItemDiv>
    )
}

export default BlogListItem