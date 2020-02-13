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
            primaryAccent: 'blue'
        },
        ...common
    },
    dark: {
        colors: {
            background: 'black',
            primaryAccent: 'blue'
        },
        ...common
    },
}
