// src/components/LaTeXText.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LaTeXTextProps {
  text: string;
  block?: boolean;
}

export const LaTeXText: React.FC<LaTeXTextProps> = ({ text, block = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !text) return;

    try {
      const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
      containerRef.current.innerHTML = '';
      
      parts.forEach((part) => {
        if (!part) return;
        
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          const div = document.createElement('div');
          div.className = 'my-4';
          try {
            katex.render(math, div, { displayMode: true, throwOnError: false });
          } catch (err) {
            div.textContent = math;
          }
          containerRef.current?.appendChild(div);
        }
        else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          const span = document.createElement('span');
          try {
            katex.render(math, span, { displayMode: false, throwOnError: false });
          } catch (err) {
            span.textContent = math;
          }
          containerRef.current?.appendChild(span);
        }
        else {
          const span = document.createElement('span');
          span.textContent = part;
          containerRef.current?.appendChild(span);
        }
      });
    } catch (error) {
      if (containerRef.current) {
        containerRef.current.textContent = text;
      }
    }
  }, [text]);

  return <div ref={containerRef} className="latex-content inline" />;
};