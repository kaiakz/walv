# walv
An online GUI designer for LittlevGL

## Architecture
* A webpage built with [lv_micropython](https://github.com/littlevgl/lv_micropython)(WASM) and front-end component library. 
* WASM part provides a Simulator.
* The front-end component library provides a way to control Simulator: create,delete or modify a widget. Include attribute editor, style editor and animation editor.
* Generate final code by javascript, Use `Blob` to save file.
* Continue your work in last closed window: By `cookie`
