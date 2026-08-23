"use client"

import { useRef, useEffect } from "react"

import Editor, { type Monaco } from "@monaco-editor/react"

import {
    configureMonaco,
    defaultEditorOptions,
    getEditorLanguage
} from "@/modules/playground/lib/editor-config"

import type { TemplateFile } from "@/modules/playground/lib/path-to-json"

interface PlaygroundEditorProps {
    activeFile: TemplateFile | undefined
    content: string
    onContentChange: (value: string) => void
}

const PlaygroundEditor = ({
    activeFile,
    content,
    onContentChange
}: PlaygroundEditorProps) => {

    const editorRef = useRef<any>(null)
    const moancoRef = useRef<Monaco | null>(null)

    const handleEditorDidMount = (editor: any, monaco: Monaco) => {
        editorRef.current = editor
        moancoRef.current = monaco

        console.log("Editor instance mounted:", !!editorRef.current)

        editor.updateOptions({
            ...defaultEditorOptions
        })

        configureMonaco(monaco)
        updateEditorLanguage()
    }

    const updateEditorLanguage = () => {
        if (!activeFile || !moancoRef.current || !editorRef.current) return

        const model = editorRef.current.getModel()

        if (!model) return

        const language = getEditorLanguage(
            activeFile.fileExtension || ""
        )

        try {
            moancoRef.current.editor.setModelLanguage(
                model,
                language
            )
        } catch (error) {
            console.warn(
                "Failed to set editor language: ",
                error
            )
        }
    }

    useEffect(() => {
        updateEditorLanguage()
    }, [])

    return (
        <div className="relative h-full w-full min-w-0 overflow-hidden">
            <Editor
                height="100%"
                width="100%"
                value={content}
                onChange={(value) => onContentChange(value || "")}
                onMount={handleEditorDidMount}
                language={
                    activeFile
                        ? getEditorLanguage(
                            activeFile.fileExtension || ""
                        )
                        : "plaintext"
                }
                // @ts-expect-error xys
                options={defaultEditorOptions}
            />
        </div>
    )
}

export default PlaygroundEditor