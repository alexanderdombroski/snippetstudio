interface VSCodeSnippet {
    /**
     * The prefix to trigger the snippet. This appears as the title of the autocomplete option
     */
    prefix: string | string[];
  
    /**
     * The snippet body. Can be a single string or an array of strings.
     */
    body: string | string[];
  
    /**
     * The snippet description. This appears when hovering over the autocomplete option
     */
    description?: string;
  
    /**
     * The scope(s) in which the snippet is valid.
     */
    scope?: string;
}

interface VSCodeSnippets {
    /**
     * snippetTitle appears to the right of autocomplete trigger
     */
    [snippetTitle: string]: VSCodeSnippet;
}

interface SnippetMap {
    [fileName: string]: VSCodeSnippets;
}

interface SnippetData {
    /**
     * snippetTitle appears to the right of autocomplete trigger
     */
    snippetTitle: string,

    /**
     * The prefix to trigger the snippet. This appears as the title of the autocomplete option
     */
    prefix: string | string[];
  
    /**
     * The snippet description. This appears when hovering over the autocomplete option
     */
    description?: string;
  
    /**
     * The scope(s) in which the snippet is valid.
     */
    scope?: string;
}

export { VSCodeSnippet, VSCodeSnippets, SnippetMap, SnippetData };