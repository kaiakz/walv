# Generate the setter table for objects
# https://github.com/littlevgl/lv_gui_builder/issues/1#issuecomment-528845543
# Parse the lv_mpy.json(example: https://raw.githubusercontent.com/littlevgl/lv_binding_micropython/master/gen/lv_mpy_example.json)

import json

Setter = {}
path = '../lv_mpy_example.json'

with open(path) as f:
    data = json.load(f)
    objs = data['objects']
    for o in objs:
        # print(o)
        tmp = {}
        for fn in objs[o]['members'].keys():
            if fn.startswith('set_') and fn not in objs['obj']['members'].keys():
                name = fn.replace('set_', '')
                tmp[name] = objs[o]['members'][fn]
                tmp[name]['api'] = fn
                del tmp[name]['args'][0]    # The first argument is about type
        Setter[o] = tmp
    # del Setter['obj']

# We also need to add 'null:{}' in apis.js
f = open('apis.js', 'w')
f.write("const setter = ");
json.dump(Setter, f)
f.close()
