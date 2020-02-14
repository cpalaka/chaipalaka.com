import React from 'react'
import styled, { keyframes } from 'styled-components'
import MeshLine from './MeshLine'
import TransitionLink from './TransitionLink'
import Nav from './Nav'

/*TODO:
* 
* 2. 
* 3. fix three js blurriness
* 4. windows scrollbars
* 5. ios safari bottom bar
*/


const ContentContainer = styled.div`
    position: absolute;

    width: 50vw;
    height: 100vh;

    left: 25vw;
    top: 0;

    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    display: flex;
    flex-direction: column;

    border-left: 1px solid rgba(50, 115, 220, 0.3);
    border-right: 1px solid rgba(50, 115, 220, 0.3);
    border-bottom: 10px solid ${({theme}) => theme.colors.primaryAccent};

    justify-content: space-between;

    @media (max-width: 1024px) {
        left: 2.5vw;
        width: 95vw;
    }
`

const Site = styled.div`
    height: 100vh;
    width: 100vw;
    // overflow: hidden;
`

const SiteTitle = styled(TransitionLink)`
    :hover {
        text-decoration: underline;
    }
`

const BlogNavButton = styled(TransitionLink)`
    position: absolute;
    right: 0;
    bottom: 0;
    font-size: ${({theme}) => theme.font.navButtonSize};

    min-width: 50px;
    color: ${props => (props.match ? props.theme.colors.primaryAccent : 'initial')};
    :hover {
        color: ${({theme}) => theme.colors.primaryAccent};
        text-decoration: underline;
    }
`

const Layout = ({ children, ...props }) => {
    const onBlog = props.path === '/blog/'
    return (
        <Site>
            <MeshLine />
            <ContentContainer>
                <SiteTitle to='/' from='right'>
                    <h1>chaipalaka</h1>
                </SiteTitle>

                {children}
                <Nav {...props} />
                
                <BlogNavButton to='/blog' from='left' match={onBlog}>
                    blog
                </BlogNavButton>
            </ContentContainer>
        </Site>
    )
}

export default Layout
