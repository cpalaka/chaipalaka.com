const path = require('path')
const { createFilePath } = require('gatsby-source-filesystem')

exports.onCreateWebpackConfig = ({ stage, actions, plugins }) => {
    actions.setWebpackConfig({
        plugins: [
            plugins.define({
                'global.GENTLY': false,
            }),
        ],
    })
}

exports.onCreateNode = ({ node, actions, getNode }) => {
    const { createNodeField } = actions
    if (node.internal.type === 'Mdx') {
        const value = createFilePath({ node, getNode })
        createNodeField({
            name: 'slug',
            node,
            value: `/blog${value}`,
        })
    }
}

exports.createPages = ({ graphql, actions }) => {
    const { createPage } = actions
    const blogPostTemplate = path.resolve(`src/components/BlogPostTemplate.js`)

    return graphql(
        `
            query loadPagesQuery {
                allMdx {
                    edges {
                        node {
                            id
                            fields {
                                slug
                            }
                        }
                    }
                }
            }
        `
    ).then(result => {
        if (result.errors) {
            throw result.errors
        }

        // Create blog post pages.
        result.data.allMdx.edges.forEach(edge => {
            // console.log(edge)
            createPage({
                // Path for this page — required
                path: `${edge.node.fields.slug}`,
                component: blogPostTemplate,
                context: {
                    id: edge.node.id
                },
            })
        })
    })
}
