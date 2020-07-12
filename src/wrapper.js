/* wrapper: generate the related code, then use `mp_js_do_str` to excute them. */

// id = expr
const wrap_equal = (id, expr) => {
    mp_js_do_str(`${id}=${expr}`);
}

const wrap_create = (id, parent_id, type_s) => {

    //     id + "=lv." + type_s + "(" + parent_id + ")",
    //     id + ".set_drag(1)",
    //     id + ".set_protect(lv.PROTECT.PRESS_LOST)",
    //     "query_attr(" + id + ",\'" + id + "\',\'" + type_s + "\')",
    //     id + ".set_event_cb(lambda obj=" + id + ",event=-1,name=\'" + id + "\':walv_callback(obj,name,event))",

    let code = [
        `${id}=lv.${type_s}(${parent_id})`,
        `${id}.set_drag(True)`,
        `${id}.set_protect(lv.PROTECT.PRESS_LOST)`,
        `query_attr(${id},"${id}","${type_s}")`,
        `${id}.set_event_cb(lambda obj=${id},event=-1,name="${id}":walv_callback(obj,name,event))`,
    ];


    const ComplexWidgets = ['ddlist', 'page', 'roller'];
    if (ComplexWidgets.indexOf(type_s) != -1) {
        code.push(`${id}.get_child(None).set_drag_parent(True)`);
    }
    mp_js_do_str(code.join('\n'));
}

const wrap_delete = (id) => {
    mp_js_do_str(`${id}.delete()`);
}


const wrap_query_attr = (id, type_s) => {
    mp_js_do_str(`query_attr(${id},"${id}","${type_s}")`);
}

const wrap_simple_setter = (id, attr, param) => {
    mp_js_do_str(`${id}.set_${attr}(${param})`);
}

// Convert '#ffffff' to '0xffffff'
const color_convert = (color) => {
    return color.replace("#", "0x")
}

const wrap_setter = (id, type, name, params, database) => {
    // params is a list
    let api = database[type][name]['api']; // "fit": {"return_type": "NoneType", "args": [{"type": "object", "name": "cont"}, {"type": "int", "name": "fit"}], "type": "function", "api": "set_fit"}
    let args = database[type][name]['args'];
    let code = `${id}.${api}(${params.toString()})`;
    mp_js_do_str(code);
}

const wrap_align = (id, ref_id, offset_x, offset_y) => {
    mp_js_do_str(`${id}.align(${ref_id}, ${offset_x}, ${offset_y})`);
}

const wrap_setter_str = (id, api, params) => {
    // params is a string
    let code = `${id}.${api}(${params})`;
    mp_js_do_str(code);
}

const wrap_simple_style = (id, style) => {
    let s = style.text;
    let code = [
        "s=lv.style_t(lv.style_plain)"
    ];
    let c = color_convert(s.color);
    code.push(`s.text.font=lv.${s.font}`);
    code.push(`s.text.color=lv.color_hex(${c})`);
    code.push(`${id}.set_style(lv.label.STYLE.MAIN,s)`);
    mp_js_do_str(code.join('\n'));
}