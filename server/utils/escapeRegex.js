// Anything a customer types into the search box ends up inside a $regex.
// Left raw, "C++" or "(" throws an invalid-regex error and a pattern like
// "(a+)+$" pins the CPU. Escaping turns every special character into a
// literal, so the search matches the text the person actually typed.
const escapeRegex = (value) =>
  String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default escapeRegex;