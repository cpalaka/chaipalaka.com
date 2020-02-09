import React from 'react'
import styled from 'styled-components'

const PageStyle = styled.div`
    overflow: hidden;
    // background-color: white;
`

//hide scroll bars
const PageStyleChild = styled.div`
    width: 100%;
    height: 90vh;

    overflow-y: scroll;
    padding-right: 18px;
    box-sizing: content-box;
`

const Page = ({ children }) => (
    <PageStyle>
        <PageStyleChild>{children}</PageStyleChild>
    </PageStyle>
)

export default Page
