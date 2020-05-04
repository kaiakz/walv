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

// arguments
const setArgvs = (args) => {
    li = [];
    for (const i of args) {
        li.push(i["type"])
    }
    return li.toString();
}

Vue.component('lvgl-setters', {
    props: ['setters'],
    data: function() {
        return {
            args: [],
        }
    },
    method: {

    },
    template: '<p v-for="(body, method) in setters"> {{ method }}({{ setArgs(body.args) }}) <input type="text" v-on:input="bindWidgetSpecial($event, body)"></p>'
})