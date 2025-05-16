'use client';

import { EditorView, Direction } from '@codemirror/view';
import { EditorState, Transaction, StateEffect } from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';
import React, { memo, useEffect, useRef } from 'react';
import { Suggestion } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

type EditorProps = {
  content: string;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  status: 'streaming' | 'idle';
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  suggestions: Array<Suggestion>;
  dir?: 'rtl' | 'ltr';
  lang?: string;
};

function PureCodeEditor({ 
  content, 
  onSaveContent, 
  status, 
  dir = 'ltr',
  lang 
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      const startState = EditorState.create({
        doc: content,
        extensions: [
          basicSetup, 
          python(), 
          oneDark,
          EditorView.contentAttributes.of({
            dir: dir,
            lang: lang || ""
          }),
          // For RTL languages, set direction in CodeMirror
          dir === 'rtl' ? EditorView.lineWrapping : []
        ],
      });

      editorRef.current = new EditorView({
        state: startState,
        parent: containerRef.current,
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
    // NOTE: we only want to run this effect once
    // eslint-disable-next-line
  }, []);

  // Update editor direction when it changes
  useEffect(() => {
    if (editorRef.current) {
      const extension = EditorView.contentAttributes.of({
        dir: dir,
        lang: lang || ""
      });
      
      editorRef.current.dispatch({
        effects: StateEffect.reconfigure.of([extension])
      });
    }
  }, [dir, lang]);

  useEffect(() => {
    if (editorRef.current) {
      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const transaction = update.transactions.find(
            (tr) => !tr.annotation(Transaction.remote),
          );

          if (transaction) {
            const newContent = update.state.doc.toString();
            onSaveContent(newContent, true);
          }
        }
      });

      const currentSelection = editorRef.current.state.selection;

      const newState = EditorState.create({
        doc: editorRef.current.state.doc,
        extensions: [basicSetup, python(), oneDark, updateListener],
        selection: currentSelection,
      });

      editorRef.current.setState(newState);
    }
  }, [onSaveContent]);

  useEffect(() => {
    if (editorRef.current && content) {
      const currentContent = editorRef.current.state.doc.toString();

      if (status === 'streaming' || currentContent !== content) {
        const transaction = editorRef.current.state.update({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: content,
          },
          annotations: [Transaction.remote.of(true)],
        });

        editorRef.current.dispatch(transaction);
      }
    }
  }, [content, status]);

  return (
    <div
      className={cn("relative not-prose w-full pb-[calc(80dvh)] text-sm", {
        "rtl": dir === 'rtl'
      })}
      ref={containerRef}
      dir={dir}
      lang={lang}
    />
  );
}

function areEqual(prevProps: EditorProps, nextProps: EditorProps) {
  if (prevProps.suggestions !== nextProps.suggestions) return false;
  if (prevProps.currentVersionIndex !== nextProps.currentVersionIndex)
    return false;
  if (prevProps.isCurrentVersion !== nextProps.isCurrentVersion) return false;
  if (prevProps.status === 'streaming' && nextProps.status === 'streaming')
    return false;
  if (prevProps.content !== nextProps.content) return false;
  if (prevProps.dir !== nextProps.dir) return false;
  if (prevProps.lang !== nextProps.lang) return false;

  return true;
}

export const CodeEditor = memo(PureCodeEditor, areEqual);
