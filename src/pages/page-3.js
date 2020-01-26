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
    exiting: {
        x: '100%'
    },
    entered: {
        x: '0%'
    }
}

const ThirdPage = ({ transitionStatus, entry, exit }) => {

    // console.log('p2', props)
    // console.log(' p2 status: ', props.transitionStatus)
    // console.log(' p2 entry: ', props.entry)
    // console.log(' p2 exit: ', props.exit)
    return (
        <motion.div initial={{ x: '100%' }} transition={{ type: "tween", duration: 1, ease: 'easeOut' }} animate={transitionStatus} variants={variants}>
            <Page>
                <h1>BLAH TEST BLAH TEST</h1>
                <p>Welcome to page 3</p>
                <TransitionLink to='/page-2' state={{comingFrom: 'right'}}>Back</TransitionLink>
                <TransitionLink to='/page-4' state={{comingFrom: 'bottom'}}>Up</TransitionLink>
            </Page>
        </motion.div >
    )
}

export default ThirdPage
