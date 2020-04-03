# Generate the setter table for objects
# https://github.com/littlevgl/lv_gui_builder/issues/1#issuecomment-528845543
# Parse the lv_mpy.json(example: https://raw.githubusercontent.com/littlevgl/lv_binding_micropython/master/gen/lv_mpy_example.json)

import json

Setter = {}

with open("lv_mpy.json") as f:
    data = json.load(f)
    objs = data['objects']
    Setter['obj'] = objs['obj']['members']
    for o in objs:
        tmp = {}
        for fn in objs[o]['members']:
            if fn.startswith('set_') and fn not in Setter['obj']:
                tmp[fn] = objs[o]['members'][fn]
        Setter[o] = tmp

f = open('setter.json', 'w')
json.dump(Setter, f)
f.close()
