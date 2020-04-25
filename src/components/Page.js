import React from 'react'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import config from '../../config'

const PageChild = styled.div`
    background: rgba(255, 255, 255, 0.9);

    width: 60vw;

    @media (max-width: 1024px) {
        width: 95vw;
        margin-left: 2.5vw;
    }

    padding: 15px;
    margin-left: 20vw;
    margin-bottom: 60px;
    margin-top: 10px;
`

const variants = dir => ({
    entering: {
        [dir]: '0%',
    },
    exiting: value => ({
        [dir]: value,
    }),
    entered: {
        [dir]: '0%',
    },
})

const Page = ({ children, transitionStatus, entry }) => {
    const from = entry.state.from

    // const startPos = from === 'left' || from === 'top' ? '100%' : '-100%'
    // const exitPos = from === 'left' || from === 'top' ? '-100%' : '100%'

    const startPos = '-100%'
    const exitPos = '-100%'

    // const direction = from === 'left' || from === 'right' ? 'x' : 'y'
    const direction = 'y'
    return (
        <motion.div
            custom={exitPos}
            initial={{ [direction]: startPos }}
            transition={{
                type: 'tween',
                duration: config.transitionSpeed,
                ease: 'easeOut',
            }}
            animate={transitionStatus}
            variants={variants(direction)}
        >
            <PageChild>{children}</PageChild>
        </motion.div>
    )
}

export default Page
