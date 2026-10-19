"use client"

import { useCallback, useEffect, useRef, useState } from 'react'


interface AISuggestionsState {
    suggestion: string | null;
    isLoading: boolean;
    position: { line: number; column: number } | null;
    decoration: string[];
    isEnabled: boolean;
}

interface UseAISuggestionsReturn extends AISuggestionsState {
    toggleEnabled: () => void;
    fetchSuggestion: (type: string, editor: any) => Promise<void>;
    acceptSuggestion: (editor: any, monaco: any) => void;
    rejectSuggestion: (editor: any) => void;
    clearSuggestion: (editor: any) => void;
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

    useEffect(() => {
        stateRef.current = state;
    }, [state]);


    const toggleEnabled = useCallback(() => {
        setState((prev) => ({ ...prev, isEnabled: !prev.isEnabled }));
    }, []);

    const fetchSuggestion = useCallback(async (type: string, editor: any) => {
        const currentState = stateRef.current;

        if (!currentState.isEnabled || currentState.isLoading || !editor) {
            return;
        }

        const model = editor.getModel();
        const cursorPosition = editor.getPosition();

        if (!model || !cursorPosition) {
            return;
        }

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
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }

            const data = await response.json();

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
                console.warn("No suggestion received from API.");
                setState((prev) => ({ ...prev, isLoading: false }));
            }

        } catch (error) {

            console.error("Error fetching code suggestion:", error);
            setState((prev) => ({ ...prev, isLoading: false }));

        }
    }, [])

    const clearState = useCallback((editor: any) => {
        const { decoration } = stateRef.current;
        if (editor && decoration.length > 0) {
            editor.deltaDecorations(decoration, []);
        }
        setState((currentState) => ({
            ...currentState,
            suggestion: null,
            position: null,
            decoration: [],
        }));
    }, []);

    // The editor inserts the accepted text itself; here we only reset state.
    const acceptSuggestion = useCallback(
        (editor: any, _monaco: any) => clearState(editor),
        [clearState]
    );

    const rejectSuggestion = useCallback((editor: any) => clearState(editor), [clearState]);

    const clearSuggestion = useCallback((editor: any) => clearState(editor), [clearState]);

    return {
        ...state,
        toggleEnabled,
        fetchSuggestion,
        acceptSuggestion,
        rejectSuggestion,
        clearSuggestion,
    };
}
