/**
 * SEO component that queries for data with
 *  Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import { useStaticQuery, graphql } from 'gatsby'
import { useLocation } from '@reach/router'

function SEO({ description, lang, meta, image, title, article }) {
    const { pathname } = useLocation()
    const { site } = useStaticQuery(
        graphql`
            query {
                site {
                    siteMetadata {
                        defaultTitle: title
                        titleTemplate
                        defaultDescription: description
                        defaultImage: image
                        author
                        twitterUsername
                        siteUrl
                    }
                }
            }
        `
    )

    const {
        defaultTitle,
        titleTemplate,
        defaultDescription,
        siteUrl,
        defaultImage,
        twitterUsername
    } = site.siteMetadata

    const seo = {
        title: title || defaultTitle,
        description: description || defaultDescription,
        image: `${siteUrl}${image || defaultImage}`,
        url: `${siteUrl}${pathname}`,
    }

    // console.log(seo)

    return (
        <Helmet title={seo.title} titleTemplate={ title ? titleTemplate : null}>
            <meta name='description' content={seo.description} />
            <meta name='image' content={seo.image} />
            {seo.url && <meta property='og:url' content={seo.url} />}
            {(article ? true : null) && <meta property='og:type' content='article' />}
            {seo.title && <meta property='og:title' content={seo.title} />}
            {seo.description && <meta property='og:description' content={seo.description} />}
            {seo.image && <meta property='og:image' content={seo.image} />}
            <meta name='twitter:card' content='summary_large_image' />
            {twitterUsername && <meta name='twitter:creator' content={twitterUsername} />}
            {seo.title && <meta name='twitter:title' content={seo.title} />}
            {seo.description && <meta name='twitter:description' content={seo.description} />}
            {seo.image && <meta name='twitter:image' content={seo.image} />}
        </Helmet>
    )
}


export default SEO
