# walv
An Online, WYSIWYG GUI designer for LittlevGL. Cross-platform supported(Even Android and IOS).
## [Try it online!](https://kaiakz.github.io/walv/index.html)
Make sure your browser is the latest version(Chrome, Firefox and Safari). 

![gif of walv](https://user-images.githubusercontent.com/51747223/63927840-1b5a3780-ca81-11e9-8073-e033e52c7c1e.gif)

## Alibaba Summer of Code 2019 : [AliOS-Things](https://github.com/alibaba/AliOS-Things/)
### Old Version : [lv_gui_designer](https://github.com/kaiakz/lv_gui_designer)
This repository continues to being used for improvements and further development. Vuejs version is coming.

## Feature
* Just a static webpage, you need to use it with **the latest browser**(FireFox, Chrome...even IOS Safari).
* Create object based on an object. Support parent-child structure.
* Drag and drop to control the postion of the widget.
* Highlight the selected widget.
* Screenshot.
* Set attribute(postion, size, click, etc).
* Code Preview : ACE-Editor.
* TFT_simulator can be customized(size), supports mutiple windows.(To do)
* Style and Animation Editor(planning).
* Save and load project. The tool will save your project automatically, and could restore your work from the last closed window.
* Generate C and MicroPython code: includes GUI and Callback. Just add a function `lv_gui_main` in your code to use LittlevGL.(Doing)

## Architecture
* A static webpage built with [lv_micropython](https://github.com/littlevgl/lv_micropython)(WASM) and front-end component library. 
* WASM part provides a Simulator.
* The front-end component library provides a way to control Simulator: create,delete or modify a widget. Include attribute editor, style editor and animation editor.(Now use Bootstrap)
* Generate final code by javascript, Use `Blob` to save file.
* Continue your work in last closed window: By `IndexedDB`.

## How does it work?
* `lv_micropython` has some JavaScript API: `mp_js_do_str()`(`lv_micropython` will excute the parameter, just like eval() in Python or JavaScript)
* walv wraps some commonly used functions(see Getter & Setter), called `template`.
* walv provides a layer over the `lv_micropython`, it can generate some real functions by `template`, and then send those functions to `lv_micropython` by `mp_js_do_str`. For example, if the user want to change the X of the btn0 to 88 , walv will use the `template` (id.set_x(integer)) to generate the `btn0.set_x(88)`, and then send it to lv_micropython by `mp_js_do_str("btn0.set_x(88)")`.
