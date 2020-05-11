import { createGlobalStyle } from 'styled-components'

export default createGlobalStyle`
    html, body {
        margin: 0;
        padding: 0;
        // color: ${props => props.theme.colors.text}
    }
    img {
        margin: 0;
    }
`
