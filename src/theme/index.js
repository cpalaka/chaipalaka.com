const common = {
    font: {
        navButtonSize: '22px',
        subNavButtonSize: '18px',
    },
    dim: {
        nav: '50',
    },
    commonColors: {
        text: '#040f0f',
        borderBlack: '#040f0f'
    },
    blogColors: {
        dev: {
            primary: 'rgba(0,0,0,0)',
            secondary: '#f9f9f9'
        },
        misc: {
            primary: 'rgba(0,0,0,0)',
            secondary: 'rgba(217, 229, 255,0.6)'
        },
        reviews: {
            primary: 'rgba(0,0,0,0)',
            secondary: 'rgba(255, 191, 206,0.6)'
        },
    }
}

export default {
    //add theme constants here
    light: {
        colors: {
            ...common.commonColors,
            // background: 'white',
            primaryAccent: '#2f6690',
            secondary: '#ea638c',
        },
        ...common,
    },
    dark: {
        colors: {
            ...common.commonColors,
            // text: 'white',
            background: 'black',
            primaryAccent: '#2f6690',
            secondary: '#ea638c',
        },
        ...common,
    },
}
