/**
 * Helper to extract plain text from React children
 */
export const flattenText = (children) => {
  if (!children) return "";
  if (typeof children === "string" || typeof children === "number")
    return children.toString();
  if (Array.isArray(children)) return children.map(flattenText).join("");
  if (children.props && children.props.children)
    return flattenText(children.props.children);
  return "";
};

/**
 * Helper to generate consistent IDs from text for anchor links
 */
export const generateId = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special chars except whitespace & hyphens
    .trim()
    .replace(/\s+/g, "-"); // Replace spaces with hyphens
};
