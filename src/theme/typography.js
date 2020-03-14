import Typography from 'typography'
import wikipediaTheme from 'typography-theme-Wikipedia'
import stAnnesTheme from 'typography-theme-st-annes'
import twinPeaksTheme from 'typography-theme-twin-peaks'

stAnnesTheme.overrideThemeStyles = ({ rhythm }, options) => ({
    'h1, h2, h3, h4, h5, h6, p': {
        marginTop: rhythm(0),
        marginBottom: rhythm(0),
    },
    // h1: {
    //     fontFamily: 'Lacquer',
    // },
    a: {
        // color: 'initial',
        color: '#040f0f'
    },

})

const typography = new Typography(stAnnesTheme)

export default typography
