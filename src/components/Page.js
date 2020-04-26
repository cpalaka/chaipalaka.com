import React from 'react'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import config from '../../config'

export const PageSection = styled.div`
    background: rgba(255, 255, 255, 0.9);
    // background: rgba(119, 122, 128, 0.98);
    margin: 15px auto;
    padding: 10px;
    border: 3px solid #040f0f;
    width: ${props => props.width ? props.width + 'vw' : 'initial'};
`

const PageChild = styled.div`
    width: 60vw;
    margin-left: 20vw;

    @media (max-width: 1024px) {
        width: 95vw;
        margin-left: 2.5vw;
    }


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
