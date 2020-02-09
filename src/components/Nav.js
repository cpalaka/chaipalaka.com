import React, { useCallback } from 'react'
import styled from 'styled-components'

const NavTab = styled.div`
    padding: auto;
    border: 1px solid black;
`

const NavBar = styled.nav`
    display: flex;
    flex-direction: row;
    height: 7vh;
    // width: 100%;
    justify-content: space-between;
`

const Nav = props => {
    // console.log('nav props', props)
    return (
        <NavBar>
            <NavTab>Home</NavTab>
            <NavTab>About</NavTab>
            <NavTab>Blo</NavTab>
        </NavBar>
    )
}

export default Nav
