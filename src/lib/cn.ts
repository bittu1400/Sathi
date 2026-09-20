import { createCn } from "cn/config"

/**
 * `cn` that knows the type-scale utilities from globals.css. Without this it
 * reads `text-body`/`text-small`… as colours and drops the real colour class
 * (`cn("text-ink text-body")` → `text-body`).
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["readout-xl", "readout", "display", "h1", "h2", "body", "small", "label"] }],
    },
  },
})
