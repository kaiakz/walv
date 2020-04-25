
var vm = null;


window.onload = function() {
    vm = new Vue(WALV_MAIN);

    /* Initialize the wasm mpy */
    mpylvInit(vm);

    /* Initialize the ace editor */
    editorInit(vm);

    document.title = "WALV: The Online Designer For LittlevGL";


}



const mpylvInit = (vm) => {

    Module.canvas = document.getElementById("canvas");

    /* Bind mp_js_stdout */
    mp_js_stdout = document.getElementById('mp_js_stdout');
    mp_js_stdout.value = "";

    /* Initialize the xtermjs */
    Terminal.applyAddon(fit);
    var term = new Terminal({
      cursorBlink: true,
    //   theme: {
    //     background: '#fdf6e3'
    //   }
    });
    term.open(document.getElementById("mpy_repl"), true);
    term.fit();
    term.write('Welcome To \x1B[1;3;31mWALV\x1B[0m');

    /*Initialize MicroPython itself*/
    mp_js_init(8 * 1024 * 1024);

    /*Setup printing event handler*/
    mp_js_stdout.addEventListener('print', function(e) {
        // console.log(e.data);
        term.write(vm.handleOutput(e.data));
    }, false);

    /*Setup key input handler */
    term.on('data', function(key, e) {
        for(var i = 0; i < key.length; i++) {
            mp_js_process_char(key.charCodeAt(i));
        }
    });

    vm.Term = term;

    /* Run init script */
    mp_js_do_str(EnvInitCode.join('\n'));

    /* Add function querry_attr() & walv_callback() */
    mp_js_do_str(QueryCode.join('\n'));
    wrap_equal("ATTR", JSON.stringify(Getter)); //Add ATTR to mpy, ATTR is common getter

    /*Setup lv_task_handler loop*/
    var the_mp_handle_pending = Module.cwrap('mp_handle_pending', null);
    function handle_pending() {
        the_mp_handle_pending();
        setTimeout(handle_pending, 10); // should call lv_task_handler()
    }

    /*Initialize the REPL.*/
    mp_js_init_repl();

    /*Start the main loop, asynchronously.*/
    handle_pending();
}

// Init the ace editor
const editorInit = (vm) => {
    let editor = ace.edit("code-editor");
    editor.getSession().setUseWrapMode(true);
    editor.setAutoScrollEditorIntoView(true);
    editor.setFontSize(15);
    editor.resize();
    let c_edit_mode = ace.require("ace/mode/c_cpp").Mode;
    let py_edit_mode = ace.require("ace/mode/python").Mode;
    editor.session.setMode(new py_edit_mode());
    editor.setOptions({maxLines: "200px" });
    vm.editor = editor;
    vm.py_edit_mode = py_edit_mode;
    vm.c_edit_mode = c_edit_mode;
}


