# walv
An online GUI designer for LittlevGL. [Try it online!](https://kaiakz.github.io/walv/index.html)

#### Alibaba Summer of Code 2019

## Feature
* Just a static webpage, you can open it in the lastest browser(FireFox, Chrome...even IOS Safari).
* Create object based on an object, Parent-child structure.
* Drag and drop to control the postion of the widget.
* Highlight the selected widget.
* TFT_simulator can be customized(size), supports mutiple windows.(To do)
* Modfied attribute(postion, size, click, etc).
* Style and Animation Editor(planning).
* Screenshot.
* Save and load project. The tool will save your project automatically, and could restore your work from the last closed window.
* Generate C and Python code: includes GUI and Callback. Just add a function `lv_gui_main` in your code to use LittlevGL.(Doing)

## Architecture
* A static webpage built with [lv_micropython](https://github.com/littlevgl/lv_micropython)(WASM) and front-end component library. 
* WASM part provides a Simulator.
* The front-end component library provides a way to control Simulator: create,delete or modify a widget. Include attribute editor, style editor and animation editor.(Now use Bootstrap)
* Generate final code by javascript, Use `Blob` to save file.
* Continue your work in last closed window: By `Web Storage`