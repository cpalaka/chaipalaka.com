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

    // border-left: ${({ theme }) => `3px solid ${theme.colors.borderBlack}`};
    // border-top: ${({ theme }) => `3px solid ${theme.colors.borderBlack}`};
    background-color: ${({ theme }) => `${theme.colors.background}`};

    position: fixed;
    bottom: -1px;
    right: ${({ isDesktop, isWindows }) =>
        !isDesktop ? '0vw' : isWindows ? 'calc(21vw - 17px)' : '21vw'};
    transition: top 0.6s, left 1s;

    box-shadow: ${({ theme }) => `0px 2px 15px -9px ${theme.colors.blur}`};
    transform: rotate(-1deg);
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
    background-color: ${({ theme }) => `${theme.colors.background}`};;
    position: fixed;

    bottom: 0px;
    right: ${({ isDesktop, isWindows }) =>
        !isDesktop ? '2.5vw' : isWindows ? 'calc(25vw - 17px)' : '25vw'};
    bottom: ${({ open }) => (open ? '50px' : '-102px')};

    z-index: 59;

    transition: bottom 1s;
    box-shadow: ${({ theme }) => `0px 2px 15px -9px ${theme.colors.blur}`};
    transform: rotate(1deg);
`

const SettingsNavContainer = styled(LogNavContainer)``

const NavMenu = ({ path, isDesktop, isWindows, ...props }) => {
    const onLog = path.includes('/log'),
        onBlog = path.includes('/blog'),
        onProjects = path === '/projects/'
    const onLogBooks = path === '/log/books/',
        onLogMusic = path === '/log/music/',
        onLogArticles = path === '/log/articles/',
        onLogProductivity = path === '/log/productivity/'

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

            <NavMenuContainer isDesktop={isDesktop} isWindows={isWindows}>
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

const SiteTitle = styled(TransitionLink)`
    display: inline-block;
    :hover {
        text-decoration: underline;
        color: ${({ theme }) => theme.colors.secondary};
    }
    background-color: ${({ theme }) => `${theme.colors.background}`};

    
    color: ${({ theme }) => `${theme.colors.navText}`};

    padding: 5px;
    z-index: 60;

    position: fixed;
    top: ${({ show, isDesktop }) => (!show && !isDesktop ? '-60px' : '0px')};
    left: ${({ isDesktop }) => (!isDesktop ? '0vw' : '21vw')};
    transition: top 0.6s, left 1s;

    box-shadow: ${({ theme }) => `0px 2px 15px -9px ${theme.colors.blur}`};
    transform: rotate(-1deg);
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
