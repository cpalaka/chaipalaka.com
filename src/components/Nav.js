import React, { useCallback } from 'react'
import styled from 'styled-components'
import TransitionLink from './TransitionLink'

const NavContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 85%;
`

const MainNavContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    min-width: ${props => (props.smol ? '40%' : '60%')};
    transition: min-width 1s;

    @media (max-width: 1024px) {
        min-width: ${props => (props.smol ? '57%' : '80%')};
    }
`

const SubNavContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-content: center;
`

const StyledTL = styled(TransitionLink)`
    color: ${props => (props.match ? 'blue' : 'initial')};
    font-size: ${props =>
        props.sub ? props.theme.font.subNavButtonSize : props.theme.font.navButtonSize};
    padding: 0;
    @media (max-width: 1024px) {
        padding: ${props => props.sub ? '0 5px' : '0'};
    }

    :hover {
        text-decoration: underline;
        color: ${({theme}) => theme.colors.primaryAccent};
    }
`

const MainNav = ({ path }) => {
    const onLog = path.includes('/log'),
        onCareer = path === '/career/',
        onProjects = path === '/projects/'
    return (
        <MainNavContainer smol={onLog}>
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

const SubNav = ({ path }) => {
    const onLogBooks = path === '/log/books/',
        onLogMusic = path === '/log/music/',
        onLogArticles = path === '/log/articles/',
        onLogProductivity = path === '/log/productivity/'

    return (
        <div style={{ overflowX: 'scroll', width: '100%', position: 'relative', bottom: '-5px', height: '100%' }}>
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
        </div>
    )
}

const Nav = ({ path, ...props }) => {
    const onLog = path.includes('/log')
    // console.log('onLog', onLog)
    return (
        <NavContainer>
            <MainNav path={path} />
            {onLog ? <SubNav path={path} /> : null}
        </NavContainer>
    )
}

export default Nav
