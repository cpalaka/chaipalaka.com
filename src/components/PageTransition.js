import React from 'react'
import { motion } from 'framer-motion'
import config from '../../config'

const variantsX = {
    entering: {
        x: '0%'
    },
    exiting: value => ({
        x: '100%'
    }),
    entered: {
        x: '0%'
    }
}

const variantsY = {
    entering: {
        y: '0%'
    },
    exiting: value => ({
        y: '-100%'
    }),
    entered: {
        y: '0%'
    }
}

const variants = dir => ({
    entering: {
        [dir]: '0%'
    },
    exiting: value => ({
        [dir]: value
    }),
    entered: {
        [dir]: '0%'
    }
})

const PageTransition = ({children, transitionStatus, entry}) => {
    const from = entry.state.from
    const startPos = from === 'left' || from === 'top' ? '100%' : '-100%'
    const exitPos = from === 'left' || from === 'top' ? '-100%' : '100%'
    const direction = from === 'left' || from === 'right' ? 'x' : 'y'
    return(
        <motion.div
            custom={exitPos}
            initial={{[direction]: startPos}}
            transition={{ type: "tween", duration: config.transitionSpeed, ease: 'easeOut' }}
            animate={transitionStatus}
            variants={variants(direction)}
        >
            {children}
        </motion.div>
    )
}

export default PageTransition