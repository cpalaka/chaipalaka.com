const common = {
    font: {
        navButtonSize: '26px',
        subNavButtonSize: '21px',
    },
    dim: {
        nav: '50',
    },
    commonColors: {
        // text: '#040f0f',
        borderBlack: '#040f0f',
    },
    blogColors: {
        dev: {
            primary: 'rgba(0,0,0,0)',
            secondary: 'rgba(6, 98, 60,0.6)',
        },
        misc: {
            primary: 'rgba(0,0,0,0)',
            secondary: 'rgba(7, 121, 228,0.6)',
        },
        reviews: {
            primary: 'rgba(0,0,0,0)',
            secondary: 'rgba(255, 81, 0,0.6)',
        },
    },
}

export default {
    //add theme constants here
    light: {
        colors: {
            ...common.commonColors,
            navItemBackground: 'white',
            pageBackground: 'rgba(255, 255, 255, 0.5)',
            pageSectionBackground: 'rgba(255, 255, 255, 0.8)',
            pageSectionText: '#040f0f',
            pageSectionShadow: '#040f0f',
            primaryAccent: '#2f6690',
            secondary: '#ea638c',
            navText: '#040f0f',
            text: '#040f0f',
            blur: '#040f0f',
            meshLineColors: ['#5F4BB6', '#86A5D9', '#26F0F1', '#C4EBC8'],
            // meshLineColors: ['#A2CCB6', '#FCEEB5', '#EE786E', '#e0feff', 'lightpink', 'lightblue']
            meshLineBackground: '#202A25',
        },
        ...common,
    },
    dark: {
        colors: {
            ...common.commonColors,
            text: 'white',
            navItemBackground: '#000300',
            pageBackground: 'rgba(0, 3, 0, 0.5)',
            pageSectionBackground: 'rgba(0, 3, 0, 0.8)',
            pageSectionText: 'white',
            pageSectionShadow: '#040f0f',
            primaryAccent: '#2f6690',
            secondary: '#ea638c',
            navText: 'white',
            borderBlack: 'grey',
            blur: '#040f0f',
            meshLineColors: ['#FF01FB', '#02A9EA', '#FAFF00', '#FFFEFF'],
            meshLineBackground: '#000300',
        },
        ...common,
    },
}

//dark background candidates:
//brown: #4d3e3e
//dark blue: #222831
