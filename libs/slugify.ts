// utils/slugify.ts
export interface SlugifyOptions {
  lower?: boolean;          
  strict?: boolean;         
  separator?: string;        
  remove?: RegExp | null;    
  maxLength?: number | null; 
  trim?: boolean;            
}

/**
 * Create a URL-friendly slug from a string.
 */
export default function slugify(input: string, opts: SlugifyOptions = {}): string {
  if (typeof input !== "string") input = String(input ?? "");

  const {
    lower = true,
    strict = true,
    separator = "-",
    remove = null,
    maxLength = null,
    trim = true,
  } = opts;

  // 1. Normalize and remove diacritics (accents)
  // NFKD separates accents from letters, regex removes combining diacritical marks.
  let s = input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

  // 2. Apply custom remove regex first (if provided)
  if (remove instanceof RegExp) {
    s = s.replace(remove, "");
  }

  // 3. Replace spaces and punctuation with separator
  // Keep letters, numbers, and separator if strict; otherwise be more permissive
  if (strict) {
    // Replace any sequence of non-alphanumeric characters with the separator.
    // Use Unicode property escapes to handle letters in other scripts.
    s = s.replace(/[^\p{L}\p{N}]+/gu, separator);
  } else {
    // more permissive: collapse whitespace into separator and strip control chars
    s = s.replace(/\s+/g, separator).replace(/[\u0000-\u001F]+/g, "");
  }

  // 4. Collapse multiple separators (e.g. "--" -> "-")
  const escSep = escapeRegExp(separator);
  const multiSepRe = new RegExp(`${escSep}{2,}`, "g");
  s = s.replace(multiSepRe, separator);

  // 5. Optionally lowercase
  if (lower) s = s.toLowerCase();

  // 6. Trim separators from ends
  if (trim) {
    const trimRe = new RegExp(`(^${escSep}|${escSep}$)`, "g");
    s = s.replace(trimRe, "");
  }

  // 7. Truncate to maxLength if requested (avoid cutting multi-byte characters incorrectly)
  if (typeof maxLength === "number" && maxLength > 0) {
    // naive slice is fine because JS strings are UTF-16; it's okay for most slugs.
    if (s.length > maxLength) s = s.slice(0, maxLength);
    // trim again in case truncation left a trailing separator
    if (trim) s = s.replace(new RegExp(`(${escSep})$`), "");
  }

  return s;
}

function escapeRegExp(str: string): string {
  // escape for use in RegExp
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
