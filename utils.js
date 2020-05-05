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
    let li = [];
    for (const i of args) {
        li.push(i["name"])
    }
    return li.toString();
}

Vue.component('lvgl-setter', {
    props: ['name', 'body'],
    data: function() {
        return {
            args: {},
        }
    },
    methods: {
        checkArgs: function() {
            let li = [];
            for (const arg of this.args) {
                if (arg['value'] == "") {
                    return
                }
                if (arg['type'] == "str") {
                    li.push(`"${arg['value']}"`);
                } else {
                    li.push(arg.value);
                }
                // TODO: We can check each value's type here
            }
            console.log(li.toString());
        },

    },
    created() {
        this.args = this.body.args;   
        for (const arg of this.args) {
            arg['value'] = '';      // args: [{"name": '', "type": '', "value": ''}]
        }
    },
    template: '<span> {{ name }} (<small v-for="arg in args">{{arg.name}}:<input type="text" style="width: 35px"  v-model="arg.value" v-bind:placeholder="arg.type" v-on:input="checkArgs()"/>,</small>)</span>'
})