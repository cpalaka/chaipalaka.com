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

const PageTransition = ({children}) => {

    return(
        <motion.div
            initial={null}
            transition={{ type: "tween", duration: config.transitionSpeed, ease: 'easeOut' }}
            animate={null}
            variants={null}
        >
            {children}
        </motion.div>
    )
}

export default PageTransition