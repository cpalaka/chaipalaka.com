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
        },
        ...common
    },
    dark: {
        colors: {
            background: 'black',
        },
        ...common
    },
}
