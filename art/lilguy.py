"""The lil guy: Build Board's mascot, modeled and rendered headless in Blender.

Run from the widget folder:
  blender -b --factory-startup --python art/lilguy.py -- --who base --poses icon,idle,working,done,failed,stuck
  blender -b --factory-startup --python art/lilguy.py -- --who all

Writes, per <who> and <pose>, transparent PNGs:
  art/<who>/<pose>-<pt>@2x.png       a still (frame 0) at 24, 32 and 48pt (48, 64 and 96px)
  art/<who>/<pose>-anim-<pt>@2x.png  the loop as a horizontal strip of FRAMES frames
"base" is the house colour (the app icon); every other <who> is a crew agent in their accent colour.
"""
import bpy, bmesh, math, os, sys, subprocess, tempfile
from mathutils import Euler, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
AGENTS_DIR = os.path.expanduser("~/.claude/agents")
FONT = "/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf"
POSES = ["icon", "idle", "working", "done", "failed", "stuck"]
FRAMES = 8   # one loop; the widget steps through the strip with CSS
SIZES = (24, 32, 48)   # point sizes; every file is @2x

ACCENTS = {
    "base": "#3FC1FF",      # Frutiger aqua: the app icon
    "hexx": "#2F5BFF", "carmina": "#FF6FAE", "mello": "#3DBE5A", "jig": "#FF9A3C", "sora": "#A77BFF",
    "maya": "#9A6440", "mars": "#FF4D4F", "neo": "#F4F2EE", "big-bro": "#3A3F4B", "benjamin": "#F2C230",
}
FALLBACK = ["#2E7BFF", "#FF6FAE", "#5FD38A", "#FF9A3C", "#A77BFF", "#22CFC0", "#FF5A5F", "#5468FF"]


def accent_of(who):
    if who in ACCENTS: return ACCENTS[who]
    return FALLBACK[sum(map(ord, who)) % len(FALLBACK)]   # a new agent still gets a stable colour


def lin(hex_):   # node colour inputs are linear, the palette above is sRGB
    h = hex_.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)


def shade(hex_, f):   # f < 1 darker, f > 1 lighter (towards white)
    h = hex_.lstrip("#")
    c = [int(h[i:i + 2], 16) for i in (0, 2, 4)]
    c = [round(x * f) if f < 1 else round(x + (255 - x) * (f - 1)) for x in c]
    return "#" + "".join(f"{max(0, min(255, x)):02x}" for x in c)


