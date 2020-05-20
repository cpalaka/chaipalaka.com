import React from 'react'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import config from '../../config'

export const PageSection = styled.div`
    background: ${({ theme }) => `${theme.colors.pageSectionBackground}`};
    color: ${({ theme }) => `${theme.colors.pageSectionText}`};
    // background: white;

    margin: 15px auto;

    padding-top: ${({ padding, top }) => (padding ? padding : top ? '30px' : '10px')};
    padding-bottom: ${({ padding }) => (padding ? padding : '10px')};
    padding-left: ${({ padding }) => (padding ? padding : '10px')};
    padding-right: ${({ padding }) => (padding ? padding : '10px')};

    width: ${({ width }) => (width ? width + 'vw' : 'initial')};
    box-shadow: ${({ theme }) => `inset 0px 0px 15px -10px ${theme.colors.pageSectionShadow}`};
    border-radius: 12px;
`

const PageChild = styled.div`
    width: 50vw;
    margin-left: 25vw;

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

    const startPos = '-110%'
    const exitPos = '-110%'

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
