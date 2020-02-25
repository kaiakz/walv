const template_create = (id, parent_id, type) => {
    return id + " = lv." + type + "(" + parent_id + ")";
}


const template_setter_number = (id, attr, param) => {
    return id + ".set_" + attr + "(" + param + ")";
}

const template_setter_boolean = (id, attr, param) => {
    let value = "True";
    if (patam == false) {
        value = "False";
    }
    return id + ".set_" + attr + "(" + param + ")";
}

const template_setter_text = (id, attr, param) => {
    return id + ".set_" + attr + "(\"" + param + "\")";
}

// id = expr
const wrap_equal = (id, expr) => {
    mp_js_do_str(id + "=" + expr);
}

const wrap_create = (id, parent_id, type_s) => {
    let command = [
        id + " = lv." + type_s + "(" + parent_id + ")",
        id + ".set_drag(1)",
        id + ".set_protect(lv.PROTECT.PRESS_LOST)",
        "query_attr(" + id + ",\'" + id + "\',\'" + type_s + "\')",
        id + ".set_event_cb(lambda obj=" + id + ",event=-1,name=\'" + id + "\':walv_callback(obj,name,event))",
    ];
    const ComplexWidgets = ['ddlist', 'page', 'roller'];
    if (ComplexWidgets.indexOf(type_s) != -1) {
        command.push(id + ".get_child(None).set_drag_parent(1)");
    }
    mp_js_do_str(command.join('\n'));
}

const wrap_query_attr = (id, type) => {
    mp_js_do_str("query_attr(" + id + ",\'" + id + "\'," + type + ")");
}

const wrap_simple_setter = (id, attribute, value) => {
    let command = id + '.set_' + attribute + '(' + value + ')';
    mp_js_do_str(command);
}