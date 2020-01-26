import React from "react"
import { Link } from "gatsby"
import Image from "../components/image"
import SEO from "../components/seo"
import styled from 'styled-components'
import { AnimatePresence, motion } from 'framer-motion'
import TransitionLink from '../components/TransitionLink'
import Page from '../components/Page'

const Title = styled.h1`
    font-size: 46px;
    color: palevioletred;
    padding-bottom: 40px;
`;

const variants = {
    entering: {
        x: '0%'
    },
    exiting: {
        x: '-100%'
    },
    entered: {
        x: '0%'
    }
}

const IndexPage = ({ transitionStatus, entry, exit }) => {
    // console.log('p1',props)
    // console.log(' p1 status: ', props.transitionStatus)
    // console.log(' p1 entry: ', props.entry)
    // console.log(' p1 exit: ', props.exit)
    
    return (
        <motion.div initial={{x: '-100%'}} transition={{ type: "tween", duration: 1, ease: 'easeOut' }} animate={transitionStatus} variants={variants}>
                <Page>
                    <Title>Testing styled</Title>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Mauris augue neque gravida in fermentum et. Mauris a diam maecenas sed enim. Purus viverra accumsan in nisl nisi scelerisque eu. Ut eu sem integer vitae justo eget. Quis auctor elit sed vulputate mi sit amet mauris commodo. Suspendisse potenti nullam ac tortor vitae purus. Senectus et netus et malesuada fames ac turpis egestas. Rhoncus mattis rhoncus urna neque viverra justo. Malesuada bibendum arcu vitae elementum curabitur. Ultrices eros in cursus turpis massa tincidunt. Id donec ultrices tincidunt arcu non.
                
                Dolor purus non enim praesent elementum. Eu lobortis elementum nibh tellus molestie nunc non. Vulputate enim nulla aliquet porttitor lacus luctus accumsan tortor posuere. Cras adipiscing enim eu turpis egestas pretium. Massa tincidunt dui ut ornare lectus sit amet. Sociis natoque penatibus et magnis dis. Vel fringilla est ullamcorper eget nulla. Sed id semper risus in hendrerit. Nulla aliquet enim tortor at auctor urna nunc. Cursus risus at ultrices mi tempus. Feugiat in fermentum posuere urna nec. Ante in nibh mauris cursus mattis molestie a iaculis. Risus commodo viverra maecenas accumsan lacus.
                
                Aliquam etiam erat velit scelerisque. Viverra accumsan in nisl nisi scelerisque eu ultrices vitae auctor. Etiam sit amet nisl purus. Aliquam faucibus purus in massa tempor nec feugiat nisl pretium. Viverra vitae congue eu consequat. Nulla pharetra diam sit amet. Vel quam elementum pulvinar etiam non quam. Nec nam aliquam sem et tortor consequat id. Sed tempus urna et pharetra. Hendrerit gravida rutrum quisque non. Nunc faucibus a pellentesque sit amet porttitor. Sed vulputate odio ut enim blandit volutpat maecenas volutpat blandit. Aliquet bibendum enim facilisis gravida neque convallis a cras. Arcu non sodales neque sodales ut. Consectetur purus ut faucibus pulvinar elementum integer enim neque.
                    </p>
                    <TransitionLink to='/page-2' state={{comingFrom: 'left'}}>Page 2</TransitionLink>
                </Page>
        </motion.div>
    )
}

export default IndexPage
