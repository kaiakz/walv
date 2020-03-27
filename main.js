
var vm = null;


window.onload = function() {
    vm = new Vue(WALV_MAIN);

    /* Initialize the wasm mpy */
    mpylv_init(vm);

    /* Initialize the ace editor */
    editor_init(vm);

    document.title = "WALV: The Online Designer For LittlevGL";


}



const mpylv_init = (vm) => {

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
        term.write(vm.handle_stdout(e.data));
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
const editor_init = (vm) => {
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
        currJSON: {},   // The Attributes
        posJSON: {},
        WidgetPool: {},
        InfoPool: {},

        //Simulator
        cursorX: 0,
        cursorY: 0,

        //Creator
        creator_options: WidgetsOption,
        props: {emitPath: false, expandTrigger: 'hover'},
        selected_type: "",
        WidgetNum: 0,
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
        CheckedNode: {
            id: null,
            obj: null,
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

                    this.InfoPool_modify(tmp['id'], 'x');
                    this.InfoPool_modify(tmp['id'], 'y');

                    this.currJSON = this.WidgetPool[tmp['id']];

                    this.draw_rect(this.currJSON.x, this.currJSON.y, this.currJSON.width, this.currJSON.height);
                } else {
                    this.WidgetPool[tmp['id']] = tmp;
                    this.currJSON = this.WidgetPool[tmp['id']];
                }
            } catch (error) {
                alert(error);
            }
        },

    },

    methods: {
        // Handle the information(strats with \x06, end with \x15)
        handle_stdout: function(text) {
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
            if (this.selected_type == "") {
                this.$message({
                    message: 'Please select a type',
                    type: 'error'
                });
                return;
            } else {
                let parent_id = this.get_curr_id();
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
                this.CreateWidget(this.selected_type, parent_id);
            }
        },

        //Parametres are the String type
        CreateWidget: function(type, strPar) {
            var id = this.makeID(type);
            var par = strPar;

            wrap_create(id, par, type);

            //TODO: BUG
            this.append_node(id);

            //** walv saves the inital info to WidgetPool && InfoPool

            //Store Info that a widget was created from.
            this.InfoPool_add(id, par, type);
        },

        // Increase by 1
        makeID: function(type) {
            let id = type + (this.Count++).toString(16);
            this.WidgetNum += 1;
            return id;
        },

        // Append new node to TreeView
        append_node(widget_name) {
            let new_child = {
                label: widget_name,
                children: [] };
            let node = this.$refs.TreeView.getCurrentNode();
            if (node != null) {
                node.children.push(new_child);
            }
        },

        // Delete node and its childs(reverse)
        delete_node: function() {
            const node = this.CheckedNode.obj;
            const id = this.CheckedNode.id;

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
            this.WidgetNum -= record.length;

            // Clear this.CheckedNode
            this.CheckedNode.obj = null;
            this.CheckedNode.id = null

            // Remove the related info
            pool_delete(this.WidgetPool, record);
            pool_delete(this.InfoPool, record);
            this.currJSON = this.WidgetPool['screen'];

            this.$message({
                message: 'Delete sucessfully',
                type: 'success'
            });
        },

        // When the node is clicked, walv will: change the CheckedNode, set new id for label, update the Setting
        // https://element.eleme.cn/#/en-US/component/tree
        node_click_cb: function(data, obj, tree_obj) {
            this.CheckedNode.id = data.label;
            this.CheckedNode.obj = obj;

            let id = data.label;
            if (id == "") {// NOTICE
                return;
            }
            if (this.WidgetPool[id] == undefined) {
                let type = "\'obj\'";
                if (id != "screen") {
                    type = this.InfoPool[id]['type'];
                }
                wrap_query_attr(id, type);
            }
            this.currJSON = this.WidgetPool[id];
        },

        // Update the X & Y below the Simulator
        cursorXY : function(event) {
            this.cursorX = event.offsetX;
            this.cursorY = event.offsetY;
        },

        // Get the id of recently checked node
        get_curr_id: function() {
            return this.CheckedNode.id;
            // node = this.$refs.TreeView.getCurrentNode()
            // if (node != null) {
            //     return node.label;
            // }
            // return null;
        },

        // Lock the widget, so it can't move anymore
        // lock_widget: function() {
        //     let drag_state = this.currJSON["get_drag"];
        //     if(drag_state == true) {
        //         drag_state = "True";
        //     } else {
        //         drag_state = "False";
        //     }

        //     mp_js_do_str(this.currJSON["id"] + ".set_drag(" + drag_state + ')');
        // },


        // Apply change to the widget: number
        bind_widget_num: function(attribute) {

            let value = this.currJSON[attribute];

            if(value == null) {
                value = 0;
            }

            let id = this.currJSON["id"];

            wrap_simple_setter(id, attribute, value);

            this.InfoPool_modify(id, attribute);
        },

        // Apply change to the widget: boolean
        bind_widget_bool: function(attribute) {

            let value = this.currJSON[attribute];

            if(value == true) {
                value = "True"
            } else {
                value = "False"
            }

            let id = this.currJSON["id"];

            wrap_simple_setter(id, attribute, value);

            this.InfoPool_reverse(id, attribute);
        },

        // Add some information for the new widget to InfoPool
        InfoPool_add: function(id, par_name, type) {
            let info = {
                type: type,
                parent: par_name,
                cb: false,
                attributes: [],
            };
            this.InfoPool[id] = info;
        },

        // For text or number
        InfoPool_modify: function(id, attribute_name) {
            let index = this.InfoPool[id].attributes.indexOf(attribute_name);
            if (index == -1) {
                this.InfoPool[id].attributes.push(attribute_name);
            }
        },

        //For boolean only
        InfoPool_reverse: function(id, attribute_name) {
            let index = this.InfoPool[id].attributes.indexOf(attribute_name);
            if (index != -1) {
                this.InfoPool[id].attributes.splice(index, 1);
            } else {
                this.InfoPool[id].attributes.push(attribute_name);
            }
        },

        // User enable CallBack template
        InfoPool_setCB: function(id) {
            this.InfoPool[id].cb = true;
        },

        refresh_repl: function() {
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
        code_generate: function() {
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
        code_export: function() {
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
        make_style: function() {
            wrap_simple_style(this.currJSON["id"], this.style);
        },

        //Highlight object
        draw_rect: (x, y, w, h) => {
            let ctx = document.getElementById("canvas").getContext("2d");
            ctx.strokeStyle="red";
            ctx.lineWidth = 2;
            ctx.setLineDash([5,5]);
            ctx.strokeRect(x, y, w, h);
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