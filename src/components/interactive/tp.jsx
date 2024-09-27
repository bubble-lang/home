import React, { useState, useEffect } from 'react';

const LexerParserVisualization = ({ defaultCode = 'set x to 5\nif x is greater than 3\n  say "x is greater than 3"\nelse\n  say "x is not greater than 3"\nend if' }) => {
  const [input, setInput] = useState(defaultCode);
  const [tokens, setTokens] = useState([]);
  const [ast, setAst] = useState(null);

  const tokenColors = {
    KEYWORD: 'bg-blue-200',
    IDENTIFIER: 'bg-green-200',
    NUMBER: 'bg-yellow-200',
    STRING: 'bg-red-200',
    OPERATOR: 'bg-purple-200',
  };

  const tokenize = (input) => {
    const tokenRegex = /\b(set|to|if|is|greater|than|say|else|end)\b|\d+|"[^"]*"|\S+/g;
    return input.match(tokenRegex).map(value => {
      let type = 'IDENTIFIER';
      if (['set', 'if', 'else', 'end'].includes(value)) type = 'KEYWORD';
      else if (/^\d+$/.test(value)) type = 'NUMBER';
      else if (/^".*"$/.test(value)) type = 'STRING';
      else if (['is', 'greater', 'than'].includes(value)) type = 'OPERATOR';
      return { type, value };
    });
  };

  const parse = (tokens) => {
    let position = 0;

    const parseProgram = () => {
      const statements = [];
      while (position < tokens.length) {
        statements.push(parseStatement());
      }
      return { type: 'Program', body: statements };
    };

    const parseStatement = () => {
      const token = tokens[position];
      if (token.type === 'KEYWORD') {
        switch (token.value) {
          case 'set': return parseAssignment();
          case 'if': return parseIfStatement();
          case 'say': return parseSayStatement();
          default: throw new Error(`Unexpected keyword: ${token.value}`);
        }
      }
      throw new Error(`Unexpected token: ${token.value}`);
    };

    const parseAssignment = () => {
      position++; // skip 'set'
      const variable = tokens[position++].value;
      position++; // skip 'to'
      const value = parseExpression();
      return { type: 'Assignment', variable, value };
    };

    const parseIfStatement = () => {
      position++; // skip 'if'
      const condition = parseExpression();
      const thenBlock = [parseStatement()];
      let elseBlock = [];
      if (position < tokens.length && tokens[position].value === 'else') {
        position++; // skip 'else'
        elseBlock = [parseStatement()];
      }
      position += 2; // skip 'end if'
      return { type: 'IfStatement', condition, thenBlock, elseBlock };
    };

    const parseSayStatement = () => {
      position++; // skip 'say'
      const message = parseExpression();
      return { type: 'SayStatement', message };
    };

    const parseExpression = () => {
      let left = parsePrimary();
      while (position < tokens.length && tokens[position].type === 'OPERATOR') {
        const operator = tokens[position++].value;
        const right = parsePrimary();
        left = { type: 'BinaryExpression', operator, left, right };
      }
      return left;
    };

    const parsePrimary = () => {
      const token = tokens[position++];
      switch (token.type) {
        case 'NUMBER': return { type: 'NumberLiteral', value: parseFloat(token.value) };
        case 'STRING': return { type: 'StringLiteral', value: token.value.slice(1, -1) };
        case 'IDENTIFIER': return { type: 'Identifier', name: token.value };
        default: throw new Error(`Unexpected token: ${token.value}`);
      }
    };

    return parseProgram();
  };

  useEffect(() => {
    const newTokens = tokenize(input);
    setTokens(newTokens);
    setAst(parse(newTokens));
  }, [input]);

  const renderAst = (node, depth = 0) => {
    if (!node) return null;
    const indent = '  '.repeat(depth);

    if (Array.isArray(node)) {
      return node.map((item, index) => <div key={index}>{renderAst(item, depth)}</div>);
    }

    return (
      <div className="font-mono text-sm">
        {indent}
        <span className="text-blue-600">{node.type}</span>
        {node.variable && <span className="text-green-600"> ({node.variable} = {renderAst(node.value, depth + 1)})</span>}
        {node.condition && <span className="text-purple-600"> ({renderAst(node.condition, depth + 1)})</span>}
        {node.message && <span className="text-red-600"> ({renderAst(node.message, depth + 1)})</span>}
        {node.operator && (
          <span>
            {' '}
            <span className="text-yellow-600">{node.operator}</span>
            {' '}
            <span className="text-green-600">{renderAst(node.left, depth + 1)}</span>
            {' '}
            <span className="text-green-600">{renderAst(node.right, depth + 1)}</span>
          </span>
        )}
        {node.name && <span className="text-green-600"> {node.name}</span>}
        {node.value !== undefined && <span className="text-amber-600"> {node.value}</span>}
        {node.thenBlock && (
          <div className="ml-4">
            {indent}Then:
            {renderAst(node.thenBlock, depth + 1)}
          </div>
        )}
        {node.elseBlock && node.elseBlock.length > 0 && (
          <div className="ml-4">
            {indent}Else:
            {renderAst(node.elseBlock, depth + 1)}
          </div>
        )}
        {node.body && node.body.length > 0 && (
          <div className="ml-4">{renderAst(node.body, depth + 1)}</div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 max-w-full mx-auto font-mono">
      <div className="mb-4">
        <textarea
          className="w-full p-2 border text-sm rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
        />
      </div>
      <div className="mb-4">
        <h3 className="text-sm font-bold mb-2">Tokens:</h3>
        <div className="flex flex-wrap gap-1">
          {tokens.map((token, index) => (
            <span key={index} className={`inline-block px-2 py-0.5 rounded text-xs ${tokenColors[token.type]}`}>
              {token.value}
              <span className="text-[10px] ml-1 opacity-50">{token.type}</span>
            </span>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold mb-2">Abstract Syntax Tree:</h3>
        <div className="bg-gray-100 p-2 rounded overflow-auto h-60">
          {renderAst(ast)}
        </div>
      </div>
    </div>
  );
};

export default LexerParserVisualization;