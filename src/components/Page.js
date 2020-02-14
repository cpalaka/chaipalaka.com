import React from 'react'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import config from '../../config'

const PageParent = styled.div`
    overflow: hidden;
`

//hide scroll bars
const PageChild = styled.div`
    width: 100%;
    height: 89vh;

    overflow-y: scroll;
    padding-right: 18px;
    box-sizing: content-box;
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

    const startPos = from === 'left' || from === 'top' ? '100%' : '-100%'
    const exitPos = from === 'left' || from === 'top' ? '-100%' : '100%'

    const direction = from === 'left' || from === 'right' ? 'x' : 'y'
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
            <PageParent>
                <PageChild>{children}</PageChild>
            </PageParent>
        </motion.div>
    )
}

export default Page
