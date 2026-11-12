"use client"

import { useRef, useEffect, useCallback, useMemo, type MutableRefObject } from "react"
import { useTheme } from "next-themes"
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react"
import { configureMonaco, defaultEditorOptions, getEditorLanguage } from "@/modules/playground/lib/editor-config"
import type { TemplateFile } from "@/modules/playground/lib/path-to-json"

type MonacoEditorInstance = Parameters<OnMount>[0]
type MonacoEditorOptions = NonNullable<Parameters<MonacoEditorInstance["updateOptions"]>[0]>
type DisposableHandle = { dispose: () => void }
type ContextKeyHandle<T> = { set: (value: T) => void }
type ModelType = ReturnType<MonacoEditorInstance["getModel"]>
type PositionType = ReturnType<MonacoEditorInstance["getPosition"]>

interface EditorFile extends TemplateFile {
    id?: string
}

interface PlaygroundEditorProps {
    playgroundId?: string
    activeFile: EditorFile | undefined
    openFileIds?: string[]
    content: string
    onContentChange: (value: string, fileId?: string) => void
    editorContentGetterRef?: MutableRefObject<((fileId?: string) => string | undefined) | null>
    suggestion: string | null
    suggestionLoading: boolean
    suggestionPosition: { line: number; column: number } | null
    onAcceptSuggestion: (editor: MonacoEditorInstance, monaco: Monaco) => void
    onRejectSuggestion: (editor: MonacoEditorInstance) => void
    onTriggerSuggestion: (type: string, editor: MonacoEditorInstance) => void
}

// Characters after which an AI suggestion is requested automatically
const TRIGGER_CHARACTERS = new Set(["\n", "{", ".", "=", "(", ",", ":", ";"])
const TRIGGER_DELAY_MS = 500

function getModelPath(playgroundId: string | undefined, fileId: string): string {
    const scope = encodeURIComponent(playgroundId || "default")
    const normalized = fileId.replace(/^\/+/, "")
    return `playground://${scope}/${normalized}`
}

