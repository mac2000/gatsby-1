const fs = require(`fs-extra`)
const path = require(`path`)

const slugify = require(`@sindresorhus/slugify`)

exports.onPostBuild = async ({ graphql }) => {
  const results = await graphql(`
    {
      mdx(slug: { eq: "html" }) {
        html
      }
    }
  `)

  await fs.outputJSON(
    path.join(__dirname, `public`, `html-queried-like-feed-plugin.json`),
    results,
    { spaces: 2 }
  )
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions

  createTypes(`
    type Mdx implements Node {
      frontmatter: Frontmatter
    }
    type Frontmatter {
      title: String
    }
  `)
}
// Add custom fields to our MDX nodes
exports.onCreateNode = async ({ node, actions, getNode, reporter, cache }) => {
  const { createNodeField } = actions
  if (node.internal.type === `Mdx`) {
    // Set slug based on frontmatter, fall back to filename
    const fileNode = getNode(node.parent)

    if (!fileNode) {
      return
    }

    const slug = []
    if (fileNode.relativeDirectory) {
      slug.push(fileNode.relativeDirectory)
    }

    if (node.frontmatter.slug) {
      slug.push(slugify(node.frontmatter.slug))
    } else if (fileNode.name !== `index`) {
      slug.push(slugify(fileNode.name))
    }

    createNodeField({
      node,
      name: `slug`,
      value: `/${slug.join(`/`)}`,
    })

    // Set (creation) date based on file ctime
    createNodeField({
      node,
      name: `date`,
      value: fileNode.ctime,
    })
  }
}
