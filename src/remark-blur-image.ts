import type { Image, Root } from "mdast"
import type {} from "mdast-util-to-hast"
import path from "node:path"
import { visit } from "unist-util-visit"
import { BLUR_PROPERTIES } from "./attributes.js"
import type { PlaceholderOptions } from "./placeholder.js"
import { createBlurPlaceholder, fetchImage } from "./placeholder.js"

/** Options for {@link remarkBlurImage}. */
export interface RemarkBlurImageOptions extends PlaceholderOptions {
  /**
   * Directory that root-relative image URLs such as `/images/photo.jpg` resolve against.
   * Defaults to `public` in the current working directory, which is the project root during an
   * Astro build.
   */
  publicDir?: string
}

const REMOTE_URL = /^https?:\/\//i

/**
 * Generates a blurred placeholder for every image in a Markdown file and stores it on the image
 * node for {@link rehypeBlurWrapper} to render. Relative URLs resolve against the Markdown file,
 * root-relative URLs against `publicDir`, and `http(s)` URLs are downloaded. An image whose
 * placeholder cannot be generated is left as it is.
 */
export function remarkBlurImage(options: RemarkBlurImageOptions = {}) {
  const { publicDir = path.resolve("public"), ...placeholderOptions } = options

  return async function transformer(tree: Root, file: { path?: string }): Promise<void> {
    const dir = file.path ? path.dirname(file.path) : process.cwd()
    const images: Image[] = []

    visit(tree, "image", (node) => {
      if (!node.url.startsWith("data:")) images.push(node)
    })

    await Promise.all(
      images.map(async (node) => {
        try {
          const source = REMOTE_URL.test(node.url)
            ? await fetchImage(node.url)
            : node.url.startsWith("/")
              ? path.join(publicDir, decodeURI(node.url))
              : path.resolve(dir, decodeURI(node.url))
          const placeholder = await createBlurPlaceholder(source, placeholderOptions)

          node.data ??= {}
          node.data.hProperties = {
            ...node.data.hProperties,
            [BLUR_PROPERTIES.placeholder]: placeholder.dataURI,
            [BLUR_PROPERTIES.width]: placeholder.width,
            [BLUR_PROPERTIES.height]: placeholder.height,
          }
        } catch {
          // without a placeholder the image renders as a plain <img>
        }
      }),
    )
  }
}
