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
    let args_list = [];
    for (const i of args) {
        args_list.push(i["name"])
    }
    return args_list.toString();
}

Vue.component('lvgl-setter', {
    props: ['id', 'name', 'body'],
    data: function() {
        return {
            args: [],
        }
    },
    methods: {
        checkArgs: function() {
            let args_list = [];
            for (const arg of this.args) {
                if (arg['value'] == "") {
                    return
                }
                if (arg['type'] == "str") {
                    args_list.push(`"${arg['value']}"`);
                } else {
                    args_list.push(arg.value);
                }
                // TODO: We can check each value's type here
            }
            wrap_setter_str(this.id, this.body.api, args_list.toString());
        },
    },
    // TODO: Rewrite created && beforeUpdate
    created() {
        for (const arg of this.body.args) {
            arg['value'] = "";      // args: [{"name": '', "type": '', "value": ''}]
            this.args.push(arg);
        }
    },
    // Why we need beforeUpdate: https://vuejs.org/v2/guide/list.html#Maintaining-State. If template was rendered by other, Vue won't excute created but beforeUpdate
    beforeUpdate() {
        this.args.splice(0, this.args.length);
        for (const arg of this.body.args) {
            arg['value'] = "";
            this.args.push(arg);
        }
    },
    template: '<span> {{ name }} (<small v-for="arg in args">{{arg.name}}:<input type="text" style="width: 35px"  v-model="arg.value" v-bind:placeholder="arg.type" v-on:input="checkArgs()"/>,</small>)</span>'
})