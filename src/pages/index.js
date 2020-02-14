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

const IndexPage = props => {
    const dispatch = useGlobalDispatch()
    const state = useGlobalState()

    const toggleTheme = useCallback(() => {
        const theme = state.theme === 'light' ? 'dark' : 'light'
        dispatch({ type: 'setTheme', theme })
    }, [dispatch, state.theme])

    return (
        <Page {...props}>
            <h3> Hey, im chai palaka and this is my website!</h3>
            <p>
                This might have some more pertinent info about me - make me look relatively
                employable to any hungry recruiters.
            </p>
            <p>Probably a picture here as well.</p>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ac turpis egestas sed tempus urna et.
                Facilisi etiam dignissim diam quis. Nulla aliquet porttitor lacus luctus accumsan
                tortor posuere ac. Convallis a cras semper auctor neque vitae tempus quam. Nunc sed
                velit dignissim sodales ut eu sem. Commodo nulla facilisi nullam vehicula ipsum.
                Mauris rhoncus aenean vel elit scelerisque mauris pellentesque pulvinar
                pellentesque. Ante in nibh mauris cursus mattis molestie a iaculis at. Integer vitae
                justo eget magna fermentum. Sed ullamcorper morbi tincidunt ornare massa eget
                egestas purus. Sed risus ultricies tristique nulla. Commodo elit at imperdiet dui
                accumsan sit amet. Sociis natoque penatibus et magnis dis parturient montes nascetur
                ridiculus. Sed id semper risus in. Aliquam sem fringilla ut morbi. Amet nisl
                suscipit adipiscing bibendum est. Risus pretium quam vulputate dignissim suspendisse
                in est ante. In massa tempor nec feugiat nisl pretium fusce. Quis viverra nibh cras
                pulvinar mattis nunc. Nisi vitae suscipit tellus mauris a diam maecenas sed enim.
                Duis tristique sollicitudin nibh sit amet commodo nulla. Id semper risus in
                hendrerit gravida rutrum quisque non tellus. Sed vulputate odio ut enim. Fermentum
                leo vel orci porta non pulvinar neque laoreet suspendisse. Nisl nunc mi ipsum
                faucibus vitae aliquet nec ullamcorper sit. Molestie a iaculis at erat pellentesque
                adipiscing commodo elit. Mauris vitae ultricies leo integer malesuada. Viverra
                aliquet eget sit amet tellus cras adipiscing. Lacus laoreet non curabitur gravida.
                Pellentesque elit eget gravida cum sociis natoque. Diam sollicitudin tempor id eu
                nisl. Blandit aliquam etiam erat velit scelerisque in dictum non consectetur. Quis
                imperdiet massa tincidunt nunc pulvinar sapien et ligula ullamcorper. Sed adipiscing
                diam donec adipiscing tristique risus. Sapien eget mi proin sed libero. Nullam eget
                felis eget nunc lobortis mattis aliquam. Odio tempor orci dapibus ultrices in
                iaculis. Dignissim cras tincidunt lobortis feugiat vivamus at. Faucibus in ornare
                quam viverra orci. Sit amet consectetur adipiscing elit ut aliquam purus sit.
                Venenatis a condimentum vitae sapien. Mauris pharetra et ultrices neque ornare
                aenean euismod elementum nisi. Odio euismod lacinia at quis risus. Purus gravida
                quis blandit turpis cursus in hac habitasse. Vestibulum mattis ullamcorper velit sed
                ullamcorper. In iaculis nunc sed augue lacus viverra vitae congue. Metus aliquam
                eleifend mi in nulla posuere. Lectus mauris ultrices eros in cursus turpis. Sed
                libero enim sed faucibus turpis. Vitae tortor condimentum lacinia quis vel eros.
                Mauris in aliquam sem fringilla ut morbi tincidunt augue. Cras tincidunt lobortis
                feugiat vivamus at augue. Pharetra massa massa ultricies mi quis hendrerit dolor
                magna eget. Posuere sollicitudin aliquam ultrices sagittis orci a scelerisque purus.
                Dolor sit amet consectetur adipiscing elit. Velit dignissim sodales ut eu sem
                integer vitae. Vitae congue eu consequat ac felis donec. Vitae purus faucibus ornare
                suspendisse sed nisi. Scelerisque varius morbi enim nunc. Enim ut tellus elementum
                sagittis vitae et leo. Bibendum ut tristique et egestas quis ipsum suspendisse
                ultrices gravida. Enim neque volutpat ac tincidunt vitae semper. Egestas congue
                quisque egestas diam. Vestibulum rhoncus est pellentesque elit. Risus in hendrerit
                gravida rutrum quisque non tellus orci. Scelerisque eleifend donec pretium vulputate
                sapien nec. Porta nibh venenatis cras sed felis eget velit. Dignissim cras tincidunt
                lobortis feugiat vivamus at. Felis eget nunc lobortis mattis aliquam faucibus purus
                in. Arcu felis bibendum ut tristique. Porta lorem mollis aliquam ut porttitor leo.
                Ac ut consequat semper viverra nam libero justo laoreet. Risus ultricies tristique
                nulla aliquet enim tortor at. Semper risus in hendrerit gravida rutrum quisque non.
                Sapien eget mi proin sed libero enim sed faucibus. Etiam dignissim diam quis enim
                lobortis scelerisque. Mi ipsum faucibus vitae aliquet. Maecenas pharetra convallis
                posuere morbi leo urna molestie. Blandit cursus risus at ultrices. Lorem donec massa
                sapien faucibus et molestie ac. Lorem ipsum dolor sit amet, consectetur adipiscing
                elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ac turpis
                egestas sed tempus urna et. Facilisi etiam dignissim diam quis. Nulla aliquet
                porttitor lacus luctus accumsan tortor posuere ac. Convallis a cras semper auctor
                neque vitae tempus quam. Nunc sed velit dignissim sodales ut eu sem. Commodo nulla
                facilisi nullam vehicula ipsum. Mauris rhoncus aenean vel elit scelerisque mauris
                pellentesque pulvinar pellentesque. Ante in nibh mauris cursus mattis molestie a
                iaculis at. Integer vitae justo eget magna fermentum. Sed ullamcorper morbi
                tincidunt ornare massa eget egestas purus. Sed risus ultricies tristique nulla.
                Commodo elit at imperdiet dui accumsan sit amet. Sociis natoque penatibus et magnis
                dis parturient montes nascetur ridiculus. Sed id semper risus in. Aliquam sem
                fringilla ut morbi. Amet nisl suscipit adipiscing bibendum est. Risus pretium quam
                vulputate dignissim suspendisse in est ante. In massa tempor nec feugiat nisl
                pretium fusce. Quis viverra nibh cras pulvinar mattis nunc. Nisi vitae suscipit
                tellus mauris a diam maecenas sed enim. Duis tristique sollicitudin nibh sit amet
                commodo nulla. Id semper risus in hendrerit gravida rutrum quisque non tellus. Sed
                vulputate odio ut enim. Fermentum leo vel orci porta non pulvinar neque laoreet
                suspendisse. Nisl nunc mi ipsum faucibus vitae aliquet nec ullamcorper sit. Molestie
                a iaculis at erat pellentesque adipiscing commodo elit. Mauris vitae ultricies leo
                integer malesuada. Viverra aliquet eget sit amet tellus cras adipiscing. Lacus
                laoreet non curabitur gravida. Pellentesque elit eget gravida cum sociis natoque.
                Diam sollicitudin tempor id eu nisl. Blandit aliquam etiam erat velit scelerisque in
                dictum non consectetur. Quis imperdiet massa tincidunt nunc pulvinar sapien et
                ligula ullamcorper. Sed adipiscing diam donec adipiscing tristique risus. Sapien
                eget mi proin sed libero. Nullam eget felis eget nunc lobortis mattis aliquam. Odio
                tempor orci dapibus ultrices in iaculis. Dignissim cras tincidunt lobortis feugiat
                vivamus at. Faucibus in ornare quam viverra orci. Sit amet consectetur adipiscing
                elit ut aliquam purus sit. Venenatis a condimentum vitae sapien. Mauris pharetra et
                ultrices neque ornare aenean euismod elementum nisi. Odio euismod lacinia at quis
                risus. Purus gravida quis blandit turpis cursus in hac habitasse. Vestibulum mattis
                ullamcorper velit sed ullamcorper. In iaculis nunc sed augue lacus viverra vitae
                congue. Metus aliquam eleifend mi in nulla posuere. Lectus mauris ultrices eros in
                cursus turpis. Sed libero enim sed faucibus turpis. Vitae tortor condimentum lacinia
                quis vel eros. Mauris in aliquam sem fringilla ut morbi tincidunt augue. Cras
                tincidunt lobortis feugiat vivamus at augue. Pharetra massa massa ultricies mi quis
                hendrerit dolor magna eget. Posuere sollicitudin aliquam ultrices sagittis orci a
                scelerisque purus. Dolor sit amet consectetur adipiscing elit. Velit dignissim
                sodales ut eu sem integer vitae. Vitae congue eu consequat ac felis donec. Vitae
                purus faucibus ornare suspendisse sed nisi. Scelerisque varius morbi enim nunc. Enim
                ut tellus elementum sagittis vitae et leo. Bibendum ut tristique et egestas quis
                ipsum suspendisse ultrices gravida. Enim neque volutpat ac tincidunt vitae semper.
                Egestas congue quisque egestas diam. Vestibulum rhoncus est pellentesque elit. Risus
                in hendrerit gravida rutrum quisque non tellus orci. Scelerisque eleifend donec
                pretium vulputate sapien nec. Porta nibh venenatis cras sed felis eget velit.
                Dignissim cras tincidunt lobortis feugiat vivamus at. Felis eget nunc lobortis
                mattis aliquam faucibus purus in. Arcu felis bibendum ut tristique. Porta lorem
                mollis aliquam ut porttitor leo. Ac ut consequat semper viverra nam libero justo
                laoreet. Risus ultricies tristique nulla aliquet enim tortor at. Semper risus in
                hendrerit gravida rutrum quisque non. Sapien eget mi proin sed libero enim sed
                faucibus. Etiam dignissim diam quis enim lobortis scelerisque. Mi ipsum faucibus
                vitae aliquet. Maecenas pharetra convallis posuere morbi leo urna molestie. Blandit
                cursus risus at ultrices. Lorem donec massa sapien faucibus et molestie ac.
            </p>
        </Page>
    )
}

export default IndexPage
