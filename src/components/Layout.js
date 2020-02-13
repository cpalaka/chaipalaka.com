import React from 'react'
import styled, { keyframes } from 'styled-components'
import MeshLine from './MeshLine'
import TransitionLink from './TransitionLink'
import Nav from './Nav'

const ContentContainer = styled.div`
    position: absolute;

    width: 50vw;
    left: 25vw;
    top: 0;
    backdrop-filter: blur(10px);

    display: flex;
    flex-direction: column;
    height: 100vh;

    border-left: 1px solid rgba(50, 115, 220, 0.3);
    border-right: 1px solid rgba(50, 115, 220, 0.3);
    border-bottom: 10px solid blue;

    justify-content: space-between;

    @media (max-width: 600px) {
        left: 2.5vw;
        width: 95vw;
    }
`

const Site = styled.div`
    height: 100vh;
    width: 100vw;
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
    :hover {
        text-decoration: underline;
    }
`

const Layout = ({ children, ...props }) => {
    console.log(props)

    return (
        <Site>
            <MeshLine />
            <ContentContainer>
                <SiteTitle to='/' from='right'>
                    <h1>chaipalaka</h1>
                </SiteTitle>

                {children}
                <Nav {...props} />
                
                <BlogNavButton to='/blog' from='left'>
                    <p style={{ fontSize: '26px', marginBottom: 0, minWidth: '80px' }}>blog</p>
                </BlogNavButton>
            </ContentContainer>
        </Site>
    )
}

export default Layout
