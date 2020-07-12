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
                if (arg['value'] === "") {
                    return
                }
                if (arg['type'] === "str") {
                    args_list.push(`"${arg['value']}"`);
                } else if (arg['type'] === "bool") {
                    if (arg['value'] === true) {
                        args_list.push("True");
                    } else {
                        args_list.push("False");
                    } 
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
    template: '<span> {{ name }} (<small v-for="arg in args">{{arg.name}}:<input type="checkbox" v-if="arg.type === `bool`" v-model="arg.value" v-on:change="checkArgs()"/> <input type="text" style="width: 35px" v-else v-model="arg.value" v-bind:placeholder="arg.type" v-on:input="checkArgs()"/>,</small>)</span>'
});

// https://docs.littlevgl.com/en/html/object-types/obj.html
// Vue.component('lvgl-layout', {
//     props: ['id', 'x', 'y', 'align', 'obj_ref', 'x_shift', 'y_shift'],  // lv_obj_set_x, lv_obj_set_y, lv_obj_align(obj, obj_ref, LV_ALIGN_..., x_shift, y_shift)
//     data: function() {
//         return {
//             x: 0,
//             y: 0,
//             align: "", 
//         }
//     },
//     template: ''
// });

// TODO: Only support align to its parent now
Vue.component('lvgl-align', {
    props: ['id', 'ref_id'],
    data: function() {
        return {
            align: '',
            ref_obj: '',
            x_shift: 0,
            y_shift: 0,
            options: [
                '',                 'OUT_TOP_LEFT',     'OUT_TOP_MID',  'OUT_TOP_RIGHT', '', 0, 
                'OUT_LEFT_TOP',     'IN_TOP_LEFT',      'IN_TOP_MID',   'IN_TOP_RIGHT', 'OUT_RIGHT_TOP', 0,
                'OUT_LEFT_MID',     'IN_LEFT_MID',      'CENTER',        'IN_RIGHT_MID', 'OUT_RIGHT_MID', 0,
                'OUT_LEFT_BOTTOM', 'IN_BOTTOM_LEFT',    'IN_BOTTOM_MID', 'IN_BOTTOM_RIGHT', 'OUT_RIGHT_BOTTOM', 0,
                '',                 'OUT_BOTTOM_LEFT', 'OUT_BOTTOM_MID', 'OUT_BOTTOM_RIGHT', '', 0,
            ]
        }
    },
    watch: {
        align: (type) => {
            wrap_align(this.id, 'None', type, 0, 0);
        }
    },
    template: '<div><p>{{align}}</p><span v-for="type in options"><input type="radio" v-bind:disabled="type === ``" v-if="type !== 0" v-bind:value="type" v-model="align"/><br v-else /></span></div>'
});