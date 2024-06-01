// https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro#answer-35385518

export function fromHTML(html: string, trim = true) {
  html = trim ? html.trim() : html;
  if (!html) throw new Error("String cannot be empty.");

  const template = document.createElement('template');
  template.innerHTML = html;
  const result = template.content.children;

  if (result.length === 1) return result[0];
  return result;
}