import React, { useState, useEffect, useRef } from 'react';

const ParserDemo = ({ 
  defaultCode = '', 
  hideTextBox = false, 
  title = 'Parser Demo',
  subtitle = 'Visualizing the parsing process',
  footnote
}) => {
  const [input, setInput] = useState(defaultCode || `set x to 5
if x is greater than 3
  say "x is greater than 3"
else
  say "x is not greater than 3"
end if`);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tokenizedLines, setTokenizedLines] = useState([]);
  const [parseSteps, setParseSteps] = useState([]);
  const [astTree, setAstTree] = useState([]);
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

  const tokenize = (input) => {
    const lines = input.split('\n');
    return lines.map((line) => {
      const tokens = [];
      let pos = 0;

      const isWhitespace = (c) => /\s/.test(c);
      const isLetter = (c) => /[a-zA-Z]/.test(c);
      const isDigit = (c) => /[0-9]/.test(c);
      const isOperator = (c) => /[+\-*/=<>!]/.test(c);
      const isKeyword = (s) => ['set', 'to', 'if', 'else', 'end if', 'say', 'is'].includes(s.toLowerCase());

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
          } else if (value.toLowerCase() === 'is' && pos < line.length - 12 && line.slice(pos, pos + 13).toLowerCase() === ' greater than') {
            value = 'is greater than';
            pos += 13;
          }
          
          if (isKeyword(value)) {
            tokens.push({ type: 'KEYWORD', value: value.toLowerCase() });
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

  const generateParseSteps = (tokenizedLines) => {
    const steps = [{ description: 'Start parsing', highlightToken: null, astUpdate: [] }];
    let currentAst = [];
    let tokenIndex = 0;

    tokenizedLines.forEach((lineData, lineIndex) => {
      lineData.tokens.forEach((token) => {
        let newNode;
        switch (token.type) {
          case 'KEYWORD':
            if (token.value === 'set') {
              newNode = { type: 'AssignmentNode', children: [] };
            } else if (token.value === 'if') {
              newNode = { type: 'IfNode', children: [] };
            } else if (token.value === 'say') {
              newNode = { type: 'PrintNode', children: [] };
            }
            break;
          case 'IDENTIFIER':
            newNode = { type: 'VariableNode', value: token.value };
            break;
          case 'NUMBER':
            newNode = { type: 'NumberNode', value: parseInt(token.value) };
            break;
          case 'STRING':
            newNode = { type: 'StringNode', value: token.value };
            break;
          case 'OPERATOR':
            newNode = { type: 'OperatorNode', value: token.value };
            break;
        }
        if (newNode) {
          if (currentAst.length > 0 && currentAst[currentAst.length - 1].children) {
            currentAst[currentAst.length - 1].children.push(newNode);
          } else {
            currentAst.push(newNode);
          }
        }
        steps.push({
          description: `Parse ${token.type.toLowerCase()}: ${token.value}`,
          highlightToken: { line: lineIndex, token: tokenIndex },
          astUpdate: JSON.parse(JSON.stringify(currentAst))
        });
        tokenIndex++;
      });
    });
    steps.push({ description: 'Parsing complete', highlightToken: null, astUpdate: currentAst });
    return steps;
  };

  useEffect(() => {
    const newTokenizedLines = tokenize(input);
    setTokenizedLines(newTokenizedLines);
    const newParseSteps = generateParseSteps(newTokenizedLines);
    setParseSteps(newParseSteps);
    setCurrentStep(0);
    setAstTree([]);
  }, [input]);

  const nextStep = () => {
    if (currentStep < parseSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setAstTree(parseSteps[currentStep + 1].astUpdate);
    } else {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setTimeout(nextStep, 1000);
    }
    return () => clearTimeout(timer);
  }, [isRunning, currentStep]);

  const toggleRunning = () => {
    if (!isRunning && currentStep === parseSteps.length - 1) {
      setCurrentStep(0);
      setAstTree([]);
    }
    setIsRunning(!isRunning);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setIsRunning(false);
    setCurrentStep(0);
    setAstTree([]);
  };

  const handleTokenMouseEnter = (e, token) => {
    const rect = e.target.getBoundingClientRect();
    setTooltip({
      show: true,
      content: token.type,
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY,
    });
  };

  const handleTokenMouseLeave = () => {
    setTooltip({ show: false, content: '', x: 0, y: 0 });
  };

  const renderVisualAstNode = (node, depth = 0, isLast = true) => {
    const nodeColor = {
      AssignmentNode: 'bg-blue-200',
      IfNode: 'bg-green-200',
      PrintNode: 'bg-yellow-200',
      VariableNode: 'bg-purple-200',
      NumberNode: 'bg-red-200',
      StringNode: 'bg-pink-200',
      OperatorNode: 'bg-orange-200',
    };

    return (
      <div key={`${node.type}-${depth}-${node.value}`} className="relative pl-5">
        {depth > 0 && (
          <div className="absolute left-0 top-0 h-full w-4 flex items-center">
            <div className={`h-full w-px bg-gray-300 ${isLast ? 'h-1/2' : ''}`}></div>
          </div>
        )}
        <div className="relative">
          {depth > 0 && (
            <div className="absolute left-0 top-1/2 w-4 h-px bg-gray-300"></div>
          )}
          <div className={`inline-block px-2 py-1 rounded ${nodeColor[node.type] || 'bg-gray-200'} text-xs`}>
            {node.type}
            {node.value !== undefined && <span className="ml-1 font-bold">: {node.value}</span>}
          </div>
        </div>
        {node.children && (
          <div className="ml-4">
            {node.children.map((child, index) => 
              renderVisualAstNode(child, depth + 1, index === node.children.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-2 max-w-full mx-auto font-mono">
      <span className="text-[12px] block font-sans font-bold">{title}</span>
      <span className="text-[12px] block mb-4 font-sans text-gray-600">{subtitle}</span>
      <div className={`md:flex md:space-x-4 ${hideTextBox ? 'md:justify-center md:align-stretch' : ''}`}>
        {!hideTextBox && (
          <div className="md:w-2/5 py-2 h-auto mb-4 md:mb-0">
            <textarea
              ref={textareaRef}
              className="w-full p-2 border text-xs h-full rounded resize-none overflow-hidden font-mono"
              value={input}
              onChange={handleInputChange}
              placeholder="Enter your code here..."
            />
          </div>
        )}
        <div className={hideTextBox ? 'w-full' : 'md:w-3/5'}>
          <div className="space-y-2 mb-4">
            <div className="flex space-x-2">
              <button
                className={`px-2 py-1 rounded text-xs ${
                  isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                } text-white`}
                onClick={toggleRunning}
              >
                {isRunning ? 'Stop' : 'Start'}
              </button>
              <button
                className="px-2 py-1 rounded text-xs bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => {
                  setCurrentStep(0);
                  setAstTree([]);
                  setIsRunning(false);
                }}
              >
                Reset
              </button>
            </div>
         
            <div className="border p-2 rounded">
              <div className="text-xs font-semibold mb-1">Current Step:</div>
              <div className="text-xs">{parseSteps[currentStep]?.description || 'No parsing steps'}</div>
            </div>
            <div className="border p-2 rounded">
              <div className="text-xs font-semibold mb-1">Abstract Syntax Tree:</div>
              <div className="text-xs overflow-auto max-h-60">
                {astTree.map((node, index) => renderVisualAstNode(node, 0, index === astTree.length - 1))}
              </div>
            </div>
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

export default ParserDemo;