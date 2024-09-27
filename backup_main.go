package main

import (
	"bubble-wasm/internal/interpreter"
	"strings"
	"syscall/js"
)

var interp *interpreter.Interpreter

var inputCallback js.Value

func setInputCallback(this js.Value, args []js.Value) interface{} {
	if len(args) > 0 {
		inputCallback = args[0]
	}
	return nil
}

func input(prompt string) string {
	if !inputCallback.IsUndefined() {
		promise := inputCallback.Invoke(prompt)
		result := await(promise)
		return result.String()
	}
	return js.Global().Call("prompt", prompt).String()
}

func await(promise js.Value) js.Value {
	done := make(chan struct{})
	var result js.Value
	promise.Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		result = args[0]
		close(done)
		return nil
	}))
	<-done
	return result
}

func main() {
	interp = interpreter.NewInterpreter()
	js.Global().Set("bubbleREPL", js.ValueOf(map[string]interface{}{
		"runBubble":         js.FuncOf(runBubble),
		"runBubbleProgram":  js.FuncOf(runBubbleProgram),
		"setOutputCallback": js.FuncOf(setOutputCallback),
		"setInputCallback":  js.FuncOf(setInputCallback),
	}))
	<-make(chan struct{})
}

func runBubble(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return "Error: No input provided"
	}
	input := args[0].String()
	result, err := interp.Interpret(input)
	if err != nil {
		return "Error: " + err.Error()
	}
	if result != nil {
		return js.ValueOf(result)
	}
	return js.Undefined()
}

func runBubbleProgram(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return "Error: No program provided"
	}
	program := args[0].String()

	// Reset the interpreter to clear any previous state
	interp = interpreter.NewInterpreter()

	result, err := interp.Interpret(program)
	if err != nil {
		return "Error: " + err.Error()
	}
	if result != nil {
		return js.ValueOf(result)
	}
	return js.Undefined()
}

func setOutputCallback(this js.Value, args []js.Value) interface{} {
	if len(args) > 0 {
		interpreter.SetOutputCallback(args[0])
	}
	return nil
}

func isIncompleteStatement(input string) bool {
	return strings.Contains(input, "if") && !strings.Contains(input, "end")
}
