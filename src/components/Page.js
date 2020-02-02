import React from "react"
import styled from "styled-components"

const PageSize = styled.div`
    width: 50vw;
    height: 100vh;
    @media (max-width: 600px) {
        width: 90vw;
    }
`

const PageStyle = styled.div`
    border: 2px solid black;
    height: 90%;
    transform: translate(25vw, 5vh);
    @media (max-width: 600px) {
        transform: translate(5vw, 5vh);
    }
    overflow: hidden;
    background-color: white;
`

//hide scroll bars
const PageStyleChild = styled.div`
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    padding-right: 17px;
    box-sizing: content-box;
`

const Page = ({ children }) => (
    <PageSize>
        <PageStyle>
            <PageStyleChild>{children}</PageStyleChild>
        </PageStyle>
    </PageSize>
)

export default Page
