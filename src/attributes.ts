/**
 * The hast properties the remark plugin writes onto an image and the rehype plugin reads back.
 * They only carry data between the two plugins and never reach the rendered HTML.
 */
export const BLUR_PROPERTIES = {
  placeholder: "dataBlur",
  width: "dataBlurWidth",
  height: "dataBlurHeight",
} as const

/** Class names the rehype plugin renders, which `styles.css` and the client script target. */
export const BLUR_CLASSES = {
  wrapper: "blur-wrapper",
  placeholder: "blur-placeholder",
  full: "blur-full",
} as const
