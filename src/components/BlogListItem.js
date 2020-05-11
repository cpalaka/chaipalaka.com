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

    margin: 15px 55px;

    @media (max-width: 1024px) {
        margin: 15px 0px;
    }

    padding: 20px;
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
    height: 100px;
    width: 100px;
    // margin: auto;
    transform: ${({ rot }) => 'rotate(' + rot + 'deg) translateY(-40px) translateX(-10px)'};
    :hover {
        height: 110px;
        width: 110px;
        transform: translateY(-45px);
    }

    @media (max-width: 1024px) {
        transform: ${({ rot }) => 'rotate(' + rot + 'deg) translateY(-40px) translateX(-10px)'};
        :hover {
            transform: translateY(-45px) translateX(-10px);
        }
    }

    transition: height 1s, width 1s, transform 1s;
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
    // height: 100%;
    // width: 100%;
    position: relative;
    top: -8px;
    left: -7px;
`

const BlogTitle = styled.p`
    font-size: 18px;
    letter-spacing: 1.5px;
    font-weight: bold;
    display: inline-block;
    background-color: rgba(255, 255, 255, 0.7);
    line-height: 15px;
`

const WordCount = styled.p`
    font-size: 13px;
    letter-spacing: 1px;
    background-color: rgba(255, 255, 255, 0.7);
    line-height: 17px;
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

const Tags = styled.div`
    display: flex;
    flex-direction: row;
    // display: inline-block;
    flex-wrap: wrap;
    background-color: rgba(255, 255, 255, 0.7)
`


const Tag = styled.div`
    font-size: 11px;
    margin: 0px 4px;
    font-style: oblique;
    // display: inline-block;
    letter-spacing: 2px;
`

const BlogListItem = ({ postdata }) => {
    const themeContext = useContext(ThemeContext)
    const { date, excerpt, infopic, slug, tags, title, wordCount } = postdata
    const imageRotation = getRandomRotation(5)
    const type = slug.split('/')[2]
    // console.log(themeContext)
    return (
        <TransitionLink to={slug}>
            <BlogItemDiv
                // wide, mainly vertical stripes
                // stripeRotation={getRandomRotation(5)}
                // width={Math.random()* (80 - 20) + 20}
                //thin, hatched stripes
                stripeRotation={getRandomRotation(360)}
                width={5 * Math.random()}
                color1={themeContext.blogColors[type].primary}
                color2={themeContext.blogColors[type].secondary}
            >
                <Date>{date}</Date>
                <InnerHorizontal>
                    <VerticalFlex>
                        <BlogTitle>{title}</BlogTitle>
                        <WordCount>{`${wordCount} words`}</WordCount>
                        <Tags>
                            {tags.map((el,i) => <Tag key={i}>{el}</Tag>)}
                        </Tags>
                    </VerticalFlex>
                    <BlogImage rot={imageRotation}>
                        <Img
                            fluid={infopic.node.childImageSharp.fluid}
                            alt='Gatsby Docs are awesome'
                        />
                    </BlogImage>
                </InnerHorizontal>
            </BlogItemDiv>
        </TransitionLink>
    )
}

export default BlogListItem
