import React from "react"
import styled from "styled-components"

const PageSize = styled.div`
    width: 60vw;
    height: 100vh;
`

const PageStyle = styled.div`
    // border: 2px solid black;
    height: 100%;
    transform: translateX(20vw);
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
            <PageStyleChild>
            {children}
            </PageStyleChild>
        </PageStyle>
    </PageSize>
)

export default Page
