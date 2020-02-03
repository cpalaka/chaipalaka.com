import React, { useCallback } from "react"
import styled from "styled-components"

const NavTab = styled.div`
    position: fixed;
    top: ${props => props.pos};
    left: 15vw;
`

const Nav = ({children, ...props}) => {
    // console.log('nav props', props)
    return (
        <>
            <NavTab pos='0px'>Home</NavTab>
            <NavTab pos='20px'>Blog</NavTab>
            <NavTab pos='40px'>About</NavTab>
            {children}
        </>
    )
}

export default Nav