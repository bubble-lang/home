import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

// Context for the Bubble REPL WASM module
const BubbleREPLContext = createContext(null);

// Provider component to initialize and provide the Bubble REPL WASM module
export const BubbleREPLProvider = ({ children }) => {
  const [wasmModule, setWasmModule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWASMModule = async () => {
      try {
        const response = await fetch("/wasm_exec.js");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch WASM executor: ${response.status} ${response.statusText}`,
          );
        }
        const wasmExecScript = await response.text();
        eval(wasmExecScript);

        const go = new Go();
        const result = await WebAssembly.instantiateStreaming(
          fetch("/bubble.wasm"),
          go.importObject,
        );

        setWasmModule({ instance: result.instance, go });
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading Bubble REPL WASM module:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    loadWASMModule();
  }, []);

  return (
    <BubbleREPLContext.Provider value={{ wasmModule, isLoading, error }}>
      {children}
    </BubbleREPLContext.Provider>
  );
};

// Hook to use the Bubble REPL WASM module
const useBubbleREPL = () => {
  const context = useContext(BubbleREPLContext);
  if (context === undefined) {
    throw new Error("useBubbleREPL must be used within a BubbleREPLProvider");
  }
  return context;
};

// BubbleREPLTutorial component
export const BubbleREPLTutorial = ({ initialCode = "", active = false }) => {
  const { wasmModule, isLoading, error } = useBubbleREPL();
  const [input, setInput] = useState(initialCode);
  const [output, setOutput] = useState([]);
  const [interpreter, setInterpreter] = useState(null);
  const inputRef = useRef(null);

  const initializeInterpreter = useCallback(() => {
    if (wasmModule) {
      const { instance, go } = wasmModule;
      const newGo = new Go();
      const newInstance = new WebAssembly.Instance(
        instance.exports,
        newGo.importObject,
      );
      newGo.run(newInstance);
      const newInterpreter = globalThis.bubbleREPL;
      if (!newInterpreter) {
        throw new Error("bubbleREPL not found in global scope");
      }
      newInterpreter.setOutputCallback((text) => {
        setOutput((prev) => [...prev, { type: "output", content: text }]);
      });
      setInterpreter(newInterpreter);
    }
  }, [wasmModule]);

  useEffect(() => {
    initializeInterpreter();
  }, [initializeInterpreter]);

  const runCode = async () => {
    if (!interpreter) return;

    setOutput((prev) => [...prev, { type: "input", content: input }]);
    try {
      const result = await interpreter.runBubble(input);
      if (result !== undefined && result !== null) {
        setOutput((prev) => [
          ...prev,
          { type: "output", content: result.toString() },
        ]);
      }
    } catch (err) {
      setOutput((prev) => [...prev, { type: "error", content: err.message }]);
    }
    setInput("");
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runCode();
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading Bubble REPL...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="my-4 relative border rounded-md p-4">
      <div className="mb-4 h-48 overflow-y-auto bg-gray-100 p-2 rounded">
        {output.map((item, index) => (
          <div
            key={index}
            className={`${item.type === "input" ? "text-blue-600" : item.type === "error" ? "text-red-600" : ""}`}
          >
            {item.type === "input" ? "> " : ""}
            {item.content}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your code here..."
          className="flex-grow px-2 py-1 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={runCode}
          className="px-4 py-1 bg-blue-500 text-white rounded-r hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          Run
        </button>
      </div>
    </div>
  );
};

// Example usage
const App = () => {
  return (
    <BubbleREPLProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Bubble REPL Tutorial</h1>
        <BubbleREPLTutorial
          initialCode="print 'Hello, Bubble!'"
          active={true}
        />
        <BubbleREPLTutorial initialCode="set x to 5" active={false} />
      </div>
    </BubbleREPLProvider>
  );
};

export default App;
