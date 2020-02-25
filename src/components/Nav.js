import React, { useState } from 'react'
import styled from 'styled-components'
import TransitionLink from './TransitionLink'
import { DownArrow } from 'styled-icons/boxicons-solid/DownArrow'

const StyledTL = styled(TransitionLink)`
    color: ${props => (props.match ? props.theme.colors.primaryAccent : 'initial')};
    font-size: ${props =>
        props.sub ? props.theme.font.subNavButtonSize : props.theme.font.navButtonSize};
    padding: 0;
    margin: 0 5px;
    @media (max-width: 1024px) {
        padding: ${props => (props.sub ? '0 5px' : '0')};
    }

    :hover {
        text-decoration: underline;
        color: ${({ theme }) => theme.colors.primaryAccent};
    }
`

const MainNavContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
`

const MainNav = ({ path }) => {
    console.log('main nav path', path)
    console.log('onLog', onLog)
    const onCareer = path === '/career/',
        onProjects = path === '/projects/',
        onLog = path.includes('/log')

    return (
        <MainNavContainer>
            <StyledTL to='/career' from='bottom' match={onCareer}>
                career
            </StyledTL>
            <StyledTL to='/projects' from='bottom' match={onProjects}>
                projects
            </StyledTL>
            <StyledTL to='/log' from='bottom' match={onLog}>
                {`log${onLog ? '⟩' : ''}`}
            </StyledTL>
        </MainNavContainer>
    )
}

const SubNavContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`

//below styled components are solely to remove bottom scroll bar
const SubNavContainerGrandparent = styled.div`
    overflow: hidden;
`

const SubNavContainerParent = styled.div`
    width: 100%;
    height: 100%;

    position: relative;
    bottom: -5px;

    overflow-x: scroll;
    padding-bottom: 18px;
    box-sizing: content-box;

    // @media (max-width: 1024px) {
    //     width: 35vw;
    // }
`

const SubNav = ({ path, onLog }) => {
    console.log('subnav path', path)
    console.log(onLog)
    const onLogBooks = path === '/log/books/',
        onLogMusic = path === '/log/music/',
        onLogArticles = path === '/log/articles/',
        onLogProductivity = path === '/log/productivity/'

    return (
        <SubNavContainerGrandparent>
            <SubNavContainerParent>
                <SubNavContainer>
                    <StyledTL to='/log/books' from='top' match={onLogBooks} sub>
                        books
                    </StyledTL>

                    <StyledTL to='/log/music' from='top' match={onLogMusic} sub>
                        music
                    </StyledTL>

                    <StyledTL to='/log/articles' from='top' match={onLogArticles} sub>
                        articles
                    </StyledTL>

                    <StyledTL to='/log/productivity' from='top' match={onLogProductivity} sub>
                        productivity
                    </StyledTL>
                </SubNavContainer>
            </SubNavContainerParent>
        </SubNavContainerGrandparent>
    )
}

const NavContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    position: absolute;
    top: 0;
    right: 10px;
    width: auto;
`

const BlogNavButton = styled(TransitionLink)`
    font-size: ${({ theme }) => theme.font.navButtonSize};
    margin-left: 5px;

    color: ${props => (props.match ? props.theme.colors.primaryAccent : 'initial')};
    :hover {
        color: ${({ theme }) => theme.colors.primaryAccent};
        text-decoration: underline;
    }
`
const SiteTitle = styled(TransitionLink)`
    :hover {
        text-decoration: underline;
        color: ${({ theme }) => theme.colors.primaryAccent};
    }
`

const NavContainer1 = styled.div`
    width: 100%;
    // height: 50px;
    height: ${props => props.showMenu ? '100px' : '50px'};
    transition: height 1s;

    position: fixed;
    top: 0;
    left: 0;
    background-color: white;
    z-index: 100;
    border-bottom: 10px solid ${({ theme }) => theme.colors.primaryAccent};
`

const CustomArrow = styled(DownArrow)`
    position: relative;
    width: 50px;
    height: 50px;
    cursor: pointer;
`

const Nav = ({ path, ...props }) => {
    // const onLog = path.includes('/log')
    // const onBlog = path.includes('/blog')
    // // console.log('onLog', onLog)
    // console.log('nav path', path)
    // console.log('onLog', onLog)
    const [ menu, setMenu ] = useState(false)
    const isMobile = window.innerWidth < 1024
    return (
        <NavContainer1 showMenu={menu}>
            <SiteTitle to='/' from='right'>
                <h1>chaipalaka</h1>
            </SiteTitle>
            <CustomArrow onClick={() => setMenu(true)} />
            { isMobile ? <CustomArrow /> : <NavMenu path={path}/>}
        </NavContainer1>
    )
}

const NavMenu = ({path}) => {
    const onLog = path.includes('/log')
    const onBlog = path.includes('/blog')
    return (
        <NavContainer>
            <MainNav path={path} />
            {onLog ? <SubNav path={path} onLog={onLog} /> : <div></div>}
            <BlogNavButton to='/blog' from='left' match={onBlog}>
                blog
            </BlogNavButton>
        </NavContainer>
    )
}

export default Nav
