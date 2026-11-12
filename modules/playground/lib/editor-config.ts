import type { Monaco } from "@monaco-editor/react";

export const getEditorLanguage = (fileExtension: string): string => {
    const extension = fileExtension.toLowerCase();
    const languageMap: Record<string, string> = {
        // JavaScript/TypeScript
        js: "javascript",
        jsx: "javascript",
        ts: "typescript",
        tsx: "typescript",
        mjs: "javascript",
        cjs: "javascript",

        // Web languages
        json: "json",
        html: "html",
        htm: "html",
        css: "css",
        scss: "scss",
        sass: "scss",
        less: "less",

        // Markup/Documentation
        md: "markdown",
        markdown: "markdown",
        xml: "xml",
        yaml: "yaml",
        yml: "yaml",

        // Programming languages
        py: "python",
        python: "python",
        java: "java",
        c: "c",
        cpp: "cpp",
        cs: "csharp",
        php: "php",
        rb: "ruby",
        go: "go",
        rs: "rust",
        sh: "shell",
        bash: "shell",
        sql: "sql",

        // Config files
        toml: "ini",
        ini: "ini",
        conf: "ini",
        dockerfile: "dockerfile",
    };

    return languageMap[extension] || "plaintext";
};

const AMBIENT_REACT_JSX_LIB = `
declare module "react" {
    export type ReactNode = any;
    export type ReactElement = any;
    export type FC<P = {}> = (props: P & { children?: ReactNode }) => ReactElement | null;
    export type Dispatch<A> = (value: A) => void;
    export type SetStateAction<S> = S | ((prevState: S) => S);
    export type RefObject<T> = { readonly current: T | null };
    export type MutableRefObject<T> = { current: T };
    export type DependencyList = readonly any[];
    export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
    export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
    export function useEffect(effect: () => void | (() => void), deps?: DependencyList): void;
    export function useLayoutEffect(effect: () => void | (() => void), deps?: DependencyList): void;
    export function useRef<T>(initialValue: T): MutableRefObject<T>;
    export function useRef<T>(initialValue: T | null): RefObject<T>;
    export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: DependencyList): T;
    export function useMemo<T>(factory: () => T, deps: DependencyList): T;
    export function useReducer<R extends (state: any, action: any) => any>(reducer: R, initialState: any): [any, Dispatch<any>];
    export function useContext<T>(context: any): T;
    export function createContext<T>(defaultValue: T): any;
    export const StrictMode: FC<{ children?: ReactNode }>;
    export const Fragment: FC<{ children?: ReactNode }>;
    const React: any;
    export default React;
}
declare module "react/jsx-runtime" {
    export const jsx: any;
    export const jsxs: any;
    export const Fragment: any;
}
declare module "react/jsx-dev-runtime" {
    export const jsxDEV: any;
    export const Fragment: any;
}
declare module "react-dom/client" {
    export function createRoot(container: Element | DocumentFragment): {
        render(children: any): void;
        unmount(): void;
    };
}
declare namespace JSX {
    type Element = any;
    interface IntrinsicElements {
        [elemName: string]: any;
    }
    interface IntrinsicAttributes {
        key?: string | number | bigint | null | undefined;
    }
}
`;

const configuredMonacoInstances = new WeakSet<Monaco>();

