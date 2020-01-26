import React from "react"
import { Link } from "gatsby"

import SEO from "../components/seo"
import styled from 'styled-components'
import TransitionLink from '../components/TransitionLink'
import { AnimatePresence, motion } from 'framer-motion'
import Page from '../components/Page'

const variants = {
    entering: {
        x: '0%'
    },
    exiting: (custom) => ({
        x: custom === 'left' ? '100%' : '-100%'
    }),
    entered: {
        x: '0%'
    }
}

const SecondPage = ({ transitionStatus, entry, exit }) => {
    console.log('p2', entry.state.comingFrom)
    // console.log(' p2 status: ', props.transitionStatus)
    // console.log(' p2 entry: ', props.entry)
    // console.log(' p2 exit: ', props.exit)
    return (
        <motion.div custom={entry.state.comingFrom} initial={{ x: entry.state.comingFrom === 'left' ? '100%' : '-100%' }} transition={{ type: "tween", duration: 1, ease: 'easeOut' }} animate={transitionStatus} variants={variants}>
            <Page>
                <h1>Hi from the second page</h1>
                <p>Welcome to page 2</p>
                <TransitionLink to='/' exit={{ length: 1 }} entry={{ length: 1, state: { comingFrom: 'left' } }}>Back</TransitionLink>
                <TransitionLink to='/page-3'>FOrward</TransitionLink>
            </Page>
        </motion.div >
    )
}

export default SecondPage
