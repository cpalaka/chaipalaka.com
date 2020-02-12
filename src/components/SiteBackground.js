import React from 'react'
import styled, { keyframes } from 'styled-components'
import MeshLine from './MeshLine'
import TransitionLink from './TransitionLink'

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

const colorAnim = keyframes`
    0% {
        background-color: rgba(50, 115, 220, 0.3);
    }
    50% {
        background-color: rgba(150, 11, 20, 0.3);
    }
    100% {
        background-color: rgba(50, 115, 220, 0.3);
    }
`

const Site = styled.div`
    height: 100vh;
    width: 100vw;
`

const FlexboxH = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`

const FlexboxH2 = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    min-width: 50%;
`

const SectionText = styled.div`
    color: ${props => (props.match ? 'blue' : 'initial')};
`

const StyledTL = styled(TransitionLink)`
    :hover {
        text-decoration: underline;
    }
`

const NavBar = props => {
    console.log(props)
    return (
        <FlexboxH2>
            <StyledTL to='/career' from='bottom'>
                <SectionText match={props.path === '/career/'}>career</SectionText>
            </StyledTL>
            <StyledTL to='/projects' from='bottom'>
                <SectionText match={props.path === '/projects/'}>projects</SectionText>
            </StyledTL>
            <StyledTL to='/log' from='bottom'>
                <SectionText match={props.path === '/log/'}>log</SectionText>
            </StyledTL>
        </FlexboxH2>
    )
}

const Logo = styled.span`
    display: inline-flex;
    align-self: ${props => (props.right ? 'flex-end' : 'flex-start')};
`

const SiteBackground = ({ children, ...props }) => {
    console.log(props)
    return (
        <Site>
            <MeshLine />
            <ContentContainer>
                {/* <Logo> */}
                <StyledTL to='/' from='right'>
                    <h1>chaipalaka</h1>
                </StyledTL>
                {/* </Logo> */}

                {children}

                <FlexboxH>
                    <NavBar {...props} />
                    {props.path === '/log/' 
                    ? <div style={{overflowX: 'scroll'}}>
                        <FlexboxH>
                            <div>Test1</div>
                            <div>Test2</div>
                            <div>Test3</div>
                            <div>Test1</div>
                            <div>Test2</div>
                            <div>Test3</div>
                            <div>Test1</div>
                            <div>Test2</div>
                            <div>Test3</div>
                        </FlexboxH>
                    </div>
                    : ''}
                    {/* <Logo right> */}
                    <StyledTL to='/blog' from='left'>
                        <p style={{ fontSize: '26px', marginBottom: 0, minWidth: '80px' }}>blog ></p>
                    </StyledTL>
                    {/* </Logo> */}
                </FlexboxH>
            </ContentContainer>
        </Site>
    )
}

export default SiteBackground
