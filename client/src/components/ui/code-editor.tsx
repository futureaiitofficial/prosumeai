import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: 'html' | 'css' | 'javascript';
  height?: string;
  placeholder?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'html',
  height = '400px',
  placeholder = 'Enter code here...',
}) => {
  // Map language prop to Prism language
  const getLanguage = (lang: string) => {
    switch (lang) {
      case 'html':
        return languages.markup;
      case 'css':
        return languages.css;
      case 'javascript':
        return languages.javascript;
      default:
        return languages.markup;
    }
  };

  return (
    <div 
      className="font-mono text-sm overflow-auto" 
      style={{ 
        height, 
        background: 'var(--background)',
        borderRadius: 'var(--radius)'
      }}
    >
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={(code: string) => highlight(code, getLanguage(language), language)}
        padding={16}
        style={{
          fontFamily: 'monospace',
          minHeight: height,
        }}
        placeholder={placeholder}
        className="w-full"
      />
    </div>
  );
};

export default CodeEditor; 