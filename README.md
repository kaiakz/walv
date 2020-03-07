# walv
An Online, WYSIWYG GUI designer for LittlevGL. Cross-platform supported(Even Android and IOS).
## [Try it online!](https://kaiakz.github.io/walv/index.html)
Make sure your browser is the latest version(Chrome, Firefox and Safari).

![preview](https://user-images.githubusercontent.com/51747223/75126997-84043300-56f7-11ea-8b54-3a5603cec9b7.gif)
![style_editor](https://user-images.githubusercontent.com/51747223/75605140-0e46ff80-5b1b-11ea-9260-f0c9ad87dc5a.gif)

## Usage
You need a browser firstly(Recommends PC with 1920x1080), and then visit [the github page](https://kaiakz.github.io/walv/index.html) or just run an HTTP server(`python -m http.server`) that serves files from this directory.
### Create
1. Click a node of the treeview in the left(as the parent), for example, `screen`.
2. Choose which widget you want, and then click the `+`.
### Generat && Export the final code
1. Click the `Generate` button to generate the source code, you can preview and edit the code in Code Editor.
2. Click the `Export` button, you can download the code in Code Editor.

## Feature
* Just a static webpage, you need to use it with **the latest browser**(FireFox, Chrome...even IOS Safari).
* Create object based on an object. Support parent-child structure.
* Drag and drop to control the postion of the widget.
* Style Editor(initial).
* Screenshot.
* Set attribute(postion, size, click, etc).
* Code Preview : ACE-Editor.
* TFT_simulator can be customized(size), supports mutiple windows.(To do)
* Animation Editor(planning).
* Save and load project. The tool will save your project automatically, and could restore your work from the last closed window.
* Generate C and MicroPython code: includes GUI and Callback.

## Architecture
* A static webpage built with [lv_micropython](https://github.com/littlevgl/lv_micropython)(WASM) and front-end component library. 
* WASM part provides a Simulator.
* The front-end component library provides a way to control Simulator: create,delete or modify a widget. Include attribute editor, style editor and animation editor.
* Generate final code by javascript, Use `Blob` to save file.
* Continue your work in last closed window: By `IndexedDB`.

## How does it work?
* `lv_micropython` has some JavaScript API: `mp_js_do_str()`(`lv_micropython` will excute the parameter, just like eval() in Python or JavaScript)
* walv wraps some commonly used functions(see Getter & Setter), called `template`.
* walv provides a layer over the `lv_micropython`, it can generate some real functions by `template`, and then send those functions to `lv_micropython` by `mp_js_do_str`. For example, if the user want to change the X of the btn0 to 88 , walv will use the `template` (id.set_x(integer)) to generate the `btn0.set_x(88)`, and then send it to lv_micropython by `mp_js_do_str("btn0.set_x(88)")`.

## Alibaba Summer of Code 2019 : [AliOS-Things](https://github.com/alibaba/AliOS-Things/)
### Old : [lv_gui_designer](https://github.com/kaiakz/lv_gui_designer)