# ── scene ──────────────────────────────────────────────────────────────────
def fresh_scene(samples, size):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    cp = bpy.context.preferences.addons["cycles"].preferences
    try:
        cp.compute_device_type = "METAL"
        cp.refresh_devices()
        for d in cp.devices: d.use = True
        sc.cycles.device = "GPU"
    except Exception:
        sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.render.resolution_x = sc.render.resolution_y = size
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"   # AgX greys out the candy colours; Standard keeps them loud

    world = bpy.data.worlds.new("studio")
    sc.world = world
    if world.node_tree is None: world.use_nodes = True
    nt = world.node_tree
    bg = next(n for n in nt.nodes if n.type == "BACKGROUND")
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(os.path.join(bpy.utils.system_resource("DATAFILES"), "studiolights", "world", "studio.exr"))
    nt.links.new(env.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.65
    return sc


def link(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob


def aim(ob, target):
    ob.rotation_euler = (Vector(target) - ob.location).to_track_quat("-Z", "Y").to_euler()


def light(name, loc, size, energy, color=(1, 1, 1), size_y=None):
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy, ld.color, ld.size = energy, color, size
    if size_y: ld.shape, ld.size_y = "RECTANGLE", size_y
    ob = link(bpy.data.objects.new(name, ld))
    ob.location = loc
    aim(ob, (0, 0, 1.15))


def camera():
    cd = bpy.data.cameras.new("cam")
    cd.type, cd.ortho_scale = "ORTHO", 3.3
    ob = link(bpy.data.objects.new("cam", cd))
    target = Vector((0, -0.25, 1.2))
    elev, azim, dist = math.radians(14), math.radians(-16), 12
    ob.location = target + Vector((math.sin(azim) * math.cos(elev) * dist, -math.cos(azim) * math.cos(elev) * dist, math.sin(elev) * dist))
    aim(ob, target)
    bpy.context.scene.camera = ob


# ── materials ──────────────────────────────────────────────────────────────
def mat(name, color, rough=0.3, metal=0.0, coat=0.0, coat_rough=0.04, sss=0.0, emit=None, emit_str=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    if m.node_tree is None: m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    vals = {"Base Color": lin(color), "Roughness": rough, "Metallic": metal, "Coat Weight": coat, "Coat Roughness": coat_rough,
            "Subsurface Weight": sss, "Subsurface Scale": 0.08, "Alpha": alpha}
    if emit: vals.update({"Emission Color": lin(emit), "Emission Strength": emit_str})
    for k, v in vals.items():
        if k in p.inputs: p.inputs[k].default_value = v
    if sss and "Subsurface Radius" in p.inputs: p.inputs["Subsurface Radius"].default_value = (1.0, 0.55, 0.35)
    return m


def give(ob, m):
    ob.data.materials.append(m)
    return ob


# ── geometry helpers ───────────────────────────────────────────────────────
def mesh_obj(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    for poly in me.polygons: poly.use_smooth = True
    return link(bpy.data.objects.new(name, me))


def sphere(name, loc, scale, m, segs=32):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=segs // 2, radius=1)
    ob = mesh_obj(name, bm)
    ob.location, ob.scale = loc, scale
    return give(ob, m)


def rounded_box(name, loc, dims, m, bevel=0.04):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.scale(bm, vec=dims, verts=bm.verts)   # real size in the mesh: a bevel on a scaled object warps
    ob = mesh_obj(name, bm)
    ob.location = loc
    bv = ob.modifiers.new("round", "BEVEL")
    bv.width, bv.segments, bv.affect, bv.limit_method = bevel, 4, "EDGES", "NONE"
    for poly in ob.data.polygons: poly.use_smooth = True
    return give(ob, m)


def star(name, loc, r, m, depth=0.05):
    bm = bmesh.new()
    pts = []
    for i in range(8):
        a = math.pi / 2 + i * math.pi / 4
        rr = r if i % 2 == 0 else r * 0.36
        pts.append(bm.verts.new((math.cos(a) * rr, 0, math.sin(a) * rr)))
    face = bm.faces.new(pts)
    ext = bmesh.ops.extrude_face_region(bm, geom=[face])
    for v in [g for g in ext["geom"] if isinstance(g, bmesh.types.BMVert)]: v.co.y += depth
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = mesh_obj(name, bm)
    for poly in ob.data.polygons: poly.use_smooth = False
    ob.location = loc
    bv = ob.modifiers.new("round", "BEVEL"); bv.width, bv.segments = 0.012, 2
    return give(ob, m)


def text(name, body, loc, size, m, tilt=0):
    cu = bpy.data.curves.new(name, "FONT")
    if os.path.exists(FONT): cu.font = bpy.data.fonts.load(FONT)
    cu.body, cu.size, cu.extrude, cu.bevel_depth, cu.bevel_resolution = body, size, 0.05, 0.018, 3
    cu.align_x, cu.align_y = "CENTER", "CENTER"
    ob = link(bpy.data.objects.new(name, cu))
    ob.location = loc
    ob.rotation_euler = (math.radians(90), math.radians(tilt), math.radians(-16))
    return give(ob, m)


def surface(x, z, push=0.0):
    """Where a ray from the front at (x, z) meets the body, and the normal there."""
    deps = bpy.context.evaluated_depsgraph_get()
    hit, loc, nor, *_ = bpy.context.scene.ray_cast(deps, Vector((x, -8, z)), Vector((0, 1, 0)))
    if not hit: return Vector((x, -0.6, z)), Vector((0, -1, 0))
    return loc + nor * push, nor


def on_face(ob, x, z, sink=0.0):
    loc, nor = surface(x, z)
    ob.location = loc - nor * sink
    ob.rotation_euler = Vector((0, -1, 0)).rotation_difference(nor).to_euler()
    return ob


def tube(name, pts, radius, m):
    """A rounded line drawn on the face (mouths, closed eyes)."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions, cu.bevel_depth, cu.bevel_resolution = "3D", radius, 4
    sp = cu.splines.new("NURBS")
    sp.points.add(len(pts) - 1)
    for i, (x, z) in enumerate(pts):
        loc, _ = surface(x, z, push=radius * 0.5)
        sp.points[i].co = (*loc, 1)
    sp.use_endpoint_u, sp.order_u = True, 3
    ob = link(bpy.data.objects.new(name, cu))
    for end in (pts[0], pts[-1]):   # round caps
        loc, _ = surface(*end, push=radius * 0.5)
        sphere(name + "cap", loc, (radius,) * 3, m, segs=12).parent = ob
    return give(ob, m)


def arc(cx, cz, w, depth, n=11):   # depth > 0 dips in the middle (a smile), < 0 bulges up (a frown)
    return [(cx + w * t, cz - depth * (1 - t * t)) for t in [i / (n - 1) * 2 - 1 for i in range(n)]]


# ── the lil guy ────────────────────────────────────────────────────────────
HOLD = "hold"
LAPTOP = Vector((0, -1.0, 0.72))   # centre of the keyboard half   # arms reach in to grip the laptop's sides
POSE = {   # arms: (degrees up from hanging straight down, how far it reaches forward) for the guy's right, left
    "icon":    dict(arms=((150, 0.15), (40, 0.2)), tilt=(0, 0, 0), eyes="open", mouth="smile"),
    "idle":    dict(arms=((12, 0.1), (12, 0.1)), tilt=(6, 0, -7), eyes="shut", mouth="o"),
    "working": dict(arms=HOLD, tilt=(8, 0, 0), eyes="down", mouth="smile-small", laptop="on"),
    "done":    dict(arms=((152, 0.1), (152, 0.1)), tilt=(-4, 0, 0), eyes="happy", mouth="grin"),
    "failed":  dict(arms=HOLD, tilt=(4, 0, 0), eyes="open", mouth="frown", laptop="dead"),
    "stuck":   dict(arms=((168, 0.25), (20, 0.05)), tilt=(0, 0, 6), eyes="open", mouth="flat"),
}


def build(who, pose, t=0.0):
    """t runs 0..1 through one loop; t and t+1 must look the same, so every motion is a whole number of cycles."""
    P = POSE[pose]
    ph = 2 * math.pi * t
    s, c = math.sin(ph), math.cos(ph)
    arms, tilt, lift, breathe = P["arms"], list(P["tilt"]), 0.0, 1.0
    # motion is about 1.5x what reads at full size: at 24-32px subtle disappears, much more looks frantic
    if pose == "icon":      arms, lift = ((149 + 20 * s, 0.15), arms[1]), 0.035 * c                     # wave
    elif pose == "idle":    breathe, tilt[1] = 1 + 0.055 * s, tilt[1] + 3.2 * s                        # breathe, sway
    elif pose == "working":                                                                            # typing, head nodding along
        bob = abs(math.sin(2 * ph)); lift, tilt[0] = 0.025 * bob, tilt[0] + 2.5 * bob
    elif pose == "done":    arms, lift = ((151 + 13 * s, 0.1), (151 - 13 * s, 0.1)), 0.22 * abs(s)     # hop hop
    elif pose == "failed":  tilt[1] += 2.5 * math.sin(4 * ph)                                          # shiver
    elif pose == "stuck":   arms, tilt[2] = ((165 + 9 * s, 0.25 + 0.15 * c), arms[1]), tilt[2] + 4.5 * s  # scratch, head tilting
    col = accent_of(who)
    body_m = mat("body", col, rough=0.3, coat=1.0, coat_rough=0.02, sss=0.12)
    ink = mat("ink", "#10121c", rough=0.12, coat=1.0)
    glint = mat("glint", "#ffffff", emit="#ffffff", emit_str=4.0)
    blush = mat("blush", "#ff8db6", rough=0.45, sss=0.4)
    bulb = mat("bulb", shade(col, 1.45), rough=0.15, coat=1.0, coat_rough=0.02, emit=shade(col, 1.3), emit_str=0.6)
    stalk = mat("stalk", shade(col, 0.75), rough=0.25, coat=1.0)

    rig = link(bpy.data.objects.new("rig", None))
    rig.location = (0, 0, 0.05 + lift)

    mb = bpy.data.metaballs.new("body")
    mb.resolution, mb.render_resolution, mb.threshold = 0.05, 0.018, 0.6
    body = link(bpy.data.objects.new("body", mb))
    give(body, body_m)

    def ball(kind, co, r, stiff=2.0, size=(1, 1, 1), rot=None):
        e = mb.elements.new(type=kind)
        e.co, e.radius, e.stiffness = co, r, stiff
        if kind in ("ELLIPSOID", "CAPSULE", "CUBE", "PLANE"): e.size_x, e.size_y, e.size_z = size
        if rot is not None: e.rotation = rot
        return e

    ball("ELLIPSOID", (0, 0, 1.05), 1.0, 2.0, (1.18 / breathe ** 0.5, 1.02, 1.38 * breathe))   # the bean
    for sx in (-1, 1):                                                   # feet
        ball("ELLIPSOID", (0.36 * sx, -0.14, 0.16), 0.5, 1.5, (0.85, 1.15, 0.55))
    for side in (1, -1):                                                 # his right is screen-left
        shoulder = Vector((0.62 * -side, -0.02, 1.12))
        if arms == HOLD:
            tap = 0.09 * max(0.0, math.sin(2 * ph + (0 if side == 1 else math.pi))) if pose == "working" else 0.0   # hands take turns
            hand = Vector((0.5 * -side, LAPTOP.y + 0.02, LAPTOP.z + 0.08 + tap))
            d, reach = (hand - shoulder).normalized(), (hand - shoulder).length
        else:
            deg, fwd = arms[0 if side == 1 else 1]
            a = math.radians(deg)
            d, reach = Vector((math.sin(a) * -side, -fwd, -math.cos(a))).normalized(), 0.68
        ball("CAPSULE", shoulder + d * reach * 0.53, 0.22, 1.6, (reach * 0.4, 1, 1), Vector((1, 0, 0)).rotation_difference(d))
        ball("BALL", shoulder + d * reach, 0.23, 1.4)                    # the mitten

    bpy.context.view_layer.update()

    parts = []
    eyes = P["eyes"]
    ez = 1.31 if eyes == "down" else 1.42
    for sx in (-1, 1):
        x = 0.27 * sx
        if eyes in ("open", "down"):
            e = on_face(sphere("eye", (0, 0, 0), (0.105, 0.05, 0.15 if eyes == "open" else 0.125), ink), x, ez, sink=0.012)
            loc, nor = surface(x - 0.035, ez + 0.055, push=0.045)
            parts += [e, sphere("glint", loc, (0.034,) * 3, glint, segs=16)]
        elif eyes == "shut":
            parts.append(tube("lid", arc(x, ez, 0.1, 0.045), 0.022, ink))
        elif eyes == "happy":
            parts.append(tube("lid", arc(x, ez, 0.1, -0.07), 0.026, ink))
        parts.append(on_face(sphere("blush", (0, 0, 0), (0.12, 0.03, 0.075), blush), 0.5 * sx, 1.2, sink=0.008))

    mz = 1.14 if eyes == "down" else 1.2
    mouth = P["mouth"]
    if mouth == "smile":         parts.append(tube("mouth", arc(0, mz, 0.12, 0.06), 0.022, ink))
    elif mouth == "smile-small": parts.append(tube("mouth", arc(0, mz, 0.08, 0.035), 0.02, ink))
    elif mouth == "grin":        parts.append(tube("mouth", arc(0, mz - 0.01, 0.16, 0.1), 0.03, ink))
    elif mouth == "frown":       parts.append(tube("mouth", arc(0, mz - 0.03, 0.1, -0.045), 0.022, ink))
    elif mouth == "flat":        parts.append(tube("mouth", [(-0.1, mz - 0.02), (0, mz - 0.005), (0.1, mz + 0.015)], 0.022, ink))
    elif mouth == "o":           parts.append(on_face(sphere("mouth", (0, 0, 0), (0.045, 0.025, 0.04), ink), 0, mz - 0.02, sink=0.01))

    # antenna: a stalk off the top of the head and a chrome ball
    deps = bpy.context.evaluated_depsgraph_get()
    hit, top, *_ = bpy.context.scene.ray_cast(deps, Vector((0.05, 0, 5)), Vector((0, 0, -1)))
    top = top if hit else Vector((0.05, 0, 1.95))
    tip = top + Vector((0.12, 0, 0.38))
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.035, radius2=0.025, depth=(tip - top).length)
    st = mesh_obj("stalk", bm)
    st.location = (top + tip) / 2
    st.rotation_euler = Vector((0, 0, 1)).rotation_difference(tip - top).to_euler()
    parts += [give(st, stalk), sphere("bulb", tip, (0.11,) * 3, bulb)]

    for ob in [body] + parts:
        ob.parent = rig

    # props stay put while he leans
    laptop = P.get("laptop")
    if laptop:   # held open in front of him: we see the lid's back and its glowing dot, he sees the screen
        shell = mat("shell", "#e4e8ef", rough=0.16, metal=0.8, coat=1.0)
        glow = "#00d9ff" if laptop == "on" else "#ff3b3b"
        base_c = LAPTOP
        rounded_box("base", base_c, (0.9, 0.36, 0.05), shell, 0.02)
        hinge = base_c + Vector((0, 0.16, 0.02))
        tilt = Euler((math.radians(10), 0, 0))   # top leans away from him, towards us
        lid = rounded_box("lid", hinge + Vector((0, 0, 0.21)) @ tilt.to_matrix().transposed(), (0.9, 0.045, 0.42), shell, 0.02)
        lid.rotation_euler = tilt
        dot = sphere("dot", hinge + Vector((0, -0.03, 0.22)) @ tilt.to_matrix().transposed(), (0.085, 0.012, 0.085), mat("dot", glow, emit=glow, emit_str=(8 + 4 * s) if laptop == "on" else (9 if math.sin(2 * ph) > 0 else 1.5)))
        dot.rotation_euler = tilt
        screen = bpy.data.lights.new("screen", "AREA"); screen.energy, screen.size, screen.color = 25, 0.6, lin(glow)[:3]
        sl = link(bpy.data.objects.new("screen", screen)); sl.location = hinge + Vector((0, 0.15, 0.25)); aim(sl, (0, 0, 1.3))
        if laptop == "dead":
            smoke = mat("smoke", "#7d848f", rough=0.9, alpha=0.8)
            for i in range(3):   # puffs ride up and away, each a third of a loop behind the last
                k = (t + i / 3) % 1
                r = (0.07 + 0.17 * k) * min(1.0, (1 - k) / 0.2)
                sphere(f"puff{i}", (0.5 + 0.45 * k, -0.95, 0.98 + 0.62 * k), (r, r * 0.9, r * 0.85), smoke)
            drop = mat("drop", "#6fd8ff", rough=0.05, coat=1.0, emit="#8fe6ff", emit_str=0.3)
            sphere("drop", (-0.74, -0.4, 1.72), (0.07, 0.07, 0.095), drop)
            bm = bmesh.new()
            bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.067, radius2=0.0, depth=0.11)
            tipcone = mesh_obj("droptip", bm); tipcone.location = (-0.74, -0.4, 1.8); give(tipcone, drop)

    if pose == "idle":
        zz = mat("zz", "#8a78ff", rough=0.15, coat=1.0, emit="#6f5cff", emit_str=0.3)
        z1 = text("z1", "z", (0.92, -0.4, 1.92 + 0.13 * s), 0.4, zz, tilt=-8 + 10 * s)
        z2 = text("z2", "Z", (1.28, -0.4, 2.3 + 0.13 * math.sin(ph + 1.6)), 0.58, zz, tilt=-12 + 10 * math.sin(ph + 1.6))
        z1.scale = z2.scale = (1 + 0.12 * c,) * 3
    if pose == "done":
        gold = mat("gold", "#ffd23f", rough=0.12, coat=1.0, emit="#ffc21a", emit_str=1.2)
        for i, (name, loc, r) in enumerate([("s1", (-1.2, -0.4, 2.12), 0.22), ("s2", (1.24, -0.4, 1.85), 0.17), ("s3", (1.12, -0.4, 2.42), 0.11)]):
            st_ = star(name, loc, r, gold)
            st_.rotation_euler = (0, t * math.pi / 2 * (1 if i % 2 else -1), 0)   # a quarter turn per loop: the star looks the same again
            st_.scale = (0.62 + 0.5 * (0.5 + 0.5 * math.sin(ph + i * 2.1)),) * 3
    if pose == "stuck":
        qm = mat("q", "#ffb321", rough=0.15, coat=1.0, emit="#ff9d00", emit_str=0.4)
        text("q", "?", (-1.1, -0.4, 2.2 + 0.11 * s), 0.76, qm, tilt=10 + 15 * s)

    rig.rotation_euler = tuple(math.radians(v) for v in tilt)

    light("key", (-3.6, -4.6, 5.0), 2.6, 300, (1.0, 0.97, 0.93))
    light("rim", (3.4, 3.2, 3.2), 1.6, 700, (0.85, 0.93, 1.0))
    light("fill", (3.2, -5.0, 1.4), 3.0, 70)
    light("window", (-1.3, -0.6, 5.5), 1.0, 1400, size_y=0.5)   # nearly overhead, so it mirrors into the camera off his upper-left: the crisp Y2K highlight
    camera()


# ── render ─────────────────────────────────────────────────────────────────
def crew():
    names = sorted(f[:-3] for f in os.listdir(AGENTS_DIR) if f.endswith(".md")) if os.path.isdir(AGENTS_DIR) else []
    return names


def strip(frames, out):
    """Lay same-size PNGs side by side into one strip."""
    import numpy as np
    tiles = []
    for f in frames:
        im = bpy.data.images.load(f)
        w, h = im.size
        tiles.append(np.array(im.pixels[:], dtype=np.float32).reshape(h, w, 4))
        bpy.data.images.remove(im)
    row = np.concatenate(tiles, axis=1)
    o = bpy.data.images.new("strip", row.shape[1], row.shape[0], alpha=True)
    o.pixels = row.ravel()
    o.filepath_raw, o.file_format = out, "PNG"
    o.save()


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    opt = {"who": "base", "poses": ",".join(POSES), "samples": "64", "size": "256"}
    for k, v in zip(argv[::2], argv[1::2]): opt[k.lstrip("-")] = v
    who_list = ["base"] + crew() if opt["who"] == "all" else opt["who"].split(",")
    poses = opt["poses"].split(",")
    tmp = tempfile.mkdtemp(prefix="lilguy-")
    for who in who_list:
        out = os.path.join(HERE, who)
        os.makedirs(out, exist_ok=True)
        for pose in poses:
            small = {pt: [] for pt in SIZES}
            for n in range(FRAMES):
                sc = fresh_scene(int(opt["samples"]), int(opt["size"]))
                build(who, pose, n / FRAMES)
                master = os.path.join(tmp, f"{who}-{pose}-{n}.png")
                sc.render.filepath = master
                bpy.ops.render.render(write_still=True)
                for pt in SIZES:   # @2x files for those point sizes
                    dst = os.path.join(tmp, f"{who}-{pose}-{n}-{pt}.png")
                    subprocess.run(["sips", "-Z", str(pt * 2), master, "--out", dst], capture_output=True)
                    small[pt].append(dst)
                if n == 0 and opt.get("keep"): subprocess.run(["cp", master, os.path.join(out, f"{pose}-master.png")])
            for pt in SIZES:
                subprocess.run(["cp", small[pt][0], os.path.join(out, f"{pose}-{pt}@2x.png")])
                strip(small[pt], os.path.join(out, f"{pose}-anim-{pt}@2x.png"))
            print(f"lilguy: {who} {pose}", flush=True)


if __name__ == "__main__":
    main()
