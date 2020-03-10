
function python_generator(info, widget) {
    let code = [];

    for (const key in info) {
        let id = key;

        let par_id = info[key].parent;

        let type = info[key].type;

        code.push(template_py_create(id, par_id, type));    //code: create, EX: btn0 = lv.btn(scr)

        if (info[id].cb) {
            code.push(template_py_cb(id));
        }

        const attributes = info[key].attributes;
        for (const attr of attributes) {
            let value = widget[id][attr];
            if (value == true) {
                value = "True";
            } else if (value == false) {
                value = "False";
            }
            code.push(template_py_setter_simple(id, attr, value));
        }
    }
    return code.join("\n");
}


function c_generator(info, widget) {
    let code = [];

    for (const key in info) {
        let id = key;

        let par_id = info[key].parent;

        let type = info[key].type;

        code.push(template_c_create(id, par_id, type));    //code: create, EX: btn0 = lv.btn(scr)

        const attributes = info[key].attributes;
        for (const attr of attributes) {
            let value = widget[id][attr];

            code.push(template_c_setter_simple(id, "obj", attr, value));
        }
    }
    return code.join("\n");
}