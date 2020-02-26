const common = {
    font: {
        navButtonSize: '22px',
        subNavButtonSize: '18px'
    },
    dim: {
        nav: '50'
    }
}

export default {
    //add theme constants here
    light: {
        colors: {
            background: 'white',
            primaryAccent: '#9AECDB'
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
