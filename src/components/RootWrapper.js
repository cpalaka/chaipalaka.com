import React, { useReducer } from 'react'
import { ThemeProvider } from 'styled-components'
import theme from '../theme'
import GlobalStyles from '../theme/globalStyles'
import {
    globalDispatchContext,
    globalStateContext,
    globalStateReducer,
    initialState,
} from '../state'

const RootWrapper = ({ children, ...props }) => {
    const [state, dispatch] = useReducer(globalStateReducer, initialState)
    const currentTheme = theme[state.theme]

    return (
        <globalDispatchContext.Provider value={dispatch}>
            <globalStateContext.Provider value={state}>
                <ThemeProvider theme={currentTheme}>
                    <>
                        <GlobalStyles />
                        {children}
                    </>
                </ThemeProvider>
            </globalStateContext.Provider>
        </globalDispatchContext.Provider>
    )
}

export default RootWrapper