const WALV_MAIN = {
    el: "#walv",

    data: {
        editor: null,
        c_edit_mode: null,
        py_edit_mode: null,
        is_c_mode: false, //true: c, false: python
        Term: null,

        buffer: [],
        str_json: "",
        mask: false,
        currentWidget: {},   // The Attributes
        posJSON: {},
        WidgetPool: {},
        InfoPool: {},

        setter: setter,
        currentType: null,

        //Simulator
        cursorX: 0,
        cursorY: 0,

        //Creator
        creator_options: WidgetsOption,
        props: {emitPath: false, expandTrigger: 'hover'},
        selectedType: "",
        widgetNum: 0,
        Count: 0,

        //TreeView
        widget_tree: [
            {
                label: "screen",
                children: []
            },
            // For invisible
            {
                label: "",
                children: []
            }
        ],
        // Which node in TreeView was checked
        checkedNode: {
            id: null,
            obj: null,
            // type: null,  // DEPRECATED
        },

        //Terminal
        term_visible: true,

        // Style Editor
        style_visible: false,
        style: {
            body: {
                main_color: null,
                grad_color: null,
            },
            text: {
                color: "#409EFF",
                font: "font_roboto_16",
            },
            image: {

            },
            line: {

            },
        }
    },


    watch: {
        //Parse string to JSON
        str_json: function() {
            try {

                let tmp = JSON.parse(this.str_json);
                if(Object.keys(tmp).length == 3) {
                    this.posJSON = tmp;

                    //Update Postion
                    this.WidgetPool[tmp['id']]['x'] = this.posJSON['x'];
                    this.WidgetPool[tmp['id']]['y'] = this.posJSON['y'];

                    this.changeInfo(tmp['id'], 'x');
                    this.changeInfo(tmp['id'], 'y');

                    // Change the Setting to show the widget that was just moved.
                    this.currentWidget = this.WidgetPool[tmp['id']];
                    this.currentType = this.InfoPool[tmp['id']]['type'];

                    this.drawRect(this.currentWidget.x, this.currentWidget.y, this.currentWidget.width, this.currentWidget.height);
                } else {
                    this.WidgetPool[tmp['id']] = tmp;
                    this.currentWidget = this.WidgetPool[tmp['id']];
                }
            } catch (error) {
                alert(error);
            }
        },

    },

    methods: {
        // Handle the information(strats with \x06, end with \x15)
        handleOutput: function(text) {
            if(text == '\x15')      //End: '\x15'
            {
                this.mask = false;
                this.str_json = this.buffer.join('');
            }                
            if(this.mask)
            {
                this.buffer.push(text);
                text = "";
            }        
            if(text == '\x06')      //Begin: '\x06'
            {
                this.mask = true;
            }

            if(text == '\n')
            {
                this.buffer.splice(0, this.buffer.length);
            }
            return text;
        },

        Creator: function() {
            if (this.selectedType == "") {
                this.$message({
                    message: 'Please select a type',
                    type: 'error'
                });
                return;
            } else {
                let parent_id = this.getCurrentID();
                if (parent_id === null) {
                    this.$message({
                        message: 'You must choose a widget!',
                        type: 'error'
                    });
                    return;
                }
                if (parent_id == "") {
                    this.$message({
                        message: 'You created a widget invisible',
                        type: 'warning'
                    });

                }
                this.createWidget(this.selectedType, parent_id);
            }
        },

        //Parametres are the String type
        createWidget: function(type, strPar) {
            var id = this.makeID(type);
            var par = strPar;

            wrap_create(id, par, type);

            //TODO: BUG
            this.appendNode(id);

            //** walv saves the inital info to WidgetPool && InfoPool

            //Store Info that a widget was created from.
            this.addInfo(id, par, type);

            // Change currentType, walv will render new input for setters
            this.currentType = type;
        },

        // Increase by 1
        makeID: function(type) {
            let id = type + (this.Count++).toString(16);
            this.widgetNum += 1;
            return id;
        },

        // Append new node to TreeView
        appendNode(widget_name) {
            let new_child = {
                label: widget_name,
                children: [] };
            let node = this.$refs.TreeView.getCurrentNode();
            if (node != null) {
                node.children.push(new_child);
            }
        },

        // Delete node and its childs(reverse)
        deleteNode: function() {
            const node = this.checkedNode.obj;
            const id = this.checkedNode.id;

            if (id == "screen" || id == "") {
                this.$message({
                    message: "You can't delete the screen or nothing!",
                    type: 'error'
                });
                return; // Not support delete screen now
            }
            // delete child
            let record = [id]; // Which child was deleted
            reverse_del_node(node.data, record);

            // delete itself
            const children = node.parent.data.children;
            const index = children.findIndex(d => d.label === id);
            wrap_delete(id);
            children.splice(index, 1);
            this.widgetNum -= record.length;

            // Clear this.checkedNode
            this.checkedNode.obj = null;
            this.checkedNode.id = null;

            // Remove the related info
            pool_delete(this.WidgetPool, record);
            pool_delete(this.InfoPool, record);
            this.currentWidget = this.WidgetPool['screen'];

            this.$message({
                message: 'Delete sucessfully',
                type: 'success'
            });
        },

        // When the node is clicked, walv will: change the checkedNode, set new id for label, update the Setting
        // https://element.eleme.cn/#/en-US/component/tree
        clickNode: function(data, obj, tree_obj) {
            this.checkedNode.id = data.label;
            this.checkedNode.obj = obj;

            let id = data.label;
            if (id == "") {// NOTICE
                return;
            }
            // If WidgetPool doesn't has infomation of the widget
            if (this.WidgetPool[id] == undefined) {
                let type = "\'obj\'";
                if (id != "screen") {
                    type = this.InfoPool[id]['type'];
                }
                wrap_query_attr(id, type);
            }
            // if (id != 'screen') {
            //     this.checkedNode.type = this.InfoPool[id]['type'];   // TODO
            // } DEPRECATED
            this.currentWidget = this.WidgetPool[id];
        },

        // Update the X & Y below the Simulator
        cursorXY : function(event) {
            this.cursorX = 0 | (event.offsetX / 1.25);
            this.cursorY = 0 | (event.offsetY / 1.25);
        },

        // Get the id of recently checked node
        getCurrentID: function() {
            return this.checkedNode.id;
            // node = this.$refs.TreeView.getCurrentNode()
            // if (node != null) {
            //     return node.label;
            // }
            // return null;
        },

        // Lock the widget, so it can't move anymore
        // lock_widget: function() {
        //     let drag_state = this.currentWidget["get_drag"];
        //     if(drag_state == true) {
        //         drag_state = "True";
        //     } else {
        //         drag_state = "False";
        //     }

        //     mp_js_do_str(this.currentWidget["id"] + ".set_drag(" + drag_state + ')');
        // },


        // Apply change to the widget: number
        bindWidgetNumerical: function(attribute) {

            let value = this.currentWidget[attribute];

            if(value == null) {
                value = 0;
            }

            let id = this.currentWidget["id"];

            wrap_simple_setter(id, attribute, value);

            this.changeInfo(id, attribute);
        },

        // Apply change to the widget: boolean
        bindWidgetBool: function(attribute) {

            let value = this.currentWidget[attribute];

            if(value == true) {
                value = "True"
            } else {
                value = "False"
            }

            let id = this.currentWidget["id"];

            wrap_simple_setter(id, attribute, value);

            this.reverseInfo(id, attribute);
        },

        bindWidgetSpecial: function(e, f) {
            let id = this.currentWidget["id"];
            let api = f['api'];
            let params = e.target.value;
            if(params == "") {  // If input nothing
                return;
            }
            wrap_setter_str(id, api, params);
        },

        // Add some information for the new widget to InfoPool
        addInfo: function(id, par_name, type) {
            let info = {
                type: type,
                parent: par_name,
                cb: false,
                attributes: [],
            };
            this.InfoPool[id] = info;
        },

        // For text or number, save something in InfoPool
        changeInfo: function(id, attribute_name) {
            let index = this.InfoPool[id].attributes.indexOf(attribute_name);
            if (index == -1) {
                this.InfoPool[id].attributes.push(attribute_name);
            }
        },

        // For boolean only, save something in InfoPool
        reverseInfo: function(id, attribute_name) {
            let index = this.InfoPool[id].attributes.indexOf(attribute_name);
            if (index != -1) {
                this.InfoPool[id].attributes.splice(index, 1);
            } else {
                this.InfoPool[id].attributes.push(attribute_name);
            }
        },

        // User enable CallBack template
        enableCBInfo: function(id) {
            this.InfoPool[id].cb = true;
        },

        refreshTerm: function() {
            this.Term.clear();
            this.Term.write("\r\x1b[K>>> ");
        },

        // Take a screenshot for the Simulator
        screenshot: function() {
            document.getElementById("canvas").toBlob((blob) => {
                saveAs(blob, "screenshot.png");
            });
        },

        // Generate the code and print them to the editor.
        generateCode: function() {
            let preview_code = "";
            if (this.is_c_mode) {
                preview_code = c_generator(this.InfoPool, this.WidgetPool);
            } else {
               preview_code = python_generator(this.InfoPool, this.WidgetPool);
            }
            this.editor.setValue(preview_code);
            this.$message({
                message: 'Generate code sucessfully',
                type: 'success'
            });
        },

        // Export the code in editor as a file.
        exportCodeAsFile: function() {
            let code = this.editor.getValue();
            this.$message({
                message: 'Export file sucessfully',
                type: 'success'
            });
            let blob = new Blob([code], {type: "text/plain;charset=utf-8"});
            if (this.is_c_mode) {
                saveAs(blob, "lv_gui.h");
            } else {
                saveAs(blob, "lv_gui.py");
            }
        },

        // Set the style
        makeStyle: function() {
            wrap_simple_style(this.currentWidget["id"], this.style);
        },

        //Highlight object
        drawRect: (x, y, w, h) => {
            let ctx = document.getElementById("canvas").getContext("2d");
            ctx.strokeStyle="red";
            ctx.lineWidth = 2;
            ctx.setLineDash([5,5]);
            ctx.strokeRect(x, y, w, h);
        },

        // arguments
        setArgs: (args) => {
            li = [];
            for (const i of args) {
                li.push(i["type"])
            }
            return li.toString();
        }
    },
}


const reverse_del_node = (node, record) => {
    let childs = node.children;
    for (const iter of childs) {
        reverse_del_node(iter, record);
        wrap_delete(iter.label);
        record.push(iter.label);
    }
    childs.splice(0, childs.length);
}

const pool_delete = (pool, list) => {
    for (const i of list) {
        delete pool[i];
    }
}

window.addEventListener('beforeunload', (event) => {
    event.preventDefault();
    event.returnValue = '';
});