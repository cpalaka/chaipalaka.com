import React from 'react'
import TL from 'gatsby-plugin-transition-link'
import config from '../../config'

const TransitionLink = props => (
    <TL
        to={props.to}
        exit={{ length: config.transitionSpeed }}
        entry={{
            length: config.transitionSpeed,
            state: { from: props.from },
            delay: config.transitionSpeed
        }}
        className={props.className}
    >
        {props.children}
    </TL>
)

export default TransitionLink
