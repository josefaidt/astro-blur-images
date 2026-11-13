import type { AstroIntegration } from "astro"
import { fileURLToPath } from "node:url"

export { BLUR_CLASSES } from "./attributes.js"
export type { BlurPlaceholder, PlaceholderOptions } from "./placeholder.js"
export { createBlurPlaceholder } from "./placeholder.js"
export { rehypeBlurWrapper } from "./rehype-blur-wrapper.js"
export type { RemarkBlurImageOptions } from "./remark-blur-image.js"
export { remarkBlurImage } from "./remark-blur-image.js"

// Absolute paths rather than the package name, so the injected imports resolve however the
// package is installed: from npm, linked, or imported from a local checkout.
const STYLES = fileURLToPath(new URL("../styles.css", import.meta.url))
const CLIENT = fileURLToPath(new URL("./client.js", import.meta.url))

/**
 * Adds the stylesheet and the client script that fade each blurred placeholder into its full
 * image. The placeholders themselves come from {@link remarkBlurImage} and
 * {@link rehypeBlurWrapper}, which go in the `unified()` Markdown processor's plugin lists.
 */
export default function blurImages(): AstroIntegration {
  return {
    name: "astro-blur-images",
    hooks: {
      "astro:config:setup": ({ injectScript }) => {
        injectScript("page-ssr", `import ${JSON.stringify(STYLES)};`)
        injectScript("page", `import ${JSON.stringify(CLIENT)};`)
      },
    },
  }
}
