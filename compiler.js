
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
    let body = [], cb = [];

    for (const key in info) {
        let id = key;

        let par_id = info[key].parent;

        let type = info[key].type;

        if(info[key].cb) {
            cb.push(id);
        }

        body.push(template_c_create(id, par_id, type));    //code: create, EX: btn0 = lv.btn(scr)

        const attributes = info[key].attributes;
        for (const attr of attributes) {
            let value = widget[id][attr];

            body.push(template_c_setter_simple(id, "obj", attr, value));
        }
    }
    let cb_s = [];
    for (const id of cb) {
        cb_s.push(template_c_cb(id));
    }

    return template_c_all(body.join("\n"), cb_s.join("\n"));
}