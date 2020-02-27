import React, { useCallback } from 'react'
import SEO from '../components/seo'
import styled from 'styled-components'
import TransitionLink from '../components/TransitionLink'
import Page from '../components/Page'
import PageTransition from '../components/Page'

import { useGlobalDispatch, useGlobalState } from '../state'

const Title = styled.h1`
    font-size: 46px;
    color: palevioletred;
    padding-bottom: 40px;
`

const Title2 = styled.p`
    font-size: 46px;
    color: palevioletred;
    padding-bottom: 40px;
`

const Content = styled.p`
    text-align: justify;
`

const Name = styled.span`
    :hover {
        ::after {
            content: 'tanya'
        }
    }
`

const IndexPage = props => {
    const dispatch = useGlobalDispatch()
    const state = useGlobalState()

    const toggleTheme = useCallback(() => {
        const theme = state.theme === 'light' ? 'dark' : 'light'
        dispatch({ type: 'setTheme', theme })
    }, [dispatch, state.theme])

    return (
        <Page {...props}>
            <h3> Hey, I'm <Name>Chai</Name> Palaka and this is my website!</h3>
            <p>
                This might have some more pertinent info about me - make me look relatively
                employable to any hungry recruiters.
            </p>
            <p>Probably a picture here as well.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Aliquet sagittis id consectetur purus ut faucibus pulvinar elementum integer. Dui id ornare arcu odio. Habitant morbi tristique senectus et. Amet porttitor eget dolor morbi non arcu risus quis varius. Et tortor at risus viverra adipiscing at in tellus integer. Erat pellentesque adipiscing commodo elit at imperdiet. Mauris in aliquam sem fringilla ut. Enim sit amet venenatis urna cursus. Elit eget gravida cum sociis. Habitant morbi tristique senectus et netus. Mi tempus imperdiet nulla malesuada pellentesque elit eget gravida cum. Ullamcorper eget nulla facilisi etiam dignissim diam quis enim. Suspendisse faucibus interdum posuere lorem ipsum.

Sit amet nisl suscipit adipiscing bibendum est ultricies integer quis. Nisl nunc mi ipsum faucibus vitae aliquet nec ullamcorper sit. Morbi enim nunc faucibus a pellentesque sit amet porttitor. Adipiscing elit duis tristique sollicitudin nibh sit amet. Scelerisque in dictum non consectetur a. Viverra vitae congue eu consequat ac felis donec et odio. Lorem mollis aliquam ut porttitor leo a diam sollicitudin. Congue eu consequat ac felis donec et odio pellentesque. Lorem mollis aliquam ut porttitor leo a diam sollicitudin tempor. Congue quisque egestas diam in arcu cursus euismod quis. Sapien pellentesque habitant morbi tristique senectus et netus. Nibh tellus molestie nunc non blandit massa enim. Amet facilisis magna etiam tempor orci eu lobortis elementum. Diam quis enim lobortis scelerisque fermentum dui faucibus in ornare. Consectetur a erat nam at lectus urna duis convallis. Eu feugiat pretium nibh ipsum consequat nisl vel pretium lectus. Urna nunc id cursus metus aliquam.

Faucibus turpis in eu mi bibendum. Ut lectus arcu bibendum at. Cum sociis natoque penatibus et magnis dis parturient. Donec ac odio tempor orci dapibus ultrices in iaculis. Velit ut tortor pretium viverra suspendisse potenti nullam ac tortor. Odio facilisis mauris sit amet massa vitae tortor condimentum. Suspendisse ultrices gravida dictum fusce. Ullamcorper eget nulla facilisi etiam dignissim. Felis imperdiet proin fermentum leo vel orci porta. Placerat duis ultricies lacus sed turpis tincidunt. Sapien faucibus et molestie ac feugiat sed lectus vestibulum. Lectus arcu bibendum at varius vel. Tortor consequat id porta nibh venenatis. Sapien et ligula ullamcorper malesuada proin libero nunc consequat. Dui faucibus in ornare quam viverra. Neque egestas congue quisque egestas diam. Risus nullam eget felis eget nunc. Lorem mollis aliquam ut porttitor leo a diam sollicitudin. Amet consectetur adipiscing elit duis tristique sollicitudin nibh sit. Odio euismod lacinia at quis risus sed.

Ornare quam viverra orci sagittis. Facilisis gravida neque convallis a cras semper auctor neque vitae. Egestas sed tempus urna et pharetra pharetra massa massa ultricies. Convallis posuere morbi leo urna molestie. Sed id semper risus in. Erat imperdiet sed euismod nisi porta lorem mollis aliquam ut. Convallis tellus id interdum velit laoreet id. Nibh venenatis cras sed felis eget velit aliquet sagittis. Pellentesque habitant morbi tristique senectus et netus et malesuada fames. Orci phasellus egestas tellus rutrum tellus pellentesque.

Dolor sit amet consectetur adipiscing elit. Sodales ut eu sem integer vitae. Est lorem ipsum dolor sit amet consectetur. Commodo ullamcorper a lacus vestibulum sed arcu non. Accumsan tortor posuere ac ut consequat semper viverra nam libero. Ipsum faucibus vitae aliquet nec ullamcorper sit amet risus. Massa ultricies mi quis hendrerit dolor. Faucibus in ornare quam viverra orci. Arcu bibendum at varius vel pharetra vel turpis. Vestibulum rhoncus est pellentesque elit ullamcorper dignissim. Diam sit amet nisl suscipit adipiscing. Arcu felis bibendum ut tristique et. Id interdum velit laoreet id donec ultrices tincidunt. Enim ut sem viverra aliquet eget sit. Elementum integer enim neque volutpat ac tincidunt vitae. Volutpat diam ut venenatis tellus in metus vulputate eu scelerisque. Lobortis mattis aliquam faucibus purus in massa tempor nec feugiat. Vel fringilla est ullamcorper eget nulla facilisi etiam dignissim. Cras fermentum odio eu feugiat pretium. Mattis molestie a iaculis at erat pellentesque adipiscing commodo.

Quis hendrerit dolor magna eget est lorem. Ornare arcu odio ut sem nulla pharetra diam sit. Et tortor consequat id porta nibh venenatis cras. Ut aliquam purus sit amet. Fringilla ut morbi tincidunt augue interdum. Quis eleifend quam adipiscing vitae proin sagittis nisl rhoncus mattis. Phasellus faucibus scelerisque eleifend donec. In fermentum et sollicitudin ac. A pellentesque sit amet porttitor eget dolor. Velit sed ullamcorper morbi tincidunt ornare massa. Fringilla phasellus faucibus scelerisque eleifend donec pretium vulputate sapien. In hac habitasse platea dictumst quisque sagittis purus sit.

Faucibus vitae aliquet nec ullamcorper sit amet risus nullam eget. Quisque egestas diam in arcu. Hendrerit gravida rutrum quisque non tellus orci ac auctor augue. Fringilla ut morbi tincidunt augue interdum velit euismod in. Mattis molestie a iaculis at. Donec massa sapien faucibus et molestie ac feugiat sed. Quisque egestas diam in arcu cursus euismod quis. Ultricies lacus sed turpis tincidunt id aliquet risus feugiat in. Id aliquet lectus proin nibh nisl. Diam sit amet nisl suscipit. Nibh tortor id aliquet lectus proin.

Amet nulla facilisi morbi tempus iaculis urna id volutpat lacus. Eu consequat ac felis donec et odio pellentesque. Volutpat sed cras ornare arcu dui vivamus arcu. Enim sed faucibus turpis in eu mi bibendum. Fringilla urna porttitor rhoncus dolor purus non. Tempus urna et pharetra pharetra. Non curabitur gravida arcu ac tortor dignissim convallis. Nisl tincidunt eget nullam non nisi est sit amet. Varius duis at consectetur lorem donec. Tristique magna sit amet purus gravida. Viverra accumsan in nisl nisi scelerisque eu ultrices vitae auctor.

Elementum eu facilisis sed odio. Aliquet nec ullamcorper sit amet risus nullam eget felis eget. Malesuada nunc vel risus commodo viverra maecenas accumsan lacus vel. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Lacus vel facilisis volutpat est velit egestas. Odio eu feugiat pretium nibh ipsum consequat. Pharetra diam sit amet nisl. Egestas congue quisque egestas diam. Ipsum faucibus vitae aliquet nec ullamcorper sit amet. Mi quis hendrerit dolor magna eget. Non quam lacus suspendisse faucibus interdum posuere.

In cursus turpis massa tincidunt dui ut ornare lectus. Aliquam purus sit amet luctus venenatis. Lorem donec massa sapien faucibus et molestie ac. Integer enim neque volutpat ac tincidunt vitae semper. Sit amet consectetur adipiscing elit ut. Diam quam nulla porttitor massa id neque. Lacus laoreet non curabitur gravida arcu ac tortor. Tortor at auctor urna nunc id cursus. Nunc faucibus a pellentesque sit amet porttitor eget dolor. Cursus mattis molestie a iaculis. Cursus turpis massa tincidunt dui ut ornare lectus sit amet. Vitae aliquet nec ullamcorper sit amet. Aliquet risus feugiat in ante metus dictum at tempor. Elit scelerisque mauris pellentesque pulvinar pellentesque habitant. Massa placerat duis ultricies lacus sed turpis tincidunt id.</p>
        </Page>
    )
}

export default IndexPage
