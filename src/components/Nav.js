import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import TransitionLink from './TransitionLink'
import { DownArrow } from 'styled-icons/boxicons-solid/DownArrow'
// import { NavigateNext } from 'styled-icons'
import { NavigateNext } from 'styled-icons/material/NavigateNext'
// import * as materialSharp from 'styled-icons/material-sharp'

const Flexbox = styled.div`
    display: flex;
    flex-direction: row;
`

const NavLink = styled(TransitionLink)`
    color: ${props => (props.match ? props.theme.colors.primaryAccent : 'initial')};
    display: inline-block;
    :hover {
        text-decoration: underline;
        color: ${({ theme }) => theme.colors.primaryAccent};
    }
`

const MainNavLink = styled(NavLink)`
    font-size: ${props => props.theme.font.navButtonSize};
    margin: 0 5px;
`

const BlogNavLink = styled(MainNavLink)`
    // ?
`

const SubNavLink = styled(NavLink)`
    font-size: ${props => props.theme.font.subNavButtonSize};
    margin: 0 2px;
`

const SubNavContainer = styled(Flexbox)`
    justify-content: space-around;
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
`

const SubNav = ({ path, show }) => {
    console.log('subnav path', path)
    // console.log(onLog)
    const onLogBooks = path === '/log/books/',
        onLogMusic = path === '/log/music/',
        onLogArticles = path === '/log/articles/',
        onLogProductivity = path === '/log/productivity/'

    return (
        <SubNavContainerGrandparent show={show}>
            <SubNavContainerParent>
                <SubNavContainer>
                    <SubNavLink to='/log/books' from='top' match={onLogBooks}>
                        books
                    </SubNavLink>

                    <SubNavLink to='/log/music' from='top' match={onLogMusic}>
                        music
                    </SubNavLink>

                    <SubNavLink to='/log/articles' from='top' match={onLogArticles}>
                        articles
                    </SubNavLink>

                    <SubNavLink to='/log/productivity' from='top' match={onLogProductivity}>
                        productivity
                    </SubNavLink>
                </SubNavContainer>
            </SubNavContainerParent>
        </SubNavContainerGrandparent>
    )
}

const MainNavContainer = styled(Flexbox)`
    justify-content: space-around;
`

const NavMenuContainer = styled(Flexbox)`
    justify-content: space-between;
    position: absolute;
    top: 0;
    right: 10px;
    width: auto;

    // TODO: figure out how to animate the subnav
    // flex-grow: ${props => props.show ? '1' : '0.00001'};
    // transition: all 1s;
`

const Arrow = styled(NavigateNext)`
    color: black;
    width: 30px;
    height: 30px;
    margin-top: 3px;
    cursor: pointer;
`

const NavMenu = ({ path }) => {
    const [submenuOpen, setSubmenuOpen] = useState(false)
    const onLog = path.includes('/log'),
        onBlog = path.includes('/blog'),
        onCareer = path === '/career/',
        onProjects = path === '/projects/'
    console.log(submenuOpen)

    const openSubNav = onLog || submenuOpen
    return (
        <NavMenuContainer show={openSubNav}>
            <MainNavContainer>
                <MainNavLink to='/career' from='bottom' match={onCareer}>
                    career
                </MainNavLink>
                <MainNavLink to='/projects' from='bottom' match={onProjects}>
                    projects
                </MainNavLink>
                <MainNavLink to='/log' from='bottom' match={onLog}>
                    log
                </MainNavLink>
                <Arrow onClick={() => setSubmenuOpen(v => !v)} />
            </MainNavContainer>

            {openSubNav ? <SubNav path={path} show={openSubNav} /> : <div></div>}

            <MainNavLink to='/blog' from='left' match={onBlog}>
                blog
            </MainNavLink>
        </NavMenuContainer>
    )
}

const NavContainer = styled.nav(({ theme, showMenu }) => ({
    width: '100%',
    height: showMenu ? `${theme.dim.nav}px` : `${2 * theme.dim.nav}px`,
    transition: 'height 1s',

    position: 'fixed',
    top: '0',
    left: '0',
    backgroundColor: 'white',
    zIndex: '100',
    borderBottom: `10px solid ${theme.colors.primaryAccent}`,
}))



const Nav = ({ path, ...props }) => {
    // dynamic screen width detection here?
    const [ width, setWidth ] = useState(window.innerWidth)

    useEffect(() => {
        window.addEventListener('resize', e => setWidth(e.target.innerWidth))
        return () => {
            window.removeEventListener('resize', e => setWidth(e.target.innerWidth))
        }
    }, [])

    const showMenu = width > 1024

    return (
        <NavContainer showMenu={showMenu}>
            <NavLink to='/' from='right'>
                <h1>chaipalaka</h1>
            </NavLink>
            {showMenu ? <NavMenu path={path} /> : null}
        </NavContainer>
    )
}

export default Nav
