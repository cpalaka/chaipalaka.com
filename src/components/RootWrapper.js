import React from "react"
import { ThemeProvider } from "styled-components"
import theme from "../theme"
import GlobalStyles from "../theme/globalStyles"

const RootWrapper = ({children}) => {
    return (
        <ThemeProvider theme={theme}>
            <>
                <GlobalStyles />
                {children}
            </>
        </ThemeProvider>
    )
}

export default RootWrapper