export const configureMonaco = (
    monaco: Monaco,
    initialTheme: "light" | "dark" = "dark"
) => {
    if (configuredMonacoInstances.has(monaco)) {
        monaco.editor.setTheme(initialTheme === "light" ? "modern-light" : "modern-dark");
        return;
    }
    configuredMonacoInstances.add(monaco);
    // Define a crisp modern light theme
    monaco.editor.defineTheme("modern-light", {
        base: "vs",
        inherit: true,
        rules: [
            // Comments
            { token: "comment", foreground: "64748B", fontStyle: "italic" },
            { token: "comment.line", foreground: "64748B", fontStyle: "italic" },
            { token: "comment.block", foreground: "64748B", fontStyle: "italic" },

            // Keywords
            { token: "keyword", foreground: "7C3AED", fontStyle: "bold" },
            { token: "keyword.control", foreground: "7C3AED", fontStyle: "bold" },
            { token: "keyword.operator", foreground: "334155" },

            // Strings
            { token: "string", foreground: "047857" },
            { token: "string.quoted", foreground: "047857" },
            { token: "string.template", foreground: "047857" },

            // Numbers
            { token: "number", foreground: "0369A1" },
            { token: "number.hex", foreground: "0369A1" },
            { token: "number.float", foreground: "0369A1" },

            // Functions
            { token: "entity.name.function", foreground: "2563EB" },
            { token: "support.function", foreground: "2563EB" },

            // Variables
            { token: "variable", foreground: "0F172A" },
            { token: "variable.parameter", foreground: "B45309" },
            { token: "variable.other", foreground: "1E293B" },

            // Types
            { token: "entity.name.type", foreground: "0F766E" },
            { token: "support.type", foreground: "0F766E" },
            { token: "storage.type", foreground: "7C3AED" },

            // Classes
            { token: "entity.name.class", foreground: "0F766E" },
            { token: "support.class", foreground: "0F766E" },

            // Constants
            { token: "constant", foreground: "0284C7" },
            { token: "constant.language", foreground: "2563EB" },
            { token: "constant.numeric", foreground: "0369A1" },

            // Operators
            { token: "punctuation", foreground: "475569" },

            // HTML/XML
            { token: "tag", foreground: "1D4ED8" },
            { token: "tag.id", foreground: "0369A1" },
            { token: "tag.class", foreground: "2563EB" },
            { token: "attribute.name", foreground: "7C3AED" },
            { token: "attribute.value", foreground: "047857" },

            // CSS
            { token: "attribute.name.css", foreground: "1D4ED8" },
            { token: "attribute.value.css", foreground: "047857" },
            { token: "property-name.css", foreground: "1D4ED8" },
            { token: "property-value.css", foreground: "047857" },

            // JSON
            { token: "key", foreground: "1D4ED8" },
            { token: "string.key", foreground: "1D4ED8" },
            { token: "string.value", foreground: "047857" },

            // Error/Warning
            { token: "invalid", foreground: "DC2626", fontStyle: "underline" },
            { token: "invalid.deprecated", foreground: "64748B", fontStyle: "strikethrough" },
        ],
        colors: {
            // Editor background
            "editor.background": "#FFFFFF",
            "editor.foreground": "#1E293B",

            // Line numbers
            "editorLineNumber.foreground": "#94A3B8",
            "editorLineNumber.activeForeground": "#0F172A",

            // Cursor
            "editorCursor.foreground": "#2563EB",

            // Selection
            "editor.selectionBackground": "#BFDBFE",
            "editor.selectionHighlightBackground": "#DBEAFE",
            "editor.inactiveSelectionBackground": "#E2E8F0",

            // Current line
            "editor.lineHighlightBackground": "#F1F5F9",
            "editor.lineHighlightBorder": "#E2E8F0",

            // Gutter
            "editorGutter.background": "#F8FAFC",
            "editorGutter.modifiedBackground": "#F59E0B80",
            "editorGutter.addedBackground": "#10B98180",
            "editorGutter.deletedBackground": "#EF444480",

            // Scrollbar
            "scrollbar.shadow": "#0F172A14",
            "scrollbarSlider.background": "#94A3B855",
            "scrollbarSlider.hoverBackground": "#64748B77",
            "scrollbarSlider.activeBackground": "#47556999",

            // Minimap
            "minimap.background": "#F8FAFC",
            "minimap.selectionHighlight": "#BFDBFE",

            // Find/Replace
            "editor.findMatchBackground": "#FDE047",
            "editor.findMatchHighlightBackground": "#FEF08A99",
            "editor.findRangeHighlightBackground": "#BBF7D080",

            // Word highlight
            "editor.wordHighlightBackground": "#E2E8F099",
            "editor.wordHighlightStrongBackground": "#BFDBFE99",

            // Brackets
            "editorBracketMatch.background": "#DBEAFE",
            "editorBracketMatch.border": "#3B82F6",

            // Indentation guides
            "editorIndentGuide.background": "#E2E8F0",
            "editorIndentGuide.activeBackground": "#94A3B8",

            // Ruler
            "editorRuler.foreground": "#E2E8F0",

            // Whitespace
            "editorWhitespace.foreground": "#CBD5E1",

            // Error/Warning squiggles
            "editorError.foreground": "#DC2626",
            "editorWarning.foreground": "#D97706",
            "editorInfo.foreground": "#2563EB",
            "editorHint.foreground": "#475569",

            // Suggest widget
            "editorSuggestWidget.background": "#FFFFFF",
            "editorSuggestWidget.border": "#CBD5E1",
            "editorSuggestWidget.foreground": "#0F172A",
            "editorSuggestWidget.selectedBackground": "#EFF6FF",

            // Hover widget
            "editorHoverWidget.background": "#FFFFFF",
            "editorHoverWidget.border": "#CBD5E1",

            // Panel
            "panel.background": "#F8FAFC",
            "panel.border": "#E2E8F0",

            // Activity bar
            "activityBar.background": "#F1F5F9",
            "activityBar.foreground": "#0F172A",
            "activityBar.border": "#E2E8F0",

            // Side bar
            "sideBar.background": "#F8FAFC",
            "sideBar.foreground": "#0F172A",
            "sideBar.border": "#E2E8F0",
        },
    });

    // Define a beautiful modern dark theme
    monaco.editor.defineTheme("modern-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
            // Comments
            { token: "comment", foreground: "7C7C7C", fontStyle: "italic" },
            { token: "comment.line", foreground: "7C7C7C", fontStyle: "italic" },
            { token: "comment.block", foreground: "7C7C7C", fontStyle: "italic" },

            // Keywords
            { token: "keyword", foreground: "C586C0", fontStyle: "bold" },
            { token: "keyword.control", foreground: "C586C0", fontStyle: "bold" },
            { token: "keyword.operator", foreground: "D4D4D4" },

            // Strings
            { token: "string", foreground: "CE9178" },
            { token: "string.quoted", foreground: "CE9178" },
            { token: "string.template", foreground: "CE9178" },

            // Numbers
            { token: "number", foreground: "B5CEA8" },
            { token: "number.hex", foreground: "B5CEA8" },
            { token: "number.float", foreground: "B5CEA8" },

            // Functions
            { token: "entity.name.function", foreground: "DCDCAA" },
            { token: "support.function", foreground: "DCDCAA" },

            // Variables
            { token: "variable", foreground: "9CDCFE" },
            { token: "variable.parameter", foreground: "9CDCFE" },
            { token: "variable.other", foreground: "9CDCFE" },

            // Types
            { token: "entity.name.type", foreground: "4EC9B0" },
            { token: "support.type", foreground: "4EC9B0" },
            { token: "storage.type", foreground: "569CD6" },

            // Classes
            { token: "entity.name.class", foreground: "4EC9B0" },
            { token: "support.class", foreground: "4EC9B0" },

            // Constants
            { token: "constant", foreground: "4FC1FF" },
            { token: "constant.language", foreground: "569CD6" },
            { token: "constant.numeric", foreground: "B5CEA8" },

            // Operators
            { token: "keyword.operator", foreground: "D4D4D4" },
            { token: "punctuation", foreground: "D4D4D4" },

            // HTML/XML
            { token: "tag", foreground: "569CD6" },
            { token: "tag.id", foreground: "9CDCFE" },
            { token: "tag.class", foreground: "92C5F8" },
            { token: "attribute.name", foreground: "9CDCFE" },
            { token: "attribute.value", foreground: "CE9178" },

            // CSS
            { token: "attribute.name.css", foreground: "9CDCFE" },
            { token: "attribute.value.css", foreground: "CE9178" },
            { token: "property-name.css", foreground: "9CDCFE" },
            { token: "property-value.css", foreground: "CE9178" },

            // JSON
            { token: "key", foreground: "9CDCFE" },
            { token: "string.key", foreground: "9CDCFE" },
            { token: "string.value", foreground: "CE9178" },

            // Error/Warning
            { token: "invalid", foreground: "F44747", fontStyle: "underline" },
            { token: "invalid.deprecated", foreground: "D4D4D4", fontStyle: "strikethrough" },
        ],
        colors: {
            // Editor background
            "editor.background": "#0D1117",
            "editor.foreground": "#E6EDF3",

            // Line numbers
            "editorLineNumber.foreground": "#7D8590",
            "editorLineNumber.activeForeground": "#F0F6FC",

            // Cursor
            "editorCursor.foreground": "#F0F6FC",

            // Selection
            "editor.selectionBackground": "#264F78",
            "editor.selectionHighlightBackground": "#ADD6FF26",
            "editor.inactiveSelectionBackground": "#3A3D41",

            // Current line
            "editor.lineHighlightBackground": "#21262D",
            "editor.lineHighlightBorder": "#30363D",

            // Gutter
            "editorGutter.background": "#0D1117",
            "editorGutter.modifiedBackground": "#BB800966",
            "editorGutter.addedBackground": "#347D3966",
            "editorGutter.deletedBackground": "#F8514966",

            // Scrollbar
            "scrollbar.shadow": "#0008",
            "scrollbarSlider.background": "#6E768166",
            "scrollbarSlider.hoverBackground": "#6E768188",
            "scrollbarSlider.activeBackground": "#6E7681BB",

            // Minimap
            "minimap.background": "#161B22",
            "minimap.selectionHighlight": "#264F78",

            // Find/Replace
            "editor.findMatchBackground": "#9E6A03",
            "editor.findMatchHighlightBackground": "#F2CC6080",
            "editor.findRangeHighlightBackground": "#3FB95040",

            // Word highlight
            "editor.wordHighlightBackground": "#575757B8",
            "editor.wordHighlightStrongBackground": "#004972B8",

            // Brackets
            "editorBracketMatch.background": "#0064001A",
            "editorBracketMatch.border": "#888888",

            // Indentation guides
            "editorIndentGuide.background": "#21262D",
            "editorIndentGuide.activeBackground": "#30363D",

            // Ruler
            "editorRuler.foreground": "#21262D",

            // Whitespace
            "editorWhitespace.foreground": "#6E7681",

            // Error/Warning squiggles
            "editorError.foreground": "#F85149",
            "editorWarning.foreground": "#D29922",
            "editorInfo.foreground": "#75BEFF",
            "editorHint.foreground": "#EEEEEE",

            // Suggest widget
            "editorSuggestWidget.background": "#161B22",
            "editorSuggestWidget.border": "#30363D",
            "editorSuggestWidget.foreground": "#E6EDF3",
            "editorSuggestWidget.selectedBackground": "#21262D",

            // Hover widget
            "editorHoverWidget.background": "#161B22",
            "editorHoverWidget.border": "#30363D",

            // Panel
            "panel.background": "#0D1117",
            "panel.border": "#30363D",

            // Activity bar
            "activityBar.background": "#0D1117",
            "activityBar.foreground": "#E6EDF3",
            "activityBar.border": "#30363D",

            // Side bar
            "sideBar.background": "#0D1117",
            "sideBar.foreground": "#E6EDF3",
            "sideBar.border": "#30363D",
        },
    });

    // Set the theme
    monaco.editor.setTheme(initialTheme === "light" ? "modern-light" : "modern-dark");

    // Configure additional editor settings
    const sharedDiagnosticsOptions = {
        noSemanticValidation: false,
        noSyntaxValidation: false,
        // Ignore unresolvable external package / CSS imports that live only inside WebContainer's node_modules
        diagnosticCodesToIgnore: [2307, 2792],
    };

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(sharedDiagnosticsOptions);
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(sharedDiagnosticsOptions);

    // Provide lightweight ambient React + JSX declarations so TSX/JSX files don't show false red squiggles
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
        AMBIENT_REACT_JSX_LIB,
        "ts:filename/codesphere-react-jsx.d.ts"
    );
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
        AMBIENT_REACT_JSX_LIB,
        "js:filename/codesphere-react-jsx.d.ts"
    );

    // Set compiler options for better IntelliSense
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        noEmit: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
        reactNamespace: "React",
        allowJs: true,
        checkJs: false,
        noImplicitAny: false,
        resolveJsonModule: true,
        skipLibCheck: true,
        typeRoots: ["node_modules/@types"],
    });

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        noEmit: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
        reactNamespace: "React",
        allowJs: true,
        noImplicitAny: false,
        isolatedModules: true,
        resolveJsonModule: true,
        skipLibCheck: true,
        typeRoots: ["node_modules/@types"],
    });
};

