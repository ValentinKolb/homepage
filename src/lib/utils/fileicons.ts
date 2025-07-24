const LANGAGE_TO_ICON = {
  astro: "ti-brand-astro",
  "apache,apacheconf,nginx,nginxconf": "ti-protocol",
  "applescript,osascript": "ti-brand-apple",
  autohotkey: "ti-keyboard",
  "bash,sh,zsh,ps": "ti-prompt",
  "brainfuck,bf": "ti-brain",
  Powershell: "ti-prompt",
  "csharp,cs": "ti-csharp",
  "c,h": "ti-circle-dotted-letter-c",
  "cpp,hpp,cc,hh,c++,h++,cxx,hxx": "ti-circle-dotted-letter-c",
  css: "ti-brand-css3",
  "scss,sass": "ti-brand-sass",
  "coffeescript,coffee,cson,iced": "ti-coffee",
  curl: "ti-http-connect",
  "diff,patch": "ti-brand-git",
  "dockerfile,docker": "ti-brand-docker",
  "excel,xls,xlsx": "ti-file-type-xls",
  doc: "ti-file-type-doc",
  docx: "ti-file-type-docx",
  "ppt,pptx": "ti-file-type-ppt",
  pdf: "file-type-pdf",
  "haskell,hs": "ti-lambda",
  "plaintext,txt,text": "ti-file-type-txt",
  "zip,tar": "ti-zip",
  "csv,tsv": "csv",
  graphql: "ti-brand-graphql",
  "go,golang": "ti-brand-golang",
  html: "ti-brand-html5",
  xml: "ti-file-type-xml",
  svg: "ti-file-type-svg",
  "toml,ini": "ti-toml",
  json: "ti-json",
  "js,jsx,javascript": "ti-brand-javascript",
  "deno,denojs,deno-ts": "ti-brand-deno",
  "kotlin,kt": "ti-brand-kotlin",
  "tex,latex": "ti-tex",
  "makefile,mk,mak,make": "ti-forklift",
  "markdown,md,mkdown,mkd,mdx": "ti-markdown",
  matlab: "ti-matrix",
  php: "ti-file-type-php",
  "python,py,gyp": "ti-brand-python",
  "python repl": "ti-brand-python",
  "rust,rs": "ti-brand-rust",
  "sql,pgsql,postgres,postgresql": "ti-sql",
  swift: "ti-brand-swift",
  svelte: "ti-brand-svelte",
  "terraform,tf,hcl": "ti-brand-terraform",
  "typescript,ts,tsx,mts,cts": "ti-brand-typescript",
  code: "ti-code",
};

/**
 * this function returns the icon for a given file type
 * @param filename or the fileType the file extension (e.g. .js, .ts, .py)
 * @returns the icon for the file type, ti-file if not found
 */
export function getIconForFileType(fileTypeOrName: string): string {
  const fileType = fileTypeOrName.split(".").pop() ?? fileTypeOrName;
  const icons = Object.entries(LANGAGE_TO_ICON)
    .map(([k, v]) => ({
      fileExtensions: k.split(",").map((ext) => ext.trim()),
      icon: v,
    }))
    .filter((v) => v.fileExtensions.includes(fileType))
    .map((v) => v.icon);

  return icons.length > 0 ? icons[0] : "ti-file";
}

/**
 * returns the file extension for a given filename
 * @param filename the filename to get the extension for
 * @returns the file extension, or "plaintext" if not found
 */
export const getFileExtension = (filename: string) => {
  return filename.split(".").pop() ?? "plaintext";
};
