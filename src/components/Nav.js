import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import TransitionLink from './TransitionLink'
import { Settings } from '@styled-icons/material/Settings'

const Flexbox = styled.div`
    display: flex;
    flex-direction: row;
`

const NavLink = styled(TransitionLink)`
    color: ${props => (props.match ? props.theme.colors.primaryAccent : props.theme.colors.text)};
    display: inline-block;
    :hover {
        text-decoration: underline;
        color: ${({ theme }) => theme.colors.secondary};
    }
`

const MainNavLink = styled(NavLink)`
    font-size: ${props => props.theme.font.navButtonSize};
    margin: 0 5px;
`

const SubNavLink = styled(NavLink)`
    font-size: ${props => props.theme.font.subNavButtonSize};
    margin: 0 2px;
`

const NavMenuContainer = styled(Flexbox)`
    justify-content: space-between;
    z-index: 60;

    border-left: ${({ theme }) => `3px solid ${theme.commonColors.borderBlack}`};
    border-top: ${({ theme }) => `3px solid ${theme.commonColors.borderBlack}`};
    background-color: white;

    position: fixed;
    bottom: 0px;
    right: ${({ isDesktop }) => (!isDesktop ? '2.5vw' : '25vw')};
    transition: top 0.6s, left 1s;
`

const SettingsIcon = styled(Settings)`
    color: ${props => (props.open ? props.theme.colors.primaryAccent : props.theme.colors.text)};
    width: 30px;
    height: 30px;
    margin-top: 3px;
    cursor: pointer;
    position: relative;
    top: -4px;
    z-index: 10;
`

const FakeNavLink = styled.div`
    color: ${props => (props.match ? props.theme.colors.primaryAccent : props.theme.colors.text)};
    cursor: pointer;
    display: inline-block;
    font-size: 22px;
    margin: 0 5px;
    :hover {
        text-decoration: underline;
        color: ${({ theme }) => theme.colors.secondary};
    }
`

const LogNavContainer = styled.div`
    display: flex;
    flex-direction: column;
    background-color: white;
    position: fixed;

    bottom: 0px;
    right: ${({ isDesktop }) => (!isDesktop ? '2.5vw' : '25vw')};
    bottom: ${({ open }) => (open ? '50px' : '-102px')};

    z-index: 59;

    transition: bottom 1s;
    border-top: ${({ theme }) => `3px solid ${theme.commonColors.borderBlack}`};
    // border-right: ${({ theme }) => `3px solid ${theme.commonColors.borderBlack}`};
    border-left: ${({ theme }) => `3px solid ${theme.commonColors.borderBlack}`};
    border-bottom: ${({ theme }) => `3px solid ${theme.commonColors.borderBlack}`};;
`

const SettingsNavContainer = styled(LogNavContainer)``

const NavMenu = ({ path, isDesktop, ...props }) => {
    const onLog = path.includes('/log'),
        onBlog = path.includes('/blog'),
        onProjects = path === '/projects/'
    const onLogBooks = path === '/log/books/',
        onLogMusic = path === '/log/music/',
        onLogArticles = path === '/log/articles/',
        onLogProductivity = path === '/log/productivity/'

    // const [isWindows, setIsWindows] = useState(false)

    // useEffect(() => {
    //     setIsWindows(window.navigator.userAgent.includes('Windows'))
    // }, [])
    const [logNavOpen, setLogNavOpen] = useState(false)
    const [settingsNavOpen, setSettingsNavOpen] = useState(false)

    return (
        <>
            <SettingsNavContainer open={settingsNavOpen} isDesktop={isDesktop}>
                <SubNavLink to='/log/books' match={onLogBooks}>
                    testbooks
                </SubNavLink>
                <SubNavLink to='/log/music' match={onLogMusic}>
                    testmusic
                </SubNavLink>
                <SubNavLink to='/log/articles' match={onLogArticles}>
                    testarticles
                </SubNavLink>
                <SubNavLink to='/log/productivity' match={onLogProductivity}>
                    testproductivity
                </SubNavLink>
            </SettingsNavContainer>

            <LogNavContainer open={logNavOpen} isDesktop={isDesktop}>
                <SubNavLink to='/log/books' match={onLogBooks}>
                    books
                </SubNavLink>
                <SubNavLink to='/log/music' match={onLogMusic}>
                    music
                </SubNavLink>
                <SubNavLink to='/log/articles' match={onLogArticles}>
                    articles
                </SubNavLink>
                <SubNavLink to='/log/productivity' match={onLogProductivity}>
                    productivity
                </SubNavLink>
            </LogNavContainer>

            <NavMenuContainer isDesktop={isDesktop}>
                <FakeNavLink
                    onClick={() => {
                        setLogNavOpen(false)
                        setSettingsNavOpen(v => !v)
                    }}
                    match={settingsNavOpen}
                >
                    <SettingsIcon open={settingsNavOpen} />
                </FakeNavLink>
                <MainNavLink to='/projects' match={onProjects}>
                    projects
                </MainNavLink>
                <FakeNavLink
                    onClick={() => {
                        setSettingsNavOpen(false)
                        setLogNavOpen(v => !v)
                    }}
                    match={logNavOpen}
                >
                    log
                </FakeNavLink>
                <MainNavLink to='/blog' match={onBlog}>
                    blog
                </MainNavLink>
            </NavMenuContainer>
        </>
    )
}

const SiteTitle = styled(NavLink)`
    background-color: white;
    border-right: ${({ theme }) => `3px solid ${theme.commonColors.borderBlack}`};
    border-bottom: ${({ theme }) => `3px solid ${theme.commonColors.borderBlack}`};
    // background: rgba(255, 255, 255, 0.9);
    padding: 5px;
    z-index: 60;

    position: fixed;
    top: ${({ scrollY, isDesktop }) => (scrollY > 30 && !isDesktop ? '-55px' : '0px')};
    left: ${({ scrollY, isDesktop }) => (!isDesktop ? '2.5vw' : '25vw')};
    transition: top 0.6s, left 1s;
`

const H1Title = styled.h1`
    color: ${props => props.theme.colors.text};
`

const Nav = ({ path, isDesktop, ...props }) => {
    //detect scroll position
    const [scrollPos, setScrollPos] = useState(0)
    useEffect(() => {
        setScrollPos(window.scrollY)
        window.addEventListener('scroll', e => setScrollPos(window.scrollY))
        return () => {
            window.removeEventListener('scroll', e => setScrollPos(window.scrollY))
        }
    }, [])

    return (
        <>
            <SiteTitle to='/' scrollY={scrollPos} isDesktop={isDesktop}>
                <H1Title>chaipalaka</H1Title>
            </SiteTitle>
            <NavMenu path={path} isDesktop={isDesktop} />
        </>
    )
}

export default Nav
