import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const allLetters = {
    bounce: {
        // fontSize: '22px',
        transition: {
            // from: '15px',
            staggerChildren: 0.05,
            delayChildren: 1
            // delay: 1

            // flip: Infinity
            // yoyo: Infinity
        }
    }
}

const singleLetter = {
    bounce: {
        // backgroundColor: '#cfa',
        fontSize: '23px',
        transition: {
            from: '20px',
            yoyo: Infinity,
            repeatDelay: 0.4,
            // duration: 4
            // delay: 2
        }
    }
}

const Button = styled.div`
    display: inline-block;
    padding: 5px;
    cursor: pointer;
    width: 150px;
    height: 100px;
`

const AnimatedButton = props => {
    let text = props.buttonText.split('')
    console.log(text)
    return (
        <Button>
            <motion.div variants={allLetters} animate='bounce'>
                {text.map((letter,i) => 
                    <motion.span key={letter+i} variants={singleLetter}>{letter}</motion.span>
                    )}
            </motion.div>
        </Button>
    )
}
//animate={{ fontSize: '25px'}} transition={{ from: '15px', duration: 1, flip: Infinity}}
export default AnimatedButton