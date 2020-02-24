
var vm = null;


window.onload = function() {
    vm = new Vue(walv_main);

    /* Initialize the wasm mpy */
    mpylv_init(vm);

    /* Initialize the ace editor */
    editor_init(vm);

    document.title = "WALV: the Online Designer For LittlevGL";
}



var mpylv_init = (vm) => {

    Module.canvas = document.getElementById("canvas");

    /* Bind mp_js_stdout */
    mp_js_stdout = document.getElementById('mp_js_stdout');
    mp_js_stdout.value = "";

    /* Initialize the xtermjs */
    Terminal.applyAddon(fit);
    let term = new Terminal({
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

    /* Run init script */
    for(var i = 0;i < lvEnv.length;i++){
        mp_js_do_str(lvEnv[i]);
    }
    /* Add function getobjattr() & EventCB() */
    mp_js_do_str(DEF_FUN.join('\n'));

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


var editor_init = (vm) => {
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


var walv_main = {
    el: "#walv",

    data: {
        editor: null,
        c_edit_mode: null,
        py_edit_mode: null,
        is_c_mode: true, //true: c, false: python

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
        creator_options: Widgets_opt,
        props: {emitPath: false, expandTrigger: 'hover'},
        selected_type: "",
        widget_count: 0,

        //TreeView
        widget_tree: [
            {
                label: 'screen',
                children: []
            }
        ],
        selected_node_id: "",

        //Terminal
        term_show: true,

        // Watcher
        // other_attr_option: other_attribute,
        // other_attr: [],
    },


    watch: {
        //Parse string to JSON
        str_json: function(val) {
            try {

                // currJSON = JSON.parse(this.str_json);
                let tmp = JSON.parse(this.str_json);
                if(tmp['x'] != undefined) {
                    this.posJSON = tmp;

                    //Update Postion
                    this.WidgetPool[tmp['id']]['get_x'] = this.posJSON['x'];
                    this.WidgetPool[tmp['id']]['get_y'] = this.posJSON['y'];

                    this.InfoPool_modify(tmp['id'], 'x');
                    this.InfoPool_modify(tmp['id'], 'y');

                    this.currJSON = this.WidgetPool[tmp['id']];
                } else {
                    // this.currJSON = Object.assign({}, j);
                    this.WidgetPool[tmp['id']] = tmp;
                    this.currJSON = this.WidgetPool[tmp['id']];
                }
                // console.log(this.currJSON);                    
            } catch (error) {
                alert(error);
            }
        },

    },


    methods: {
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
                    message: 'Please Select A Type What You Want To Create',
                    type: 'warning'
                });
            } else {
                let curr_widget = this.GetCurrWidget();
                if (curr_widget === null) {
                    this.$message({
                        message: 'You Are Creating A Widget Invisible',
                        type: 'warning'
                    });
                    this.CreateWidget(this.selected_type, null);
                } else {
                    this.CreateWidget(this.selected_type, curr_widget);
                }
            }
        },

        //Parametres are the String type
        CreateWidget: function(type, strPar) {
            var id = this.makeID(type);
            var par = strPar;
            if(strPar === null){
                par = '';
            }
            // console.log(id);
            var code = [
                id + " = lv." + type + "(" + par + ")",
                id + ".set_drag(1)",
                id + ".set_protect(lv.PROTECT.PRESS_LOST)",
                // "print(getobjattr(" + id + ",\'" + id + "\'))",
                "getobjattr(" + id + ",\'" + id + "\')",
                id + ".set_event_cb(lambda obj=None, event=-1, name=\'" + id + '\'' + ", real_obj =" + id + " : EventCB(real_obj, name, event))"
            ];
            const complexWidgets = ['ddlist', 'page', 'roller'];
            if (complexWidgets.indexOf(type) != -1) {
                code.push(id + ".get_child(None).set_drag_parent(1)");
            }
            mp_js_do_str(code.join('\n'));

            //TODO: BUG
            this.append_node(id);

            //** walv saves the inital info to WidgetPool && InfoPool

            //Store Info that a widget was created from.
            this.InfoPool_add(id, par, type);
        },

        makeID: function(type) {
            var id = type + (this.widget_count++).toString(16);
            return id;
        },

        append_node(widget_name) {
            let new_child = {label: widget_name, children: [] };
            let node = this.$refs.TreeView.getCurrentNode();
            if (node != null) {
                node.children.push(new_child);
            }
        },

        // delete node and its childs(reverse)
        delete_node() {
            let node = this.$refs.TreeView.getCurrentNode();
            reverse_del_node(node);
        },


        node_click_cb: function() {
            let id = this.GetCurrWidget();
            this.selected_node_id = id;
            if (this.WidgetPool[id] == undefined) {
                mp_js_do_str("getobjattr(" + id + ",\'" + id + "\')");
            }
            this.currJSON = this.WidgetPool[id];
        },

        cursorXY : function(event) {
            this.cursorX = event.offsetX;
            this.cursorY = event.offsetY;
        },

        GetCurrWidget: function() {
            node = this.$refs.TreeView.getCurrentNode()
            if (node != null) {
                return node.label;
            }
            return null;
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
        bind_widget_num: function(attribute_name) {

            let get_fn_name = "get_" + attribute_name;
            let set_fn_name = "set_" + attribute_name;
            let value = this.currJSON[get_fn_name];

            if(value == null) {
                value = 0;
            }

            let str = this.currJSON["id"] + '.' + set_fn_name + '(' + value + ')';
            mp_js_do_str(str);

            this.InfoPool_modify(this.currJSON["id"], attribute_name);
        },

        // Apply change to the widget: boolean
        bind_widget_bool: function(attribute_name) {

            let get_fn_name = "get_" + attribute_name;
            let set_fn_name = "set_" + attribute_name;
            let value = this.currJSON[get_fn_name];

            if(value == true) {
                value = "True"
            } else {
                value = "False"
            }

            let str = this.currJSON["id"] + '.' + set_fn_name + '(' + value + ')';
            mp_js_do_str(str);

            this.InfoPool_reverse(this.currJSON["id"], attribute_name);
        },

        InfoPool_add: function(id, par_name, type) {
            let info = {
                type: type,
                parent: par_name,
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

        screenshot: function() {
            document.getElementById("canvas").toBlob((blob) => {
                saveAs(blob, "screenshot.png");
            });
        },

        code_generate: function() {
            let preview_code = python_generator(this.InfoPool, this.WidgetPool);
            this.editor.setValue(preview_code);
        },

        code_export: function() {
            let code = this.editor.getValue();
            let blob = new Blob([code], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "interface.py");
        }
    },
}

const reverse_del_node = (node) => {
    let childs = node.children;
    for (const iter of childs) {
        reverse_del_node(iter);
        mp_js_do_str(iter.label + ".delete()");
    }
    childs.splice(0, childs.length);
}