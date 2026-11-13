import { BLUR_CLASSES } from "./attributes.js"

const PENDING = `.${BLUR_CLASSES.wrapper}:not([data-loaded]) > .${BLUR_CLASSES.full}`

// A failed image is revealed too, so its alt text shows instead of a blur that never resolves
function reveal(img: HTMLImageElement): void {
  img.closest(`.${BLUR_CLASSES.wrapper}`)?.setAttribute("data-loaded", "")
}

function init(): void {
  for (const img of document.querySelectorAll<HTMLImageElement>(PENDING)) {
    if (img.complete) {
      reveal(img)
    } else {
      img.addEventListener("load", () => reveal(img), { once: true })
      img.addEventListener("error", () => reveal(img), { once: true })
    }
  }
}

init()
// <ClientRouter /> swaps pages without running bundled scripts again
document.addEventListener("astro:page-load", init)
