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

exports.createSchemaCustomization = ({ actions }) => {
    const { createTypes } = actions
    const typeDefs = `
        type AllTags implements Node {
            tags: [String]!
        }
    `
    createTypes(typeDefs)
}

exports.createResolvers = ({ createResolvers }) => {
    const resolvers = {
        Query: {
            type: 'AllTags',
            allTags: {
                resolve(source, args, context, info) {
                    let posts = context.nodeModel.getAllNodes({ type: 'Mdx' })
                    let tags = posts
                        .map(el => el.frontmatter.tags.split(','))
                        .reduce((acc, el) => acc.concat(el), [])
                        .filter((el, i, self) => self.indexOf(el) === i)
                        .sort()

                    return { tags: tags }
                },
            },
        },
    }
    createResolvers(resolvers)
}

exports.createPages = ({ graphql, actions, createNodeId, createContentDigest }) => {
    const { createPage, createNode } = actions
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
                            frontmatter {
                                tags
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
            createPage({
                path: `${edge.node.fields.slug}`,
                component: blogPostTemplate,
                context: {
                    id: edge.node.id,
                },
            })
        })
    })
}
