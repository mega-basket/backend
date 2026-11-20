// User search text is used inside a MongoDB $regex. Without escaping, input
// like "(" or "[" is an invalid pattern (→ 500 error), and input like ".*"
// or "(a+)+$" changes what matches or can make the query very slow.
// Escaping makes every character match literally.

const MAX_SEARCH_LENGTH = 100;

export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Turns a raw `req.query.search` value into a safe, literal regex source.
 * Returns "" for empty input. Handles repeated params (?search=a&search=b)
 * and caps the length.
 */
export const toSearchPattern = (raw) => {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value == null) return "";
  const trimmed = String(value).trim().slice(0, MAX_SEARCH_LENGTH);
  return trimmed ? escapeRegex(trimmed) : "";
};
