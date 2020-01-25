import React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"
import styled from 'styled-components'
import TransitionLink from "gatsby-plugin-transition-link"
import { AnimatePresence, motion } from 'framer-motion'

const PageLayout = styled.div`
    border: 2px solid black;
    width: 50vw;
    height: 100vh;
    // margin: 2.5% 0% 2.5% 0%;
    transform: translateX(50%);
    overflow: scroll;
`

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

const SecondPage = props => {
    // console.log('p2',props)
    console.log(' p2 status: ', props.transitionStatus)
    // console.log(' p2 entry: ', props.entry)
    // console.log(' p2 exit: ', props.exit)
    return (
        <motion.div initial={{x: '100%'}} animate={props.transitionStatus} variants={variants}>
            <PageLayout>
                <h1>Hi from the second page</h1>
                <p>Welcome to page 2</p>
                <TransitionLink to='/' exit={{ length: 1 }} entry={{  length: 1 }}>Back</TransitionLink>
            </PageLayout>
        </motion.div >
    )
}

export default SecondPage
