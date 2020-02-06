import React from "react"
import styled from "styled-components"

const PageSize = styled.div`
    width: 100%;
    height: 100vh;
    // @media (max-width: 600px) {
    //     width: 90vw;
    // }
`

const PageStyle = styled.div`
    // border: 2px solid black;
    // height: 100%;
    // transform: translateX(20vw);
    overflow: hidden;
    background-color: white;
`

//hide scroll bars
const PageStyleChild = styled.div`
    width: 100%;
    height: 93vh;
    overflow-y: scroll;
    padding-right: 18px;
    box-sizing: content-box;
`

const Page = ({ children }) => (
    // <PageSize>
        <PageStyle>
            <PageStyleChild>{children}</PageStyleChild>
        </PageStyle>
    // </PageSize>
)

export default Page
