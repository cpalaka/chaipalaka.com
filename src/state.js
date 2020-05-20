import { createContext, useContext } from 'react'

export const globalStateContext = createContext()
export const globalDispatchContext = createContext()

export const useGlobalState = () => useContext(globalStateContext)
export const useGlobalDispatch = () => useContext(globalDispatchContext)

export const initialState = {
    theme: 'light',
    isInfoSectionOpen: false,
    nowPlayingVideo: null,
    postAnchors: null,
    onPost: null,
}

export const globalStateReducer = (state, action) => {
    switch (action.type) {
        case 'setTheme':
            if (action.theme !== state.theme) {
                localStorage.setItem('theme', action.theme)
                return {
                    ...state,
                    theme: action.theme,
                }
            }

            return state
        case 'setInfoSection':
            return {
                ...state,
                isInfoSectionOpen: action.data,
            }
        case 'setNowPlayingVideo':
            const toBeClosed = action.videoId === null
            return {
                ...state,
                isInfoSectionOpen: toBeClosed ? state.onPost : state.isInfoSectionOpen,
                nowPlayingVideo: action.videoId,
            }
        case 'setPostAnchors':
            return {
                ...state,
                postAnchors: action.anchors,
            }
        case 'removePostAnchors':
            return {
                ...state,
                postAnchors: null,
            }
        case 'setOnPost':
            return {
                ...state,
                onPost: action.post,
            }
        default:
            return state
    }
}
