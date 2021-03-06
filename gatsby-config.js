module.exports = {
    siteMetadata: {
        title: `chaipalaka`,
        titleTemplate: ` %s · chaipalaka`, 
        description: "Chai Palaka's personal website - made with Gatsby!",
        author: `Chai Palaka`,
        image: '/images/gradpic.jpg',
        siteUrl: 'https://www.chaipalaka.com',
        twitterUsername: 'sincosan'
    },
    plugins: [
        `gatsby-plugin-react-helmet`,
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                name: `images`,
                path: `${__dirname}/images`,
            },
        },
        `gatsby-transformer-sharp`,
        `gatsby-plugin-sharp`,
        {
            resolve: `gatsby-plugin-manifest`,
            options: {
                name: `gatsby-starter-default`,
                short_name: `starter`,
                start_url: `/`,
                background_color: `#663399`,
                theme_color: `#663399`,
                display: `minimal-ui`,
                icon: `images/favicons/favicon-32x32.png`, // This path is relative to the root of the site.
            },
        },
        {
            resolve: `gatsby-plugin-s3`,
            options: {
                bucketName: 'chaisblogsite',
                protocol: 'https',
                hostname: 'www.chaipalaka.com',
            },
        },
        //source mdx files
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                name: `blog_posts`,
                path: `${__dirname}/posts`,
            },
        },
        `gatsby-plugin-mdx`,
        {
            resolve: `gatsby-plugin-styled-components`,
            options: {
                // Add any options here
            },
        },
        {
            resolve: `gatsby-plugin-transition-link`,
            options: {
                layout: require.resolve('./src/components/Layout.js'),
            },
        },
        {
            resolve: `gatsby-plugin-typography`,
            options: {
                pathToConfigModule: `src/theme/typography`,
            },
        },
        // this (optional) plugin enables Progressive Web App + Offline functionality
        // To learn more, visit: https://gatsby.dev/offline
        // `gatsby-plugin-offline`,
        {
            resolve: `gatsby-plugin-google-analytics`,
            options: {
                // replace "UA-XXXXXXXXX-X" with your own Tracking ID
                trackingId: 'UA-103141426-2',
            },
        },
        `gatsby-plugin-sitemap`,
    ],
}
