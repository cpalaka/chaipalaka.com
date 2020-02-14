import React from 'react'
import styled from 'styled-components'
import TransitionLink from './TransitionLink'

const StyledTL = styled(TransitionLink)`
    color: ${props => (props.match ? props.theme.colors.primaryAccent : 'initial')};
    font-size: ${props =>
        props.sub ? props.theme.font.subNavButtonSize : props.theme.font.navButtonSize};
    padding: 0;
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

    min-width: ${props => (props.smol ? '40%' : '60%')};
    transition: min-width 1s;

    @media (max-width: 1024px) {
        min-width: ${props => (props.smol ? '47%' : '80%')};
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

const SubNavContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-content: center;
`

//below styled components are solely to remove bottom scroll bar
const SubNavContainerGrandparent = styled.div`
    overflow: hidden;
`

const SubNavContainerParent = styled.div`
    width: 25vw;
    position: relative;
    bottom: -5px;
    overflow-x: scroll;
    padding-bottom: 18px;
    height: 100%;
    box-sizing: content-box;

    @media (max-width: 1024px) {
        width: 35vw;
    }
`

const SubNav = ({ path }) => {
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
`

const BlogNavButton = styled(TransitionLink)`
    font-size: ${({ theme }) => theme.font.navButtonSize};
    margin-left: 2%;

    min-width: 50px;
    color: ${props => (props.match ? props.theme.colors.primaryAccent : 'initial')};
    :hover {
        color: ${({ theme }) => theme.colors.primaryAccent};
        text-decoration: underline;
    }
`

const Nav = ({ path, ...props }) => {
    const onLog = path.includes('/log')
    const onBlog = props.path === '/blog/'
    // console.log('onLog', onLog)
    return (
        <NavContainer>
            <MainNav path={path} />
            {onLog ? (
                <div style={{ overflow: 'hidden' }}>
                    <SubNav path={path} />
                </div>
            ) : null}
            <BlogNavButton to='/blog' from='left' match={onBlog}>
                blog
            </BlogNavButton>
        </NavContainer>
    )
}

export default Nav