const PlaygroundEditor = ({
    playgroundId,
    activeFile,
    openFileIds,
    content,
    onContentChange,
    editorContentGetterRef,
    suggestion,
    suggestionLoading,
    suggestionPosition,
    onAcceptSuggestion,
    onRejectSuggestion,
    onTriggerSuggestion,
}: PlaygroundEditorProps) => {
    const activeFileId =
        activeFile?.id ||
        (activeFile
            ? `${activeFile.filename}${activeFile.fileExtension ? `.${activeFile.fileExtension}` : ""}`
            : undefined)
    const activeFileExtension = activeFile?.fileExtension || ""
    const modelPath = activeFileId ? getModelPath(playgroundId, activeFileId) : undefined

    const editorRef = useRef<MonacoEditorInstance | null>(null)
    const monacoRef = useRef<Monaco | null>(null)
    const inlineCompletionProviderRef = useRef<DisposableHandle | null>(null)
    const suggestionVisibleKeyRef = useRef<ContextKeyHandle<boolean> | null>(null)
    const isAcceptingSuggestionRef = useRef(false)
    const suggestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastEmittedByFileRef = useRef<Map<string, string>>(new Map())
    const prevOpenFileIdsRef = useRef<string[]>([])
    const playgroundIdRef = useRef(playgroundId)
    const activeFileIdRef = useRef(activeFileId)
    const onContentChangeRef = useRef(onContentChange)
    const { resolvedTheme } = useTheme()
    const activeThemeMode: "light" | "dark" = resolvedTheme === "light" ? "light" : "dark"
    const editorTheme = activeThemeMode === "light" ? "modern-light" : "modern-dark"
    const activeThemeModeRef = useRef<"light" | "dark">(activeThemeMode)

    playgroundIdRef.current = playgroundId
    activeFileIdRef.current = activeFileId
    onContentChangeRef.current = onContentChange

    const editorOptions = useMemo<MonacoEditorOptions>(
        () =>
            ({
                ...defaultEditorOptions,
                inlineSuggest: {
                    enabled: true,
                    mode: "prefix",
                    suppressSuggestions: false,
                },
                suggest: {
                    preview: false,
                    showInlineDetails: false,
                    insertMode: "replace",
                },
                quickSuggestions: {
                    other: true,
                    comments: false,
                    strings: false,
                },
                cursorSmoothCaretAnimation: "on",
            }) as unknown as MonacoEditorOptions,
        [],
    )

    useEffect(() => {
        activeThemeModeRef.current = activeThemeMode
        if (monacoRef.current) {
            monacoRef.current.editor.setTheme(editorTheme)
        }
    }, [activeThemeMode, editorTheme])

    // Editor listeners are registered once on mount, so they read the latest
    // props through refs instead of capturing stale values.
    const suggestionRef = useRef(suggestion)
    const suggestionPositionRef = useRef(suggestionPosition)
    const suggestionLoadingRef = useRef(suggestionLoading)
    const onAcceptSuggestionRef = useRef(onAcceptSuggestion)
    const onRejectSuggestionRef = useRef(onRejectSuggestion)
    const onTriggerSuggestionRef = useRef(onTriggerSuggestion)

    useEffect(() => {
        suggestionRef.current = suggestion
        suggestionPositionRef.current = suggestionPosition
        suggestionLoadingRef.current = suggestionLoading
        onAcceptSuggestionRef.current = onAcceptSuggestion
        onRejectSuggestionRef.current = onRejectSuggestion
        onTriggerSuggestionRef.current = onTriggerSuggestion
    })

    const hasActiveSuggestionAtPosition = useCallback(() => {
        const editor = editorRef.current
        const position = suggestionPositionRef.current
        if (!editor || !suggestionRef.current || !position) return false

        const current = editor.getPosition()
        return (
            current?.lineNumber === position.line &&
            current.column >= position.column &&
            current.column <= position.column + 2
        )
    }, [])

    const rejectSuggestion = useCallback(() => {
        const editor = editorRef.current
        if (!editor) return
        editor.trigger("ai", "editor.action.inlineSuggest.hide", null)
        onRejectSuggestionRef.current(editor)
    }, [])

    const acceptCurrentSuggestion = useCallback(() => {
        const editor = editorRef.current
        const monaco = monacoRef.current
        const text = suggestionRef.current
        const position = suggestionPositionRef.current

        if (!editor || !monaco || !text || !position) return false
        if (isAcceptingSuggestionRef.current || !hasActiveSuggestionAtPosition()) return false

        isAcceptingSuggestionRef.current = true

        try {
            const cleanText = text.replace(/\r/g, "")
            const range = new monaco.Range(position.line, position.column, position.line, position.column)

            const success = editor.executeEdits("ai-suggestion-accept", [
                { range, text: cleanText, forceMoveMarkers: true },
            ])
            if (!success) return false

            // Move cursor to end of inserted text
            const lines = cleanText.split("\n")
            const endLine = position.line + lines.length - 1
            const endColumn =
                lines.length === 1 ? position.column + cleanText.length : lines[lines.length - 1].length + 1
            editor.setPosition({ lineNumber: endLine, column: endColumn })

            editor.trigger("ai", "editor.action.inlineSuggest.hide", null)
            onAcceptSuggestionRef.current(editor, monaco)
            return true
        } catch (error) {
            console.error("Error accepting suggestion:", error)
            return false
        } finally {
            isAcceptingSuggestionRef.current = false
        }
    }, [hasActiveSuggestionAtPosition])

    // Register an inline completion provider whenever a new suggestion arrives
    useEffect(() => {
        const editor = editorRef.current
        const monaco = monacoRef.current
        if (!editor || !monaco) return

        suggestionVisibleKeyRef.current?.set(!!suggestion && !!suggestionPosition)

        if (!suggestion || !suggestionPosition) return

        const cleanSuggestion = suggestion.replace(/\r/g, "")
        const language = getEditorLanguage(activeFileExtension)

        const provider = monaco.languages.registerInlineCompletionsProvider(language, {
            provideInlineCompletions: async (_model: NonNullable<ModelType>, position: NonNullable<PositionType>) => {
                const isPositionMatch =
                    position.lineNumber === suggestionPosition.line &&
                    position.column >= suggestionPosition.column &&
                    position.column <= suggestionPosition.column + 2

                if (!isPositionMatch || isAcceptingSuggestionRef.current) {
                    return { items: [] }
                }

                return {
                    items: [
                        {
                            insertText: cleanSuggestion,
                            range: new monaco.Range(
                                suggestionPosition.line,
                                suggestionPosition.column,
                                suggestionPosition.line,
                                suggestionPosition.column,
                            ),
                        },
                    ],
                }
            },
            disposeInlineCompletions: () => { },
        })
        inlineCompletionProviderRef.current = provider

        const triggerTimeout = setTimeout(() => {
            editor.trigger("ai", "editor.action.inlineSuggest.trigger", null)
        }, 50)

        return () => {
            clearTimeout(triggerTimeout)
            provider.dispose()
            if (inlineCompletionProviderRef.current === provider) {
                inlineCompletionProviderRef.current = null
            }
        }
    }, [suggestion, suggestionPosition, activeFileId, activeFileExtension])

    const handleEditorChange = useCallback((value: string | undefined) => {
        const nextValue = value ?? ""
        const fileId = activeFileIdRef.current
        if (fileId) {
            lastEmittedByFileRef.current.set(fileId, nextValue)
        }
        onContentChangeRef.current(nextValue, fileId)
    }, [])

    const handleEditorBeforeMount = useCallback((monaco: Monaco) => {
        configureMonaco(monaco, activeThemeModeRef.current)
    }, [])

    const handleEditorDidMount = (editor: MonacoEditorInstance, monaco: Monaco) => {
        editorRef.current = editor
        monacoRef.current = monaco

        if (editorContentGetterRef) {
            editorContentGetterRef.current = (targetFileId?: string) => {
                const resolvedId = targetFileId || activeFileIdRef.current
                if (resolvedId && monacoRef.current) {
                    const targetModel = monacoRef.current.editor.getModel(
                        monacoRef.current.Uri.parse(getModelPath(playgroundIdRef.current, resolvedId)),
                    )
                    if (targetModel) {
                        return targetModel.getValue()
                    }
                }
                return editorRef.current?.getModel?.()?.getValue?.()
            }
        }

        editor.updateOptions(editorOptions)

        configureMonaco(monaco, activeThemeModeRef.current)

        // Context key so our Tab/Escape bindings only apply while an AI suggestion is shown;
        // otherwise Monaco's default Tab/Escape behavior is untouched.
        suggestionVisibleKeyRef.current = editor.createContextKey(
            "aiSuggestionVisible",
            !!suggestionRef.current && !!suggestionPositionRef.current,
        )

        // Alt+\ manually requests a suggestion (Ctrl+Space stays as Monaco's IntelliSense)
        editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Backslash, () => {
            onTriggerSuggestionRef.current("completion", editor)
        })

        editor.addCommand(
            monaco.KeyCode.Tab,
            () => {
                if (!acceptCurrentSuggestion()) {
                    editor.trigger("keyboard", "tab", null)
                }
            },
            "editorTextFocus && !editorReadonly && !suggestWidgetVisible && aiSuggestionVisible",
        )

        editor.addCommand(monaco.KeyCode.Escape, rejectSuggestion, "editorTextFocus && aiSuggestionVisible")

        // Reject the suggestion when the cursor moves away from it
        editor.onDidChangeCursorPosition((e) => {
            if (isAcceptingSuggestionRef.current) return

            const position = suggestionPositionRef.current
            if (!suggestionRef.current || !position) return

            if (
                e.position.lineNumber !== position.line ||
                e.position.column < position.column ||
                e.position.column > position.column + 10
            ) {
                rejectSuggestion()
            }
        })

        editor.onDidChangeModelContent((e) => {
            if (isAcceptingSuggestionRef.current || e.changes.length === 0) return

            const change = e.changes[0]

            // Clear any shown suggestion or pending AI request when the user edits or cuts text
            if (suggestionRef.current || suggestionLoadingRef.current) {
                rejectSuggestion()
            }

            // Debounced request after specific characters
            // Monaco auto-closes brackets ("{" -> "{}") and auto-indents after Enter ("\n    "),
            // so look at the typed character rather than the last inserted one.
            const typedChar = change.text.includes("\n") ? "\n" : change.text.charAt(0)
            if (!TRIGGER_CHARACTERS.has(typedChar)) return

            if (suggestionTimeoutRef.current) {
                clearTimeout(suggestionTimeoutRef.current)
            }
            suggestionTimeoutRef.current = setTimeout(() => {
                if (editorRef.current && !suggestionLoadingRef.current) {
                    onTriggerSuggestionRef.current("completion", editor)
                }
            }, TRIGGER_DELAY_MS)
        })

        updateEditorLanguage()
    }

    const updateEditorLanguage = useCallback(() => {
        if (!monacoRef.current || !editorRef.current) return
        const model = editorRef.current.getModel()
        if (!model) return

        const language = getEditorLanguage(activeFileExtension)
        try {
            monacoRef.current.editor.setModelLanguage(model, language)
        } catch (error) {
            console.warn("Failed to set editor language:", error)
        }
    }, [activeFileExtension])

    useEffect(() => {
        updateEditorLanguage()
    }, [activeFileId, updateEditorLanguage])

    // Dispose Monaco models for closed tabs so reopening them reads the saved file content cleanly
    useEffect(() => {
        const currentIds = openFileIds ?? []
        const prevIds = prevOpenFileIdsRef.current
        prevOpenFileIdsRef.current = currentIds

        if (!monacoRef.current) return

        const currentSet = new Set(currentIds)
        for (const prevId of prevIds) {
            if (!currentSet.has(prevId)) {
                lastEmittedByFileRef.current.delete(prevId)
                const uri = monacoRef.current.Uri.parse(getModelPath(playgroundId, prevId))
                monacoRef.current.editor.getModel(uri)?.dispose()
            }
        }
    }, [openFileIds, playgroundId])

    // Apply genuine external updates (when not triggered by user typing) without ever clobbering active typing
    useEffect(() => {
        if (!activeFileId || !monacoRef.current || !editorRef.current) return
        if (lastEmittedByFileRef.current.get(activeFileId) === content) return

        const model = monacoRef.current.editor.getModel(
            monacoRef.current.Uri.parse(getModelPath(playgroundId, activeFileId)),
        )
        if (!model || model.getValue() === content) return

        if (!lastEmittedByFileRef.current.has(activeFileId) && !editorRef.current.hasTextFocus()) {
            model.setValue(content)
        }
    }, [activeFileId, content, playgroundId])

    // Cleanup on unmount
    useEffect(() => {
        const getterRef = editorContentGetterRef
        const emittedMap = lastEmittedByFileRef.current
        return () => {
            if (suggestionTimeoutRef.current) {
                clearTimeout(suggestionTimeoutRef.current)
            }
            inlineCompletionProviderRef.current?.dispose()
            inlineCompletionProviderRef.current = null
            if (getterRef) {
                getterRef.current = null
            }
            if (monacoRef.current) {
                const scopePrefix = `playground://${encodeURIComponent(playgroundIdRef.current || "default")}/`
                for (const model of monacoRef.current.editor.getModels()) {
                    if (model.uri.toString().startsWith(scopePrefix)) {
                        model.dispose()
                    }
                }
            }
            emittedMap.clear()
        }
    }, [editorContentGetterRef])

    return (
        <div className="relative h-full w-full min-w-0 overflow-hidden bg-background">
            {suggestionLoading && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-md border border-blue-200 dark:border-blue-500/30 bg-blue-50/95 dark:bg-blue-950/90 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></div>
                    AI thinking...
                </div>
            )}

            {suggestion && !suggestionLoading && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-md border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/95 dark:bg-emerald-950/90 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></div>
                    Press Tab to accept
                </div>
            )}

            <Editor
                height="100%"
                width="100%"
                theme={editorTheme}
                path={modelPath}
                defaultValue={content}
                beforeMount={handleEditorBeforeMount}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                language={activeFileExtension ? getEditorLanguage(activeFileExtension) : "plaintext"}
                options={editorOptions}
            />
        </div>
    )
}

export default PlaygroundEditor
