import React, { useState, useEffect, useRef } from 'react';

const TokenizerDemo = ({ 
  defaultCode = '', 
  hideTextBox = false, 
  title,
  subtitle,
  footnote
}) => {
  const [input, setInput] = useState(defaultCode);
  const [tokenizedLines, setTokenizedLines] = useState([]);
  const [tooltip, setTooltip] = useState({ show: false, content: '', x: 0, y: 0 });
  const textareaRef = useRef(null);

  const tokenColors = {
    KEYWORD: 'bg-indigo-200 text-indigo-800',
    IDENTIFIER: 'bg-emerald-200 text-emerald-800',
    NUMBER: 'bg-amber-200 text-amber-800',
    STRING: 'bg-rose-200 text-rose-800',
    OPERATOR: 'bg-fuchsia-200 text-fuchsia-800',
    COMMENT: 'bg-slate-200 text-slate-800',
    EOF: 'bg-gray-200 text-gray-800',
  };

  const keywordDescriptions = {
    if: "Starts a conditional block",
    else: "Alternative condition in an if-statement",
    while: "Starts a while loop",
    for: "Starts a for loop",
    function: "Defines a new function",
    return: "Specifies the value to be returned from a function",
    set: "Assigns a value to a variable",
    to: "Used with 'set' to assign values",
    say: "Prints output to the console",
    input: "Reads user input",
    "end if": "Ends an if block",
  };

  const operatorDescriptions = {
    "+": "Addition operator",
    "-": "Subtraction operator",
    "*": "Multiplication operator",
    "/": "Division operator",
    "=": "Assignment operator",
    "==": "Equality comparison",
    "!=": "Inequality comparison",
    ">": "Greater than comparison",
    "<": "Less than comparison",
    ">=": "Greater than or equal to comparison",
    "<=": "Less than or equal to comparison",
    "is": "Comparison operator",
    "is not": "Negative comparison operator",
    "is greater than": "Greater than comparison",
    "is less than": "Less than comparison",
    "is greater than or equal to": "Greater than or equal to comparison",
    "is less than or equal to": "Less than or equal to comparison",
  };

  const tokenize = (input) => {
    const lines = input.split('\n');
    return lines.map((line) => {
      const tokens = [];
      let pos = 0;

      const isWhitespace = (c) => /\s/.test(c);
      const isLetter = (c) => /[a-zA-Z]/.test(c);
      const isDigit = (c) => /[0-9]/.test(c);
      const isOperator = (c) => /[+\-*/=<>!]/.test(c);
      const isKeyword = (s) => Object.keys(keywordDescriptions).includes(s.toLowerCase());
      const isOperatorKeyword = (s) => Object.keys(operatorDescriptions).includes(s);

      while (pos < line.length) {
        if (isWhitespace(line[pos])) {
          pos++;
        } else if (line[pos] === '#') {
          const start = pos;
          pos = line.length; // Comments go to end of line
          tokens.push({ type: 'COMMENT', value: line.slice(start) });
        } else if (isLetter(line[pos])) {
          const start = pos;
          while (pos < line.length && (isLetter(line[pos]) || isDigit(line[pos]))) pos++;
          let value = line.slice(start, pos);
          
          // Check for multi-word keywords
          if (value.toLowerCase() === 'end' && pos < line.length - 2 && line.slice(pos, pos + 3).toLowerCase() === ' if') {
            value = 'end if';
            pos += 3;
          }
          
          if (isKeyword(value)) {
            tokens.push({ type: 'KEYWORD', value: value.toLowerCase() });
          } else if (value.toLowerCase() === "is") {
            let fullOperator = value;
            const remainingLine = line.slice(pos).trim();
            const possibleOperators = [
              "is not",
              "is greater than",
              "is less than",
              "is greater than or equal to",
              "is less than or equal to"
            ];
            
            for (const op of possibleOperators) {
              if (remainingLine.toLowerCase().startsWith(op.slice(3))) { // slice(3) to remove "is "
                fullOperator = op;
                pos += op.length - 2; // -2 because "is" is already consumed
                break;
              }
            }
            
            tokens.push({ type: 'OPERATOR', value: fullOperator });
          } else {
            tokens.push({ type: 'IDENTIFIER', value });
          }
        } else if (isDigit(line[pos])) {
          const start = pos;
          while (pos < line.length && isDigit(line[pos])) pos++;
          tokens.push({ type: 'NUMBER', value: line.slice(start, pos) });
        } else if (line[pos] === '"') {
          const start = pos;
          pos++;
          while (pos < line.length && line[pos] !== '"') pos++;
          if (pos < line.length) pos++;
          tokens.push({ type: 'STRING', value: line.slice(start, pos) });
        } else if (isOperator(line[pos])) {
          const start = pos;
          while (pos < line.length && isOperator(line[pos])) pos++;
          const value = line.slice(start, pos);
          tokens.push({ type: 'OPERATOR', value });
        } else {
          pos++;
        }
      }
      return { line, tokens };
    });
  };

  const handleInputChange = (e) => {
    const newInput = e.target.value;
    setInput(newInput);
    setTokenizedLines(tokenize(newInput));
  };

  const handleTokenMouseEnter = (e, token) => {
    const rect = e.target.getBoundingClientRect();
    let content;
    if (token.type === 'KEYWORD') {
      content = keywordDescriptions[token.value] || token.type;
    } else if (token.type === 'OPERATOR') {
      content = operatorDescriptions[token.value] || token.type;
    } else {
      content = token.type;
    }
    setTooltip({
      show: true,
      content: content,
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY,
    });
  };

  const handleTokenMouseLeave = () => {
    setTooltip({ show: false, content: '', x: 0, y: 0 });
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    setTokenizedLines(tokenize(input));
  }, [input]);

  useEffect(() => {
    setInput(defaultCode);
  }, [defaultCode]);

  return (
    <div className="p-2 max-w-full mx-auto font-mono">
      {title && <span className="text-[12px] block font-sans font-bold">{title}</span>}
      {subtitle && <span className="text-[12px] block mb-4 font-sans text-gray-600">{subtitle}</span>}
      <div className={`md:flex md:space-x-4 ${hideTextBox ? 'md:justify-center md:align-stretch' : ''}`}>
        {!hideTextBox && (
          <div className="md:w-1/3 py-2 h-full  mb-4 md:mb-0">
            <textarea
              ref={textareaRef}
              className="w-full p-2 border text-xs h-full rounded resize-none overflow-hidden font-mono"
              value={input}
              onChange={handleInputChange}
              placeholder="Enter your multi-line code here..."
            />
          </div>
        )}
        <div className={hideTextBox ? 'w-full' : 'md:w-2/3'}>
          <div className="space-y-2">
            {tokenizedLines.map((lineData, lineIndex) => (
              <div key={lineIndex} className=" py-2  border-gray-300 pl-4">
                <pre className="text-xs pb-1 px-0 py-0 overflow-x-auto whitespace-pre-wrap break-all">{lineData.line}</pre>
                <div className="flex flex-wrap gap-1">
                  {lineData.tokens.map((token, tokenIndex) => (
                    <span
                      key={tokenIndex}
                      className={`inline-block px-2 py-0.5 font-semibold rounded text-xs ${tokenColors[token.type]} 
                                  transition-all duration-300 ease-in-out transform hover:scale-105
                                  cursor-pointer`}
                      onMouseEnter={(e) => handleTokenMouseEnter(e, token)}
                      onMouseLeave={handleTokenMouseLeave}
                    >
                      <span className="opacity-80">{token.value}</span>
                      <span className="text-[10px] font-light ml-2 opacity-50">{token.type}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {input && (
              <div className="border-gray-300 pl-4 mt-0">
                <span className={`inline-block px-1 py-0.5 text-[10px] rounded text-xs ${tokenColors.EOF} 
                                  transition-all duration-300 ease-in-out transform hover:scale-105`}>
                  EOF
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {footnote && <span className="text-xs mt-4 font-sans text-gray-500">{footnote}</span>}
      {tooltip.show && (
        <div
          className="absolute bg-black text-white px-1 py-0.5 rounded text-xs z-10"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default TokenizerDemo;