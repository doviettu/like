import bpy, sys, math
from mathutils import Vector
blend, coll_name, out = sys.argv[-3:]
bpy.ops.wm.open_mainfile(filepath=blend, load_ui=False)
sc = bpy.context.scene
target = next(c for c in sc.collection.children if c.name == coll_name)
keep = {o.name for o in target.all_objects if o.type in ('MESH', 'CURVE') and not o.name.endswith('.g')
        and 'fascia' not in o.name.lower()
        and not any(m.material and m.material.name == 'Fascia' for m in o.material_slots)}
for o in sc.objects:
    hide = o.name not in keep
    o.hide_render = hide
# đảm bảo collection được render
def unhide(lc):
    lc.exclude = False
    lc.collection.hide_render = False
    for ch in lc.children: unhide(ch)
for lc in bpy.context.view_layer.layer_collection.children:
    if lc.collection == target: unhide(lc)
    else: lc.exclude = True
bpy.context.view_layer.update()
objs = [o for o in sc.objects if o.name in keep and o.visible_get() is not None and not o.hide_render]
pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx = Vector([max(p[i] for p in pts) for i in range(3)])
ctr = (mn + mx) / 2; size = mx - mn
# khung toàn thân cố định (theo bộ xương) để các hệ cùng tỉ lệ
mn = Vector((-0.4206, -0.2021, -0.0726)); mx = Vector((0.3346, 0.2162, 1.7135)); ctr = (mn + mx) / 2; size = mx - mn
print("objs", len(objs), "min", mn, "max", mx)
cam = bpy.data.objects.new("RCam", bpy.data.cameras.new("RCam"))
sc.collection.objects.link(cam)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = max(size.z, size.x * 0.75) * 1.08
cam.location = (ctr.x, mn.y - 10 * size.z, ctr.z)
cam.rotation_euler = (math.radians(90), 0, 0)
cam.data.clip_end = 1000 * size.z
sc.camera = cam
for name, rot, e in [("KeyL", (50, 0, -35), 3.5), ("FillL", (60, 0, 50), 1.5)]:
    l = bpy.data.objects.new(name, bpy.data.lights.new(name, 'SUN'))
    l.data.energy = e; l.rotation_euler = [math.radians(a) for a in rot]
    sc.collection.objects.link(l)
w = bpy.data.worlds.new("W"); w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.025, 0.035, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 0.6
sc.world = w
r = sc.render
r.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 24; sc.cycles.use_denoising = True
r.resolution_x, r.resolution_y, r.resolution_percentage = 720, 960, 100
r.film_transparent = False; r.use_freestyle = False; r.use_compositing = False
sc.view_settings.view_transform = 'Standard'
r.filepath = out
bpy.ops.render.render(write_still=True)
