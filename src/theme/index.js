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
            background: 'white',
            primaryAccent: '#2f6690',
            secondary: '#f7d4bc',
            
        },
        ...common,
    },
    dark: {
        colors: {
            ...common.commonColors,
            background: 'black',
            primaryAccent: 'palevioletred',
            secondary: '#412234',

        },
        ...common,
    },
}
