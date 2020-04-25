const path = require('path')


exports.onCreateWebpackConfig = ({ stage, actions, plugins }) => {
    actions.setWebpackConfig({
        plugins: [
            plugins.define({
                'global.GENTLY': false,
            }),
        ],
    })
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
                            frontmatter {
                                title
                                date
                                slug
                                tags
                            }
                            body
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
                path: `/blog${edge.node.frontmatter.slug}`,
                component: blogPostTemplate,
                context: {
                    title: edge.node.frontmatter.title,
                    date: edge.node.frontmatter.date,
                    tags: edge.node.frontmatter.tags,
                    body: edge.node.body
                },
            })
        })
    })
}
