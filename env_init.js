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

var lines = [
    "import ujson",
    "import lvgl as lv",
    "lv.init()",
    "import SDL",
    "SDL.init()",
    /* Register SDL display driver. */
    "disp_drv = lv.disp_drv_t()",
    "lv.disp_drv_init(disp_drv)",
    "disp_drv.disp_flush = SDL.monitor_flush",
    "disp_drv.disp_fill = SDL.monitor_fill",
    "disp_drv.disp_map = SDL.monitor_map",
    "lv.disp_drv_register(disp_drv)",
    /*Regsiter SDL mouse driver*/
    "indev_drv = lv.indev_drv_t()",
    "lv.indev_drv_init(indev_drv)",
    "indev_drv.type = lv.INDEV_TYPE.POINTER;",
    "indev_drv.read = SDL.mouse_read;",
    "lv.indev_drv_register(indev_drv);",
    /* Create a screen with a button and a label */
    "scr = lv.obj()",
    // "btn = lv.btn(scr)",
    // "btn.align(lv.scr_act(), lv.ALIGN.CENTER, 0, 0)",
    // "label = lv.label(btn)",
    // "label.set_text('Button')",
    /* Load the screen */
    "lv.scr_load(scr)",
];

/*Initialization function*/
window.onload = function() {


    mp_js_stdout = document.getElementById('mp_js_stdout');
    mp_js_stdout.value = "";

    // Terminal.applyAddon(fit);
    // term = new Terminal();    
    // term.open(mp_js_stdout);
    // term.fit();
    
    /*Initialize MicroPython itself*/
    mp_js_init(8 * 1024 * 1024); 

    var stdout_data = {
        tmp : [],
        strJson : 0,
        
    };

    Object.defineProperty(stdout_data, 'strJson', {
        get: function(){
            return strJson;
        },

        set: function(value){
            strJson = value;
            console.log(JSON.parse(strJson))
        }
    });

    /*Setup printing event handler*/

    mp_js_stdout.addEventListener('print', function(e) {
        text = e.data;
        // term.write(text);

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
    for(var i = 0;i < lines.length;i++){
        mp_js_do_str(lines[i]);
    }

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
        setTimeout(handle_pending, 20); // should call lv_task_handler() 
    }
    
    /*Initialize the REPL.*/
    // mp_js_init_repl();

    /*Start the main loop, asynchronously.*/
    handle_pending();

}

function stdoutHandler(ch, a){
    if(ch == '\r' || ch == '\n')
    { 
        arr = a.tmp;
        
        if(arr.length != 0){
            if(arr[0] == '[' || arr[0] == '{'){
                if (arr[arr.length - 1] == ']' || arr[arr.length - 1] == '}') {
                    a.strJson = arr.join('');
                }
            }else{
                console.log(arr.join(''));
            }  
        }
        arr.splice(0, arr.length);
    }else{
        arr.push(ch);
    }
}