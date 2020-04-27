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
    },
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
