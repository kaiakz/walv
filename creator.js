var count = 0;

function getID()
{
    //Get ID by timestamp
    // now = Date.parse(new Date()) / 1000;
    // return now;
    return (count++).toString(16);
}

function createWidget(type, par) {
    var id = type + getID();
    console.log(id);
    var code = [
        id + " = lv." + type + "(" + par + ")",
        id + ".set_drag(1)",
        id + ".set_protect(lv.PROTECT.PRESS_LOST)"
    ];
    if (type == "ddlist") {
        code.push(id + ".get_child(None).set_drag_parent(1)");
    }
    mp_js_do_str(code.join('\n'));
}

// function label_create(par)

//This is 
// l=dir(scr)
// d={}
// for i in l:
//     if 'get_' in i:
//         try:
//             ret = eval('scr.' + i + '()')
//             if isinstance(ret, (int,float,str,bool)):
//                 d[i] = ret
//         except:
//             pass
// print(ujson.dumps(d))

