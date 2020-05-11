import Typography from 'typography'
import wikipediaTheme from 'typography-theme-Wikipedia'
import stAnnesTheme from 'typography-theme-st-annes'
import twinPeaksTheme from 'typography-theme-twin-peaks'
import stowLakeTheme from 'typography-theme-stow-lake' // **
import oceanBeachTheme from 'typography-theme-ocean-beach' // **
import irvingTheme from 'typography-theme-irving'
import fairyGatesTheme from 'typography-theme-fairy-gates' // **

stowLakeTheme.overrideThemeStyles = ({ rhythm }, options) => ({
    'h1, h2, h3, h4, h5, h6, p': { //for st annes
        marginTop: rhythm(0),
        marginBottom: rhythm(0),
    },
    // h1: {
    //     fontFamily: 'Lacquer',
    // },
    // a: {
    //     // color: 'initial',
    //     color: '#040f0f'
    // },

})

const typography = new Typography(stowLakeTheme)

export default typography
