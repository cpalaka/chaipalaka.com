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
            primaryAccent: '#2f6690',
            secondary: '#f7d4bc',
            text: '#040f0f'
        },
        ...common
    },
    dark: {
        colors: {
            background: 'black',
            primaryAccent: 'palevioletred',
            secondary:'#412234'
        },
        ...common
    },
}

