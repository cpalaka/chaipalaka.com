import React, { useState, useEffect, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { useGlobalDispatch, useGlobalState } from '../state'
import config from '../../config'
import { DiscussionEmbed } from 'disqus-react'
import { Close } from '@styled-icons/material/Close'
import { Remove } from '@styled-icons/material/Remove'

const InfoSectionDiv = styled.div`
    height: 100vh;
    width: ${({ isDesktop, isWindows }) =>
        !isDesktop ? 'calc(79vw)' : isWindows ? 'calc(22vw - 17px)' : 'calc(22vw)'};

    background: ${({ theme }) => `${theme.colors.pageBackground}`};

    position: fixed;
    bottom: ${({ shouldShow }) => (shouldShow ? '0' : '103vh')};
    left: ${({ isDesktop, isWindows, open }) =>
        isDesktop ? 'calc(78vw)' : open ? 'calc(21vw)' : 'calc(102.5vw)'};

    transition: ${({ isDesktop }) => (!isDesktop ? `width 1s, left 1s` : 'bottom 2s')};

    padding: 62px 10px 10px 10px;
    box-shadow: 0px 0px 10px -5px #040f0f;
`

const NowPlayingIFrame = styled.iframe`
    margin: auto;
    position: relative;
    height: ${({ open }) => (open ? '120px' : '0px')};
    top: ${({ open }) => (open ? '-10px' : '-10px')};
    transition: height 1s, top 1s;
    border: none;
`

const InfoSubSection = styled.div`
    background: ${({ theme }) => `${theme.colors.pageSectionBackground}`};
    color: ${({ theme }) => `${theme.colors.pageSectionText}`};
    box-shadow: ${({ theme }) => `inset 0px 0px 15px -10px ${theme.colors.pageSectionShadow}`};
    border-radius: 12px;
    margin: 15px 0;
`

const CloseButton = styled(Close)`
    color: ${({ theme }) => `${theme.colors.navText}`};
    :active {
        color: ${({ theme }) => `${theme.colors.secondary}`};
    }
    width: 30px;
    height: 30px;
    margin: 0 5px;
    cursor: pointer;
`

const MinimizeButton = styled(Remove)`
    color: ${({ theme }) => `${theme.colors.navText}`};
    :active {
        color: ${({ theme }) => `${theme.colors.secondary}`};
    }
    width: 30px;
    height: 30px;
    margin: 0 5px;
    cursor: pointer;
`

const IconBar = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 40px;
`

const NowPlayingSubsection = styled(InfoSubSection)`
    height: ${({ open }) => (open ? '180px' : '40px')};
    transition: height 1s;

    display: flex;
    flex-direction: column;
    align-items: flex-start;
`

const NowPlayingVideo = ({ src }) => {
    const dispatch = useGlobalDispatch()
    const closeVideo = useCallback(() => {
        dispatch({ type: 'setNowPlayingVideo', videoId: null })
    }, [dispatch])

    const [subsectionOpen, setSubsectionOpen] = useState(true)
    if (src) {
        return (
            <NowPlayingSubsection open={subsectionOpen}>
                <IconBar>
                    <MinimizeButton onClick={() => setSubsectionOpen(v => !v)} />
                    <CloseButton onClick={closeVideo} />
                </IconBar>

                <NowPlayingIFrame
                    open={subsectionOpen}
                    src={`https://www.youtube.com/embed/${src}`}
                    width='90%'
                />
            </NowPlayingSubsection>
        )
    } else {
        return null
    }
}

const OutlineDiv = styled(InfoSubSection)`
    padding: 7px;
    // max-height: 40%;
`

const PostHeading = styled.p`
    line-height: 2;
    text-align: center;
    font-weight: ${({ on }) => (on ? 'bold' : 'initial')};
    color: ${({ on, theme }) => (on ? `${theme.colors.secondary}` : '${theme.colors.text}')};
    cursor: pointer;
    :hover {
        font-weight: bold;
        color: ${({ on, theme }) => `${theme.colors.primaryAccent}`};
    }
`

const PostOutline = ({ list }) => {
    const scrollTo = y => {
        window.scrollTo({ top: y - 62, left: 0, behavior: 'smooth' })
    }

    const [scrollOver, setScrollOver] = useState(0)

    let postOffsets = list ? list.map(el => el.scrollOffset) : []
    postOffsets[0] = 0

    // console.log('rerender')
    const eventHandler = () => {
        // console.log(list)
        for (let i = 1; i < postOffsets.length; ++i) {
            if (
                window.scrollY < postOffsets[i] &&
                window.scrollY > postOffsets[i - 1] - window.innerHeight * 0.5
            ) {
                setScrollOver(i - 1)
            }
            if (
                window.scrollY > postOffsets[i] - window.innerHeight * 0.5 &&
                i === postOffsets.length - 1
            ) {
                setScrollOver(i)
            }
            if (i === 1 && window.scrollY < postOffsets[i + 1] + window.innerHeight * 0.5) {
                setScrollOver(0)
            }
        }
    }

    useEffect(() => {
        window.setInterval(eventHandler, 100)
        return () => {
            window.clearInterval(eventHandler, 100)
        }
    }, [])

    if (list) {
        return (
            <OutlineDiv>
                {list.map((el, i) => (
                    <PostHeading
                        on={i === scrollOver ? 1 : 0}
                        key={i}
                        onClick={() => scrollTo(el.scrollOffset)}
                    >
                        {el.sectionTitle}
                    </PostHeading>
                ))}
            </OutlineDiv>
        )
    } else {
        return null
    }
}

const InfoSection = ({ isDesktop, isWindows, openSection, state }) => {
    const shouldShow = state.nowPlayingVideo || state.onPost
    // let postOffsets = null
    return (
        <InfoSectionDiv
            isDesktop={isDesktop}
            isWindows={isWindows}
            open={openSection}
            stripeRotation={45}
            color1='rgba(255,255,255,1)'
            color2='rgba(242, 242, 242,0.7)'
            width='60'
            shouldShow={shouldShow}
        >
            <NowPlayingVideo src={state.nowPlayingVideo} />
            {/* {state.nowPlayingVideo ? <NowPlayingVideo src={state.nowPlayingVideo} /> : null} */}
            {state.postAnchors ? <PostOutline list={state.postAnchors} /> : null}
            {/* <PostOutline list={state.postAnchors} /> */}
        </InfoSectionDiv>
    )
}

export default InfoSection
