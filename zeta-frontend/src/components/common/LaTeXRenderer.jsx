// src/components/common/LaTeXRenderer.jsx
import { useEffect, useRef } from 'react';

/**
 * Component to render LaTeX math formulas
 * Converts $$formula$$ syntax to rendered math
 */
const LaTeXRenderer = ({ content }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && content) {
      renderLatex();
    }
  }, [content]);

  const renderLatex = () => {
    if (typeof window.MathJax !== 'undefined') {
      window.MathJax.typesetPromise([containerRef.current]).catch((err) => {
        console.error('MathJax rendering error:', err);
      });
    } else {
      // Load MathJax if not already loaded
      loadMathJax();
    }
  };

  const loadMathJax = () => {
    if (!document.getElementById('mathjax-script')) {
      const script = document.createElement('script');
      script.id = 'mathjax-script';
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      
      script.onload = () => {
        window.MathJax = {
          tex: {
            inlineMath: [['$', '$'], ['\\(', '\\)']],
            displayMath: [['$$', '$$'], ['\\[', '\\]']],
            processEscapes: true
          },
          svg: {
            fontCache: 'global'
          }
        };
        renderLatex();
      };
      
      document.head.appendChild(script);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="latex-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default LaTeXRenderer;