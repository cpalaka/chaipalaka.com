import React from "react"
import { Link } from "gatsby"

import Layout from "../components/SiteBackground"
import SEO from "../components/seo"
import styled from 'styled-components'
import TransitionLink from '../components/TransitionLink'
import { AnimatePresence, motion } from 'framer-motion'
import Page from '../components/Page'

const variants = {
    entering: {
        y: '0%'
    },
    exiting: {
        y: '-100%'
    },
    entered: {
        y: '0%'
    }
}

const FourthPage = ({ transitionStatus, entry, exit }) => {
    const from = entry.state.comingFrom
    // console.log('p2',props)
    // console.log(' p2 status: ', props.transitionStatus)
    // console.log(' p2 entry: ', props.entry)
    // console.log(' p2 exit: ', props.exit)
    return (
        <motion.div initial={{ y: from === 'bottom' ? '-100%' : '100%' }} transition={{ type: "tween", duration: 1, ease: 'easeOut' }} animate={transitionStatus} variants={variants}>
            <Page>
                <h1> BLAH TEST</h1>
                <p>Welcome to page 4</p>
                <TransitionLink to='/page-3' state={{comingFrom: 'top'}}>Back</TransitionLink>
            </Page>
        </motion.div >
    )
}

export default FourthPage
