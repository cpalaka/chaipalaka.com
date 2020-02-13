import React, { useCallback } from 'react'
import styled from 'styled-components'
import TransitionLink from './TransitionLink'

const NavContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 75%;
`

const MainNavContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    min-width: ${props => (props.smol ? '30%' : '50%')};
    transition: min-width 1s;

    @media (max-width: 600px) {
        min-width: ${props => (props.smol ? '50%' : '70%')};
    }
`

const SubNavContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`

const StyledTL = styled(TransitionLink)`
    :hover {
        text-decoration: underline;
    }
`

const SectionText = styled.div`
    color: ${props => (props.match ? 'blue' : 'initial')};
`

const MainNav = ({ path }) => {
    // console.log(props)
    const onLog = path.includes('log'),
        onCareer = path === '/career/',
        onProjects = path === '/projects/'
    return (
        <MainNavContainer smol={onLog}>
            <StyledTL to='/career' from='bottom'>
                <SectionText match={onCareer}>career</SectionText>
            </StyledTL>
            <StyledTL to='/projects' from='bottom'>
                <SectionText match={onProjects}>projects</SectionText>
            </StyledTL>
            <StyledTL to='/log' from='bottom'>
                <SectionText match={onLog}>{`log${onLog ? ':' : ''}`}</SectionText>
            </StyledTL>
        </MainNavContainer>
    )
}

const SubNav = ({ path }) => {
    const onLogBooks = path === '/log/books/',
        onLogMusic = path === '/log/music/',
        onLogArticles = path === '/log/articles/',
        onLogProductivity = path === '/log/productivity/'

    return (
        <div style={{ overflowX: 'scroll', width: '100%' }}>
            <SubNavContainer>
                <StyledTL to='/log/books' from='top'>
                    <SectionText match={onLogBooks}>books</SectionText>
                </StyledTL>

                <StyledTL to='/log/music' from='top'>
                    <SectionText match={onLogMusic}>music</SectionText>
                </StyledTL>

                <StyledTL to='/log/articles' from='top'>
                    <SectionText match={onLogArticles}>articles</SectionText>
                </StyledTL>

                <StyledTL to='/log/productivity' from='top'>
                    <SectionText match={onLogProductivity}>productivity</SectionText>
                </StyledTL>
            </SubNavContainer>
        </div>
    )
}

const Nav = ({ path, ...props }) => {
    // console.log('nav props', props)
    const onLog = path.includes('log')
    return (
        <NavContainer>
            <MainNav path={path} />
            {onLog ? <SubNav path={path} /> : null}
        </NavContainer>
    )
}

export default Nav
