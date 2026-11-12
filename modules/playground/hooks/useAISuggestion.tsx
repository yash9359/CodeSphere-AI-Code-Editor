"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import type { OnMount } from '@monaco-editor/react'

type MonacoEditorInstance = Parameters<OnMount>[0];
type MonacoInstance = Parameters<OnMount>[1];


interface AISuggestionsState {
    suggestion: string | null;
    isLoading: boolean;
    position: { line: number; column: number } | null;
    decoration: string[];
    isEnabled: boolean;
}

interface UseAISuggestionsReturn extends AISuggestionsState {
    toggleEnabled: () => void;
    fetchSuggestion: (type: string, editor: MonacoEditorInstance) => Promise<void>;
    acceptSuggestion: (editor: MonacoEditorInstance, monaco: MonacoInstance) => void;
    rejectSuggestion: (editor: MonacoEditorInstance) => void;
    clearSuggestion: (editor: MonacoEditorInstance) => void;
}

export const UseAISuggestions = (): UseAISuggestionsReturn => {

    const [state, setState] = useState<AISuggestionsState>({
        suggestion: null,
        isLoading: false,
        position: null,
        decoration: [],
        isEnabled: true,

    });

    // Mirror of state so callbacks can read the latest values without
    // performing side effects inside setState updaters (which React may run twice).
    const stateRef = useRef(state);
    const abortControllerRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);


    const toggleEnabled = useCallback(() => {
        setState((prev) => {
            const nextEnabled = !prev.isEnabled;
            if (!nextEnabled) {
                abortControllerRef.current?.abort();
                abortControllerRef.current = null;
            }
            return {
                ...prev,
                isEnabled: nextEnabled,
                isLoading: nextEnabled ? prev.isLoading : false,
                suggestion: nextEnabled ? prev.suggestion : null,
                position: nextEnabled ? prev.position : null,
            };
        });
    }, []);

    const fetchSuggestion = useCallback(async (type: string, editor: MonacoEditorInstance) => {
        const currentState = stateRef.current;

        if (!currentState.isEnabled || !editor) {
            return;
        }

        const model = editor.getModel();
        const cursorPosition = editor.getPosition();

        if (!model || !cursorPosition) {
            return;
        }

        // Cancel any previous in-flight completion so edits (`Ctrl+X`, typing) never wait on stale AI calls
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const requestId = ++requestIdRef.current;
        const modelUri = model.uri?.toString?.() ?? "";
        const initialVersionId = model.getAlternativeVersionId?.();

        stateRef.current = { ...currentState, isLoading: true };
        setState((prev) => ({ ...prev, isLoading: true }));

        try {
            const payload = {
                fileContent: model.getValue(),
                cursorLine: cursorPosition.lineNumber - 1,
                cursorColumn: cursorPosition.column - 1,
                suggestionType: type
            }

            const response = await fetch("/api/code-completion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal,
            })

            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }

            const data = await response.json();

            const latestModel = editor.getModel?.();
            const isStale =
                controller.signal.aborted ||
                requestId !== requestIdRef.current ||
                !stateRef.current.isEnabled ||
                !latestModel ||
                (latestModel.uri?.toString?.() ?? "") !== modelUri ||
                (initialVersionId !== undefined &&
                    latestModel.getAlternativeVersionId?.() !== initialVersionId);

            if (isStale) {
                return;
            }

            if (data.suggestion) {
                const suggestionText = data.suggestion.trim();
                setState((prev) => ({
                    ...prev,
                    suggestion: suggestionText,
                    position: {
                        line: cursorPosition.lineNumber,
                        column: cursorPosition.column
                    },
                    isLoading: false
                }))
            } else {
                setState((prev) => ({ ...prev, isLoading: false }));
            }

        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return;
            }

            console.error("Error fetching code suggestion:", error);
            if (requestId === requestIdRef.current) {
                setState((prev) => ({ ...prev, isLoading: false }));
            }

        } finally {
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null;
            }
        }
    }, [])

    const clearState = useCallback((editor: MonacoEditorInstance) => {
        requestIdRef.current += 1;
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;

        const { decoration } = stateRef.current;
        if (editor && decoration.length > 0) {
            editor.deltaDecorations(decoration, []);
        }
        setState((currentState) => ({
            ...currentState,
            suggestion: null,
            position: null,
            decoration: [],
            isLoading: false,
        }));
    }, []);

    // The editor inserts the accepted text itself; here we only reset state.
    const acceptSuggestion = useCallback(
        (editor: MonacoEditorInstance) => clearState(editor),
        [clearState]
    );

    const rejectSuggestion = useCallback((editor: MonacoEditorInstance) => clearState(editor), [clearState]);

    const clearSuggestion = useCallback((editor: MonacoEditorInstance) => clearState(editor), [clearState]);

    return {
        ...state,
        toggleEnabled,
        fetchSuggestion,
        acceptSuggestion,
        rejectSuggestion,
        clearSuggestion,
    };
}
