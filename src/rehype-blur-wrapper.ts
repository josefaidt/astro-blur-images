import type { Element, Root } from "hast"
import { SKIP, visit } from "unist-util-visit"
import { BLUR_CLASSES, BLUR_PROPERTIES } from "./attributes.js"

/**
 * Wraps each image that {@link remarkBlurImage} gave a placeholder in a box sized to the image's
 * aspect ratio, holding the blurred placeholder behind the lazily loaded full image. The client
 * script marks the box loaded once the full image arrives, and `styles.css` fades it in.
 */
export function rehypeBlurWrapper() {
  return function transformer(tree: Root): void {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "img" || parent === undefined || index === undefined) return

      const {
        [BLUR_PROPERTIES.placeholder]: placeholder,
        [BLUR_PROPERTIES.width]: width,
        [BLUR_PROPERTIES.height]: height,
        ...imgProperties
      } = node.properties
      if (typeof placeholder !== "string" || typeof width !== "number" || typeof height !== "number") {
        return
      }

      // A span, since a Markdown image sits inside a <p>, which cannot hold a <div>
      const wrapper: Element = {
        type: "element",
        tagName: "span",
        properties: {
          className: [BLUR_CLASSES.wrapper],
          style: `aspect-ratio: ${width} / ${height}`,
        },
        children: [
          {
            type: "element",
            tagName: "img",
            properties: {
              className: [BLUR_CLASSES.placeholder],
              src: placeholder,
              alt: "",
              ariaHidden: "true",
            },
            children: [],
          },
          {
            type: "element",
            tagName: "img",
            properties: {
              ...imgProperties,
              className: [BLUR_CLASSES.full],
              loading: "lazy",
              decoding: "async",
              width,
              height,
            },
            children: [],
          },
        ],
      }

      parent.children.splice(index, 1, wrapper)
      return [SKIP, index + 1]
    })
  }
}