export const defaultEditorOptions = {
    // Font settings
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
    fontLigatures: true,
    fontWeight: "400",

    // Layout
    minimap: {
        enabled: true,
        size: "proportional",
        showSlider: "mouseover"
    },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    padding: { top: 16, bottom: 16 },

    // Line settings
    lineNumbers: "on",
    lineHeight: 20,
    renderLineHighlight: "all",
    renderWhitespace: "selection",

    // Indentation
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: true,

    // Word wrapping
    wordWrap: "on",
    wordWrapColumn: 120,
    wrappingIndent: "indent",

    // Code folding
    folding: true,
    foldingHighlight: true,
    foldingStrategy: "indentation",
    showFoldingControls: "mouseover",

    // Scrolling
    smoothScrolling: true,
    mouseWheelZoom: true,
    fastScrollSensitivity: 5,

    // Selection
    multiCursorModifier: "ctrlCmd",
    selectionHighlight: true,
    occurrencesHighlight: true,

    // Suggestions
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: "on",
    tabCompletion: "on",
    wordBasedSuggestions: true,
    quickSuggestions: {
        other: true,
        comments: false,
        strings: false
    },

    // Formatting
    formatOnPaste: true,
    formatOnType: true,

    // Bracket matching
    matchBrackets: "always",
    bracketPairColorization: {
        enabled: true
    },

    // Guides
    renderIndentGuides: true,
    highlightActiveIndentGuide: true,
    rulers: [80, 120],

    // Performance
    disableLayerHinting: false,
    disableMonospaceOptimizations: false,

    // Accessibility
    accessibilitySupport: "auto",

    // Cursor
    cursorBlinking: "smooth",
    cursorSmoothCaretAnimation: true,
    cursorStyle: "line",
    cursorWidth: 2,

    // Find
    find: {
        addExtraSpaceOnTop: false,
        autoFindInSelection: "never",
        seedSearchStringFromSelection: "always"
    },

    // Hover
    hover: {
        enabled: true,
        delay: 300,
        sticky: true
    },

    // Semantic highlighting
    "semanticHighlighting.enabled": true,

    // Sticky scroll
    stickyScroll: {
        enabled: true
    }
};