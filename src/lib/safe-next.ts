/** Post-login redirect target. Only same-origin paths: "/trek" yes; "https://x", "//x", "/\x" no. */
export function safeNext(value: string | null, fallback = "/trek"): string {
  return value && /^\/(?![/\\])/.test(value) ? value : fallback
}
