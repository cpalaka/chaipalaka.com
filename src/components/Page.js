import React from "react"
import styled from "styled-components"

const PageSize = styled.div`
    width: 50vw;
    height: 100vh;
`

const PageStyle = styled.div`
    border: 2px solid black;
    height: 90%;
    transform: translate(50%, 5%);
    overflow: scroll;
    background-color: white;
`

const Page = ({ children }) => (
    <PageSize>
        <PageStyle>{children}</PageStyle>
    </PageSize>
)

export default Page
