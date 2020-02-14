const common = {
    font: {
        navButtonSize: '22px',
        subNavButtonSize: '18px'
    }
}

export default {
    //add theme constants here
    light: {
        colors: {
            background: 'white',
            primaryAccent: 'palevioletred'
        },
        ...common
    },
    dark: {
        colors: {
            background: 'black',
            primaryAccent: 'palevioletred'
        },
        ...common
    },
}
