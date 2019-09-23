/*
    lvgl_mp.js provides some ways to access:
        mp_js_init
        mp_js_do_str
        mp_js_init_repl
        mp_js_process_char
        mp_js_stdout
    
walv uses mp_js_do_str to demand WASM(micropython), and gets data via mp_js_stdout
*/


/*Write text to the terminal */
// function sendText(text) {
//     var print = new Event('print');
//     print.data = text;
//     mp_js_stdout.dispatchEvent(print);
// }

// function processScriptArg(url){
//     // read text from URL location
//     var request = new XMLHttpRequest();
//     request.open('GET', url, true);
//     request.send(null);
//     request.onreadystatechange = function () {
//         if (request.readyState === 4 && request.status === 200) {
//             var type = request.getResponseHeader('Content-Type');
//             if (type.indexOf("text") !== 1) {
//                 mp_js_do_str(request.responseText);
//             }
//         }
//     }
// }

Module.canvas = (function() {
    var canvas = document.getElementById('canvas');
    return canvas;
})();

var Envir = [
    "import ujson",
    "import lvgl as lv",
    "lv.init()",
    "import SDL",
    "SDL.init()",
    /* Register SDL display driver. */
    "disp_buf1 = lv.disp_buf_t()",
    "buf1_1 = bytes(960*10)",
    "lv.disp_buf_init(disp_buf1,buf1_1, None, len(buf1_1)//4)",
    "disp_drv = lv.disp_drv_t()",
    "lv.disp_drv_init(disp_drv)",
    "disp_drv.buffer = disp_buf1",
    "disp_drv.flush_cb = SDL.monitor_flush",
    "disp_drv.hor_res = 480",
    "disp_drv.ver_res = 320",
    "lv.disp_drv_register(disp_drv)",
    /*Regsiter SDL mouse driver*/
    "indev_drv = lv.indev_drv_t()",
    "lv.indev_drv_init(indev_drv)",
    "indev_drv.type = lv.INDEV_TYPE.POINTER;",
    "indev_drv.read_cb = SDL.mouse_read;",
    "lv.indev_drv_register(indev_drv);",
    /* Create a screen with a button and a label */
    "scr = lv.obj()",
    /* Load the screen */
    "lv.scr_load(scr)",
    "baseAttr = dir(lv.obj)"
];

/* Define special function for python*/
var defFun = [
    //Get and send json
    "def getobjattr(obj, id):",
    "    d={}",
    "    d['id']=id",
    "    for i in dir(obj):",
    "        if 'get_' in i:",
    "            try:",
    "                ret = eval(id + '.' + i + '()')",
    "                if isinstance(ret, (int,float,str,bool)):",
    "                    d[i] = ret",
    "            except:",
    "                pass",
    "    print(ujson.dumps(d))",
    //Determine what event is
    "def whatEvent(obj, id, event):",
    "    if event == lv.EVENT.DRAG_END:",
    "        getobjattr(obj, id)"
];

/*Initialization function*/
window.onload = function() {


    mp_js_stdout = document.getElementById('mp_js_stdout');
    mp_js_stdout.value = "";

    Terminal.applyAddon(fit);
    term = new Terminal();    
    term.open(mpy_repl);
    term.fit();
    
    /*Initialize MicroPython itself*/
    mp_js_init(8 * 1024 * 1024); 

    var stdout_data = {
        tmpChArr : [],
        strJson : 0
    };

    //If the strJson was changes, the div 'showAttr' will load the new json
    Object.defineProperty(stdout_data, 'strJson', {
        get: function(){
            return strJson;
        },

        set: function(value){
            strJson = value;
            json = JSON.parse(strJson);
            // console.log(json);
            updateShow(json);
            Widget.updateDict(json['id'], json);
        }
    });


    /*Setup printing event handler*/

    mp_js_stdout.addEventListener('print', function(e) {
        text = e.data;
        term.write(text);

        stdoutHandler(text, stdout_data);
    }, false);

    /*Setup key input handler */
    term.on('data', function(key, e) {
        // console.log(key);
        for(var i = 0; i < key.length; i++) {
            mp_js_process_char(key.charCodeAt(i));
        }
    });

    /* Run init script */
    for(var i = 0;i < Envir.length;i++){
        mp_js_do_str(Envir[i]);
    }
    mp_js_do_str(defFun.join('\n'));

    /* Run custom script if passed */
    // var custom = undefined;
    // try {
    //     custom = new URL(window.location.href).searchParams.get("script");
    // } catch (e) {
    //     console.log(e + ": URL seems to be unsupported");
    // }
    // console.log("Custom script: " + custom);
    // if(custom !== undefined && custom !== null){
    //     processScriptArg(custom);
    // }


    /*Setup lv_task_handler loop*/
    var the_mp_handle_pending = Module.cwrap('mp_handle_pending', null);
    function handle_pending() {
        the_mp_handle_pending();
        setTimeout(handle_pending, 10); // should call lv_task_handler() 
    }
    
    /*Initialize the REPL.*/
    mp_js_init_repl();
    document.title = "WALV";
    /*Start the main loop, asynchronously.*/
    handle_pending();
    
    // $("#mpy_repl").hide();
}

//Get the useful data from mp_js_stdout
function stdoutHandler(ch, data_obj){
    if(ch == '\r' || ch == '\n')
    { 
        arr = data_obj.tmpChArr;   //Not a local var
        
        if(arr.length != 0){
            //If arr is a comlete JSON string
            if(arr[0] == '[' || arr[0] == '{'){
                if (arr[arr.length - 1] == ']' || arr[arr.length - 1] == '}') {
                    data_obj.strJson = arr.join('');
                }
            }else{
                console.log(arr.join(''));
            }  
        }
        arr.splice(0, arr.length);
    }else{
        // if(ch != '>'){
            arr.push(ch);
        // }
        
    }
}