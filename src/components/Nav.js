import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import TransitionLink from './TransitionLink'
import { Settings } from '@styled-icons/material/Settings'
import { useGlobalDispatch, useGlobalState } from '../state'

const Flexbox = styled.div`
    display: flex;
    flex-direction: row;
`

const NavLink = styled(TransitionLink)`
    display: inline-block;
    :hover {
        text-decoration: underline;
        color: ${({ theme }) => theme.colors.secondary};
    }
`

const MainNavLink = styled(NavLink)`
    color: ${({doesMatch, theme}) => (doesMatch ? theme.colors.primaryAccent : theme.colors.text)};
    font-size: ${props => props.theme.font.navButtonSize};
    margin: 0 5px;
`

const SubNavLink = styled(NavLink)`
    color: ${({doesMatch, theme}) => (doesMatch ? theme.colors.primaryAccent : theme.colors.text)};
    font-size: ${props => props.theme.font.subNavButtonSize};
    margin: 0 2px;
`

const NavMenuContainer = styled(Flexbox)`
    justify-content: space-between;
    z-index: 60;

    background-color: ${({ theme }) => `${theme.colors.navItemBackground}`};

    position: fixed;
    bottom: -4px;
    right: ${({ isDesktop, isWindows }) =>
        !isDesktop ? '0vw' : isWindows ? 'calc(21vw - 17px)' : '21vw'};
    transition: top 0.6s, left 1s;

    box-shadow: ${({ theme }) => `0px 2px 15px -9px ${theme.colors.blur}`};
    transform: rotate(-2deg);
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
    color: ${({doesMatch, theme}) => (doesMatch ? theme.colors.primaryAccent : theme.colors.text)};
    cursor: pointer;
    display: inline-block;
    font-size: ${props => props.theme.font.navButtonSize};
    margin: 0 5px;
    :hover {
        text-decoration: underline;
        color: ${({ theme }) => theme.colors.secondary};
    }
`

const LogNavContainer = styled.div`
    display: flex;
    flex-direction: column;
    background-color: ${({ theme }) => `${theme.colors.navItemBackground}`};
    position: fixed;

    right: ${({ isDesktop, isWindows }) =>
        !isDesktop ? '2.5vw' : isWindows ? 'calc(25vw - 17px)' : '25vw'};
    bottom: ${({ open }) => (open ? '50px' : '-110px')};

    z-index: 59;

    transition: bottom 1s;
    box-shadow: ${({ theme }) => `0px 2px 15px -9px ${theme.colors.blur}`};
    transform: rotate(1deg);
`

const SettingsNavContainer = styled(LogNavContainer)``

const NavMenu = ({ path, isDesktop, isWindows, ...props }) => {
    const [pathMatches, setPathMatches] = useState({
        onLog: path.includes('/log'),
        onWords: path.includes('/words'),
        onProjects: path === '/projects/',
        onLogBooks: path === '/log/books/',
        onLogMusic: path === '/log/music/',
        onLogArticles: path === '/log/articles/',
        onLogProductivity: path === '/log/productivity/',
    })

    useEffect(() => {
        setPathMatches({
            onLog: path.includes('/log'),
            onWords: path.includes('/words'),
            onProjects: path === '/projects/',
            onLogBooks: path === '/log/books/',
            onLogMusic: path === '/log/music/',
            onLogArticles: path === '/log/articles/',
            onLogProductivity: path === '/log/productivity/',
        })
    }, [path])
    // console.log(pathMatches)
    const [logNavOpen, setLogNavOpen] = useState(false)
    const [settingsNavOpen, setSettingsNavOpen] = useState(false)

    const dispatch = useGlobalDispatch()
    const state = useGlobalState()

    const toggleTheme = useCallback(() => {
        const theme = state.theme === 'light' ? 'dark' : 'light'
        dispatch({ type: 'setTheme', theme })
    }, [dispatch, state.theme])

    return (
        <>
            <SettingsNavContainer
                open={settingsNavOpen}
                isDesktop={isDesktop}
                isWindows={isWindows}
            >
                <FakeNavLink onClick={toggleTheme}>Change Theme</FakeNavLink>
            </SettingsNavContainer>

            <LogNavContainer open={logNavOpen} isDesktop={isDesktop} isWindows={isWindows}>
                <SubNavLink to='/log/books' doesMatch={pathMatches.onLogBooks}>
                    books
                </SubNavLink>
                <SubNavLink to='/log/music' doesMatch={pathMatches.onLogMusic}>
                    music
                </SubNavLink>
                <SubNavLink to='/log/articles' doesMatch={pathMatches.onLogArticles}>
                    articles
                </SubNavLink>
                <SubNavLink to='/log/productivity' doesMatch={pathMatches.onLogProductivity}>
                    productivity
                </SubNavLink>
            </LogNavContainer>

            <NavMenuContainer isDesktop={isDesktop} isWindows={isWindows}>
                <FakeNavLink
                    onClick={() => {
                        setLogNavOpen(false)
                        setSettingsNavOpen(v => !v)
                    }}
                    doesMatch={settingsNavOpen}
                >
                    <SettingsIcon open={settingsNavOpen} />
                </FakeNavLink>
                <MainNavLink to='/projects' doesMatch={pathMatches.onProjects}>
                    projects
                </MainNavLink>
                <FakeNavLink
                    onClick={() => {
                        setSettingsNavOpen(false)
                        setLogNavOpen(v => !v)
                    }}
                    doesMatch={logNavOpen || pathMatches.onLog}
                >
                    log
                </FakeNavLink>
                <MainNavLink to='/words' doesMatch={pathMatches.onWords}>
                    words
                </MainNavLink>
            </NavMenuContainer>
        </>
    )
}

const SiteTitle = styled(TransitionLink)`
    display: inline-block;
    :hover {
        text-decoration: underline;
        color: ${({ theme }) => theme.colors.secondary};
    }
    background-color: ${({ theme }) => `${theme.colors.navItemBackground}`};

    color: ${({ theme }) => `${theme.colors.navText}`};

    padding: 5px;
    z-index: 60;

    position: fixed;
    top: ${({ show, isDesktop }) => (!show && !isDesktop ? '-60px' : '-10px')};
    left: ${({ isDesktop }) => (!isDesktop ? '0vw' : '21vw')};
    transition: top 0.6s, left 1s;

    box-shadow: ${({ theme }) => `0px 2px 15px -9px ${theme.colors.blur}`};
    transform: rotate(-2deg);
    // border-radius: 20px;
`

const H1Title = styled.h1`
    color: ${props => props.theme.colors.text};
    font-size: 42px;
`

const Nav = ({ path, isDesktop, isWindows, ...props }) => {
    //detect scroll position
    const [scrollPos, setScrollPos] = useState({ val: 0, show: true })

    useEffect(() => {
        setScrollPos({ val: window.scrollY, show: true })
        window.addEventListener('scroll', e => {
            setScrollPos(old => ({ val: window.scrollY, show: window.scrollY < old.val }))
        })
        return () => {
            window.removeEventListener('scroll', e => {
                setScrollPos(old => ({ val: window.scrollY, show: window.scrollY < old.val }))
            })
        }
    }, [])

    return (
        <>
            <SiteTitle to='/' show={scrollPos.show} isDesktop={isDesktop}>
                <H1Title>chaipalaka</H1Title>
            </SiteTitle>
            <NavMenu path={path} isDesktop={isDesktop} isWindows={isWindows} />
        </>
    )
}

export default Nav
