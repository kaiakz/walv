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
        print(o)
        tmp = {}
        for fn in objs[o]['members'].keys():
            if fn.startswith('set_') and fn not in objs['obj']['members'].keys():
                tmp[fn] = objs[o]['members'][fn]
        Setter[o] = tmp
    # del Setter['obj']

# f = open('setter.json', 'w')
# json.dump(Setter, f)
# f.close()
