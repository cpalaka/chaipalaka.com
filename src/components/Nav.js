import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import TransitionLink from './TransitionLink'
import { NavigateNext } from 'styled-icons/material/NavigateNext'
import { Plus } from 'styled-icons/boxicons-regular/Plus'
import { Minus } from 'styled-icons/boxicons-regular/Minus'

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
    pointer-events: ${props => (props.mobile && !props.showMenu ? 'none' : 'initial')};
    font-size: ${props => props.theme.font.navButtonSize};
    margin: 0 5px;
`

const SubNavLink = styled(NavLink)`
    pointer-events: ${props => (props.mobile && !props.showMenu ? 'none' : 'initial')};
    font-size: ${props => props.theme.font.subNavButtonSize};
    margin: 0 2px;
`

const SubNavContainer = styled(Flexbox)`
    justify-content: space-around;
    align-items: center;
    position: relative;
    bottom: -1px;
`

const SubNav = ({ path, show, ...props }) => {
    const onLogBooks = path === '/log/books/',
        onLogMusic = path === '/log/music/',
        onLogArticles = path === '/log/articles/',
        onLogProductivity = path === '/log/productivity/'

    return (
        <SubNavContainer>
            <SubNavLink to='/log/books' match={onLogBooks} {...props}>
                books
            </SubNavLink>

            <SubNavLink to='/log/music' match={onLogMusic} {...props}>
                music
            </SubNavLink>

            <SubNavLink to='/log/articles' match={onLogArticles} {...props}>
                articles
            </SubNavLink>

            <SubNavLink to='/log/productivity' match={onLogProductivity} {...props}>
                productivity
            </SubNavLink>
        </SubNavContainer>
    )
}

const MainNavContainer = styled(Flexbox)`
    justify-content: space-around;
`

const NavMenuContainer = styled(Flexbox)`
    justify-content: space-between;
    align-items: center;
    position: absolute;
    bottom: 5px;

    left: ${props => (props.show ? 'calc(100vw - 545px)' : 'calc(100vw - 295px)')};
    opacity: ${props => (props.mobile ? (props.showMenu ? '1' : '0') : '1')};
    transition: left 1s, opacity 0.8s;

    width: auto;
    z-index: 49;
`

const BlogNavLink = styled(MainNavLink)`
    background-color: white;
    position: absolute;
    right: 0px;
    bottom: 5px;
    z-index: 50;
    height: 34px;
    margin: 0;
    padding-right: 15px;
    opacity: ${props => (props.mobile ? (props.showMenu ? '1' : '0') : '1')};
    transition: opacity 0.8s;
`

const Arrow = styled(NavigateNext)`
    color: ${props => (props.open ? props.theme.colors.primaryAccent : 'black')};
    width: 30px;
    height: 30px;
    margin-top: 3px;
    cursor: pointer;
`

const NavMenu = ({ path, ...props }) => {
    const onLog = path.includes('/log'),
        onBlog = path.includes('/blog'),
        onCareer = path === '/career/',
        onProjects = path === '/projects/'
    const [submenuOpen, setSubmenuOpen] = useState(onLog)

    return (
        <>
            <NavMenuContainer show={submenuOpen} {...props}>
                <MainNavContainer>
                    <MainNavLink to='/career' match={onCareer} {...props}>
                        career
                    </MainNavLink>
                    <MainNavLink to='/projects' match={onProjects} {...props}>
                        projects
                    </MainNavLink>
                    <div onClick={() => setSubmenuOpen(true)}>
                        <MainNavLink to='/log' match={onLog} {...props}>
                            log
                        </MainNavLink>
                    </div>
                    <Arrow onClick={() => setSubmenuOpen(v => !v)} open={submenuOpen} />
                </MainNavContainer>

                {submenuOpen ? <SubNav path={path} show={submenuOpen} {...props} /> : <div></div>}
            </NavMenuContainer>
            <BlogNavLink to='/blog' match={onBlog} {...props}>
                blog
            </BlogNavLink>
        </>
    )
}

const NavContainer = styled.nav(({ theme, showMenu }) => ({
    width: '100%',
    height: showMenu ? `${1.75 * theme.dim.nav}px` : `${theme.dim.nav}px`,
    transition: 'height 1s',

    position: 'fixed',
    bottom: '0',
    left: '0',
    backgroundColor: 'white',
    zIndex: '100',
    borderTop: `7px solid ${theme.colors.primaryAccent}`,
}))

const SiteTitle = styled(NavLink)`
    background-color: white;
    z-index: 60;
    position: relative;
    left: 13px;
    bottom: -5px;
`

const PlusIcon = styled(Plus)`
    color: black;
    width: 30px;
    height: 30px;
    position: absolute;
    right: 10px;
    top: 5px;
    z-index: 60;
`

const MinusIcon = styled(Minus)`
    color: black;
    width: 30px;
    height: 30px;
    position: absolute;
    right: 10px;
    top: 5px;
    z-index: 60;
`

const Nav = ({ path, ...props }) => {
    // detect screen width
    const [showMenu, setShowMenu] = useState(false)
    const [width, setWidth] = useState(null)
    useEffect(() => {
        setWidth(window.innerWidth)
        window.addEventListener('resize', e => setWidth(e.target.innerWidth))
        return () => {
            window.removeEventListener('resize', e => setWidth(e.target.innerWidth))
        }
    }, [])

    const isDesktop = width > 1024

    return (
        <NavContainer showMenu={showMenu}>
            <SiteTitle to='/'>
                <h1>chaipalaka</h1>
            </SiteTitle>
            {!isDesktop ? (
                showMenu ? (
                    <MinusIcon onClick={() => setShowMenu(false)} />
                ) : (
                    <PlusIcon onClick={() => setShowMenu(true)} />
                )
            ) : null}
            <NavMenu path={path} showMenu={showMenu} mobile={!isDesktop} />
        </NavContainer>
    )
}

export default Nav
