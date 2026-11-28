/**
 * fleming.js - fleming notation circuit renderer
 * Shape data: schemdraw (MIT), https://github.com/cdelker/schemdraw
 * Copyright (c) 2026 Kirimaru
 * SPDX-License-Identifier: MIT
 *
 * Portions adapted from Schemdraw, Copyright (c) 2014-2026 Collin J. Delker.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(function (root) {
  'use strict';

  // Reference drawings are developer data: render() never reads them, so the
  // release build ships an empty object and stays at code size. The full set is
  // generated into reference/fleming_dev.js by reference/embed_reference.py.
  const referenceImages = Object.freeze({});

  const escapeText = value => value.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[c]);

  // Geometry constants taken from Schemdraw's Element2Term subclasses:
  // reswidth = 1/6 unit, resheight = 1/4 unit, capacitor gap = 0.18 unit.
  const UNIT = 36;
  const RSW = UNIT / 6;          // resistor zig-zag step (6 px)
  const RSH = UNIT * 0.25;       // resistor zig-zag height (9 px)
  const CAPGAP = UNIT * 0.18;    // capacitor plate gap (6.48 px)

  // Resistor: six zig-zags spanning 6·reswidth, centred on x = 54.
  const resistorPath = () => {
    let d = `M 0,0 L ${54 - 3 * RSW},0`;
    for (let i = 0; i < 6; i++) d += ` L ${54 - 3 * RSW + (i + 0.5) * RSW},${i % 2 ? RSH : -RSH}`;
    return `${d} L ${54 + 3 * RSW},0 L 108,0`;
  };
  // Capacitor: two plates `CAPGAP` apart around x = 54.
  const capacitorPath = () => {
    const a = 54 - CAPGAP / 2, b = 54 + CAPGAP / 2;
    return `M 0,0 L ${a},0 M ${a},-9 L ${a},9 M ${b},-9 L ${b},9 M ${b},0 L 108,0`;
  };
  // Inductor: four loops of radius 4.5 px spaced 9 px apart.
  const inductorPath = (sy = 1) => {
    // Segment.flip() mirrors the loops: the SVG sweep flag is reversed.
    let d = 'M 0,0 L 36,0';
    for (let i = 0; i < 4; i++) d += ` M ${36 + i * 9},0 a 4.5,4.5 0 1 ${sy === 1 ? 1 : 0} 9,0`;
    return `${d} M 72,0 L 108,0`;
  };
  // Diode: triangle and bar centred on x = 54, 6.3 px either side.
  const diodePath = () => {
    const a = 54 - 6.3, b = 54 + 6.3;
    return `M 0,0 L ${a},0 M ${a},-9 L ${b},0 L ${a},9 Z M ${b},-9 L ${b},9 M ${b},0 L 108,0`;
  };
  // Round source: circle of radius 18 centred on x = 54.
  const sourcePath = () => 'M 0,0 L 36,0 M 72,0 L 108,0';
  // Voltage source: source circle plus the +/- marks (0.1 unit tall).
  const sourceVPath = () => `${sourcePath()} M 45,-3.6 L 45,3.6 M 59.4,0 L 66.6,0 M 63,-3.6 L 63,3.6`;
  // Sine source: Schemdraw samples 25 points with x following a sine of
  // amplitude 7.2 px and y descending linearly by 0.75 px per step.
  const sourceSinPath = (sy = 1) => {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const x = Number((54 + 7.2 * Math.sin(Math.PI * i / 12)).toFixed(3));
      // Segment.flip() mirrors the sine like every other segment vertex.
      const y = Number(((9 - 0.75 * i) * sy).toFixed(3));
      pts.push(`${x},${y}`);
    }
    return `${sourcePath()} M ${pts.join(' L ')}`;
  };

  // Path-form two-terminal parts: one SVG path spanning the 3-unit leads.
  const pathParts = {
    Resistor: { form: 'path', path: resistorPath() },
    // ResistorIEEE is Schemdraw's IEEE/US-style resistor; the same zig-zag.
    ResistorIEEE: { form: 'path', path: resistorPath() },
    Capacitor: { form: 'path', path: capacitorPath() },
    Inductor: { form: 'path', path: inductorPath() },
    Diode: { form: 'path', path: diodePath() },
    Line: { form: 'path', path: 'M 0,0 L 108,0' },
    Source: { form: 'path', path: sourcePath() },
    SourceV: { form: 'path', path: sourceVPath() },
    SourceSin: { form: 'path', path: sourceSinPath() }
  };

  // Lengths are in the same 36 SVG units per schemdraw unit as the examples.
  const defaultUnit = 108;
  const directions = { right: [1, 0, 0], down: [0, 1, 90], left: [-1, 0, 180], up: [0, -1, -90] };

  const cycloidPoints = loops => {
    const a = 0.06, b = 0.19, n = loops * 50;
    const yint = Math.acos(a / b);
    const t0 = yint, t1 = 2 * (loops + 1) * Math.PI - yint;
    const raw = Array.from({ length: n }, (_, i) => {
      const t = t0 + (t1 - t0) * i / (n - 1);
      return [a * t - b * Math.sin(t), a - b * Math.cos(t)];
    });
    const x0 = raw[0][0], xlen = raw[n - 1][0] - x0;
    const ys = raw.map(point => point[1]);
    const yscale = (Math.max(...ys) - Math.min(...ys)) / 0.25;
    return raw.map(([x, y]) => [(x - x0) / xlen, y * yscale]);
  };

  // Prolate cycloid used by Inductor2 and Relay(cycl=True). The points are
  // normalized like schemdraw's cycloid(): x spans 1 unit and y uses the
  // resistor height scale.
  const relayCycloid = (() => {
    const loops = 4, n = loops * 50;
    const points = cycloidPoints(loops);
    return points.map(([u, v]) => `L ${(v * 36).toFixed(4)},${(18 + u * 36).toFixed(4)}`).join(' ');
  })();

  // Local coordinates are SVG coordinates (positive y down). Schemdraw flips
  // y, reverses x about the element center, then shifts, scales and rotates.
  // The reverse axis must be supplied by the definition; it cannot be guessed
  // from anchors when the geometry has a different bounding box.
  function placeComponent(definition, origin, { direction = [1, 0], anchor = null, flip = false, reverse = false, scale = [1, 1] } = {}) {
    if (anchor !== null && !Object.prototype.hasOwnProperty.call(definition.anchors, anchor)) throw new Error(`Unknown anchor: ${anchor}`);
    if (reverse && !Number.isFinite(definition.reverseCenter)) throw new Error('Reverse center is not defined.');
    if (!Array.isArray(scale) || scale.length !== 2 || scale.some(n => !Number.isFinite(n) || n <= 0)) throw new Error('scale must be a finite positive number.');
    const reflect = ([px, py]) => [reverse ? 2 * definition.reverseCenter - px : px, flip ? -py : py];
    const offset = anchor === null ? null : reflect(definition.anchors[anchor]);
    const transform = (localX, localY) => {
      let [px, py] = reflect([localX, localY]);
      if (offset) { px -= offset[0]; py -= offset[1]; }
      if (scale[0] !== 1) px *= scale[0];
      if (scale[1] !== 1) py *= scale[1];
      return [origin[0] + px * direction[0] - py * direction[1], origin[1] + px * direction[1] + py * direction[0]];
    };
    const anchors = Object.create(null);
    for (const [name, point] of Object.entries(definition.anchors)) anchors[name] = transform(...point);
    return { transform, anchors };
  }

  const linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));

  // Width estimate of Schemdraw's sans-serif approximation (backends/svgtext).
  function textWidth(text, size) {
    let units = 0;
    for (const ch of text) {
      // Schemdraw's tables use string membership, so digits count as 95.
      if ('lij|\' '.includes(ch)) units += 37;
      else if ('![]fI.,:;/\\t'.includes(ch)) units += 50;
      else if ('`-(){}r"'.includes(ch)) units += 60;
      else if ('*^zcsJkvxyμ°'.includes(ch)) units += 85;
      else if (('aebdhnopqug#$L+<>=?_~FZTα' + '0123456789').includes(ch)) units += 95;
      else if ('BSPEAKVXY&UwNRCHD'.includes(ch)) units += 112;
      else if ('QGOMm%@Ω'.includes(ch)) units += 140;
      else if ('W∠'.includes(ch)) units += 155;
      else units += 75;
    }
    return units * 72 / 1000 * (size / 12);
  }

  // Schemdraw's _align_label default offset for a label at a named anchor.
  function anchorLabelOffset(halign, valign, pofst) {
    return {
      'center-bottom': [0, -pofst], 'right-top': [-pofst, -pofst], 'left-top': [pofst, -pofst],
      'right-center': [-pofst, 0], 'left-center': [pofst, 0],
      'center-top': [0, -pofst], 'right-bottom': [-pofst, -pofst], 'left-bottom': [pofst, -pofst]
    }[`${halign}-${valign}`] || [0, -pofst];
  }

  // Curves used by Photodiode and LED2, computed like Schemdraw's LED2 code
  // (50 samples, rotated 20 degrees) in default SVG coordinates.
  const photoCurves = (() => {
    const n = 50, th = 20 * Math.PI / 180;
    const xs = linspace(0.25 * 0.75, 0.25 * 1.25, n);
    const ys = linspace(-1, 1, n).map(x => -x * (x - 0.7) * (x + 0.7) / 2 + 0.25 * 2.5);
    const rot = (x, y) => [x * Math.cos(th) - y * Math.sin(th), x * Math.sin(th) + y * Math.cos(th)];
    const path = shift => xs.map((x, i) => {
      const [a, b] = rot(x - shift, ys[i]);
      return `${i ? 'L' : 'M'} ${(a * 36 + 47.7).toFixed(4)},${(-b * 36).toFixed(4)}`;
    }).join(' ');
    return [path(0), path(0.2)];
  })();

  // Filament of Lamp, normalized like Schemdraw's Lamp source.
  const lampFilament = (() => {
    const n = 100, a = 0.25, b = 0.7;
    const t = linspace(1.4, 3.6 * Math.PI, n);
    const x = t.map(v => a * v - b * Math.sin(v));
    const y = t.map(v => a - b * Math.cos(v));
    const x0 = x[0], xn = x[n - 1], y0 = y[0];
    return t.map((_, i) => `${i ? 'L' : 'M'} ${(36 + (x[i] - x0) / (xn - x0) * 36).toFixed(4)},${(-(y[i] - y0) * 9).toFixed(4)}`).join(' ');
  })();

  // Sine element of FuseUS in default coordinates.
  const fuseSine = (() => {
    const n = 50, xs = linspace(0.24, 1.12, n), ys = linspace(0, 2 * Math.PI, n).map(t => Math.sin(t) * 0.25);
    return xs.map((x, i) => `${i ? 'L' : 'M'} ${((x + 0.82) * 36).toFixed(4)},${(-ys[i] * 36).toFixed(4)}`).join(' ');
  })();

  // Two-terminal symbols whose body is a fixed glyph. Coordinates are the
  // default Schemdraw SVG coordinates (body centered at x=54), repositioned
  // with translate(c)…translate(-54). `half` is half the intrinsic body length.
  // ResistorIEC and RBox are the same IEC box resistor in schemdraw 0.23.
  const iecResistorBody = s => `<path d="M 36,0 L 36,-9 L 72,-9 L 72,9 L 36,9 L 36,0" ${s}/>`;

  // Glyph helpers for switches. The arrow of `action='open'/'close'` is built
  // from the same elliptical arc Schemdraw uses (SegmentArc width .5, height
  // .75, theta1 -10°, theta2 70°, plus a filled arrowhead).
  const switchDot = (cx, cy, color) => `<circle cx="${cx}" cy="${cy}" r="4.32" fill="white" stroke="${color}" stroke-width="2"/>`;
  // Switch action arrow — a literal port of Schemdraw's SVG backend.
  // `arc()` draws the path in SVG pixels, then computes the arrowhead back in
  // *user* coordinates (y up) and only the final `arrow()` call maps to pixels.
  // Keeping that order is what makes the heads match.
  const switchArc = (cxU, cyU, widthU, heightU, theta1Deg, theta2Deg, arrow, color) => {
    const r2 = v => Math.round(v * 100) / 100;
    const scale = 36;
    const width = widthU * scale, height = heightU * scale;      // pixels
    const centerx = cxU * scale, centery = -cyU * scale;         // xform()
    const angle = 0;
    const t1 = -theta1Deg, t2 = -theta2Deg;                      // backend negates
    const a1 = t1 * Math.PI / 180, a2 = t2 * Math.PI / 180;
    let T1 = Math.atan2(width * Math.sin(a1), height * Math.cos(a1));
    const T2 = Math.atan2(width * Math.sin(a2), height * Math.cos(a2));
    while (T1 < T2) T1 += 2 * Math.PI;
    const sx = centerx + width / 2 * Math.cos(T2), sy = centery + height / 2 * Math.sin(T2);
    const ex = centerx + width / 2 * Math.cos(T1), ey = centery + height / 2 * Math.sin(T1);
    const rsx = r2(sx), rsy = r2(sy), rex = r2(ex), rey = r2(ey);
    let out = `<path d="M ${rsx} ${rsy} a ${r2(width / 2)} ${r2(height / 2)} ${angle} ${Math.abs(T2 - T1) >= Math.PI ? '1 1' : '0 1'} ${r2(rex - rsx)} ${r2(rey - rsy)}" fill="none" stroke="${color}" stroke-width="2"/>`;
    // Arrowhead, computed in user units exactly like the backend.
    const wU = widthU, hU = heightU, cU = [cxU, cyU];
    const arrowlength = 0.25, arrowwidth = 0.15;
    // The backend negates back: theta1 = -degrees(theta1_radians), and those
    // radians were already negated, so this returns the caller's values.
    // Backend: after `theta1 = -theta1; theta2 = -theta2`, it later does
    // `theta1 = -degrees(theta1)`, which restores the constructor values.
    const theta1u = theta1Deg, theta2u = theta2Deg;
    const th2 = Math.atan2((wU / hU) * Math.sin(theta2u * Math.PI / 180), Math.cos(theta2u * Math.PI / 180)) * 180 / Math.PI;
    const th1 = Math.atan2((wU / hU) * Math.sin(theta1u * Math.PI / 180), Math.cos(theta1u * Math.PI / 180)) * 180 / Math.PI;
    const head = (xU, yU, theta) => {
      // backend `arrow()`: convert the anchor to pixels, build the triangle there
      const x = xU * scale, y = -yU * scale;
      const dxP = arrowlength / 2 * Math.cos(theta * Math.PI / 180) * scale;
      const dyP = arrowlength / 2 * Math.sin(theta * Math.PI / 180) * scale;
      const awP = arrowwidth * scale, alP = arrowlength * scale;
      const hd = [x, y], tl = [x - dxP, y + dyP];
      const full = Math.hypot(dxP, dyP);
      const t = -Math.atan2(dyP, dxP) * 180 / Math.PI;
      const rot = (px, py) => [px * Math.cos(t * Math.PI / 180) - py * Math.sin(t * Math.PI / 180),
        px * Math.sin(t * Math.PI / 180) + py * Math.cos(t * Math.PI / 180)];
      const [f1x, f1y] = rot(full - alP, awP / 2);
      const [f2x, f2y] = rot(full - alP, -awP / 2);
      const hx = hd[0] - 1 * 2 * Math.cos(t * Math.PI / 180);
      const hy = hd[1] - 1 * 2 * Math.sin(t * Math.PI / 180);
      return `<path d="M ${r2(hx)} ${r2(hy)} L ${r2(f1x + tl[0])} ${r2(f1y + tl[1])} L ${r2(f2x + tl[0])} ${r2(f2y + tl[1])} Z" fill="${color}" stroke="${color}"/>`;
    };
    if (arrow === 'ccw') {
      const dx = Math.cos((th2 + 90) * Math.PI / 180) * arrowlength;
      const dy = Math.sin((th2 + 90) * Math.PI / 180) * arrowlength;
      const xU = cU[0] + wU / 2 * Math.cos(th2 * Math.PI / 180);
      const yU = cU[1] + hU / 2 * Math.sin(th2 * Math.PI / 180);
      out += head(xU + dx, yU + dy, th2 + 90);
    } else if (arrow === 'cw') {
      // Backend `cw` branch: the head sits `arrowlength` beyond the theta1 end
      // along th1+90 and points back along th1+90+180.
      const dx = -Math.cos((th1 + 90) * Math.PI / 180) * arrowlength;
      const dy = -Math.sin((th1 + 90) * Math.PI / 180) * arrowlength;
      const r3 = th1 * Math.PI / 180;
      const xU = cU[0] + wU / 2 * Math.cos(r3);
      const yU = cU[1] + hU / 2 * Math.sin(r3);
      out += head(xU + dx, yU + dy, th1 + 90 + 180);
    }
    return out;
  };

  // Outlet shapes, ported literally from schemdraw/elements/outlets.py.
  // Each builder returns { segments, anchors, drop } in drawing units (y up).
  // `segments` entries are { type: 'poly'|'circle'|'seg', ... } with an
  // optional `fill` ('black' when plug=True, else 'bg').
  const outletRotate = (xy, angle, center = [0, 0]) => {
    const co = Math.cos(angle * Math.PI / 180), so = Math.sin(angle * Math.PI / 180);
    // schemdraw util.rotate: b = dot(Point(xy) - center, ((co, so), (-so, co)))
    const bx = xy[0] - center[0], by = xy[1] - center[1];
    const rx = bx * co - by * so;
    const ry = bx * so + by * co;
    return [rx + center[0], ry + center[1]];
  };
  const outletLinspace = (a, b, n = 50) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));

  const OUTLET_RAD = 1.1;

  function buildOutlet(type, plug) {
    const fill = plug ? 'black' : 'bg';
    const R = OUTLET_RAD, segs = [], anchors = {};
    const poly = (verts, f) => segs.push({ type: 'poly', verts, fill: f });
    const circle = (c, r, f) => segs.push({ type: 'circle', c, r, fill: f });
    if (type === 'OutletA' || type === 'OutletB') {
      const r1 = 1.5;
      const th = outletLinspace(Math.PI * 3 / 4, Math.PI * 5 / 4);
      const xl = th.map(t => .15 + r1 * Math.cos(t));
      const yl = th.map(t => r1 * Math.sin(t));
      const xr = th.map(t => -.15 + -r1 * Math.cos(t));
      const yr = th.map(t => -r1 * Math.sin(t));
      poly(xl.concat(xr).map((x, i) => [x, yl.concat(yr)[i]]));
      const pinw = r1 / 8, pinh = pinw * 3, pinhn = pinh * 1.25;
      const pintop = pinh / 2, pintopn = pinhn / 2, pinleft = r1 / 2.2;
      poly([[-pinleft, pintopn], [-pinleft, pintopn - pinhn], [-pinleft + pinw, pintopn - pinhn], [-pinleft + pinw, pintopn]], fill);
      poly([[pinleft, pintop], [pinleft, pintop - pinh], [pinleft - pinw, pintop - pinh], [pinleft - pinw, pintop]], fill);
      anchors.hot = [pinleft - pinw / 2, 0];
      anchors.neutral = [-pinleft + pinw / 2, 0];
      if (type === 'OutletB') {
        const gndw = r1 / 4, gndy = -r1 / 2.5;
        const x = [-gndw / 2, -gndw / 2, gndw / 2, gndw / 2];
        const y = [gndy, gndy - gndw / 2, gndy - gndw / 2, gndy];
        for (const t of outletLinspace(0, Math.PI)) { x.push(gndw / 2 * Math.cos(t)); y.push(gndy + gndw / 2 * Math.sin(t)); }
        poly(x.map((v, i) => [v, y[i]]), fill);
        const dy = gndw / 2;
        for (const which of [1, 2]) segs[which].verts = segs[which].verts.map(([px, py]) => [px, py + dy]);
        anchors.hot = [anchors.hot[0], anchors.hot[1] + dy];
        anchors.neutral = [anchors.neutral[0], anchors.neutral[1] + dy];
        anchors.ground = [0, gndy];
      }
      return { segments: segs, anchors, drop: anchors.hot };
    }
    if (type === 'OutletC' || type === 'OutletF') {
      circle([0, 0], R);
      const prad = R / 8, x = R / 2;
      circle([-x, 0], prad, fill);
      circle([x, 0], prad, fill);
      anchors.hot = [x, 0]; anchors.neutral = [-x, 0];
      if (type === 'OutletF') {
        const notchw = R / 8, notchh = R / 6, y = R - .05, y2 = -R + .05;
        segs.push({ type: 'seg', verts: [[-notchw, y], [-notchw, y - notchh], [notchw, y - notchh], [notchw, y]], fill });
        segs.push({ type: 'seg', verts: [[-notchw, y2], [-notchw, y2 + notchh], [notchw, y2 + notchh], [notchw, y2]], fill });
        anchors.groundN = [0, R];
        anchors.groundS = [0, -R];
        return { segments: segs, anchors, drop: anchors.hot };
      }
      return { segments: segs, anchors, drop: anchors.hot };
    }
    if (type === 'OutletD' || type === 'OutletE' || type === 'OutletK') {
      circle([0, 0], R);
      const prad = R / 8, x = R / 2;
      if (type === 'OutletK') {
        circle([-x, 0], prad, fill);
        circle([x, 0], prad, fill);
        anchors.hot = [x, 0]; anchors.neutral = [-x, 0];
        const gndw = R / 4, gndy = -R / 2;
        const gx = [-gndw / 2, -gndw / 2, gndw / 2, gndw / 2];
        const gy = [gndy, gndy + gndw / 2, gndy + gndw / 2, gndy];
        for (const t of outletLinspace(0, Math.PI)) { gx.push(gndw / 2 * Math.cos(t)); gy.push(gndy - gndw / 2 * Math.sin(t)); }
        poly(gx.map((v, i) => [v, gy[i]]), fill);
        anchors.ground = [0, gndy];
        return { segments: segs, anchors, drop: [x, 0] };
      }
      const y = type === 'OutletD' ? -R / 4 : 0;
      const y2 = type === 'OutletD' ? R / 2.5 : R / 2;
      circle([-x, y], prad, fill);
      circle([x, y], prad, fill);
      circle([0, y2], type === 'OutletD' ? prad * 1.2 : prad, fill);
      anchors.hot = [x, y]; anchors.neutral = [-x, y]; anchors.ground = [0, y2];
      return { segments: segs, anchors, drop: type === 'OutletD' ? anchors.ground : anchors.neutral };
    }
    if (type === 'OutletG') {
      circle([0, 0], R);
      const pinw = R / 6, pinh = pinw * 3, gndw = R / 5, gndtop = R * 3 / 4, y = -R / 2.5, pinleft = pinw;
      poly([[-gndw / 2, gndtop], [-gndw / 2, gndtop - pinh], [gndw / 2, gndtop - pinh], [gndw / 2, gndtop]], fill);
      poly([[-pinleft, y], [-pinleft, y - pinw], [-pinleft - pinh, y - pinw], [-pinleft - pinh, y]], fill);
      poly([[pinleft, y], [pinleft, y - pinw], [pinleft + pinh, y - pinw], [pinleft + pinh, y]], fill);
      anchors.hot = [pinleft + pinh / 2, y - pinw / 2];
      anchors.neutral = [-pinleft - pinh / 2, y - pinw / 2];
      anchors.ground = [0, gndtop - pinh / 2];
      return { segments: segs, anchors, drop: anchors.hot };
    }
    if (type === 'OutletH' || type === 'OutletI') {
      circle([0, 0], R);
      const pinw = R / 8, pinh = pinw * 3, gndtop = -pinw * 2;
      const verts = [[-pinw / 2, gndtop], [-pinw / 2, gndtop - pinh], [pinw / 2, gndtop - pinh], [pinw / 2, gndtop]];
      const hot = verts.map(v => outletRotate(v, 120));
      const neut = verts.map(v => outletRotate(v, -120));
      poly(verts, fill); poly(hot, fill); poly(neut, fill);
      anchors.hot = hot[1]; anchors.neutral = neut[2]; anchors.ground = [0, gndtop - pinh];
      if (type === 'OutletI') {
        const hotc = [.4, .3], neutc = [-.4, .3];
        segs[2].verts = segs[2].verts.map(v => outletRotate(v, 90, hotc));
        segs[3].verts = segs[3].verts.map(v => outletRotate(v, -90, neutc));
        anchors.hot = outletRotate(anchors.hot, 90, hotc);
        anchors.neutral = outletRotate(anchors.neutral, -90, neutc);
        return { segments: segs, anchors, drop: anchors.hot };
      }
      return { segments: segs, anchors, drop: anchors.hot };
    }
    if (type === 'OutletJ' || type === 'OutletL') {
      const prad = R / 8;
      if (type === 'OutletJ') {
        const fullh = R * 1.5, fullw = fullh * 2, dw = fullw / 5;
        poly([[-fullw / 2, 0], [-fullw / 2 + dw, fullh / 2], [fullw / 2 - dw, fullh / 2],
          [fullw / 2, 0], [fullw / 2 - dw, -fullh / 2], [-fullw / 2 + dw, -fullh / 2]], fill);
        circle([-fullw / 4, 0], prad, fill);
        circle([0, -prad * 2], prad, fill);
        circle([fullw / 4, 0], prad, fill);
        anchors.hot = [fullw / 4, 0]; anchors.neutral = [-fullw / 4, 0]; anchors.ground = [0, -prad * 2];
      } else {
        const fullh = R * 1.2, fullw = fullh * 2.25;
        poly([[-fullw / 2, fullh / 2], [fullw / 2, fullh / 2], [fullw / 2, -fullh / 2], [-fullw / 2, -fullh / 2]], fill);
        circle([-fullw / 4, 0], prad, fill);
        circle([0, 0], prad, fill);
        circle([fullw / 4, 0], prad, fill);
        anchors.hot = [fullw / 4, 0]; anchors.neutral = [-fullw / 4, 0]; anchors.ground = [0, 0];
      }
      return { segments: segs, anchors, drop: anchors.hot };
    }
    throw new Error(`Unsupported outlet: ${type}`);
  }

  // Schemdraw's `Segment(..., arrow='->')` rendering, read off its SVG output:
  // the line stops `arrowlength` (9 px) short of the end, and the head is a
  // triangle whose base sits at that point, 0.15 unit (5.4 px) wide, with its
  // tip pulled back 2 px (`lw*2`) from the segment end. Points are SVG pixels.
  const segmentArrow = (x0, y0, x1, y1, color, stroke) => {
    const arrowlength = 0.25 * 36, halfwidth = 0.15 * 36 / 2;
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
    const lx = x1 - arrowlength * ux, ly = y1 - arrowlength * uy;
    const tipx = x1 - 2 * ux, tipy = y1 - 2 * uy;
    const px = -uy * halfwidth, py = ux * halfwidth;
    return `<path d="M ${x0.toFixed(4)},${y0.toFixed(4)} L ${lx.toFixed(4)},${ly.toFixed(4)}" ${stroke}/>` +
      `<path d="M ${tipx.toFixed(4)},${tipy.toFixed(4)} L ${(lx + px).toFixed(4)},${(ly + py).toFixed(4)} L ${(lx - px).toFixed(4)},${(ly - py).toFixed(4)} Z" fill="${color}" stroke="${color}"/>`;
  };

  // Shared glyph builder for SwitchDpst / SwitchDpdt (drawn in screen pixels).
  function dpSwitchGlyph(dpdt) {
    const dotR = 0.12, P = 36;
    const yofst = dpdt ? -1.4 : -1;
    return {
      half: 18,
      extent: dpdt ? [36, 80, -20, 76] : [36, 80, -20, 62],
      body: (s, c, options = {}) => {
        const contacts = options.contacts !== false, link = options.link !== false;
        // Authored around x = 54 like every other fixedParts glyph: the
        // renderer maps 54 to the body centre, so a glyph written at 0..36
        // would sit against the left lead instead of between the leads.
        const px = x => (x * P + 36).toFixed(3);
        const py = y => (-y * P).toFixed(3);
        // p1_path: (0,0) gap (2r, .1) → (.8/.7, .45/.25) gap (1, .4)
        const x1 = 2 * dotR, y1 = 0.1, x2 = dpdt ? 0.7 : 0.8, y2 = dpdt ? 0.25 : 0.45;
        const seg1 = contacts
          ? `M ${px(x1)},${py(y1)} L ${px(x2)},${py(y2)}`
          : `M ${px(0)},0 L ${px(x2)},${py(y2)}`;
        // p2_path: (2r, yofst+.1) → (.8/.7, yofst+.45/.25)
        const seg2 = contacts
          ? `M ${px(x1)},${py(yofst + y1)} L ${px(x2)},${py(yofst + y2)}`
          : `M ${px(0)},${py(yofst)} L ${px(x2)},${py(yofst + y2)}`;
        // Contact dots come from the overlay pass (`contactPoints`), so they are
        // not repeated here.
        const dots = '';
        // link: (0.5, yofst+.25) → (0.5, 0.2), dotted
        const bar = link
          ? `<path d="M ${px(0.5)},${py(yofst + 0.25)} L ${px(0.5)},${py(0.2)}" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="2 3.3"/>`
          : '';
        // Schemdraw's throw contact is the last point of p1_path and, with
        // contacts=False, nothing else marks it. Emit the same degenerate point
        // so the drawn geometry matches (with contacts the dot covers it).
        const throwPoint = contacts ? '' : `<path d="M ${px(1)},${py(dpdt ? 0.4 : 0)}" ${s}/>`;
        return `<path d="${seg1} ${seg2}" ${s}/>${bar}${dots}${throwPoint}`;
      }
    };
  }

  // Glyph-form two-terminal parts: a body of `half` × 2 px centred at x = 54
  // with separate leads. Both forms live in one registry, mirroring how
  // Schemdraw keeps every two-terminal part as an Element2Term subclass.
  const twoTerminalParts = {
    ...pathParts,
    Schottky: {
      half: 6.3,
      extent: [45, 66, -12, 12],
      body: s => `<path d="M 47.7,-9 L 60.3,0 L 47.7,9 Z M 60.3,-9 L 60.3,9 M 60.3,-9 L 56.7,-9 L 56.7,-5.4 M 60.3,9 L 63.9,9 L 63.9,5.4" ${s}/>`
    },
    Varactor: {
      half: 8.64,
      extent: [43, 65, -12, 12],
      body: s => `<path d="M 45.36,-9 L 57.96,0 L 45.36,9 Z M 57.96,-9 L 57.96,9 M 62.64,-9 L 62.64,9" ${s}/>`
    },
    RBox: {
      half: 18,
      extent: [34, 74, -11, 11],
      body: iecResistorBody
    },
    ResistorIEC: {
      half: 18,
      extent: [34, 74, -11, 11],
      body: iecResistorBody
    },
    Thermistor: {
      half: 18,
      extent: [34, 74, -20, 20],
      body: s => `<path d="M 36,0 L 36,-9 L 72,-9 L 72,9 L 36,9 L 36,0 M 36,16.2 L 43.2,16.2 L 72,-16.2" ${s}/>`
    },
    Crystal: {
      half: 7.2,
      extent: [44, 64, -11, 11],
      body: s => `<path d="M 46.8,-9 L 46.8,9 M 50.4,-9 L 50.4,9 L 57.6,9 L 57.6,-9 L 50.4,-9 M 61.2,-9 L 61.2,9" ${s}/>`
    },
    CapacitorVar: {
      half: 3.24,
      extent: [36, 70, -14, 12],
      body: (s, c) => `<path d="M 50.76,-9 L 50.76,9 M 57.24,-9 L 57.24,9 M 38.76,9 L 62.862,-7.871" ${s}/><path d="M 67.122,-10.853 L 64.513,-5.512 L 61.21,-10.23 Z" fill="${c}"/>`
    },
    CapacitorTrim: {
      half: 3.24,
      extent: [38, 73, -15, 11],
      body: s => `<path d="M 50.76,-9 L 50.76,9 M 57.24,-9 L 57.24,9 M 39.96,9 L 68.04,-9 M 65.32,-13.243 L 70.76,-4.757" ${s}/>`
    },
    // `options` holds part-specific flags (contacts, nc, action) when present.
    Switch: {
      half: 18,
      extent: [34, 74, -20, 8],
      body: (s, c, options = {}) => {
        const contacts = options.contacts !== false, nc = options.nc === true;
        // Schemdraw's Switch segment list, in drawing units (y up):
        //   contacts:      (0,0) gap (0.24,0) -> (0.8,0.45)      gap (1,0)
        //   contacts + nc: (0,0) gap (0.24,0) -> (0.9,0.17)      gap (1,0)
        //   no contacts:   (0,0) -> (0.85,0.45)                  gap (1,0)
        //   no contacts+nc:(0,0) -> (1.15,0.45) gap (1,0)  and  (1,0) -> (1,0.55)
        // The body is authored around x = 54, so 1 unit = 36 px from x = 36.
        const lever = contacts
          ? (nc ? 'M 44.64,0 L 68.4,-6.12' : 'M 44.64,-3.6 L 64.8,-16.2')
          : (nc ? 'M 36,0 L 77.4,-16.2' : 'M 36,0 L 66.6,-16.2');
        // Contact dots are emitted once, in the overlay pass that redraws them
        // above every lead (see `contactPoints`); drawing them here duplicates
        // the circles in the output. The normally-closed stub is a line, not a
        // dot, so it stays here.
        const dots = !contacts && nc ? `<path d="M 72,0 L 72,-19.8" ${s}/>` : '';
        const arrow = options.action === 'open' || options.action === 'close'
          ? switchArc(1.4, options.action === 'open' ? 0.1 : 0.25, 0.5, 0.75, -10, 70, options.action === 'open' ? 'ccw' : 'cw', c) : '';
        return `<path d="${lever}" ${s}/>${dots}${arrow}`;
      }
    },
    SwitchSpdt: {
      half: 18,
      extent: [34, 74, -32, 8],
      body: (s, c, options = {}) => {
        // Schemdraw keeps the first lead and the two lower contacts; only the
        // third (upper) contact is optional, and `contacts=False` joins the
        // pivot lead straight to the lever.
        const contacts = options.contacts !== false;
        const lever = contacts ? 'M 44.64,-3.6 L 64.8,-16.2' : 'M 36,0 L 66.6,-16.2';
        const dots = '';   // contact dots come from the overlay pass
        const arrow = options.action === 'open' || options.action === 'close'
          ? switchArc(1.4, options.action === 'open' ? 0.1 : 0.25, 0.5, 0.75, -10, 70, options.action === 'open' ? 'ccw' : 'cw', c) : '';
        return `<path d="${lever}" ${s}/>${dots}${arrow}`;
      }
    },
    // Double-pole switches hang the second pole 36 px below the terminal line;
    // coordinates are Schemdraw's default SVG frame with the waist at y = 18.
    // Single-pole double-throw switch with one throw above and one below
    // (Schemdraw `SwitchSpdt2`): the lever points at the upper throw. This
    // entry supplies the lead-less 1-unit glyph; the standalone SwitchSpdt2
    // branch places it and publishes its a/b/c anchors.
    SwitchSpdt2: {
      half: 18,
      extent: [34, 74, -22, 22],
      body: (s, c, options = {}) => {
        const contacts = options.contacts !== false;
        const lever = contacts ? 'M 8.64,-3.6 L 25.2,-9' : 'M 0,0 L 30.6,-9';
        const dots = '';   // contact dots come from the overlay pass
        // The upper throw is the last point of p1_path; with contacts=False
        // Schemdraw still emits that point, so mirror it here.
        const throwPoint = contacts ? '' : '<path d="M 36,-14.4 L 36,-14.4" ' + s + '/>';
        const action = options.action;
        // `SegmentArc((.35, 0))` / `((.30, 0))` in the element's local frame.
        const arrow = action === 'open' || action === 'close'
          ? switchArc(action === 'open' ? 0.35 : 0.3, 0, 0.5, 0.75, -10, 70, action === 'open' ? 'ccw' : 'cw', c) : '';
        return `<path d="${lever}" ${s}/>${dots}${throwPoint}${arrow}`;
      }
    },
    // Double-pole switches ported from schemdraw/elements/switches.py. The
    // glyph is written in drawing units (y up) and converted here, so the
    // numbers come from the Segment lists instead of being read off an image.
    // `yofst` is -1 for DPST and -1.4 for DPDT; the second pole is drawn below
    // the terminal line.
    SwitchDpst: dpSwitchGlyph(false),
    SwitchDpdt: dpSwitchGlyph(true),
    // Reed switch. Schemdraw traces the envelope as 50 points down the left
    // half circle (x = 39.6, r = 0.3), 50 points up the right one (x = 75.6),
    // and closes back on the start point.
    SwitchReed: {
      half: 18,
      extent: [34, 74, -14, 14],
      body: s => {
        const r = 0.3 * 36, n = 49;
        const pts = [];
        for (let i = 0; i <= n; i++) {
          const th = Math.PI * i / n;
          pts.push([39.6 - r * Math.sin(th), r * Math.cos(th)]);
        }
        for (let i = 0; i <= n; i++) {
          const th = Math.PI * i / n;
          pts.push([75.6 + r * Math.sin(th), -r * Math.cos(th)]);
        }
        pts.push([39.6, r]);
        // The outline is already in SVG coordinates (y down).
        const outline = pts.map(([px, py], i) => `${i ? 'L' : 'M'} ${px.toFixed(3)},${py.toFixed(3)}`).join(' ');
        return `<path d="${outline}" ${s}/>` +
          `<path d="M 39.6,0 L 70.2,-5.4 M 68.4,0 L 108,0" ${s}/>`;
      }
    },
    // Push button. `nc` moves the bar above the contact line (Schemdraw puts it
    // at -sw_dot_r-0.05 with the stem 0.15 higher) and `contacts=False` removes
    // the contact circles, extending the leads to their positions.
    Button: {
      half: 18,
      extent: [34, 74, -21, 8],
      body: (s, c, options = {}) => {
        const contacts = options.contacts !== false, nc = options.nc === true;
        const lead = contacts
          ? `M 0,0 L 36,0 M 72,0 L 108,0`
          : `M 0,0 L 40.32,0 M 67.68,0 L 108,0`;
        const barY = nc ? 6.12 : -10.8, stemTop = nc ? -9.72 : -18;
        const dots = contacts
          ? `<circle cx="40.32" cy="0" r="4.32" fill="none" stroke="${c}" stroke-width="2"/><circle cx="67.68" cy="0" r="4.32" fill="none" stroke="${c}" stroke-width="2"/>` : '';
        return `<path d="${lead}" ${s}/><path d="M 40.32,${barY} L 67.68,${barY} M 54,${barY} L 54,${stemTop}" ${s}/>${dots}`;
      }
    },
    Lamp2: {
      half: 18,
      extent: [34, 74, -20, 20],
      body: (s, c) => `<circle cx="54" cy="0" r="18" fill="none" stroke="${c}" stroke-width="2"/><path d="M 41.272,-12.728 L 66.728,12.728 M 41.272,12.728 L 66.728,-12.728" ${s}/>`
    },
    SourcePulse: {
      half: 18,
      extent: [34, 74, -20, 20],
      body: (s, c) => `<circle cx="54" cy="0" r="18" fill="none" stroke="${c}" stroke-width="2"/><path d="M 50.4,-10.8 L 50.4,-5.4 L 55.8,-5.4 L 55.8,5.4 L 50.4,5.4 L 50.4,10.8" ${s}/>`
    },
    SourceSquare: {
      half: 18,
      extent: [34, 74, -20, 20],
      body: (s, c) => `<circle cx="54" cy="0" r="18" fill="none" stroke="${c}" stroke-width="2"/><path d="M 54,-9 L 61.2,-9 L 61.2,0 L 46.8,0 L 46.8,9 L 54,9" ${s}/>`
    },
    SourceTriangle: {
      half: 18,
      extent: [34, 74, -20, 20],
      body: (s, c) => `<circle cx="54" cy="0" r="18" fill="none" stroke="${c}" stroke-width="2"/><path d="M 50.4,-9 L 61.2,0 L 50.4,9" ${s}/>`
    },
    SourceRamp: {
      half: 18,
      extent: [34, 74, -20, 20],
      body: (s, c) => `<circle cx="54" cy="0" r="18" fill="none" stroke="${c}" stroke-width="2"/><path d="M 50.4,-9 L 64.8,7.2 L 50.4,7.2" ${s}/>`
    },
    Photodiode: {
      half: 6.3,
      extent: [33, 68, -35, 12],
      body: (s, c) => `<path d="M 47.7,-9 L 60.3,0 L 47.7,9 Z M 60.3,-9 L 60.3,9" ${s}/><path d="${photoCurves[0]}" ${s}/><path d="${photoCurves[1]}" ${s}/><path d="M 53.029,-17.983 L 52.369,-19.704 M 46.263,-15.52 L 45.603,-17.242" ${s}/><path d="M 54.231,-14.849 L 49.68,-18.673 L 55.058,-20.735 Z M 47.465,-12.386 L 42.914,-16.21 L 48.292,-18.273 Z" fill="${c}"/>`
    },
    LED2: {
      half: 6.3,
      extent: [33, 68, -35, 12],
      body: (s, c) => `<path d="M 47.7,-9 L 60.3,0 L 47.7,9 Z M 60.3,-9 L 60.3,9" ${s}/><path d="${photoCurves[0]}" ${s}/><path d="${photoCurves[1]}" ${s}/><path d="M 43.894,-30.46 L 44.555,-28.738 M 37.129,-27.997 L 37.789,-26.276" ${s}/><path d="M 42.693,-33.594 L 47.244,-29.77 L 41.866,-27.707 Z M 35.927,-31.131 L 40.478,-27.307 L 35.1,-25.245 Z" fill="${c}"/>`
    },
    Lamp: {
      half: 18,
      extent: [34, 74, -20, 20],
      body: (s, c) => `<circle cx="54" cy="0" r="18" fill="none" stroke="${c}" stroke-width="2"/><path d="${lampFilament}" ${s}/>`
    },
    FuseUS: {
      half: 15.84,
      extent: [32, 76, -12, 12],
      // End contacts are drawn by the overlay pass, not here.
      body: (s, c) => `<path d="${fuseSine}" ${s}/>`
    },
    Memristor: {
      half: 18,
      extent: [34, 74, -11, 11],
      body: (s, c) => `<path d="M 36,-9 L 72,-9 L 72,9 L 36,9 L 36,-9 M 36,0 L 43.2,0 L 43.2,5.4 L 50.4,5.4 L 50.4,-5.4 L 57.6,-5.4 L 57.6,5.4 L 64.8,5.4 L 64.8,0 L 72,0" ${s}/><path d="M 36,-9 L 36,9 L 39.6,9 L 39.6,-9 Z" fill="${c}"/>`
    },
    SparkGap: {
      half: 18,
      extent: [34, 74, -6, 6],
      body: (s, c) => `<path d="M 36,0 L 43.56,0 M 72,0 L 64.44,0" ${s}/><path d="M 50.56,0 L 43.56,4.5 L 43.56,-4.5 Z M 57.44,0 L 64.44,-4.5 L 64.44,4.5 Z" fill="${c}"/>`
    },
    MeterV: { half: 18, extent: [34, 74, -20, 20], body: (s, c) => `<circle cx="54" cy="0" r="18" fill="none" stroke="${c}" stroke-width="2"/>`, texts: [{ x: 54, y: 0, value: 'V' }] },
    MeterA: { half: 18, extent: [34, 74, -20, 20], body: (s, c) => `<circle cx="54" cy="0" r="18" fill="none" stroke="${c}" stroke-width="2"/>`, texts: [{ x: 54, y: 0, value: 'A' }] },
    MeterI: { half: 18, extent: [34, 74, -20, 20], body: (s, c) => `<circle cx="54" cy="0" r="18" fill="none" stroke="${c}" stroke-width="2"/>`, texts: [{ x: 54, y: 0, value: 'I' }] },
    MeterOhm: { half: 18, extent: [34, 74, -20, 20], body: (s, c) => `<circle cx="54" cy="0" r="18" fill="none" stroke="${c}" stroke-width="2"/>`, texts: [{ x: 54, y: 0, value: 'Ω' }] },
    MeterArrow: {
      half: 18,
      extent: [34, 74, -20, 20],
      body: (s, c) => `<circle cx="54" cy="0" r="18" fill="none" stroke="${c}" stroke-width="2"/><path d="M 45,-5.76 L 55.42,0.909" ${s}/><path d="M 61.315,4.682 L 53.964,3.183 L 56.875,-1.366 Z" fill="${c}"/>`
    },
    SourceControlled: {
      half: 18,
      extent: [34, 74, -20, 20],
      body: s => `<path d="M 36,0 L 54,-18 L 72,0 L 54,18 Z" ${s}/>`
    },
    SourceControlledV: {
      half: 18,
      extent: [34, 74, -20, 20],
      body: s => `<path d="M 36,0 L 54,-18 L 72,0 L 54,18 Z M 45,-3.6 L 45,3.6 M 59.4,0 L 66.6,0 M 63,-3.6 L 63,3.6" ${s}/>`
    },
    SourceControlledI: {
      half: 18,
      extent: [34, 74, -20, 20],
      body: (s, c) => `<path d="M 36,0 L 54,-18 L 72,0 L 54,18 Z M 45,0 L 54,0" ${s}/><path d="M 61,0 L 54,2.7 L 54,-2.7 Z" fill="${c}"/>`
    },
    Solar: {
      half: 18,
      extent: [30, 86, -35, 15],
      body: (s, c) => `<circle cx="54" cy="0" r="18" fill="none" stroke="${c}" stroke-width="2"/><path d="M 36,0 L 50.4,0 M 57.6,0 L 72,0 M 50.4,-4.5 L 50.4,4.5 M 57.6,-9.9 L 57.6,9.9" ${s}/><path d="M 75.6,-32.4 L 71.164,-27.964 M 82.8,-25.2 L 78.364,-20.764" ${s}/><path d="M 66.214,-23.014 L 69.255,-29.873 L 73.073,-26.055 Z M 73.414,-15.814 L 76.455,-22.673 L 80.273,-18.855 Z" fill="${c}"/>`
    },
    Neon: {
      half: 18,
      extent: [34, 74, -20, 20],
      body: (s, c) => `<circle cx="54" cy="0" r="18" fill="none" stroke="${c}" stroke-width="2"/><circle cx="45" cy="-7.2" r="1.8" fill="none" stroke="${c}" stroke-width="2"/><path d="M 36,0 L 50.4,0 M 57.6,0 L 72,0 M 50.4,-9 L 50.4,9 M 57.6,-9 L 57.6,9" ${s}/>`
    }
  };
  // Every remaining entry is a glyph drawn centred at x = 54.
  for (const key of Object.keys(twoTerminalParts)) if (!twoTerminalParts[key].form) twoTerminalParts[key].form = 'glyph';

  // Half of an element's thickness. LoopCurrent insets its loop from the four
  // surrounding elements, like Schemdraw's bbox-based calculation.
  function loopHalfExtent(type) {
    if (['Line', 'Wire', 'Gap', 'BusLine', 'DataBusLine'].includes(type)) return 0;
    if (['Source', 'SourceV', 'SourceSin', 'SourceI', 'SourcePulse', 'SourceSquare', 'SourceTriangle',
      'SourceRamp', 'Lamp', 'Lamp2', 'Solar', 'Neon', 'MeterV', 'MeterA', 'MeterI', 'MeterOhm',
      'MeterArrow', 'SourceControlled', 'SourceControlledV', 'SourceControlledI', 'Motor'].includes(type)) return 18;
    const def = twoTerminalParts[type];
    if (def && def.extent) return Math.max(Math.abs(def.extent[2]), Math.abs(def.extent[3]));
    return 9;
  }

  // How far an element extends above / below its centreline. CurrentLabel
  // measures its offset from that edge, like Schemdraw's bbox-based placement.
  function sideExtent(type, options = null) {
    // A line with an arrow head has a bbox expanded by arrowwidth (0.15 unit),
    // which Schemdraw uses when placing its labels.
    if (options && 'arrow' in options && (type === 'Line' || type === 'Wire')) return [5.4, 5.4];
    if (['Line', 'Wire', 'Gap', 'BusLine', 'DataBusLine'].includes(type)) return [0, 0];
    if (type === 'Inductor') return [4.5, 0];
    // Variable resistors carry an arrow whose bbox Schemdraw expands by
    // arrowwidth (0.16). Extents are in px above/below the centreline.
    if (['ResistorVar', 'ResistorVarIEEE', 'ResistorVarIEC'].includes(type)) return [26.76, 23.76];
    if (['Source', 'SourceV', 'SourceSin', 'SourceI', 'SourcePulse', 'SourceSquare', 'SourceTriangle',
      'SourceRamp', 'Lamp', 'Lamp2', 'Solar', 'Neon', 'MeterV', 'MeterA', 'MeterI', 'MeterOhm',
      'MeterArrow', 'SourceControlled', 'SourceControlledV', 'SourceControlledI', 'Motor'].includes(type)) return [18, 18];
    const def = twoTerminalParts[type];
    if (def && def.extent) return [Math.abs(def.extent[2]), Math.abs(def.extent[3])];
    const standalone = standaloneExtent(type);
    if (standalone) return standalone;
    return [9, 9];
  }

  // Local bbox of the parts handled by the generic Element2Term-like label
  // path. Values are px above/below the terminal line and come from
  // Schemdraw 0.23's get_bbox() for the unflipped element.
  function standaloneExtent(type) {
    if (type === 'Zener') return [12.6, 12.6];
    if (type === 'LED') return [35.01, 9];
    if (type === 'Diac') return [18, 18];
    if (['Fuse', 'FuseIEC', 'FuseIEEE'].includes(type)) return [9, 9];
    if (['Battery', 'BatteryCell', 'BatteryDouble'].includes(type)) return [13.5, 13.5];
    if (type === 'SourceI') return [18, 18];
    if (type === 'Breaker') return [11.7, 4.32];
    if (type === 'Motor') return [18, 18];
    if (['BjtNpn2', 'BjtPnp2', 'BjtPnp2c2'].includes(type)) return [28.62, 7.2];
    if (['NMos2', 'PMos2'].includes(type)) return [6, 30];
    if (['NFet2', 'PFet2'].includes(type)) return [49.2, 0];
    if (['JFetN2', 'JFetP2'].includes(type)) return [36, 0];
    return null;
  }

  // Mirror a local bbox (drawing units, y up) the way Schemdraw's
  // Element._flipreverse() mirrors segments: `flip` is about y = 0, `reverse`
  // about the element centre (its `center` anchor, else the bbox centre).
  function reflectBBox(bbox, options = {}, center = null) {
    let { xmin, ymin, xmax, ymax } = bbox;
    if ('reverse' in options) {
      const cx = center == null ? (xmin + xmax) / 2 : center;
      [xmin, xmax] = [2 * cx - xmax, 2 * cx - xmin];
    }
    if ('flip' in options) [ymin, ymax] = [-ymax, -ymin];
    return { xmin, ymin, xmax, ymax };
  }

  // Element._place_label applies flip/reverse to explicit label alignment and
  // to an (x y) offset before positioning the label. Return a copy so the
  // user's label spec is not mutated.
  function reflectLabelHints(label, options = {}) {
    let halign = label.halign, valign = label.valign, ofst = label.ofst;
    if ('flip' in options) {
      if (valign) valign = { top: 'bottom', bottom: 'top' }[valign] || valign;
      if (Array.isArray(ofst)) ofst = [ofst[0], -ofst[1]];
    }
    if ('reverse' in options) {
      if (halign) halign = { left: 'right', right: 'left' }[halign] || halign;
      if (Array.isArray(ofst)) ofst = [-ofst[0], ofst[1]];
    }
    return Object.assign({}, label, { halign, valign, ofst });
  }

  // Port of Element._position_label + _align_label for a local bbox given in
  // drawing units (y up). Returns the anchor in the same local frame plus the
  // alignment that Schemdraw's text_tosvg uses.
  function localLabelPlacement(label, bbox, theta, defaultLoc = 'top', defaultOfst = 0.1, anchors = null) {
    let loc = label.loc || defaultLoc;
    loc = { bot: 'bottom', B: 'bottom', lft: 'left', L: 'left', rgt: 'right', R: 'right', T: 'top' }[loc] || loc;
    const degrees = ((theta % 360) + 360) % 360;
    if (degrees > 90 && degrees <= 270) {
      loc = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[loc] || loc;
    }
    let rotate = label.rotate;
    if (rotate === true) {
      rotate = degrees;
      if (rotate > 90 && rotate < 270) rotate -= 180;
    } else if (typeof rotate === 'number') rotate = ((rotate % 360) + 360) % 360;
    else rotate = 0;
    const { xmin, ymin, xmax, ymax } = bbox;
    let ax, ay, halign, valign;
    let anchorLoc = false;
    if (loc === 'center') {
      ax = (xmin + xmax) / 2;
      ay = (ymin + ymax) / 2;
      halign = 'center';
      valign = 'center';
    } else if (anchors && Object.prototype.hasOwnProperty.call(anchors, loc)) {
      // Schemdraw's _align_label anchor branch: align away from the bbox edge
      // the anchor sits on (abs_tol .15), then turn a scalar ofst into a
      // directional (x, y) offset.
      anchorLoc = true;
      [ax, ay] = anchors[loc];
      const tol = 0.15;
      halign = Math.abs(ax - xmin) <= tol ? 'right' : Math.abs(ax - xmax) <= tol ? 'left' : 'center';
      valign = Math.abs(ay - ymin) <= tol ? 'top' : Math.abs(ay - ymax) <= tol ? 'bottom' : 'center';
    } else if (loc === 'top' || loc === 'bottom' || loc === 'left' || loc === 'right') {
      if (loc === 'top') { ax = (xmin + xmax) / 2; ay = ymax; }
      else if (loc === 'bottom') { ax = (xmin + xmax) / 2; ay = ymin; }
      else if (loc === 'left') { ax = xmin; ay = (ymin + ymax) / 2; }
      else { ax = xmax; ay = (ymin + ymax) / 2; }
      const th = ((degrees - rotate
        + (loc === 'left' ? 90 : loc === 'bottom' ? 180 : loc === 'right' ? 270 : 0)) % 360 + 360) % 360;
      [halign, valign] = [
        ['center', 'bottom'], ['right', 'bottom'], ['right', 'center'], ['right', 'top'],
        ['center', 'top'], ['left', 'top'], ['left', 'center'], ['left', 'bottom']
      ][Math.round(th / 45) % 8];
    } else {
      throw new Error(`Unsupported label location: ${loc}`);
    }
    const ofst = label.ofst == null ? defaultOfst : label.ofst;
    let ox = 0, oy = 0;
    if (Array.isArray(ofst)) { ox = ofst[0]; oy = ofst[1]; }
    else if (loc === 'center') { ox = ofst; oy = ofst; }
    else if (anchorLoc) {
      [ox, oy] = ({
        'center-bottom': [0, ofst], 'right-bottom': [-ofst, ofst], 'right-center': [-ofst, 0],
        'right-top': [-ofst, -ofst], 'center-top': [0, -ofst], 'left-top': [ofst, -ofst],
        'left-center': [ofst, 0], 'left-bottom': [ofst, ofst]
      }[`${halign}-${valign}`] || [0, ofst]);
    }
    else if (loc === 'bottom') oy = -ofst;
    else if (loc === 'left') ox = -ofst;
    else if (loc === 'right') ox = ofst;
    else oy = ofst;
    return {
      x: ax + ox, y: ay + oy, rotate,
      halign: label.halign || halign,
      valign: label.valign || valign
    };
  }

  // Local anchors of a two-terminal element, in the element's unrotated SVG
  // frame (x along the element from start to end, y down). `reverse` mirrors x
  // about the body centre and `sy` is -1 for `flip`, matching the drawing code.
  // Every terminal beyond start/end/center is defined here and nowhere else:
  // `anchor=` placement, the contact dots and the anchors a named block exposes
  // all read this one table, so they cannot drift apart.
  function twoTerminalLocalAnchors(type, length, shiftOffset, sy, options, extra = {}) {
    const bodyCenter = length / 2 + shiftOffset;
    const reverse = 'reverse' in options;
    const mx = lx => reverse ? 2 * bodyCenter - lx : lx;
    const points = Object.create(null);
    points.start = [0, 0];
    points.end = [length, 0];
    points.center = [length / 2, 0];
    const tapH = extra.tapH === undefined ? 0.72 * 36 : extra.tapH;
    const zoom = extra.zoom === undefined ? 1 : extra.zoom;
    const batterySpan = extra.batterySpan || 0;
    const coaxRadius = extra.coaxRadius === undefined ? 10.8 : extra.coaxRadius;
    const coaxLead = extra.coaxLead === undefined ? 21.6 : extra.coaxLead;
    if (['Potentiometer', 'PotentiometerIEC', 'PotentiometerIEEE'].includes(type)) {
      points.tap = [mx(bodyCenter), -tapH * zoom * sy];
    }
    if (type === 'Rshunt') {
      points.v1 = [mx(bodyCenter - 31.5), 18 * sy];
      points.v2 = [mx(bodyCenter + 31.5), 18 * sy];
    }
    if (type === 'SCR') points.gate = [mx(bodyCenter + 17.1), 18 * sy];
    if (type === 'Triac') points.gate = [mx(bodyCenter + 24.3), -18 * sy];
    if (type === 'BatteryDouble') points.tap = [mx(bodyCenter - batterySpan / 2 + 27), -13.5 * sy];
    if (type === 'BjtNpn2' || type === 'BjtPnp2' || type === 'BjtPnp2c2') {
      points.base = [bodyCenter, -28.62 * sy];
      const emitterAtEnd = (type !== 'BjtNpn2') !== reverse;
      points.emitter = emitterAtEnd ? [length, 0] : [0, 0];
      points.collector = emitterAtEnd ? [0, 0] : [length, 0];
      if (type === 'BjtPnp2c2') points.C2 = [bodyCenter + (reverse ? 10.8 : -10.8), 0];
    }
    if (type === 'NMos2' || type === 'PMos2') {
      const gateOffset = (type === 'NMos2' ? 12 : -12) * (reverse ? -1 : 1);
      points.gate = [bodyCenter + gateOffset, 30 * sy];
      const sourceAtBodyEnd = (type === 'NMos2') !== reverse;
      points.source = [sourceAtBodyEnd ? bodyCenter + 30 : bodyCenter - 30, 0];
      points.drain = [sourceAtBodyEnd ? bodyCenter - 30 : bodyCenter + 30, 0];
      points.S = points.source;
      points.D = points.drain;
    }
    if (type === 'NFet2' || type === 'PFet2') {
      const sourceAtEnd = !reverse;
      points.gate = [bodyCenter, -49.2 * sy];
      points.source = sourceAtEnd ? [length, 0] : [0, 0];
      points.drain = sourceAtEnd ? [0, 0] : [length, 0];
      points.S = points.source;
      points.D = points.drain;
      if (extra.bulk) points.bulk = [bodyCenter, 0];
    }
    if (type === 'JFetN2' || type === 'JFetP2') {
      const gateOffset = 9 * (reverse ? -1 : 1);
      points.gate = [bodyCenter + gateOffset, -33 * sy];
      const sourceAtEnd = !reverse;
      points.source = sourceAtEnd ? [length, 0] : [0, 0];
      points.drain = sourceAtEnd ? [0, 0] : [length, 0];
      points.S = points.source;
      points.D = points.drain;
    }
    if (type === 'CurrentMirror' || type === 'VoltageMirror') {
      const offset = type === 'CurrentMirror'
        ? Math.sqrt(0.3 * 0.3 - 0.2 * 0.2) * 36
        : Math.sqrt(1 - 0.2 * 0.2 / (0.3 * 0.3)) * 0.15 * 36;
      points.common = [bodyCenter, -offset * sy];
    }
    if (type === 'SwitchSpdt') {
      const contacts = !('contacts' in options) || options.contacts === 'True';
      const a = contacts ? bodyCenter - 13.68 : bodyCenter - 18;
      const b = contacts ? bodyCenter + 13.68 : bodyCenter + 18;
      points.a = [mx(a), 0];
      points.b = [mx(b), 0];
      points.c = [mx(b), -25.2 * sy];
    }
    if (type === 'SwitchDpst' || type === 'SwitchDpdt') {
      const contacts = options.contacts !== false;
      const dpdt = type === 'SwitchDpdt';
      const pole2 = dpdt ? 50.4 : 36;
      // Contact x offsets from the body centre: Schemdraw puts the dots at
      // sw_dot_r and 1 - sw_dot_r of a 1-unit body, i.e. -13.68 .. +13.68 px
      // around the centre when a lead is added on each side.
      const half = contacts ? 13.68 : 18;
      const ax = off => mx(bodyCenter + off);
      points.p1 = [ax(-half), 0];
      points.t1 = [ax(half), dpdt ? -14.4 * sy : 0];
      if (dpdt) points.t2 = [ax(half), 14.4 * sy];
      points.p2 = [ax(-half), pole2 * sy];
      if (!dpdt) points.t2 = [ax(half), pole2 * sy];
      points.t3 = [ax(half), dpdt ? (pole2 - 14.4) * sy : pole2 * sy];
      if (dpdt) points.t4 = [ax(half), (pole2 + 14.4) * sy];
    }
    if (type === 'MeterArrow') {
      // Source anchors istart/iend are the ends of the 1-unit body.
      points.istart = [bodyCenter - 18, 0];
      points.iend = [bodyCenter + 18, 0];
    }
    if (type === 'Inductor') {
      // Schemdraw's Inductor sets NE/NW at ind_w+coregap and SE/SW at -ind_w
      // (ind_w = 0.25, coregap = 0.12) relative to the body, which spans the
      // middle unit of the element.
      const a = bodyCenter - 18, b = bodyCenter + 18;
      points.NW = [mx(a), -13.32 * sy];
      points.NE = [mx(b), -13.32 * sy];
      points.SW = [mx(a), 9 * sy];
      points.SE = [mx(b), 9 * sy];
    }
    if (type === 'Inductor2') {
      const a = bodyCenter - 18, b = bodyCenter + 18;
      // Schemdraw: NE/NW at ind_w + coregap = 0.62 above the axis in its y-up
      // frame, SE/SW at -ind_w = -0.5. Screen y grows downward, so NE/NW sit at
      // -22.32 px and SE/SW at +18 px.
      points.NW = [mx(a), -22.32 * sy];
      points.NE = [mx(b), -22.32 * sy];
      points.SW = [mx(a), 18 * sy];
      points.SE = [mx(b), 18 * sy];
      points.istart = [a, 0];
      points.iend = [b, 0];
      points.xy = [a, 0];
    }
    if (type === 'Coax') {
      // Schemdraw lists the shield anchors in y-up coordinates: `shieldstart`
      // is below the axis and `shieldstart_top` above it.
      const r = coaxRadius, l = coaxLead;
      points.shieldstart = [mx(l), r * sy];
      points.shieldstart_top = [mx(l), -r * sy];
      points.shieldend = [mx(length - l), r * sy];
      points.shieldend_top = [mx(length - l), -r * sy];
      points.shieldcenter = [mx(length / 2), r * sy];
      points.shieldcenter_top = [mx(length / 2), -r * sy];
    }
    if (type === 'Triax') {
      const L = length, l = extra.triaxLead === undefined ? 21.6 : extra.triaxLead;
      const r1 = extra.triaxR1 === undefined ? 10.8 : extra.triaxR1;
      const r2 = extra.triaxR2 === undefined ? 21.6 : extra.triaxR2;
      const os = extra.triaxOfsStart === undefined ? 10.8 : extra.triaxOfsStart;
      const oe = extra.triaxOfsEnd === undefined ? 10.8 : extra.triaxOfsEnd;
      // Schemdraw's Triax lists `guardstart`/`shieldstart` below the axis.
      points.guardstart = [mx(l), r1 * sy];
      points.guardstart_top = [mx(l), -r1 * sy];
      points.guardend = [mx(L - l), r1 * sy];
      points.guardend_top = [mx(L - l), -r1 * sy];
      points.shieldstart = [mx(l + os), r2 * sy];
      points.shieldstart_top = [mx(l + os), -r2 * sy];
      points.shieldend = [mx(L - l - oe), r2 * sy];
      points.shieldend_top = [mx(L - l - oe), -r2 * sy];
      points.shieldcenter = [mx(L / 2), r2 * sy];
      points.shieldcenter_top = [mx(L / 2), -r2 * sy];
    }
    return points;
  }

  // Ic-derived chips with fixed pin layouts. `slot` is Schemdraw's 'n/count'
  // position along a side; `angle` in degree applies to the whole box.
  const chipDefinitions = {
    VoltageRegulator: {
      w: 2, h: 1.5, lead: .5,
      pins: [
        { side: 'L', name: 'in', slot: '3/3' },
        { side: 'R', name: 'out', slot: '3/3' },
        { side: 'B', name: 'gnd' }
      ]
    },
    DFlipFlop: {
      w: 2, h: 3, lead: .5,
      pins: [
        { side: 'L', name: 'D', slot: '2/2' },
        { side: 'L', clock: true, slot: '1/2' },
        { side: 'R', name: 'Q', slot: '2/2' },
        { side: 'R', name: 'Q', anchor: 'Qbar', overline: true, slot: '1/2' }
      ],
      preclr: [
        { side: 'T', name: 'PRE', invert: true, preclr: true },
        { side: 'B', name: 'CLR', invert: true, preclr: true }
      ]
    },
    JKFlipFlop: {
      w: 2, h: 3, lead: .5,
      pins: [
        { side: 'L', name: 'J', slot: '3/3' },
        { side: 'L', clock: true, slot: '2/3' },
        { side: 'L', name: 'K', slot: '1/3' },
        { side: 'R', name: 'Q', slot: '3/3' },
        { side: 'R', name: 'Q', anchor: 'Qbar', overline: true, slot: '1/3' }
      ],
      preclr: [
        { side: 'T', name: 'PRE', invert: true, preclr: true },
        { side: 'B', name: 'CLR', invert: true, preclr: true }
      ]
    },
    Ic555: {
      w: 3.5, h: 5, lead: 1, spacing: 1.5, label: '555',
      pins: [
        { side: 'L', name: 'TRG', num: '2', slot: '1/3' },
        { side: 'L', name: 'THR', num: '6', slot: '2/3' },
        { side: 'L', name: 'DIS', num: '7', slot: '3/3' },
        { side: 'R', name: 'CTL', num: '5', slot: '1/2' },
        { side: 'R', name: 'OUT', num: '3', slot: '2/2' },
        { side: 'T', name: 'RST', num: '4' },
        { side: 'T', name: 'Vcc', num: '8' },
        { side: 'B', name: 'GND', num: '1' }
      ]
    }
  };


  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // schemdraw/transform.py and Element._place, ported as common primitives
  // -------------------------------------------------------------------------
  // schemdraw works in a y-up frame; fleming emits SVG in a y-down frame, so
  // the rotation angle is negated. Otherwise the order is identical:
  //   (pt + localshift) * zoom -> rotate(theta) -> + shift
  function drawTransform({ theta = 0, shift = [0, 0], localshift = [0, 0], zoom = 1 } = {}) {
    const [zx, zy] = Array.isArray(zoom) ? zoom : [zoom, zoom];
    const a = -theta * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a);
    return ([px, py]) => {
      const x = (px + localshift[0]) * zx;
      const y = (py + localshift[1]) * zy;
      return [x * c - y * sn + shift[0], x * sn + y * c + shift[1]];
    };
  }

  // Element._flipreverse(): flip mirrors about y = 0, reverse about x = center.
  function flipReversePoint([px, py], { flip = false, reverse = false, center = 0 } = {}) {
    return [reverse ? 2 * center - px : px, flip ? -py : py];
  }

  // Element._place(): mirror the local geometry, subtract the anchor, then
  // apply the Transform. `anchor` is a name in `localAnchors` or null.
  function placeElement(localAnchors, origin, options = {}) {
    const { theta = 0, flip = false, reverse = false, center = 0, anchor = null, zoom = 1 } = options;
    const reflected = Object.create(null);
    for (const [key, point] of Object.entries(localAnchors)) {
      reflected[key] = flipReversePoint(point, { flip, reverse, center });
    }
    const shiftPoint = anchor === null ? [0, 0] : reflected[anchor];
    const transform = drawTransform({
      theta,
      shift: origin,
      localshift: [-shiftPoint[0], -shiftPoint[1]],
      zoom
    });
    const anchors = Object.create(null);
    for (const [key, point] of Object.entries(reflected)) anchors[key] = transform(point);
    return {
      transform,
      anchors,
      anchorPoint: shiftPoint,
      // Maps a local point the same way the anchors were mapped.
      put: (point) => transform(flipReversePoint(point, { flip, reverse, center }))
    };
  }

  // Vacuum tube geometry (Schemdraw elements/tubes.py)
  // -------------------------------------------------------------------------
  // tube_w = 1.75, grid_w = tube_w*0.4, grid_ygap = tube_w/9, anode_xgap =
  // tube_w/6, dot_radius = 0.075, n_grid_dashes = 3. Coordinates are built in
  // Schemdraw's frame (y up, anode at y = 0) and flipped on emit.
  const TUBE_W = 1.75 * 36;
  const TUBE_R = TUBE_W / 2;
  const TUBE_GRID_W = TUBE_W * 0.4;
  const TUBE_YGAP = TUBE_W / 9;
  const TUBE_AXGAP = TUBE_W / 6;
  const TUBE_DOT = 0.075 * 36;
  const TUBE_OVERHANG = 20;

  function roundCornersPath(points, radius, close = false) {
    // Port of Schemdraw's segments.roundcorners(); see the DE9 family for the
    // derivation. Points are y-up; the returned path is y-down.
    const up = points.map(([px, py]) => [px, py]);
    const n = up.length;
    const ring = [];
    let rr = radius;
    for (let k = n - 1; k >= 0; k--) {
      const p1 = up[k], p2 = up[(k + n - 1) % n], p3 = up[(k + n - 2) % n];
      const dx1 = p2[0] - p1[0], dy1 = p2[1] - p1[1];
      const dx2 = p2[0] - p3[0], dy2 = p2[1] - p3[1];
      const angle = (Math.atan2(dy1, dx1) - Math.atan2(dy2, dx2)) / 2;
      const tan = Math.abs(Math.tan(angle));
      const len1 = Math.hypot(dx1, dy1), len2 = Math.hypot(dx2, dy2);
      let segment = tan > 1e-9 ? rr / tan : Math.min(len1, len2);
      const length = Math.min(len1, len2);
      if (segment > length) { segment = length; rr = length * tan; }
      if (!(len1 > 0) || !(len2 > 0) || !(segment > 0)) { ring.push([p2[0], p2[1]]); continue; }
      const p1c = [p2[0] - dx1 * (segment / len1), p2[1] - dy1 * (segment / len1)];
      const p2c = [p2[0] - dx2 * (segment / len2), p2[1] - dy2 * (segment / len2)];
      const dx = 2 * p2[0] - p1c[0] - p2c[0];
      const dy = 2 * p2[1] - p1c[1] - p2c[1];
      const L = Math.hypot(dx, dy) || 1;
      const dlen = Math.hypot(segment, rr);
      const cx = p2[0] - dx * (dlen / L), cy = p2[1] - dy * (dlen / L);
      const a0 = Math.atan2(p1c[1] - cy, p1c[0] - cx);
      let a1 = Math.atan2(p2c[1] - cy, p2c[0] - cx);
      while (a1 < a0) a1 += Math.PI * 2;
      for (let s = 0; s < 100; s++) {
        const t = a0 + (a1 - a0) * s / 99;
        ring.push([cx + rr * Math.cos(t), cy + rr * Math.sin(t)]);
      }
    }
    // Schemdraw's roundcorners() appends poly[0] to close the loop; callers
    // that need the exact vertex sequence opt in with close = true.
    if (close && ring.length) ring.push([ring[0][0], ring[0][1]]);
    return ring.map(([px, py], i) => `${i ? 'L' : 'M'} ${px.toFixed(3)},${(-py).toFixed(3)}`).join(' ') + ' Z';
  }

  // One tube drawing in Schemdraw coordinates. Returns polylines (y up),
  // circles and anchors so the renderer can flip and place it.
  // Element.get_bbox(includetext=False), restricted to the tube parts: the
  // reverse centre is the middle of the drawn extent when the element has no
  // `center` anchor.
  function tubeBBox(parts) {
    let xmin = Infinity, xmax = -Infinity;
    for (const line of parts.lines) {
      const pts = line.round ? line.verts : line.pts;
      for (const point of pts || []) {
        xmin = Math.min(xmin, point[0]);
        xmax = Math.max(xmax, point[0]);
      }
    }
    for (const circle of parts.circles) {
      xmin = Math.min(xmin, circle[0] - circle[2]);
      xmax = Math.max(xmax, circle[0] + circle[2]);
    }
    return { xmin, xmax };
  }

  function vacuumTubeParts(spec) {
    const lines = [], circles = [], anchors = Object.create(null);
    const labelHints = Object.create(null);
    const { grids = 1, cathode = 'heated', anodetype = 'plate', heater = true,
      split = 'none', width = TUBE_W, dual = false } = spec;
    const height = spec.height !== undefined ? spec.height
      : Math.max(TUBE_W, TUBE_W + (grids - 4) * TUBE_YGAP);

    // Envelope
    if (split === 'left' || split === 'right') {
      const t1 = split === 'left' ? 90 - TUBE_OVERHANG : 270 - TUBE_OVERHANG;
      // The right-hand arc runs past 360 degrees; without the wrap the sweep
      // goes backwards and draws the wrong side.
      let t2 = split === 'left' ? 270 + TUBE_OVERHANG : 90 + TUBE_OVERHANG;
      if (t2 < t1) t2 += 360;
      const pts = [];
      const steps = 256;
      for (let i = 0; i < steps; i++) {
        const t = (t1 + (t2 - t1) * i / (steps - 1)) * Math.PI / 180;
        pts.push([width / 2 * Math.cos(t), -height / 2 + height / 2 * Math.sin(t)]);
      }
      lines.push({ pts, lw: 2.5 });
    } else {
      const corner = Math.min(width / 2, height / 2);
      lines.push({
        verts: [[-width / 2, 0], [width / 2, 0], [width / 2, -height], [-width / 2, -height]],
        radius: corner, lw: 2.5, round: true
      });
    }
    anchors.N = [0, 0];
    anchors.S = [0, -height];
    anchors.E = [width / 2, -height / 2];
    anchors.W = [-width / 2, -height / 2];
    const sq2 = TUBE_R / Math.SQRT2;
    anchors.NE = [sq2, -TUBE_R + sq2];
    anchors.NW = [-sq2, -TUBE_R + sq2];
    anchors.SE = [sq2, -TUBE_R - sq2];
    anchors.SW = [-sq2, -TUBE_R - sq2];
    // TubeBase._draw_envelope sets the same hints for every tube width.
    labelHints.NE = { ofst: [.12, .12], halign: 'left' };
    labelHints.NW = { ofst: [-.12, .12], halign: 'right' };
    labelHints.SE = { ofst: [.12, -.12], halign: 'left', valign: 'top' };
    labelHints.SW = { ofst: [-.12, -.12], halign: 'right', valign: 'top' };

    const element = (cx, heightOfElement, id) => {
      const gridTop = -heightOfElement / 2 + Math.max(0, grids - 1) * TUBE_YGAP / 2;
      const gridBot = gridTop - TUBE_YGAP * Math.max(0, grids - 1);
      const gridLeft = cx - TUBE_GRID_W / 2, gridRight = cx + TUBE_GRID_W / 2;
      let anodey = gridTop + TUBE_YGAP;

      if (anodetype === 'narrow') {
        lines.push({ pts: [[cx - TUBE_DOT, anodey], [cx + TUBE_DOT, anodey]], lw: 2 });
      } else if (anodetype === 'dot') {
        anodey += TUBE_DOT * 2;
        circles.push([cx, anodey - TUBE_DOT, TUBE_DOT, 2]);
      } else if (anodetype !== 'none') {
        lines.push({ pts: [[gridLeft, anodey], [gridRight, anodey]], lw: 2 });
      }
      if (anodetype !== 'none') {
        lines.push({ pts: [[cx, 0], [cx, anodey]], lw: 2 });
        anchors[`anode${id}`] = [cx, 0];
        labelHints[`anode${id}`] = { ofst: [.1, .1], halign: 'left', valign: 'bottom', fontsize: 11 };
      }

      const dashes = 3;
      const gridXGap = TUBE_GRID_W / (dashes + 2);
      const dashW = (TUBE_GRID_W - gridXGap * (dashes - 1)) / dashes;
      const xs = [];
      for (let i = 0; i < dashes; i++) xs.push(gridLeft + i * (dashW + gridXGap));
      for (let j = 0; j < grids; j++) {
        const gy = gridTop - TUBE_YGAP * j;
        for (const gx of xs) lines.push({ pts: [[gx, gy], [gx + dashW, gy]], lw: 2 });
        if (grids === 1) {
          anchors[`grid${id}`] = [gridLeft - gridXGap, gy];
          anchors[`grid${id}_R`] = [gridRight + gridXGap, gy];
          labelHints[`grid${id}`] = {
            ofst: [(-width / 2 - gridLeft) / 36 + .1, .1],
            halign: 'right', valign: 'bottom', fontsize: 11
          };
          labelHints[`grid${id}_R`] = {
            ofst: [(width / 2 - gridRight) / 36 + .1, .1],
            halign: 'left', valign: 'bottom', fontsize: 11
          };
        } else {
          anchors[`grid${id}_${j + 1}`] = [gridLeft - gridXGap, gy];
          anchors[`grid${id}_${j + 1}R`] = [gridRight + gridXGap, gy];
          labelHints[`grid${id}_${j + 1}`] = {
            ofst: [(-width / 2 - gridLeft) / 36 + .1, .1],
            halign: 'right', valign: 'bottom', fontsize: 11
          };
          labelHints[`grid${id}_${j + 1}R`] = {
            ofst: [(width / 2 - gridRight) / 36 + .1, .1],
            halign: 'left', valign: 'bottom', fontsize: 11
          };
        }
      }

      const catY = gridBot - TUBE_YGAP;
      const catDrop = TUBE_DOT * 2;
      if (cathode === 'cold') {
        lines.push({ pts: [[cx, catY - TUBE_DOT * 2], [cx, -heightOfElement]], lw: 2 });
        circles.push([cx, catY - TUBE_DOT, TUBE_DOT, 2]);
        anchors[`cathode${id}`] = [cx, -heightOfElement];
        labelHints[`cathode${id}`] = { ofst: [.1, -.1], halign: 'left', valign: 'top', fontsize: 11 };
      } else if (cathode !== 'none') {
        lines.push({
          pts: [[gridLeft, catY - catDrop], [gridLeft, catY], [gridRight, catY], [gridRight, catY - catDrop]], lw: 2
        });
        const cathodeHintY = (-heightOfElement - (catY - catDrop)) / 36;
        anchors[`cathode${id}`] = [gridLeft, catY - catDrop];
        anchors[`cathode${id}_R`] = [gridRight, catY - catDrop];
        labelHints[`cathode${id}`] = { ofst: [-.1, cathodeHintY], halign: 'right', valign: 'top', fontsize: 11 };
        labelHints[`cathode${id}_R`] = { ofst: [.1, cathodeHintY], halign: 'left', valign: 'top', fontsize: 11 };
      }
      return catY;
    };

    if (dual) {
      const w2 = TUBE_W * 1.5;
      const left = -w2 * 0.2, right = w2 * 0.2;
      const c1 = element(left, height, 'A');
      const c2 = element(right, height, 'B');
      if (heater) heat(Math.min(c1, c2), height);
    } else {
      const catY = element(0, height, '');
      if (heater) heat(catY, height);
    }

    function heat(catY, h) {
      const heatTop = catY - TUBE_YGAP * 1.25;
      const heatLeft = -TUBE_GRID_W / 3.5, heatRight = TUBE_GRID_W / 3.5;
      const heatBot = -h - TUBE_YGAP;
      const bend = heatTop - Math.SQRT2 * heatRight;
      lines.push({
        pts: [[heatLeft, heatBot], [heatLeft, bend], [0, heatTop], [heatRight, bend], [heatRight, heatBot]], lw: 2
      });
      anchors.heat1 = [heatLeft, heatBot];
      anchors.heat2 = [heatRight, heatBot];
      labelHints.heat1 = { ofst: [-.1, 0], halign: 'right', valign: 'bottom', fontsize: 11 };
      labelHints.heat2 = { ofst: [.1, 0], halign: 'left', valign: 'bottom', fontsize: 11 };
    }

    return { lines, circles, anchors, labelHints, height, width };
  }

  function nixieTubeParts(spec) {
    const { anodes = 3, cathode = 'T', anodetype = 'narrow', grid = false } = spec;
    const lines = [], circles = [];
    const anchors = Object.create(null);
    const labelHints = Object.create(null);
    const height = TUBE_W;
    const width = Math.max(TUBE_W, (anodes - 1) * TUBE_AXGAP + TUBE_W);
    lines.push({
      verts: [[-width / 2, 0], [width / 2, 0], [width / 2, -height], [-width / 2, -height]],
      radius: Math.min(width / 2, height / 2), lw: 2.5, round: true
    });
    anchors.N = [0, 0]; anchors.S = [0, -height];
    anchors.E = [width / 2, -height / 2]; anchors.W = [-width / 2, -height / 2];
    const sq2 = TUBE_R / Math.SQRT2;
    anchors.NE = [sq2, -TUBE_R + sq2]; anchors.NW = [-sq2, -TUBE_R + sq2];
    anchors.SE = [sq2, -TUBE_R - sq2]; anchors.SW = [-sq2, -TUBE_R - sq2];

    const anodeW = (anodes - 1) * TUBE_AXGAP;
    if (grid) {
      const dashes = anodes + 1;
      const xgap = anodeW / (dashes + 2);
      const dashW = (anodeW - xgap * (dashes - 1)) / dashes;
      const gy = -TUBE_W / 2;
      for (let i = 0; i < dashes; i++) {
        const gx = -anodeW / 2 + i * (dashW + xgap);
        lines.push({ pts: [[gx, gy], [gx + dashW, gy]], lw: 2 });
      }
      anchors.grid = [-anodeW / 2 - xgap, gy];
      anchors.grid_R = [anodeW / 2 + xgap, gy];
      labelHints.grid = { ofst: [(-width / 2 + anodeW / 2) / 36, .1], halign: 'right', valign: 'bottom', fontsize: 11 };
      labelHints.grid_R = { ofst: [(width / 2 - anodeW / 2) / 36, .1], halign: 'left', valign: 'bottom', fontsize: 11 };
    }

    const anodeY = -TUBE_W / 4;
    for (let i = 0; i < anodes; i++) {
      const ax = -anodeW / 2 + i * TUBE_AXGAP;
      if (anodetype === 'dot') circles.push([ax, anodeY - TUBE_DOT, TUBE_DOT, 2]);
      else lines.push({ pts: [[ax - TUBE_DOT, anodeY], [ax + TUBE_DOT, anodeY]], lw: 2 });
      lines.push({ pts: [[ax, 0], [ax, anodeY]], lw: 2 });
      anchors[`anode${i}`] = [ax, 0];
      labelHints[`anode${i}`] = { ofst: [-.1, .1], halign: 'right', valign: 'bottom', fontsize: 11 };
    }

    const catY = -3 * TUBE_W / 4;
    if (cathode === 'cold') {
      lines.push({ pts: [[0, catY - TUBE_DOT * 2], [0, -TUBE_W]], lw: 2 });
      circles.push([0, catY - TUBE_DOT, TUBE_DOT, 2]);
      anchors.cathode = [0, -TUBE_W];
    } else if (cathode === 'heated') {
      lines.push({
        pts: [[-TUBE_GRID_W / 2, catY - TUBE_DOT], [-TUBE_GRID_W / 2, catY],
        [TUBE_GRID_W / 2, catY], [TUBE_GRID_W / 2, catY - TUBE_DOT]], lw: 2
      });
      anchors.cathode = [-TUBE_GRID_W / 2, catY - TUBE_DOT];
      anchors.cathode_R = [TUBE_GRID_W / 2, catY - TUBE_DOT];
    } else if (cathode !== 'none') {
      lines.push({ pts: [[0, -TUBE_W], [0, catY]], lw: 2 });
      lines.push({ pts: [[-anodeW / 2, catY], [anodeW / 2, catY]], lw: 2 });
      anchors.cathode = [0, -TUBE_W];
    }
    return { lines, circles, anchors, labelHints, height, width };
  }

  const componentDefinitions = {
    BjtNpn: {
      transistor: true,
      anchors: { base: [0, 0], xy: [0, 0], collector: [27.06, -25.08], emitter: [27.06, 25.08], center: [27.06, 0] },
      defaultDrop: 'collector',
      reverseCenter: 27.06,
      extent: [-2, 31, -29, 29],
      segments: [
        { path: 'M 0,0 L 13.2,0 M 13.2,-13.2 L 13.2,13.2 M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08 M 13.2,6.6 L 27.06,18.48 L 27.06,25.08 M 13.2,6.6 L 20.227,12.623', filled: false },
        { path: 'M 25.541,17.178 L 17.884,15.356 L 22.57,9.89 Z', filled: true }
      ]
    },
    // Schottky-clamped BJTs: the NPN / PNP glyph plus two small clamp hooks on
    // the base bar (Schemdraw's `NpnSchottky` / `PnpSchottky`, z = 0.1 units).
    NpnSchottky: {
      transistor: true,
      extendable: true,
      anchors: { base: [0, 0], xy: [0, 0], collector: [27.06, -25.08], emitter: [27.06, 25.08], center: [27.06, 0] },
      defaultDrop: 'collector',
      reverseCenter: 27.06,
      extent: [-2, 31, -29, 29],
      segments: [
        { path: 'M 0,0 L 13.2,0 M 13.2,-13.2 L 13.2,13.2 M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08 M 13.2,6.6 L 27.06,18.48 L 27.06,25.08 M 13.2,6.6 L 20.227,12.623', filled: false },
        { path: 'M 25.541,17.178 L 17.884,15.356 L 22.57,9.89 Z', filled: true },
        { path: 'M 13.2,-13.2 L 13.2,-16.8 L 16.8,-16.8 L 16.8,-13.2', filled: false },
        { path: 'M 13.2,13.2 L 13.2,16.8 L 9.6,16.8 L 9.6,13.2', filled: false }
      ]
    },
    PnpSchottky: {
      transistor: true,
      extendable: true,
      anchors: { base: [0, 0], xy: [0, 0], collector: [27.06, 25.08], emitter: [27.06, -25.08], center: [27.06, 0] },
      defaultDrop: 'emitter',
      reverseCenter: 27.06,
      extent: [-2, 31, -29, 29],
      segments: [
        { path: 'M 0,0 L 13.2,0 M 13.2,-13.2 L 13.2,13.2 M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08 M 13.2,6.6 L 27.06,18.48 L 27.06,25.08 M 27.06,-18.48 L 20.033,-12.457', filled: false },
        { path: 'M 14.719,-7.902 L 17.69,-15.19 L 22.376,-9.724 Z', filled: true },
        { path: 'M 13.2,-13.2 L 13.2,-16.8 L 9.6,-16.8 L 9.6,-13.2', filled: false },
        { path: 'M 13.2,13.2 L 13.2,16.8 L 16.8,16.8 L 16.8,13.2', filled: false }
      ]
    },
    BjtPnp: {
      transistor: true,
      anchors: { base: [0, 0], xy: [0, 0], collector: [27.06, 25.08], emitter: [27.06, -25.08], center: [27.06, 0] },
      defaultDrop: 'emitter',
      reverseCenter: 27.06,
      extent: [-2, 31, -29, 29],
      segments: [
        { path: 'M 0,0 L 13.2,0 M 13.2,-13.2 L 13.2,13.2 M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08 M 13.2,6.6 L 27.06,18.48 L 27.06,25.08 M 27.06,-18.48 L 20.033,-12.457', filled: false },
        { path: 'M 14.719,-7.902 L 17.69,-15.19 L 22.376,-9.724 Z', filled: true }
      ]
    },
    BjtPnp2c: {
      transistor: true,
      anchors: { base: [0, 0], xy: [0, 0], collector: [27.06, 25.08], emitter: [27.06, -25.08], center: [27.06, 0], C2: [27.06, 9.48] },
      defaultDrop: 'emitter',
      reverseCenter: 27.06,
      extent: [-2, 31, -29, 29],
      segments: [
        { path: 'M 0,0 L 13.2,0 M 13.2,-13.2 L 13.2,13.2 M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08 M 13.2,6.6 L 27.06,18.48 L 27.06,25.08 M 27.06,-18.48 L 20.033,-12.457 M 13.2,-2.4 L 27.06,9.48', filled: false },
        { path: 'M 14.719,-7.902 L 17.69,-15.19 L 22.376,-9.724 Z', filled: true }
      ]
    },
    IgbtN: {
      transistor: true,
      anchors: { base: [2.4, 10.5], xy: [0, 0], collector: [27.06, -25.08], emitter: [27.06, 25.08], center: [27.06, 0] },
      defaultDrop: 'collector',
      reverseCenter: 27.06,
      extent: [-2, 31, -29, 29],
      segments: [
        { path: 'M 13.2,-13.2 L 13.2,13.2 M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08 M 13.2,6.6 L 27.06,18.48 L 27.06,25.08 M 13.2,6.6 L 20.227,12.623', filled: false },
        { path: 'M 7.8,-10.5 L 7.8,10.5 L 2.4,10.5', filled: false },
        { path: 'M 25.541,17.178 L 17.884,15.356 L 22.57,9.89 Z', filled: true }
      ]
    },
    IgbtP: {
      transistor: true,
      anchors: { base: [2.4, -10.5], xy: [0, 0], collector: [27.06, 25.08], emitter: [27.06, -25.08], center: [27.06, 0] },
      defaultDrop: 'emitter',
      reverseCenter: 27.06,
      extent: [-2, 31, -29, 29],
      segments: [
        { path: 'M 13.2,-13.2 L 13.2,13.2 M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08 M 13.2,6.6 L 27.06,18.48 L 27.06,25.08 M 27.06,-18.48 L 20.033,-12.457', filled: false },
        { path: 'M 2.4,-10.5 L 7.8,-10.5 L 7.8,10.5', filled: false },
        { path: 'M 14.719,-7.902 L 17.69,-15.19 L 22.376,-9.724 Z', filled: true }
      ]
    },
    NpnPhoto: {
      transistor: true,
      anchors: { base: [0, 0], xy: [0, 0], collector: [27.06, -25.08], emitter: [27.06, 25.08], center: [27.06, 0] },
      defaultDrop: 'collector',
      reverseCenter: 27.06,
      extent: [-10, 31, -29, 29],
      segments: [
        { path: 'M 13.2,-13.2 L 13.2,13.2 M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08 M 13.2,6.6 L 27.06,18.48 L 27.06,25.08 M 13.2,6.6 L 20.227,12.623', filled: false },
        { path: 'M -3.6,-13.2 L 2.565,-8.816 M -3.6,-4.2 L 2.565,0.184', filled: false },
        { path: 'M 8.27,-4.759 L 0.479,-5.882 L 4.652,-11.75 Z M 8.27,4.241 L 0.479,3.118 L 4.652,-2.75 Z', filled: true },
        { path: 'M 25.541,17.178 L 17.884,15.356 L 22.57,9.89 Z', filled: true }
      ]
    },
    PnpPhoto: {
      transistor: true,
      anchors: { base: [0, 0], xy: [0, 0], collector: [27.06, 25.08], emitter: [27.06, -25.08], center: [27.06, 0] },
      defaultDrop: 'emitter',
      reverseCenter: 27.06,
      extent: [-10, 31, -29, 29],
      segments: [
        { path: 'M 13.2,-13.2 L 13.2,13.2 M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08 M 13.2,6.6 L 27.06,18.48 L 27.06,25.08 M 27.06,-18.48 L 20.033,-12.457', filled: false },
        { path: 'M -3.6,-13.2 L 2.565,-8.816 M -3.6,-4.2 L 2.565,0.184', filled: false },
        { path: 'M 8.27,-4.759 L 0.479,-5.882 L 4.652,-11.75 Z M 8.27,4.241 L 0.479,3.118 L 4.652,-2.75 Z', filled: true },
        { path: 'M 14.719,-7.902 L 17.69,-15.19 L 22.376,-9.724 Z', filled: true }
      ]
    },
    AnalogNFet: {
      transistor: true,
      analog: true,
      anchors: { source: [0, 60], drain: [0, 0], gate: [33, 42], center: [0, 30], xy: [0, 0] },
      defaultDrop: 'source',
      reverseCenter: 0,
      extent: [-36, 36, -2, 62],
      segments: []
    },
    AnalogPFet: {
      transistor: true,
      analog: true,
      anchors: { source: [0, 0], drain: [0, 60], gate: [33, 18], center: [0, 30], xy: [0, 0] },
      defaultDrop: 'drain',
      reverseCenter: 0,
      extent: [-36, 36, -2, 62],
      segments: []
    },
    AnalogBiasedFet: {
      transistor: true,
      analog: true,
      anchors: { source: [0, 60], drain: [0, 0], gate: [33, 42], center: [0, 30], xy: [0, 0] },
      defaultDrop: 'source',
      reverseCenter: 0,
      extent: [-36, 36, -2, 62],
      segments: []
    },
    // Untyped BJT and JFET (Schemdraw's `Bjt` / `JFet`). Same geometry as the
    // NPN / JFetN shapes without the emitter arrow, plus an optional circle.
    Bjt: {
      transistor: true,
      extendable: true,
      anchors: { base: [0, 0], collector: [27.06, -25.08], emitter: [27.06, 25.08], center: [27.06, 0], xy: [0, 0] },
      defaultDrop: 'emitter',
      reverseCenter: 27.06,
      extent: [-2, 31, -29, 29],
      segments: [
        { path: 'M 0,0 L 13.2,0 M 13.2,-13.2 L 13.2,13.2 M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08 M 13.2,6.6 L 27.06,18.48 L 27.06,25.08', filled: false }
      ]
    },
    // HEMT (Schemdraw `Hemt`). The gate bar is drawn split or solid, and the
    // source lead carries an arrow whose direction depends on `source_arrow`.
    Hemt: {
      transistor: true,
      extendable: true,
      hemt: true,
      // Schemdraw: source is at the top (local 0,0) and drain at the bottom
      // (local 0,-1.5 units); the glyph below is in screen coordinates.
      anchors: { source: [0, 0], drain: [0, 54], gate: [43.2, 27], center: [0, 27], xy: [0, 0] },
      defaultDrop: 'source',
      reverseCenter: 0,
      extent: [-2, 45, -2, 56],
      segments: []
    },
    JFet: {
      transistor: true,
      extendable: true,
      anchors: { source: [0, 48], drain: [0, 0], gate: [33, 33], center: [0, 24], xy: [0, 0] },
      defaultDrop: 'gate',
      reverseCenter: 0,
      // The optional circle (centre 9,24 r 26.4) reaches x -17.4..35.4, y -2.4..50.4.
      extent: [-19, 37, -4, 52],
      segments: [
        { path: 'M 0,0 L 0,15 L 18,15 L 18,10.2 L 18,37.8 L 18,33 L 0,33 L 0,48 M 18,33 L 33,33', filled: false }
      ]
    },
    JFetN: {
      transistor: true,
      anchors: { source: [0, 48], drain: [0, 0], gate: [33, 33], center: [0, 24], xy: [0, 0] },
      defaultDrop: 'gate',
      reverseCenter: 0,
      // The optional circle (centre 9,24 r 26.4) reaches x -17.4..35.4, y -2.4..50.4.
      extent: [-19, 37, -4, 52],
      segments: [
        { path: 'M 0,0 L 0,15 L 18,15 L 18,10.2 L 18,37.8 L 18,33 L 0,33 L 0,48 M 18,33 L 33,33 M 21.6,33 L 19.8,33', filled: false },
        { path: 'M 26.8,33 L 19.8,36.6 L 19.8,29.4 Z', filled: true }
      ]
    },
    JFetP: {
      transistor: true,
      anchors: { source: [0, 48], drain: [0, 0], gate: [33, 33], center: [0, 24], xy: [0, 0] },
      defaultDrop: 'gate',
      reverseCenter: 0,
      // The optional circle (centre 9,24 r 26.4) reaches x -17.4..35.4, y -2.4..50.4.
      extent: [-19, 37, -4, 52],
      segments: [
        { path: 'M 0,0 L 0,15 L 18,15 L 18,10.2 L 18,37.8 L 18,33 L 0,33 L 0,48 M 18,33 L 33,33', filled: false },
        { path: 'M 20,33 L 27,29.4 L 27,36.6 Z', filled: true }
      ]
    },
    NFet: {
      transistor: true,
      anchors: { source: [0, 54], drain: [0, 0], gate: [49.2, 27], center: [0, 27], xy: [0, 0] },
      defaultDrop: 'source',
      reverseCenter: 0,
      extent: [-2, 51, -2, 56],
      segments: [
        { path: 'M 0,0 L 0,15 L 24,15 L 24,39 L 0,39 L 0,54 M 30,15 L 30,39 M 30,27 L 49.2,27', filled: false }
      ]
    },
    PFet: {
      transistor: true,
      anchors: { source: [0, 0], drain: [0, 54], gate: [49.2, 27], center: [0, 27], xy: [0, 0] },
      defaultDrop: 'drain',
      reverseCenter: 0,
      extent: [-2, 51, -2, 56],
      segments: [
        { path: 'M 0,0 L 0,15 L 24,15 L 24,39 L 0,39 L 0,54 M 30,15 L 30,39 M 38.4,27 L 49.2,27', filled: false },
        { circle: [34.2, 27, 4.2] }
      ]
    },
    NMos: {
      transistor: true,
      anchors: { drain: [0, 0], gate: [-30, 42], center: [0, 30], source: [0, 60], xy: [0, 0] },
      defaultDrop: 'source',
      reverseCenter: 0,
      extent: [-32, 2, -2, 62],
      segments: [
        { path: 'M -9,19.5 L -9,22.5 M -9,28.5 L -9,31.5 M -9,37.5 L -9,40.5 M 0,21 L 0,0 M -9,21 L 0,21 M 0,60 L 0,39 M -9,39 L 0,39 M -30,42 L -15,42 M -15,42 L -15,18 M -3,30 L 0,30 M 0,30 L 0,39', filled: false },
        { path: 'M -7,30 L -3,27 L -3,33 Z', filled: true }
      ]
    },
    PMos: {
      transistor: true,
      anchors: { source: [0, 0], gate: [-30, 18], center: [0, 30], drain: [0, 60], xy: [0, 0] },
      defaultDrop: 'drain',
      reverseCenter: 0,
      extent: [-32, 2, -2, 62],
      segments: [
        { path: 'M -9,19.5 L -9,22.5 M -9,28.5 L -9,31.5 M -9,37.5 L -9,40.5 M 0,21 L 0,0 M -9,21 L 0,21 M 0,60 L 0,39 M -9,39 L 0,39 M -30,18 L -15,18 M -15,18 L -15,42 M -9,30 L -6,30 M 0,30 L 0,21', filled: false },
        { path: 'M -2,30 L -6,33 L -6,27 Z', filled: true }
      ]
    },
    Dot: { anchors: { start: [0, 0], center: [0, 0], end: [0, 0], xy: [0, 0] }, radius: 2.7 },
    Opamp: lead => ({
      // Schemdraw Opamp anchors (opamp.py): oa_back=2.5, oa_xlen=oa_back*√3/2,
      // leadlen=oa_back/4. `lead` is the local x offset of the triangle.
      anchors: {
        in1: [0, -22.5],
        in2: [0, 22.5],
        out: [45 * Math.sqrt(3) + 2 * lead, 0],
        center: [lead + 45 * Math.sqrt(3) / 2, 0],
        vd: [lead + 45 * Math.sqrt(3) / 3, -0.84 * 36],
        vs: [lead + 45 * Math.sqrt(3) / 3, 0.84 * 36],
        n1: [lead + 45 * Math.sqrt(3) * 2 / 3, 0.42 * 36],
        n2: [lead + 45 * Math.sqrt(3) * 2 / 3, -0.42 * 36],
        n1a: [lead + 45 * Math.sqrt(3) * 0.9, 0.13 * 36],
        n2a: [lead + 45 * Math.sqrt(3) * 0.9, -0.13 * 36]
      },
      defaultDrop: 'out'
    })
  };

  // Digital logic gates ported from schemdraw/logic/logic.py. Multi-input
  // gates (And/Or family) start at the input-lead origin; Buf/Not/Tgate use
  // schemdraw's Element2Term layout, a 3-unit (108 px) span with the body at
  // its center. Anchors and default drops match schemdraw 0.23.
  const logicGateTypes = new Set([
    'And', 'Nand', 'Or', 'Nor', 'Xor', 'Xnor', 'Buf', 'Not', 'NotNot',
    'Tgate', 'Tristate', 'Schmitt', 'SchmittNot', 'SchmittAnd', 'SchmittNand'
  ]);
  const logicMultiInputTypes = new Set([
    'And', 'Nand', 'Or', 'Nor', 'Xor', 'Xnor', 'SchmittAnd', 'SchmittNand'
  ]);

  function buildLogicGate(type, options) {
    const px = 36, bubble = 0.12 * px, gatel = 0.65 * px;
    const gateNumber = (key, fallback) => {
      if (!(key in options)) return fallback;
      if (typeof options[key] !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key])) throw new Error(`${key} must be a non-negative number.`);
      const value = Number(options[key]);
      if (!Number.isFinite(value) || value < 0) throw new Error(`${key} must be a non-negative number.`);
      return value * px;
    };
    const gateBool = (key, fallback) => {
      if (!(key in options)) return fallback;
      if (!['True', 'False'].includes(options[key])) throw new Error(`${key} must be True or False.`);
      return options[key] === 'True';
    };
    let inputs = 2;
    if (logicMultiInputTypes.has(type) && 'inputs' in options) {
      if (typeof options.inputs !== 'string' || !/^\d+$/.test(options.inputs)) throw new Error('inputs must be an integer of at least 2.');
      inputs = Number(options.inputs);
      if (!Number.isSafeInteger(inputs) || inputs < 2 || inputs > 16) throw new Error('inputs must be an integer between 2 and 16.');
    }
    const inputnots = [];
    if ('inputnots' in options) {
      if (!logicMultiInputTypes.has(type)) throw new Error(`inputnots is not supported for ${type}.`);
      if (typeof options.inputnots !== 'string') throw new Error('inputnots must use the form [1] or [1 3].');
      const match = /^\[([^\]]*)\]$/.exec(options.inputnots);
      if (!match) throw new Error('inputnots must use the form [1] or [1 3].');
      const parts = match[1].split(/[\s,]+/).filter(Boolean);
      for (const part of parts) {
        if (!/^\d+$/.test(part)) throw new Error('inputnots entries must be integers of at least 1 separated by spaces or commas.');
        const value = Number(part);
        if (value < 1 || value > inputs) throw new Error(`inputnots entry ${value} is outside the range 1 to ${inputs}.`);
        if (inputnots.includes(value)) throw new Error(`inputnots entry ${value} is duplicated.`);
        inputnots.push(value);
      }
    }
    const segs = [], anchors = Object.create(null);
    const path = points => points.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(4)},${y.toFixed(4)}`).join(' ');
    const addInputs = (leadinPx, dyPx, xbackFor) => {
      const backlen = inputs > 3 ? dyPx * (inputs - 1) : 0;
      for (let i = 0; i < inputs; i++) {
        const y = -(i + 1 - (inputs / 2 + 0.5)) * dyPx;
        const name = `in${inputs - i}`;
        anchors[name] = [0, y];
        const xback = xbackFor(y, leadinPx);
        if (inputnots.includes(inputs - i)) {
          segs.push({ circle: [xback - bubble, y, bubble], filled: false });
          if (xback - 2 * bubble > 0) segs.push({ path: `M 0,${y.toFixed(4)} L ${(xback - 2 * bubble).toFixed(4)},${y.toFixed(4)}`, filled: false });
        } else if (xback > 0) {
          segs.push({ path: `M 0,${y.toFixed(4)} L ${xback.toFixed(4)},${y.toFixed(4)}`, filled: false });
        }
      }
      return backlen;
    };
    if (['And', 'Nand', 'SchmittAnd', 'SchmittNand'].includes(type)) {
      const leadin = gateNumber('leadin', 0.35 * px), leadout = gateNumber('leadout', 0.35 * px);
      const rad = 0.5 * px, nand = type === 'Nand' || type === 'SchmittNand';
      const bodyRight = leadin + gatel + rad, out = bodyRight + leadout;
      const theta = linspace(-Math.PI / 2, Math.PI / 2, 50);
      const points = theta.map(t => [leadin + gatel + rad * Math.cos(t), -rad * Math.sin(t)]);
      points.push([leadin + gatel, -rad], [leadin, -rad], [leadin, 0], [leadin, rad], [leadin + gatel, rad]);
      segs.push({ path: path(points), filled: false });
      if (nand) segs.push({ circle: [bodyRight + bubble, 0, bubble], filled: false });
      if (nand) {
        if (out > bodyRight + 2 * bubble) segs.push({ path: `M ${(bodyRight + 2 * bubble).toFixed(4)},0 L ${out.toFixed(4)},0`, filled: false });
      } else if (out > bodyRight) {
        segs.push({ path: `M ${bodyRight.toFixed(4)},0 L ${out.toFixed(4)},0`, filled: false });
      }
      const dy = inputs === 2 ? 0.5 * px : inputs === 3 ? 0.33 * px : 0.4 * px;
      const backlen = addInputs(leadin, dy, (y, li) => li);
      if (inputs > 3) {
        const bar = backlen / 2 + dy / 2;
        segs.push({ path: `M ${leadin.toFixed(4)},${(-bar).toFixed(4)} L ${leadin.toFixed(4)},${bar.toFixed(4)}`, filled: false });
      }
      if (type === 'SchmittAnd' || type === 'SchmittNand') {
        const xofst = leadin + gatel / 2;
        segs.push({ path: `M ${(xofst + 2.52).toFixed(4)},5.4 L ${(xofst + 9).toFixed(4)},5.4 L ${(xofst + 9).toFixed(4)},-5.4 M ${(xofst + 11.88).toFixed(4)},-5.4 L ${(xofst + 5.4).toFixed(4)},-5.4 L ${(xofst + 5.4).toFixed(4)},5.4`, filled: false });
      }
      anchors.out = [out, 0];
      anchors.end = [out, 0];
      anchors.center = [out / 2, 0];
      anchors.xy = [0, 0];
      const ys = Object.keys(anchors).filter(key => /^in\d+$/.test(key)).map(key => anchors[key][1]);
      const extent = [-2, out + 2, Math.min(-rad, ...ys) - 2, Math.max(rad, ...ys) + 2];
      return { anchors, segments: segs, extent, defaultDrop: 'out', reverseCenter: (extent[0] + extent[1]) / 2 };
    }
    if (['Or', 'Nor', 'Xor', 'Xnor'].includes(type)) {
      const leadin = gateNumber('leadin', 0.35 * px), leadout = gateNumber('leadout', 0.35 * px);
      const nor = type === 'Nor' || type === 'Xnor', xor = type === 'Xor' || type === 'Xnor';
      const gatelU = 0.65, orflatU = 0.5, xorgapU = 0.15;
      const xs0 = linspace(0, gatelU + 0.05, 50);
      const ys0 = xs0.map(x => x * x);
      const ymax = Math.max(...ys0);
      let ys = ys0.map(y => y - ymax);
      ys = [Math.min(...ys), ...ys];
      let xs = [0, ...xs0.map(x => x + orflatU)];
      let y2 = linspace(Math.min(...ys), -Math.min(...ys), 50);
      let x2 = y2.map(y => -y * y);
      const back = Math.min(...x2);
      x2 = x2.map(x => x - back);
      // The body keeps the full `leadin`; only the input stubs are shortened
      // by xorgap for XOR gates (Schemdraw's Xor does `_leadin -= xorgap`).
      const leadinU = leadin / px;
      const leadinEffU = leadinU - (xor ? xorgapU : 0);
      xs = xs.map(x => x + leadinU);
      x2 = x2.map(x => x + leadinU);
      const tipU = Math.max(...xs), orheightU = Math.abs(Math.min(...ys));
      const points = [];
      for (let i = 0; i < xs.length; i++) points.push([xs[i] * px, -ys[i] * px]);
      for (let i = xs.length - 1; i >= 0; i--) points.push([xs[i] * px, ys[i] * px]);
      for (let i = x2.length - 1; i >= 0; i--) points.push([x2[i] * px, -y2[i] * px]);
      segs.push({ path: path(points), filled: false });
      if (xor) segs.push({ path: path(x2.map((x, i) => [(x - xorgapU) * px, -y2[i] * px])), filled: false });
      const tip = tipU * px, orheight = orheightU * px;
      if (nor) segs.push({ circle: [tip + bubble, 0, bubble], filled: false });
      const out = tip + leadout;
      if (nor) {
        if (out > tip + 2 * bubble) segs.push({ path: `M ${(tip + 2 * bubble).toFixed(4)},0 L ${out.toFixed(4)},0`, filled: false });
      } else if (out > tip) {
        segs.push({ path: `M ${tip.toFixed(4)},0 L ${out.toFixed(4)},0`, filled: false });
      }
      const leadinEff = leadinEffU * px;
      const dy = inputs === 2 ? 0.5 * px : inputs === 3 ? 0.33 * px : 0.4 * px;
      const backlen = addInputs(leadinEff, dy, (y, li) => {
        if (inputs > 3 && Math.abs(y) > orheight) return li;
        return li - (y * y) / px - back * px;
      });
      if (inputs > 3) {
        const bar = backlen / 2 + dy / 2;
        segs.push({ path: `M ${leadinEff.toFixed(4)},${(-bar).toFixed(4)} L ${leadinEff.toFixed(4)},${(-orheight).toFixed(4)}`, filled: false });
        segs.push({ path: `M ${leadinEff.toFixed(4)},${bar.toFixed(4)} L ${leadinEff.toFixed(4)},${orheight.toFixed(4)}`, filled: false });
      }
      anchors.out = [out, 0];
      anchors.end = [out, 0];
      anchors.center = [out / 2, 0];
      anchors.xy = [0, 0];
      const ysAll = Object.keys(anchors).filter(key => /^in\d+$/.test(key)).map(key => anchors[key][1]);
      const extent = [-2, out + 2, Math.min(-orheight, ...ysAll) - 2, Math.max(orheight, ...ysAll) + 2];
      return { anchors, segments: segs, extent, defaultDrop: 'out', reverseCenter: (extent[0] + extent[1]) / 2 };
    }
    if (type === 'Buf' || type === 'Not' || type === 'NotNot' || type === 'Schmitt' || type === 'SchmittNot') {
      const isNot = type === 'Not' || type === 'SchmittNot';
      const isNotNot = type === 'NotNot';
      const inX = isNot ? 37.98 : 42.3;
      const outX = isNot ? 70.02 : isNotNot ? 74.34 : 65.7;
      const tipX = isNot ? 61.38 : 65.7;
      segs.push({ path: `M 0,0 L ${(isNotNot ? 33.66 : inX).toFixed(2)},0 M ${outX.toFixed(2)},0 L 108,0`, filled: false });
      segs.push({ path: `M ${inX.toFixed(2)},-18 L ${tipX.toFixed(2)},0 L ${inX.toFixed(2)},18 Z`, filled: false });
      if (isNot) segs.push({ circle: [65.7, 0, 4.32], filled: false });
      if (isNotNot) {
        segs.push({ circle: [70.02, 0, 4.32], filled: false });
        segs.push({ circle: [70.02, 0, 4.32], filled: false });
        segs.push({ circle: [37.98, 0, 4.32], filled: false });
      }
      if (type === 'Schmitt') segs.push({ path: 'M 44.82,5.4 L 51.3,5.4 L 51.3,-5.4 M 54.18,-5.4 L 47.7,-5.4 L 47.7,5.4', filled: false });
      if (type === 'SchmittNot') segs.push({ path: 'M 40.5,5.4 L 46.98,5.4 L 46.98,-5.4 M 49.86,-5.4 L 43.38,-5.4 L 43.38,5.4', filled: false });
      Object.assign(anchors, {
        start: [0, 0], end: [108, 0], center: [54, 0], in1: [inX, 0], out: [outX, 0], xy: [inX, 0]
      });
      return { anchors, segments: segs, extent: [-2, 110, -22, 22], defaultDrop: 'end', reverseCenter: 54 };
    }
    if (type === 'Tgate') {
      segs.push({ path: 'M 0,0 L 42.3,0 M 65.7,0 L 108,0', filled: false });
      segs.push({ path: 'M 42.3,0 L 42.3,18 L 65.7,0 L 42.3,-18 Z', filled: false });
      segs.push({ path: 'M 65.7,0 L 65.7,18 L 42.3,0 L 65.7,-18 Z', filled: false });
      segs.push({ circle: [54, -12.96, 2.88], filled: false });
      segs.push({ path: 'M 54,-15.84 L 54,-25.2', filled: false });
      segs.push({ path: 'M 54,10.08 L 54,25.2', filled: false });
      Object.assign(anchors, {
        start: [0, 0], end: [108, 0], center: [54, 0], in1: [42.3, 0], out: [65.7, 0],
        c: [54, 25.2], cbar: [54, -25.2], xy: [42.3, 0]
      });
      return { anchors, segments: segs, extent: [-2, 110, -30, 30], defaultDrop: 'end', reverseCenter: 54 };
    }
    if (type === 'Tristate') {
      const outputnot = gateBool('outputnot', true), controlnot = gateBool('controlnot', false);
      const inX = outputnot ? 37.98 : 42.3;
      const outX = outputnot ? 70.02 : 74.34;
      const tipX = outputnot ? 61.38 : 65.7;
      const ctlX = outputnot ? 49.68 : 54;
      segs.push({ path: `M 0,0 L ${inX},0 M ${tipX},0 L 108,0`, filled: false });
      segs.push({ path: `M ${inX},-18 L ${tipX},0 L ${inX},18 Z`, filled: false });
      if (outputnot) segs.push({ circle: [65.7, 0, 4.32], filled: false });
      if (controlnot) {
        segs.push({ circle: [ctlX, -15.12, 4.32], filled: false });
        segs.push({ path: `M ${ctlX},-19.44 L ${ctlX},-25.2`, filled: false });
      } else {
        segs.push({ path: `M ${ctlX},-10.08 L ${ctlX},-25.2`, filled: false });
      }
      Object.assign(anchors, {
        start: [0, 0], end: [108, 0], center: [54, 0], in1: [inX, 0], out: [outX, 0],
        c: [ctlX, -25.2], xy: [inX, 0]
      });
      return { anchors, segments: segs, extent: [-2, 110, -30, 30], defaultDrop: 'end', reverseCenter: 54 };
    }
    throw new Error(`Unsupported logic gate: ${type}`);
  }

  function renderPathSegments(segments, color, stroke) {
    return segments.map(segment => segment.circle
      ? `<circle cx="${segment.circle[0]}" cy="${segment.circle[1]}" r="${segment.circle[2]}" fill="${segment.filled ? color : 'none'}" stroke="${color}" stroke-width="2"/>`
      : segment.filled
        ? `<path d="${segment.path}" fill="${color}" stroke="${color}"/>`
        : `<path d="${segment.path}" ${stroke}/>`).join('');
  }

  // CSS named colors also accepted by Schemdraw's color validator.
  const namedColors = new Set(('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen').split(' '));

  function readColor(value) {
    if (typeof value !== 'string') throw new Error('color must be a color name or hexadecimal color.');
    const color = value.toLowerCase();
    if (!namedColors.has(color) && !/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(color)) throw new Error(`Unsupported or invalid color: ${value}`);
    return color;
  }

  // Heuristics for a line that is probably the tail of the previous component:
  // an unpaired quote, an argument keyword without `component:`, or a lone direction.
  function breakErrorSignal(line) {
    const raw = line.replace(/\\\\|\\"|\\'/g, '');
    const double = (raw.match(/"/g) || []).length;
    const single = (raw.match(/'/g) || []).length;
    if (double % 2 || single % 2) return true;
    // Any argument-looking line (key=value or a bare flag such as `right`)
    // after a component without a trailing comma.
    if (/^[A-Za-z_]\w*\s*=/.test(line)) return true;
    if (/^[a-z_]\w*$/.test(line)) return true;
    return false;
  }

  // A `#` outside a double-quoted value starts a comment that runs to the end
  // of the physical line. It is recognised at the start of a line or directly
  // after whitespace or an argument boundary, so an unquoted hexadecimal colour
  // such as `color=#0000ff` is not cut.
  const commentBoundary = /[\s{}\[\](),:;"]/;
  function stripInlineComment(text) {
    let quoted = false, escaped = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') quoted = false;
        continue;
      }
      if (ch === '"') { quoted = true; continue; }
      if (ch === '#' && (i === 0 || commentBoundary.test(text[i - 1]))) return text.slice(0, i).trimEnd();
    }
    return text;
  }

  // Walk a physical line outside quotes, tracking escapes and bracket depth.
  // `visit(char, index, depth)` is called for every character outside quotes.
  function scanFlemingLine(text, visit) {
    let quote = null, escaped = false, depth = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quote !== null) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"') { quote = ch; continue; }
      if (ch === '[' || ch === '(') { depth++; visit && visit(ch, i, depth); continue; }
      if (ch === ']' || ch === ')') { depth = Math.max(0, depth - 1); visit && visit(ch, i, depth); continue; }
      visit && visit(ch, i, depth);
    }
    return { quote, depth };
  }

  // Index of a comma that ends the line at bracket depth 0, or -1.
  function trailingTopLevelComma(text) {
    let last = null;
    let lastIndex = -1;
    const { quote } = scanFlemingLine(text, (ch, index, depth) => {
      if (!/\s/.test(ch)) { last = { ch, depth }; lastIndex = index; }
    });
    if (quote !== null) return -1;
    return last && last.ch === ',' && last.depth === 0 ? lastIndex : -1;
  }

  function stripCharacters(text, index, count = 1) {
    return (text.slice(0, index) + text.slice(index + count)).trimEnd();
  }

  // A physical line after a continuation comma must be an argument line, not
  // a new component, block, directive, or closing brace.
  function isContinuationBoundary(text) {
    return text === '}' ||
      text.startsWith('@') ||
      /^circuit\s*\{$/.test(text) ||
      /^[A-Za-z_]\w*\s*\{$/.test(text) ||
      /^[A-Za-z_]\w*\s*:/.test(text);
  }

  // Combine physical lines while they end with a top-level comma. Comments and
  // blank lines are skipped while a continuation is open. A trailing comma
  // before '}' is accepted as the final comma and removed.
  function buildLogicalLines(physical) {
    const result = [];
    for (let i = 0; i < physical.length; i++) {
      const start = physical[i];
      if (!start.text || start.text.startsWith('#')) { result.push(start); continue; }
      let text = start.text;
      let endNumber = start.number;
      let comma = trailingTopLevelComma(text);
      while (comma >= 0) {
        const colon = text.indexOf(':');
        if (colon < 0 || !text.slice(colon + 1, comma).trim()) {
          throw new Error(`Line ${start.number}: a comma needs an argument before it.`);
        }
        let next = null;
        for (let j = i + 1; j < physical.length; j++) {
          if (physical[j].text && !physical[j].text.startsWith('#')) { next = { ...physical[j], index: j }; break; }
        }
        if (!next) throw new Error(`Line ${endNumber}: comma at the end of a line has no continuation.`);
        if (next.text === '}') { text = stripCharacters(text, comma); break; }
        if (next.text.startsWith(',')) throw new Error(`Line ${next.number}: a continuation line cannot start with a comma.`);
        if (isContinuationBoundary(next.text)) {
          throw new Error(`Line ${endNumber}: a comma at the end of a line is only allowed before '}' or when the next line contains arguments.`);
        }
        text = `${stripCharacters(text, comma)} ${next.text}`;
        endNumber = next.number;
        i = next.index;
        comma = trailingTopLevelComma(text);
      }
      result.push({ text, number: start.number, endNumber });
    }
    return result;
  }

  // Arguments whose value is a keyword of the grammar, not free text. They are
  // written without quotes (`leads=True`), and only one spelling is accepted so
  // that the notation stays learnable. Inside `label`, `loc`/`halign`/`valign`/
  // `color` follow the same rule (`loc=bot`, not `loc="bot"`).
  const BOOLEAN_WORD_ARGS = new Set([
    'leads', 'lead', 'flip', 'reverse', 'hold', 'idot', 'dot', 'polar', 'core',
    'circle', 'diode', 'bulk', 'sign', 'open', 'contacts', 'nc', 'link', 'notch',
    'number', 'shownumber', 'cathode', 'anode'
  ]);

  function quotedValueError(key, value) {
    return new Error(`${key} takes a keyword, not a quoted string: write ${key}=${value} instead of ${key}="${value}".`);
  }

  // `label="'x' loc="bot""` cannot work: the inner quotes close the label text
  // early. Detect `loc="`/`halign="`/... after a `label=` on the line so the
  // caller can explain the keyword spelling rule instead of a bare parse error.
  // Escaped forms (`loc=\"bot\"`) keep the backslash and are reported later.
  function earlyQuotedKeyword(input) {
    const start = input.indexOf('label=');
    if (start < 0) return null;
    const after = input.slice(start);
    for (const key of ['loc', 'halign', 'valign', 'color', 'ofst', 'rotate', 'fontsize']) {
      const at = after.indexOf(key + '="');
      if (at < 0) continue;
      const rest = after.slice(at + key.length + 2);
      const end = rest.indexOf('"');
      return { key, value: end < 0 ? '' : rest.slice(0, end) };
    }
    return null;
  }

  // Replace top-level commas with spaces and reject empty arguments
  // (`Type:,`, `right,,`, leading commas). Commas inside quotes or brackets
  // are left for the value parsers, which report a specific error.
  function normalizeArguments(input, label) {
    let out = '', segment = '', quote = null, escaped = false, depth = 0, hadComma = false;
    const flush = () => {
      if (!segment.trim()) throw new Error(`Line ${label}: empty argument around a comma.`);
      segment = '';
    };
    for (const ch of input) {
      if (quote !== null) {
        out += ch; segment += ch;
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"') { quote = ch; out += ch; segment += ch; continue; }
      if (ch === '[' || ch === '(') { depth++; out += ch; segment += ch; continue; }
      if (ch === ']' || ch === ')') { depth = Math.max(0, depth - 1); out += ch; segment += ch; continue; }
      if (ch === ',' && depth === 0) { flush(); hadComma = true; out += ' '; continue; }
      out += ch; segment += ch;
    }
    if (hadComma) flush();
    return out;
  }

  function parse(source, subs = null) {
    if (typeof source !== 'string') throw new TypeError('source must be a string.');
    // Physical lines are joined into logical lines while they end with a
    // top-level comma. A component still occupies exactly one logical line.
    const logical = buildLogicalLines(source.split(/\r?\n/).map((s, i) => ({ text: stripInlineComment(s).trim(), number: i + 1 })))
      .filter(s => s.text && !s.text.startsWith('#'));
    if (!/^circuit\s*\{$/.test(logical.shift()?.text || '')) throw new Error('Specify exactly one circuit { ... } block.');
    const breakError = (label, detail) =>
      new Error(`Line ${label}: line break error. ${detail}`);
    const records = [], frames = [];
    let closed = false, previousLabel = null;
    for (const { text: line, number, endNumber } of logical) {
      const lineLabel = number === endNumber ? String(number) : `${number}–${endNumber}`;
      if (closed) throw new Error('Unexpected input after the circuit block.');
      if (line.startsWith(',')) throw new Error(`Line ${lineLabel}: a line cannot start with a comma.`);
      if (line === '}') {
        const frame = frames.pop();
        if (!frame) closed = true;
        else if (frame.kind === 'hold') records.push({ type: '__hold_end' });
        else if (frame.count !== 1) throw new Error(`Named block ${frame.name} must contain exactly one component.`);
        continue;
      }
      const named = /^([A-Za-z_]\w*)\s*\{$/.exec(line);
      if (named) {
        if (named[1] === 'hold') {
          if (frames.some(frame => frame.kind === 'name')) throw new Error('A hold block cannot be placed inside a named block.');
          frames.push({ kind: 'hold' }); records.push({ type: '__hold_start' });
        } else {
          if (frames.some(frame => frame.kind === 'name')) throw new Error('Nested named blocks are not supported.');
          frames.push({ kind: 'name', name: named[1], count: 0 });
        }
        continue;
      }
      const match = /^([A-Za-z_]\w*)\s*:\s*(.*)$/.exec(line);
      if (!match) {
        // Text that belongs to a previous component's argument list was split
        // off by a line break, e.g. `label="'x'` / `loc='bot'"` or a bare `left`
        // on its own line after `and: at="A.out"`.
        if (breakErrorSignal(line)) throw breakError(lineLabel, `This line looks like a continuation of the previous component${previousLabel ? ` (line ${previousLabel})` : ''}. Add a comma at the end of the previous line to continue it.`);
        if (line.startsWith(';')) throw new Error(`Line ${lineLabel}: syntax error. \`;\` is not used in fleming notation; separate arguments with whitespace or commas.`);
        throw new Error(`Line ${lineLabel}: cannot parse component declaration: ${line}`);
      }
      const args = [], input = normalizeArguments(match[2], lineLabel);
      // Bare values end at whitespace, except inside brackets or parentheses,
      // so list values such as inputnots=[1 3] keep their inner spaces.
      const token = /\s*([A-Za-z_]\w*)(?:\s*=\s*(?:"((?:\\\\|\\"|[^"\\\r\n]|\\(?!["\\]))*)"|(\[[^\[\]\r\n]*\]|\([^()\r\n]*\)|[^\s]+)))?/gy;
      while (token.lastIndex < input.length) {
        const at = token.lastIndex, m = token.exec(input);
        if (!m || token.lastIndex === at) {
          const rest = input.slice(at).trim();
          // `;` is not part of the grammar: fleming has no statement terminator.
          if (rest.startsWith(';')) throw new Error(`Line ${lineLabel}: syntax error. \`;\` is not used in fleming notation; separate arguments with whitespace or commas.`);
          // A quoted label argument that broke at an inner `"` is reported with the
          // keyword spelling rule rather than as a generic parse failure.
          // `label="'x' loc="bot""` lets the inner quotes close the label text
          // early; report the keyword spelling rule instead of a bare parse error.
          const quotedLabelArg = earlyQuotedKeyword(input);
          if (quotedLabelArg) throw new Error(
            `Line ${lineLabel}: label arguments take keywords, not quoted strings (write ${quotedLabelArg.key}=${quotedLabelArg.value}, not ${quotedLabelArg.key}="${quotedLabelArg.value}").`);
          throw new Error(`Line ${lineLabel}: cannot parse arguments: ${rest}`);
        }
        let value = m[2], quoted = m[2] !== undefined;
        if (value === undefined) {
          if (m[3] === undefined) {
            args.push({ key: m[1], value: undefined });
            continue;
          }
          value = m[3];
          for (const [open, close] of [['[', ']'], ['(', ')']]) {
            if (!value.startsWith(open)) continue;
            let depth = 0, closed = false;
            for (let i = 0; i < value.length; i++) {
              if (value[i] === open) depth++;
              else if (value[i] === close && --depth === 0) {
                if (i !== value.length - 1) throw new Error(`Mismatched argument parentheses: ${value}`);
                closed = true;
                break;
              }
            }
            if (!closed) throw new Error(`Unclosed argument parenthesis: ${value}`);
          }
        } else {
          value = value.replace(/\\\\|\\"/g, s => s === '\\"' ? '"' : s);
        }
        args.push(quoted ? { key: m[1], value, quoted: true } : { key: m[1], value });
      }
      const namedFrame = frames.find(frame => frame.kind === 'name');
      if (namedFrame) namedFrame.count++;
      const sub = Boolean(subs && Object.prototype.hasOwnProperty.call(subs, match[1]));
      records.push({ type: match[1], name: namedFrame ? namedFrame.name : null, args, sub });
      previousLabel = lineLabel;
    }
    if (!closed || frames.length) throw new Error('Missing closing brace for a block.');
    if (!records.some(record => !record.type.startsWith('__hold_') && !['config', 'move', 'move_from', 'print'].includes(record.type))) throw new Error('Specify at least one component.');
    return records;
  }

  function readLength(value, unit) {
    if (/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value || '')) {
      const result = Number(value) * 36;
      if (!Number.isFinite(result) || result <= 0) throw new Error(`Invalid length: ${value}`);
      return result;
    }
    // Schemdraw expressions such as `d.unit/4`, `d.unit*2`, `d.unit/2*3`,
    // `1.5*d.unit`, or `d.unit+.6`.
    const text = (value || '').replace(/\s+/g, '');
    const check = result => {
      if (!Number.isFinite(result) || result <= 0) throw new Error(`Unsupported length expression: ${value}`);
      return result;
    };
    const scaled = /^(\d*\.?\d+)\*d\.unit$/.exec(text);
    if (scaled) return check(Number(scaled[1]) * unit);
    const offset = /^d\.unit([+-])(\d*\.?\d+)$/.exec(text);
    if (offset) {
      const delta = Number(offset[2]) * 36;
      return check(offset[1] === '+' ? unit + delta : unit - delta);
    }
    const m = /^d\.unit(?:([*/])(\d*\.?\d+))?(?:([*/])(\d*\.?\d+))?$/.exec(text);
    if (!m) throw new Error(`Unsupported length expression: ${value}`);
    let result = unit;
    for (const [op, raw] of [[m[1], m[2]], [m[3], m[4]]]) {
      if (op === undefined) continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0) throw new Error(`Unsupported length expression: ${value}`);
      result = op === '/' ? result / n : result * n;
    }
    return check(result);
  }

  // Drawing.move uses signed drawing-unit offsets, not SVG coordinates.
  function readMove(value, unit) {
    if (typeof value !== 'string') throw new Error('Move coordinates must be a number or d.unit expression.');
    const match = /^([+-]?)(?:(\d+(?:\.\d*)?|\.\d+)|d\.unit(?:\s*\/\s*(\d+(?:\.\d+)?))?)$/.exec(value);
    if (!match) throw new Error(`Unsupported move coordinate: ${value}`);
    const divisor = match[3] === undefined ? 1 : Number(match[3]);
    if (!Number.isFinite(divisor) || divisor <= 0) throw new Error(`Invalid move coordinate: ${value}`);
    const result = (match[2] === undefined ? unit / divisor : Number(match[2]) * 36) * (match[1] === '-' ? -1 : 1);
    if (!Number.isFinite(result)) throw new Error(`Invalid move coordinate: ${value}`);
    return result;
  }

  // Safe arithmetic for move/move_from coordinates, as in schemdraw's
  // `d.move_from(xy, dy=-(A1.out.y-A2.out.y)/2)`. Supports numbers, d.unit,
  // named anchor coordinates (`A1.out.y`), + - * / and parentheses. No eval().
  function readCoordinateExpression(value, unit, refs) {
    if (typeof value !== 'string') throw new Error('Move coordinates must be a number or an expression.');
    const source = value.replace(/\s+/g, '');
    let index = 0;
    const fail = () => { throw new Error(`Unsupported move coordinate: ${value}`); };
    const parseExpr = () => {
      let result = parseTerm();
      while (source[index] === '+' || source[index] === '-') {
        const op = source[index++];
        const rhs = parseTerm();
        result = op === '+' ? result + rhs : result - rhs;
      }
      return result;
    };
    const parseTerm = () => {
      let result = parseFactor();
      while (source[index] === '*' || source[index] === '/') {
        const op = source[index++];
        const rhs = parseFactor();
        if (op === '/') {
          if (rhs === 0) fail();
          result /= rhs;
        } else result *= rhs;
      }
      return result;
    };
    const parseFactor = () => {
      if (source[index] === '-') { index++; return -parseFactor(); }
      if (source[index] === '+') { index++; return parseFactor(); }
      if (source[index] === '(') {
        index++;
        const inner = parseExpr();
        if (source[index] !== ')') fail();
        index++;
        return inner;
      }
      const number = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(source.slice(index));
      if (number) {
        index += number[0].length;
        return Number(number[0]);
      }
      const identifier = /^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+/.exec(source.slice(index));
      if (identifier) {
        index += identifier[0].length;
        if (identifier[0] === 'd.unit') return unit / 36;
        if (!Object.prototype.hasOwnProperty.call(refs, identifier[0])) fail();
        return refs[identifier[0]];
      }
      return fail();
    };
    const result = parseExpr();
    if (index !== source.length || !Number.isFinite(result)) fail();
    return result * 36;
  }

  function readLabel(value) {
    if (value === undefined) throw new Error('A label value is required.');
    if (value.startsWith('[')) {
      let rest = value.slice(1).trim();
      const items = [];
      while (rest && rest[0] !== ']') {
        const match = /^'((?:[^'\\]|\\.)*)'/.exec(rest);
        if (!match) throw new Error(`Invalid list label: ${value}`);
        items.push(match[1].replace(/\\(['\\n])/g, (m, c) => c === 'n' ? '\n' : c));
        rest = rest.slice(match[0].length);
        if (rest.startsWith(']')) break;
        const separator = /^\s+/.exec(rest);
        if (!separator) throw new Error(`List label entries must be separated by whitespace, not commas: ${value}`);
        rest = rest.slice(separator[0].length);
      }
      if (!items.length || !rest.startsWith(']')) throw new Error(`Invalid list label: ${value}`);
      // Schemdraw gives each label() call its own loc, list labels included.
      const label = { items, loc: null, halign: null, ofst: null };
      return readLabelArgs(label, rest.slice(1), value);
    }
    if (!value.startsWith("'")) return { text: value, loc: null, halign: null, ofst: null };
    const text = /^'((?:[^'\\]|\\.)*)'/.exec(value);
    if (!text) throw new Error(`Invalid label argument: ${value}`);
    const label = { text: text[1].replace(/\\(['\\n])/g, (m, c) => c === 'n' ? '\n' : c), loc: null, halign: null, ofst: null };
    return readLabelArgs(label, value.slice(text[0].length), value);
  }

  // Parse the arguments that may follow a label's text, e.g. `loc='bot'`.
  function readLabelArgs(label, rest, value) {    const seen = new Set();
    let word = null;
    while (rest) {
      const separator = /^\s+/.exec(rest);
      if (!separator) throw new Error(`Invalid label argument: ${value}`);
      rest = rest.slice(separator[0].length);
      if (!rest) {
        break;
      }
      if (/^ofst\s*=\s*\([^)]*,/.test(rest)) throw new Error(`Invalid label offset: separate x and y with whitespace, not a comma: ${value}`);
      const arg = /^(loc|halign|valign|color)\s*=\s*(?:'([\w#]+)'|([\w#]+))|^(ofst)\s*=\s*\(\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\)|^(ofst|rotate|fontsize)\s*=\s*(True|False|[+-]?(?:\d+(?:\.\d*)?|\.\d+))/.exec(rest);
      if (!arg) throw new Error(`Invalid label argument: ${value}`);
      // `loc`, `halign`, `valign` and `color` take a keyword: `loc=bot`, never `loc="bot"`.
      const quotedValue = /^(loc|halign|valign|color)\s*=\s*"([\w#]+)"/.exec(rest);
      if (quotedValue) throw quotedValueError(quotedValue[1], quotedValue[2]);
      // `ofst=(x y)` keeps its key in group 4; the keyword/number forms use 1 or 7.
      const key = arg[4] ? 'ofst' : arg[1] || arg[7];
      // `loc=left` without quotes reads like a bare keyword inside the label value.
      // Quoted values land in group 2, unquoted ones in group 3, numbers in group 8.
      word = arg[2] !== undefined ? arg[2] : arg[3] !== undefined ? arg[3] : arg[8];
      if (seen.has(key)) throw new Error(`Duplicate label argument: ${key}`);
      seen.add(key);
      if (key === 'loc') {
        // Schemdraw's _position_label accepts these aliases. `bottom` is kept
        // as its own spelling (not folded into `bot`), so that what the caller
        // wrote survives validation and the angle swap in _position_label.
        const locAlias = { bot: 'bot', B: 'bot', lft: 'left', L: 'left', rgt: 'right', R: 'right', T: 'top' }[word] || word;
        if (!['top', 'bot', 'bottom', 'left', 'right', 'start', 'end', 'istart', 'iend', 'base', 'collector', 'emitter', 'center', 'C2', 'gate', 'source', 'drain', 'bulk', 'name', 'in1', 'in2', 'out', 'c', 'cbar', 'display', 'vd', 'vs', 'n1', 'n2', 'n1a', 'n2a', 'a', 'b'].includes(locAlias) && !/^in\d+$/.test(locAlias) && !/^p\d+(?:_in)?$/.test(locAlias) && !/^(?:N|S|E|W|NE|NW|SE|SW)$/.test(locAlias)) throw new Error(`Invalid label location: ${word}`);
        label.loc = locAlias;
      } else if (key === 'halign') {
        if (!['left', 'center', 'right'].includes(word)) throw new Error(`Invalid label alignment: ${word}`);
        label.halign = word;
      } else if (key === 'valign') {
        // `bot` is the same shorthand accepted by `loc`.
        const valign = word === 'bot' ? 'bottom' : word;
        if (!['top', 'center', 'bottom'].includes(valign)) throw new Error(`Invalid label alignment: ${word}`);
        label.valign = valign;
      } else if (key === 'color') {
        label.color = readColor(word);
      } else if (key === 'fontsize') {
        label.fontsize = Number(arg[8]);
        if (!Number.isFinite(label.fontsize) || label.fontsize <= 0) throw new Error('label fontsize must be a finite positive number.');
      } else if (key === 'ofst') {
        // `ofst=(x y)` fills groups 5–6; a bare number fills group 8.
        if (arg[5] !== undefined) label.ofst = [Number(arg[5]), Number(arg[6])];
        else {
          if (arg[8] === 'True' || arg[8] === 'False') throw new Error(`Invalid label offset: ${value}`);
          label.ofst = Number(arg[8]);
        }
        if (!(Array.isArray(label.ofst) ? label.ofst.every(Number.isFinite) : Number.isFinite(label.ofst))) throw new Error(`Invalid label offset: ${value}`);
      } else {
        label.rotate = arg[8] === 'True' ? true : arg[8] === 'False' ? false : Number(arg[8]);
        if (typeof label.rotate === 'number' && !Number.isFinite(label.rotate)) throw new Error(`Invalid label rotation: ${value}`);
      }
      rest = rest.slice(arg[0].length);
    }
    return label;
  }

  // LaTeX commands accepted inside `$...$`. Only the handful of symbols that
  // schemdraw's examples use are translated; anything else is an error.
  const mathGreek = {
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', zeta: 'ζ', eta: 'η',
    theta: 'θ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π',
    rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
    Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ',
    Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω'
  };
  const mathSymbols = {
    pm: '±', mp: '∓', times: '×', cdot: '·', div: '÷', le: '≤', leq: '≤', ge: '≥', geq: '≥',
    ne: '≠', neq: '≠', approx: '≈', infty: '∞', degree: '°', circ: '°', ang: '∠',
    int: '∫', sum: '∑', prod: '∏', partial: '∂'
  };

  // Unicode digits for numeric sub/superscripts, as in Schemdraw's
  // svgtext.mathtextsvg. Other scripts are shifted with `dy`, because
  // baseline-shift is ignored by Chromium-based renderers.
  const superscriptDigits = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const subscriptDigits = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };

  // Render `$...$`: sub/superscripts and a few Greek/symbol commands.
  function mathContent(math, source) {
    // `\overline{X}` becomes an overlined tspan, as in schemdraw's svgtext.
    // The argument is rendered recursively; other markup inside is allowed.
    const overline = /\\overline\{([^{}]*)\}/g;
    let out = '', last = 0, match;
    const renderSegment = (segment) => {
      if (segment === '') return '';
      const text = segment.replace(/\\([A-Za-z]+)/g, (cmd, name) => {
        if (Object.prototype.hasOwnProperty.call(mathGreek, name)) return mathGreek[name];
        if (Object.prototype.hasOwnProperty.call(mathSymbols, name)) return mathSymbols[name];
        throw new Error(`Unsupported math command in label: ${cmd}`);
      });
      // `=` is a plain character in Schemdraw's mathtext; do not add operator spacing.
      if (!/^(?:[A-Za-z0-9Ωμµ+ .,()\-−≤≥≠≈∞±∓×·÷°∠∫∑∏∂=]|[\^_](?:\{[A-Za-z0-9+\-−=]+\}|[A-Za-z0-9]))+$/.test(text)) {
        throw new Error(`Unsupported math label: ${source}`);
      }
      // A script is either a braced group or a single character.
      const script = (mark, content) => {
        const table = mark === '^' ? superscriptDigits : subscriptDigits;
        if (/^[0-9]+$/.test(content)) return [...content].map(c => table[c]).join('');
        const up = mark === '^';
        // dy is supported everywhere; the zero-width tspan restores the
        // baseline so following text is not shifted as well.
        return `<tspan dy="${up ? '-0.4em' : '0.3em'}" font-size="70%">${escapeText(content)}</tspan>`
          + `<tspan dy="${up ? '0.4em' : '-0.3em'}">\u200b</tspan>`;
      };
      const isScript = i => (text[i] === '^' || text[i] === '_') && i + 1 < text.length;
      let rendered = '';
      for (let i = 0; i < text.length;) {
        if (isScript(i)) {
          if (text[i + 1] === '{') {
            const end = text.indexOf('}', i + 2);
            rendered += script(text[i], text.slice(i + 2, end));
            i = end + 1;
          } else {
            rendered += script(text[i], text[i + 1]);
            i += 2;
          }
          continue;
        }
        let end = i + 1;
        while (end < text.length && !isScript(end)) end++;
        rendered += escapeText(text.slice(i, end));
        i = end;
      }
      return rendered;
    };
    while ((match = overline.exec(math))) {
      out += renderSegment(math.slice(last, match.index));
      out += `<tspan text-decoration="overline">${renderSegment(match[1])}</tspan>`;
      last = match.index + match[0].length;
    }
    out += renderSegment(math.slice(last));
    return out;
  }

  // A label may mix plain text and `$...$` math, and may contain newlines.
  function labelContent(text) {
    let out = '';
    let index = 0;
    while (index < text.length) {
      const start = text.indexOf('$', index);
      if (start === -1) { out += escapeText(text.slice(index)); break; }
      if (start > index) out += escapeText(text.slice(index, start));
      const end = text.indexOf('$', start + 1);
      if (end === -1) { out += escapeText(text.slice(start)); break; }
      out += mathContent(text.slice(start + 1, end), text);
      index = end + 1;
    }
    return out;
  }

  // Split a `<text>` element holding newlines into one tspan per line.
  function expandMultiline(svg) {
    return svg.replace(/<text ([^>]*)>([\s\S]*?)<\/text>/g, (match, attrs, body) => {
      if (body.indexOf('\n') === -1) return match;
      const x = /\bx="([^"]*)"/.exec(attrs);
      if (!x) return match;
      const size = /\bfont-size="([^"]*)"/.exec(attrs);
      const step = size ? size[1] : '14';
      // A single tspan wrapper (baseline shift) keeps its attributes on the
      // first line; later lines reuse the x and the line height.
      const wrapped = /^<tspan ([^>]*)>([\s\S]*)<\/tspan>$/.exec(body);
      // Multi-line blocks align like schemdraw: labels above an element end at
      // the anchor, labels beside it are centred on it, labels below grow down.
      const lineCount = (wrapped ? wrapped[2] : body).split('\n').length;
      if (lineCount > 1) {
        const shift = /dominant-baseline="ideographic"/.test(attrs)
          ? (lineCount - 1) * Number(step)
          : /dominant-baseline="hanging"/.test(attrs)
            ? 0
            : (lineCount - 1) * Number(step) / 2 + 5;
        if (shift) attrs = attrs.replace(/\by="([^"]*)"/, (m, v) => `y="${Number(v) - shift}"`);
      }
      if (wrapped && wrapped[2].indexOf('<tspan') === -1) {
        const spans = wrapped[2].split('\n')
          .map((line, i) => i === 0
            ? `<tspan ${wrapped[1]}>${line}</tspan>`
            : `<tspan x="${x[1]}" dy="${step}">${line}</tspan>`)
          .join('');
        return `<text ${attrs}>${spans}</text>`;
      }
      const spans = body.split('\n')
        .map((line, i) => `<tspan x="${x[1]}" dy="${i ? step : 0}">${line}</tspan>`)
        .join('');
      return `<text ${attrs}>${spans}</text>`;
    });
  }

  // ---- Signal processing elements (schemdraw/dsp/dsp.py, flow.Box) --------
  // The dsp module is not a separate registry in Schemdraw: its symbols are
  // stand-alone glyphs with compass anchors. They are built here in drawing
  // units with y up (Schemdraw's local frame) and emitted as SVG in pixels
  // with y down, like the other single-point symbols.
  const DSP_TYPES = new Set(['Box', 'Square', 'Circle', 'Sum', 'SumSigma', 'Mixer',
    'Amp', 'OscillatorBox', 'Oscillator', 'Filter', 'Adc', 'Dac', 'Demod',
    'Circulator', 'Isolator', 'VGA',
    // dsp.Speaker is the single-piece speaker; `Speaker` is already taken by
    // elements.Speaker (the two-terminal one), so the module name disambiguates.
    'dsp_Speaker']);

  // dsp._makesine(): 20 samples of -sin(x)/10 over [-pi, pi], mapped to
  // x = 0.2 … 0.8.
  const dspSine = linspace(-Math.PI, Math.PI, 20).map(t => [t / Math.PI * 0.3 + 0.5, -Math.sin(t) / 10]);

  // Element._place_label for a stand-alone dsp symbol: the anchor is a point
  // of the local bbox (or a named anchor), `ofst` is added in local
  // coordinates, and the alignment comes from the rotated `rotalign` table.
  function dspLabelPosition(label, spec, theta) {
    const { bbox, anchors } = spec;
    let loc = label.loc || spec.defaultLoc;
    if (loc === 'bot') loc = 'bottom';
    // Element._position_label keeps top/bottom and left/right on the same
    // visual side for elements pointing down or left.
    const degrees = ((theta % 360) + 360) % 360;
    if (degrees > 90 && degrees <= 270) {
      loc = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[loc] || loc;
    }
    const { xmin, ymin, xmax, ymax } = bbox;
    const isAnchor = loc !== 'center' && Object.prototype.hasOwnProperty.call(anchors, loc);
    let ax, ay, halign, valign;
    if (loc === 'center') {
      ax = (xmin + xmax) / 2; ay = (ymin + ymax) / 2;
      halign = 'center'; valign = 'center';
    } else if (isAnchor) {
      [ax, ay] = anchors[loc];
      // Anchor on an edge: align the text away from the element.
      halign = Math.abs(ax - xmin) <= 0.15 ? 'right' : Math.abs(ax - xmax) <= 0.15 ? 'left' : 'center';
      valign = Math.abs(ay - ymin) <= 0.15 ? 'top' : Math.abs(ay - ymax) <= 0.15 ? 'bottom' : 'center';
    } else if (loc === 'top' || loc === 'bottom' || loc === 'left' || loc === 'right') {
      if (loc === 'top') { ax = (xmin + xmax) / 2; ay = ymax; }
      else if (loc === 'bottom') { ax = (xmin + xmax) / 2; ay = ymin; }
      else if (loc === 'left') { ax = xmin; ay = (ymin + ymax) / 2; }
      else { ax = xmax; ay = (ymin + ymax) / 2; }
      const th = ((theta
        + (loc === 'left' ? 90 : loc === 'bottom' ? 180 : loc === 'right' ? 270 : 0)) % 360 + 360) % 360;
      [halign, valign] = [
        ['center', 'bottom'], ['right', 'bottom'], ['right', 'center'], ['right', 'top'],
        ['center', 'top'], ['left', 'top'], ['left', 'center'], ['left', 'bottom']
      ][Math.round(th / 45) % 8];
    } else {
      throw new Error(`Unsupported label location: ${label.loc}`);
    }
    // Schemdraw keeps a scalar `ofst` as a distance away from the anchor side.
    const ofst = label.ofst == null ? spec.defaultOfst : label.ofst;
    let ox = 0, oy = 0;
    if (Array.isArray(ofst)) { ox = ofst[0]; oy = ofst[1]; }
    else if (loc === 'center') { ox = ofst; oy = ofst; }
    else if (isAnchor) {
      const p = ofst;
      [ox, oy] = ({
        'center-bottom': [0, p], 'right-bottom': [-p, p], 'right-center': [-p, 0],
        'right-top': [-p, -p], 'center-top': [0, -p], 'left-top': [p, -p],
        'left-center': [p, 0], 'left-bottom': [p, p]
      }[`${halign}-${valign}`] || [0, p]);
    } else {
      ox = loc === 'left' ? -ofst : loc === 'right' ? ofst : 0;
      oy = loc === 'bottom' ? -ofst : loc === 'top' ? ofst : 0;
    }
    return {
      x: (ax + ox) * 36, y: -(ay + oy) * 36,
      halign: label.halign || halign, valign: label.valign || valign
    };
  }

  // Build one dsp symbol. Returns the body in local SVG pixels (y down), the
  // glyph texts that Schemdraw stores as segments (they stay upright), the
  // anchors in drawing units, the local bbox and the element defaults that
  // Element._place uses (label location, drop point).
  function buildDsp(type, options, fontSize, color) {
    const U = 36;
    // Drawables keep their insertion order: Schemdraw paints segments in the
    // order they were appended, so a circle must not cover the glyph inside it.
    const drawables = [], glyphs = [];
    const anchors = Object.create(null);
    let bbox = { xmin: 0, ymin: 0, xmax: 0, ymax: 0 };
    let defaultLoc = 'center', defaultOfst = 0, dropPoint = null;
    // Constructor arguments per element, as in dsp.py / flow.Box.
    const allowed = ['at', 'anchor', 'theta', 'color', 'drop', 'hold', 'fill', 'flip', 'reverse',
      ...(type === 'Box' ? ['w', 'h', 'minsize', 'pad'] : []),
      ...(['Circle', 'Sum', 'SumSigma', 'Mixer', 'Oscillator', 'Circulator'].includes(type) ? ['radius'] : []),
      ...(type === 'Mixer' ? ['N', 'E', 'S', 'W', 'fontsize'] : []),
      ...(type === 'Filter' ? ['response'] : []),
      ...(type === 'VGA' ? ['tuneup'] : [])];
    for (const key of Object.keys(options)) if (!allowed.includes(key)) throw new Error(`${type} does not support ${key}.`);
    const num = (key, fallback, positive = false) => {
      if (!(key in options)) return fallback;
      const raw = options[key];
      if (typeof raw !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw) || !Number.isFinite(Number(raw)) || (positive && !(Number(raw) > 0))) {
        throw new Error(`${type} ${key} must be a ${positive ? 'positive ' : ''}number.`);
      }
      return Number(raw);
    };
    const bool = (key, fallback) => {
      if (!(key in options)) return fallback;
      if (!['True', 'False'].includes(options[key])) throw new Error(`${key} must be True or False.`);
      return options[key] === 'True';
    };
    const path = (points, closed = false, lw = 2) => {
      const d = points.map(([lx, ly], i) => `${i ? 'L' : 'M'} ${(lx * U).toFixed(4)},${(-ly * U).toFixed(4)}`).join(' ');
      // Schemdraw can fill a segment only when its path repeats a point, so a
      // closed outline is one whose first and last points coincide.
      const last = points[points.length - 1];
      const outline = closed || (points.length > 1 && points[0][0] === last[0] && points[0][1] === last[1]);
      drawables.push({ kind: 'path', d: closed ? `${d} Z` : d, lw, closed: outline });
    };
    const text = (lx, ly, value, size = fontSize) => glyphs.push({ x: lx * U, y: -ly * U, value, size });
    const circle = (cx, cy, r) => drawables.push({ kind: 'circle', cx: cx * U, cy: -cy * U, r: r * U });
    // A segment with an arrow head, drawn like the SVG backend: the line stops
    // one arrowlength (0.25 unit) before the end, the tip is 2 px short and the
    // head is arrowwidth (0.15 unit) wide.
    const arrowSeg = (a, b) => {
      const ax = a[0] * U, ay = -a[1] * U, bx = b[0] * U, by = -b[1] * U;
      const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const tipX = bx - 2 * ux, tipY = by - 2 * uy;
      const baseX = bx - 9 * ux, baseY = by - 9 * uy;
      const nx = -uy * 2.7, ny = ux * 2.7;
      drawables.push({ kind: 'path', d: `M ${ax.toFixed(4)},${ay.toFixed(4)} L ${baseX.toFixed(4)},${baseY.toFixed(4)}`, lw: 2 });
      drawables.push({
        kind: 'path',
        d: `M ${tipX.toFixed(4)},${tipY.toFixed(4)} L ${(baseX + nx).toFixed(4)},${(baseY + ny).toFixed(4)} L ${(baseX - nx).toFixed(4)},${(baseY - ny).toFixed(4)} Z`,
        lw: 2, head: true
      });
    };
    const squareBase = () => {
      path([[0, 0], [0, 0.5], [1, 0.5], [1, -0.5], [0, -0.5], [0, 0]], true);
      bbox = { xmin: 0, ymin: -0.5, xmax: 1, ymax: 0.5 };
      Object.assign(anchors, { N: [0.5, 0.5], S: [0.5, -0.5], E: [1, 0], W: [0, 0] });
      defaultLoc = 'center'; defaultOfst = 0;
      dropPoint = [1, 0];
    };
    const circleBase = () => {
      const r = num('radius', 0.5, true);
      circle(r, 0, r);
      bbox = { xmin: 0, ymin: -r, xmax: 2 * r, ymax: r };
      const k = r * Math.SQRT2 / 2;
      Object.assign(anchors, {
        N: [r, r], S: [r, -r], E: [2 * r, 0], W: [0, 0],
        NW: [r - k, k], NE: [r + k, k], SW: [r - k, -k], SE: [r + k, -k], center: [r, 0]
      });
      defaultLoc = 'center'; defaultOfst = 0;
      dropPoint = [2 * r, 0];
      return r;
    };
    const sine = (dy = 0) => path(dspSine.map(([x, y]) => [x, y + dy]));

    if (type === 'Box') {
      // `pad` is accepted for compatibility; it only feeds flow.labelsize(),
      // which 0.23 never reaches (see below).
      num('pad', 0.25);
      let minsize = [3, 2];
      if ('minsize' in options) {
        const m = /^\(\s*(\d+(?:\.\d+)?|\.\d+)\s+(\d+(?:\.\d+)?|\.\d+)\s*\)$/.exec(String(options.minsize));
        if (!m) throw new Error('Box minsize must be specified as "(width height)".');
        minsize = [Number(m[1]), Number(m[2])];
      }
      // Schemdraw's flow.Box calls _set_size() before the labels exist, so a
      // Box is always w x h = minsize unless w/h are given; the label does not
      // grow it in 0.23.
      const w = num('w', minsize[0], true), h = num('h', minsize[1], true);
      path([[0, 0], [0, h / 2], [w, h / 2], [w, -h / 2], [0, -h / 2], [0, 0]], true);
      bbox = { xmin: 0, ymin: -h / 2, xmax: w, ymax: h / 2 };
      Object.assign(anchors, {
        center: [w / 2, 0], N: [w / 2, h / 2], E: [w, 0], S: [w / 2, -h / 2], W: [0, 0],
        NW: [0, h / 2], NE: [w, h / 2], SW: [0, -h / 2], SE: [w, -h / 2],
        NNE: [3 * w / 4, h / 2], NNW: [w / 4, h / 2], SSE: [3 * w / 4, -h / 2], SSW: [w / 4, -h / 2],
        ENE: [w, h / 3], ESE: [w, -h / 3], WNW: [0, h / 3], WSW: [0, -h / 3]
      });
      defaultLoc = 'center'; defaultOfst = 0;
    } else if (type === 'Square' || type === 'OscillatorBox' || type === 'Filter' || type === 'Demod' || type === 'Isolator') {
      squareBase();
      if (type === 'OscillatorBox') sine();
      else if (type === 'Filter') {
        sine(); sine(0.25); sine(-0.25);
        const response = 'response' in options ? String(options.response) : '';
        if (response && !['lp', 'bp', 'hp', 'notch'].includes(response)) throw new Error('Filter response must be lp, bp, hp, or notch.');
        if (['bp', 'lp'].includes(response)) path([[0.45, 0.17], [0.55, 0.33]]);
        if (['bp', 'hp'].includes(response)) path([[0.45, -0.33], [0.55, -0.17]]);
        if (['lp', 'hp', 'notch'].includes(response)) path([[0.45, -0.08], [0.55, 0.08]]);
      } else if (type === 'Demod') {
        path([[0.15, 0], [0.3, 0]]);
        path([[0.3, 0.25], [0.7, 0], [0.3, -0.25], [0.3, 0.25]]);
        path([[0.7, 0.25], [0.7, -0.25]]);
        path([[0.7, 0], [0.85, 0]]);
      } else if (type === 'Isolator') {
        arrowSeg([0.25, 0], [0.75, 0]);
      }
    } else if (type === 'Circle' || type === 'Sum' || type === 'SumSigma' || type === 'Mixer' || type === 'Oscillator' || type === 'Circulator') {
      const r = circleBase();
      if (type === 'Sum') {
        // dsp.Sum draws the plus at fixed 0.5-based coordinates.
        path([[0.5, 0.2], [0.5, -0.2]]);
        path([[0.3, 0], [0.7, 0]]);
      } else if (type === 'SumSigma') {
        // SegmentText(r'$\Sigma$', pos=(0.45, 0), align=('center','center'))
        text(0.45, 0, 'Σ');
      } else if (type === 'Mixer') {
        const k = 0.5 * Math.SQRT2 / 2;
        path([[0.5 + k, k], [0.5 - k, -k]], false, 1);
        path([[0.5 + k, -k], [0.5 - k, k]], false, 1);
        defaultLoc = 'top'; defaultOfst = 0.2;
        const mixSize = num('fontsize', 10, true);
        const textArg = key => {
          const raw = options[key];
          if (typeof raw !== 'string') throw new Error(`Mixer ${key} must be a string.`);
          const quoted = /^'((?:[^'\\]|\\.)*)'$/.exec(raw);
          return quoted ? quoted[1].replace(/\\(['\\n])/g, (m, c) => c === 'n' ? '\n' : c) : raw;
        };
        if ('N' in options) text(0.5, 0.25 + 0.01, textArg('N'), mixSize);
        if ('S' in options) text(0.5, -0.25 - 0.065, textArg('S'), mixSize);
        if ('E' in options) text(0.75 + 0.05, 0, textArg('E'), mixSize);
        if ('W' in options) text(0.25 - 0.05, 0, textArg('W'), mixSize);
      } else if (type === 'Oscillator') {
        sine();
      } else if (type === 'Circulator') {
        // SegmentArc((0.5, 0), 0.9*radius, 0.9*radius, 20, 200, 'cw')
        drawables.push({ kind: 'arc', d: switchArc(0.5, 0, 0.9 * r, 0.9 * r, 20, 200, 'cw', color) });
      }
    } else if (type === 'Amp' || type === 'VGA') {
      path([[0, 0], [0, -0.5], [0.75, 0], [0, 0.5], [0, 0]], true);
      bbox = { xmin: 0, ymin: -0.5, xmax: 0.75, ymax: 0.5 };
      anchors.input = [0, 0]; anchors.out = [0.75, 0];
      defaultLoc = 'top'; defaultOfst = 0.1;
      dropPoint = [0.75, 0];
      if (type === 'VGA') {
        const tuneup = bool('tuneup', true);
        arrowSeg([-0.1, -0.5], [0.75, 0.5]);
        anchors.tune = [0.325, tuneup ? 0.5 : -0.5];
        bbox = { xmin: -0.1, ymin: -0.65, xmax: 0.75, ymax: 0.65 };
      }
    } else if (type === 'dsp_Speaker') {
      // dsp.Speaker: a box with a cone and no anchors, so it never moves the
      // drawing position. Both outlines repeat their first point (fillable).
      path([[0, 0], [0, 0.25], [0.25, 0.25], [0.25, -0.25], [0, -0.25], [0, 0]], true);
      path([[0.25, 0.25], [0.5, 0.5], [0.5, -0.5], [0.25, -0.25], [0.25, 0.25]], true);
      bbox = { xmin: 0, ymin: -0.5, xmax: 0.5, ymax: 0.5 };
      defaultLoc = 'top'; defaultOfst = 0.1;
    } else if (type === 'Adc' || type === 'Dac') {
      if (type === 'Adc') path([[0, 0], [0.22, 0.5], [1.4, 0.5], [1.4, -0.5], [0.22, -0.5], [0, 0]], true);
      else path([[0, 0], [0, 0.5], [1.18, 0.5], [1.4, 0], [1.18, -0.5], [0, -0.5], [0, 0]], true);
      bbox = { xmin: 0, ymin: -0.5, xmax: 1.4, ymax: 0.5 };
      anchors.input = [0, 0]; anchors.out = [1.4, 0];
      anchors.E = [1.4, 0]; anchors.W = [0, 0];
      defaultLoc = 'center'; defaultOfst = 0;
      dropPoint = [1.4, 0];
    }
    // Schemdraw's Element.fill(): the colour is the style default for every
    // segment of the element, so closed paths (boxes, triangles, circles) are
    // filled with it; arrow heads keep the element colour.
    const fillColor = 'fill' in options ? (options.fill === 'True' ? color : readColor(options.fill)) : 'none';
    const body = drawables.map(item => {
      if (item.kind === 'circle') {
        return `<circle cx="${item.cx}" cy="${item.cy}" r="${item.r}" fill="${fillColor}" stroke="${color}" stroke-width="2"/>`;
      }
      if (item.head) return `<path d="${item.d}" fill="${color}"/>`;
      if (item.kind === 'arc') return item.d;
      // Schemdraw fills a segment only when its path repeats a point (a closed
      // outline); open paths such as the filter curves stay unfilled.
      return `<path d="${item.d}" fill="${item.closed ? fillColor : 'none'}" stroke="${color}" stroke-width="${item.lw}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).join('');
    return { body, glyphs, anchors, bbox, defaultLoc, defaultOfst, dropPoint };
  }

  function renderCircuit(source, log = () => {}, subs = null) {
    const records = parse(source, subs);
    const result = renderRecords(records, log, subs);
    return buildSvg(result);
  }

  // Assemble the pieces collected by renderRecords into one SVG document.
  function buildSvg({ elements, minX, minY, maxX, maxY, labelSize, inchesPerUnit }) {
    // Keep large label text from touching the viewport edge.
    const padding = Math.max(8, Math.round(labelSize * 0.6));
    const width = maxX - minX + 2 * padding, height = maxY - minY + 2 * padding;
    const viewBox = `${minX - padding} ${minY - padding} ${width} ${height}`;
    // Schemdraw's SVG backend writes the viewBox size in points, so the drawing
    // keeps its intrinsic size when embedded.
    const size = ` width="${Number(width.toFixed(3))}pt" height="${Number(height.toFixed(3))}pt"`;
    return `<svg xmlns="http://www.w3.org/2000/svg"${size} viewBox="${viewBox}" role="img" aria-label="Circuit diagram">${expandMultiline(elements.join(''))}</svg>`;
  }

  // Draw one block of components and return the finished geometry. Subcircuits
  // call this recursively with their own local coordinates.
  function renderRecords(records, log = () => {}, subs = null, depth = 0) {
    log('Detected circuit block.');
    const elements = [], names = Object.create(null), namedTypes = Object.create(null), namedDirs = Object.create(null), namedBoxes = Object.create(null), namedReversed = Object.create(null), blockAnchors = Object.create(null), heldStates = [], overlay = [];
    let elemBox = null;
    let x = 0, y = 0, direction = 'right', unit = defaultUnit, labelSize = 14, labelSizeSet = false, inchesPerUnit = null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const bounds = (x1, y1, x2, y2) => {
      minX = Math.min(minX, x1, x2); maxX = Math.max(maxX, x1, x2);
      minY = Math.min(minY, y1, y2); maxY = Math.max(maxY, y1, y2);
      if (elemBox) {
        elemBox.x1 = Math.min(elemBox.x1, x1, x2); elemBox.x2 = Math.max(elemBox.x2, x1, x2);
        elemBox.y1 = Math.min(elemBox.y1, y1, y2); elemBox.y2 = Math.max(elemBox.y2, y1, y2);
      }
    };
    // Contact/terminal markers filled with the background colour are collected
    // here and appended after every element. Schemdraw gives these segments a
    // higher zorder, so a lead drawn later must not paint over them.
    const bgMarker = (cx, cy, r, markerColor, markerFill = 'white') => {
      overlay.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${markerFill}" stroke="${markerColor}" stroke-width="2"/>`);
    };
    const whiteMarker = bgMarker;
    // Local → world for the `translate(ox oy) rotate(-deg) scale(sx sy)` groups
    // used by the stand-alone symbols.
    const localToWorld = (ox, oy, sx, sy, degrees) => {
      const a = -degrees * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
      return (lx, ly) => [ox + lx * sx * cos - ly * sy * sin, oy + lx * sx * sin + ly * sy * cos];
    };
    const point = ref => {
      // Schemdraw anchor names may contain dots (ElementCompound exposes
      // `input_component.istart`) and symbols such as the clock `>`.
      const m = /^([A-Za-z_]\w*)\.([^\s]+)$/.exec(ref || '');
      if (!m || !Object.prototype.hasOwnProperty.call(names, m[1]) || !Object.prototype.hasOwnProperty.call(names[m[1]], m[2])) throw new Error(`Unknown terminal reference: ${ref}`);
      return names[m[1]][m[2]];
    };
    const atPoint = value => {
      // Schemdraw accepts computed coordinates here, e.g. `at((d.unit*2, 0))`.
      const match = /^\(\s*([^()]+?)\s*\)$/.exec(value);
      if (!match) return point(value);
      const parts = match[1].trim().split(/\s*,\s*|\s+/).filter(Boolean);
      if (parts.length !== 2) return point(value);
      const coordRefs = Object.create(null);
      for (const [namedTypeName, anchorSet] of Object.entries(names)) {
        for (const [anchorName, coords] of Object.entries(anchorSet)) {
          if (!Array.isArray(coords)) continue;
          coordRefs[`${namedTypeName}.${anchorName}.x`] = coords[0] / 36;
          coordRefs[`${namedTypeName}.${anchorName}.y`] = -coords[1] / 36;
        }
      }
      const px = readCoordinateExpression(parts[0], unit, coordRefs);
      const py = -readCoordinateExpression(parts[1], unit, coordRefs);
      if (!Number.isFinite(px) || !Number.isFinite(py)) throw new Error('at coordinates must be finite numbers.');
      return [px, py];
    };
    for (const record of records) {
      const { name, args } = record;
      elemBox = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
      let type = record.type;
      // `Arrow` is Schemdraw's Line with arrow defaults (`double` → `<->`).
      if (type === 'Arrow') {
        const dbl = args.find(arg => arg.key === 'double');
        if (!args.some(arg => arg.key === 'arrow')) {
          args.push({ key: 'arrow', value: dbl && dbl.value === 'True' ? '<->' : '->' });
        }
        const kept = args.filter(arg => arg.key !== 'double');
        args.length = 0;
        args.push(...kept);
        type = 'Line';
      }
      if (type === '__hold_start') { heldStates.push([x, y, direction]); continue; }
      if (type === '__hold_end') { [x, y, direction] = heldStates.pop(); continue; }
      if (type === 'config') {
        // Schemdraw's d.config(unit=..., fontsize=...). Several settings may be
        // given in one line, each at most once.
        if (name || !args.length) throw new Error('Expected format: config: unit="2" fontsize="12"');
        const applied = [];
        let seenUnit = false, seenFontsize = false, seenInches = false;
        for (const arg of args) {
          if (arg.key !== 'unit' && arg.key !== 'fontsize' && arg.key !== 'inches_per_unit') throw new Error(`Unsupported config setting: ${arg.key}`);
          if (typeof arg.value !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(arg.value)) throw new Error(`config ${arg.key} must be a number.`);
          const value = Number(arg.value);
          if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(value * 36)) throw new Error(`config ${arg.key} must be a finite positive number.`);
          if (arg.key === 'unit') {
            if (seenUnit) throw new Error('Duplicate config setting: unit');
            seenUnit = true;
            unit = value * 36;
          } else if (arg.key === 'fontsize') {
            if (seenFontsize) throw new Error('Duplicate config setting: fontsize');
            seenFontsize = true;
            labelSize = value;
            labelSizeSet = true;
          } else {
            if (seenInches) throw new Error('Duplicate config setting: inches_per_unit');
            seenInches = true;
            inchesPerUnit = value;
          }
          applied.push(`${arg.key}=${value}`);
        }
        log(`config: ${applied.join(' ')}`);
        continue;
      }
      if (type === 'print') {
        if (name || args.length !== 1 || args[0].key !== 'value' || args[0].value !== 'd.here') throw new Error('Expected format: print: value="d.here"');
        const clean = n => Math.abs(n) < 1e-12 ? 0 : Number(n.toPrecision(12));
        log(`d.here: (${clean(x / 36)}, ${clean(-y / 36)})`);
        continue;
      }
      if (type === 'anchor') {
        // Schemdraw's d.set_anchor(): name the current drawing position so a
        // subcircuit instance can expose it as an anchor.
        if (name || args.length !== 1 || args[0].key !== 'name' || typeof args[0].value !== 'string') throw new Error('Expected format: anchor: name="in"');
        const anchorName = args[0].value;
        if (!/^[A-Za-z_]\w*$/.test(anchorName)) throw new Error('anchor name must start with a letter or underscore.');
        if (Object.prototype.hasOwnProperty.call(blockAnchors, anchorName)) throw new Error(`Duplicate anchor: ${anchorName}`);
        blockAnchors[anchorName] = [x, y];
        names[anchorName] = { start: [x, y], end: [x, y], center: [x, y], xy: [x, y] };
        log(`anchor: ${anchorName} at (${x / 36}, ${-y / 36})`);
        continue;
      }
      if (type === 'move' || type === 'move_from') {
        if (name) throw new Error(`${type} cannot have a component name.`);
        const offsets = Object.create(null);
        // Anchor coordinates referenced from expressions ("A1.out.y") are in
        // drawing units with y up, as in schemdraw.
        const coordRefs = Object.create(null);
        for (const [namedTypeName, anchorSet] of Object.entries(names)) {
          for (const [anchorName, coords] of Object.entries(anchorSet)) {
            if (!Array.isArray(coords)) continue;
            coordRefs[`${namedTypeName}.${anchorName}.x`] = coords[0] / 36;
            coordRefs[`${namedTypeName}.${anchorName}.y`] = -coords[1] / 36;
          }
        }
        for (const { key, value } of args) {
          if (!['dx', 'dy'].includes(key) && !(type === 'move_from' && key === 'at')) throw new Error(`Unsupported argument for ${type}: ${key}`);
          if (Object.prototype.hasOwnProperty.call(offsets, key)) throw new Error(`Duplicate argument: ${key}`);
          if (key === 'at') {
            if (typeof value !== 'string') throw new Error('move_from at must specify a terminal.');
            offsets[key] = value;
          } else offsets[key] = readCoordinateExpression(value, unit, coordRefs);
        }
        if (type === 'move_from') {
          if (!Object.prototype.hasOwnProperty.call(offsets, 'at')) throw new Error('move_from requires at.');
          [x, y] = point(offsets.at);
        }
        x += offsets.dx || 0;
        y -= offsets.dy || 0;
        log(`${type}: ${type === 'move_from' ? 'at=' + offsets.at + ' ' : ''}dx=${(offsets.dx || 0) / 36} dy=${(offsets.dy || 0) / 36}`);
        continue;
      }
      const previousState = [x, y, direction];
      if (!record.sub && !['Resistor', 'ResistorIEEE', 'ResistorIEC', 'ResistorVar', 'ResistorVarIEC', 'ResistorVarIEEE', 'Capacitor', 'Capacitor2', 'Inductor', 'Inductor2', 'CPE', 'Nullator', 'Norator', 'Diode', 'DiodeTunnel', 'DiodeTVS', 'DiodeShockley', 'Josephson', 'Zener', 'LED', 'Diac', 'Schottky', 'Varactor', 'Potentiometer', 'PotentiometerIEC', 'PotentiometerIEEE', 'Rshunt', 'SCR', 'Triac', 'Fuse', 'FuseIEC', 'FuseIEEE', 'RBox', 'Thermistor', 'Crystal', 'CapacitorVar', 'CapacitorTrim', 'Photoresistor', 'PhotoresistorBox', 'PhotoresistorIEC', 'PhotoresistorIEEE', 'Coax', 'Triax', 'Motor', 'BusLine', 'DataBusLine', 'BusConnect', 'CoaxConnect', 'Plug', 'Jack', 'Terminal', 'Jumper', 'DE9', 'DB25', 'DA15', 'DC37', 'DD50', 'Switch', 'Button', 'SwitchSpdt', 'SwitchSpdt2', 'SwitchDpst', 'SwitchDpdt', 'SwitchRotary', 'SwitchDIP', 'SwitchReed', 'Battery', 'BatteryCell', 'BatteryDouble', 'Line', 'Wire', 'OrthoLines', 'Dot', 'Source', 'SourceSin', 'SourceV', 'SourceI', 'SourcePulse', 'SourceSquare', 'SourceTriangle', 'SourceRamp', 'Lamp', 'Lamp2', 'Solar', 'Neon', 'Photodiode', 'LED2', 'FuseUS', 'Memristor', 'Memristor2', 'SparkGap', 'MeterV', 'MeterA', 'MeterI', 'MeterOhm', 'MeterArrow', 'SourceControlled', 'SourceControlledV', 'SourceControlledI', 'Gap', 'Breaker', 'Optocoupler', 'Relay', 'Opamp', 'Ground', 'GroundSignal', 'GroundChassis', 'Vdd', 'Vss', 'NoConnect', 'Antenna', 'AntennaLoop', 'AntennaLoop2', 'Speaker', 'Mic', 'AudioJack', "OutletA","OutletB","OutletC","OutletD","OutletE","OutletF","OutletG","OutletH","OutletI","OutletJ","OutletK","OutletL", 'Arrowhead', 'DotDotDot', 'Label', 'Tag', 'Bjt', 'JFet', 'Hemt', 'NpnSchottky', 'PnpSchottky', 'BjtNpn', 'BjtPnp', 'BjtPnp2c', 'BjtNpn2', 'BjtPnp2', 'BjtPnp2c2', 'IgbtN', 'IgbtP', 'NpnPhoto', 'PnpPhoto', 'AnalogNFet', 'AnalogPFet', 'AnalogBiasedFet', 'NMos2', 'PMos2', 'NFet2', 'PFet2', 'JFetN2', 'JFetP2', 'JFetN', 'JFetP', 'NFet', 'PFet', 'NMos', 'PMos', 'CurrentMirror', 'VoltageMirror', 'Ic', 'Multiplexer', 'VoltageRegulator', 'DFlipFlop', 'JKFlipFlop', 'Ic555', 'SevenSegment', 'MeterBox', 'MeterAnalog', 'MeterDigital', 'Oscilloscope', 'IcDIP', 'Header', 'Transformer', 'LoopCurrent', 'CurrentLabel', 'CurrentLabelInline', 'Rectifier', 'Triode', 'DualVacuumTube', 'VacuumTube', 'TubeDiode', 'Tetrode', 'Pentode', 'NixieTube', 'Nullor', 'VoltageTransactor', 'TransimpedanceTransactor', 'CurrentTransactor', 'TransadmittanceTransactor', 'Box', 'Square', 'Circle', 'Sum', 'SumSigma', 'Mixer', 'Amp', 'OscillatorBox', 'Oscillator', 'Filter', 'Adc', 'Dac', 'Demod', 'Circulator', 'Isolator', 'VGA', 'dsp_Speaker', ...logicGateTypes].includes(type)) throw new Error(`Unsupported component: ${type}`);
      const isMeter = ['MeterBox', 'MeterAnalog', 'MeterDigital', 'Oscilloscope'].includes(type);
      const isSource = ['Source', 'SourceV', 'SourceSin', 'SourceI', 'SourcePulse', 'SourceSquare', 'SourceTriangle', 'SourceRamp', 'Lamp', 'Lamp2', 'Solar', 'Neon', 'MeterV', 'MeterA', 'MeterI', 'MeterOhm', 'MeterArrow', 'SourceControlled', 'SourceControlledV', 'SourceControlledI', 'Solar', 'Neon'].includes(type);
      if (name && Object.prototype.hasOwnProperty.call(names, name)) throw new Error(`Duplicate component name: ${name}`);
      const options = Object.create(null), labels = [];
      let selectedDirection = null, length = null;
      for (const { key, value, quoted } of args) {
        // Keyword-valued arguments have exactly one spelling: the value is a bare
        // word (leads=True), never a quoted string (leads="True").
        if (quoted && BOOLEAN_WORD_ARGS.has(key) && (value === 'True' || value === 'False')) throw quotedValueError(key, value);
        if (Object.prototype.hasOwnProperty.call(directions, key)) {
          if (selectedDirection) throw new Error('Only one direction may be specified.');
          selectedDirection = key;
          if (value !== undefined) length = readLength(value, unit);
        } else if (key === 'label') labels.push(readLabel(value));
        else if (key === 'pin') {
          if (!options.pin) options.pin = [];
          options.pin.push(value);
        } else if (key === 'side') {
          if (typeof value !== 'string') throw new Error('side requires a value like "L spacing=1.5 pad=1.5".');
          if (!options.side) options.side = [];
          options.side.push(value);
        } else {
          if (!record.sub && !['at', 'to', 'tox', 'toy', 'endpoints', 'anchor', 'theta', 'color', 'drop', 'shift', 'scale', 'tap_length', 'idot', 'dot', 'leads', 'lead', 'hold', 'flip', 'reverse', 'length', 'shape', 'k', 'arrow', 'delta', 'dx', 'dy', 'size', 'pin', 'side', 'preclr', 'preclrinvert', 'slant', 'pinspacing', 'demux', 'decimal', 'digit', 'segcolor', 'tilt', 'labelsegments', 'anode', 'cathode', 'needle_percent', 'window_fill', 'input_fill', 'signal', 'signal_color', 'signal_lw', 'grid', ...(DSP_TYPES.has(type) ? ['w', 'h', 'minsize', 'pad', 'radius', 'response', 'tuneup', 'N', 'E', 'S', 'W', 'fill', ...(type === 'Mixer' ? ['fontsize'] : [])] : []), ...(['IcDIP', 'Header', 'Transformer'].includes(type) ? ['pins', 'notch', 'width', 'pinw', 'spacing', 'number', 'pfontsize', 'rows', 'cols', 'style', 'numbering', 'shownumber', 'pinspacing', 'edge', 'pinfill', 't1', 't2', 'core', 'loop', 'align', 'pinsleft', 'pinsright', 'pinalignleft', 'pinalignright', 'pinfontsizeleft', 'pinfontsizeright'] : []), ...(['NFet2', 'PFet2', 'NFet', 'PFet'].includes(type) ? ['bulk'] : []), ...(['JFetN2', 'JFetP2', 'BjtNpn2', 'BjtPnp2', 'BjtPnp2c2'].includes(type) ? ['circle'] : []), ...(['AnalogNFet', 'AnalogPFet', 'AnalogBiasedFet'].includes(type) ? ['bulk', 'offset_gate', 'source_arrow'] : []), ...(type === 'Breaker' ? ['dots'] : []), ...(type === 'Optocoupler' ? ['box', 'boxfill', 'boxpad', 'base'] : []), ...(type === 'Relay' ? ['switch', 'core', 'link', 'box', 'boxfill', 'boxpad', 'swreverse', 'swflip', 'unit', 'cycl'] : []), ...(type === 'Inductor2' ? ['loops', 'core'] : []), ...(type === 'Capacitor2' ? ['polar'] : []), ...(type === 'Josephson' ? ['box'] : []), ...(type === 'Coax' ? ['radius', 'leadlen'] : []), ...(type === 'Triax' ? ['radiusinner', 'radiusouter', 'leadlen', 'shieldofststart', 'shieldofstend'] : []), ...(type === 'BusLine' ? ['lw'] : []), ...(type === 'BusConnect' ? ['n', 'slant_up', 'dy', 'lwbus', 'l'] : []), ...(type === 'CoaxConnect' ? ['radius', 'radiusinner', 'fillinner'] : []), ...(type === 'Terminal' ? ['r', 'open'] : []), ...(type === 'Jumper' ? ['pinspacing'] : []), ...(['DE9', 'DB25', 'DA15', 'DC37', 'DD50'].includes(type) ? ['pinspacing', 'edge', 'number', 'pinfill'] : []), ...(['MeterBox', 'MeterAnalog', 'MeterDigital', 'Oscilloscope'].includes(type) ? ['width', 'corner', 'inputs', 'input_ofst', 'input_lw', 'input_rad'] : []), ...(type === 'MeterAnalog' ? ['needle_color', 'needle_width'] : []), ...(['MeterDigital', 'Oscilloscope'].includes(type) ? ['screen_fill', 'screen_lw'] : []), ...(type === 'Oscilloscope' ? ['grid_color', 'grid_lw'] : []), ...(logicMultiInputTypes.has(type) ? ['inputs', 'inputnots', 'leadin', 'leadout'] : []), ...(type === 'Tristate' ? ['outputnot', 'controlnot'] : []), ...(type === 'Ic' ? ['plblofst', 'botlabel'] : []), ...(type === 'OrthoLines' ? ['n', 'dy', 'xstart'] : []), ...(type === 'Capacitor' ? ['polar'] : []), ...(type === 'Inductor' ? ['core'] : []), ...(['Diode', 'LED'].includes(type) ? ['fill'] : []), ...(type === 'Dot' ? ['open'] : []), ...(type === 'Opamp' ? ['sign'] : []), ...(type === 'Button' ? ['nc', 'contacts'] : []), ...(['NMos', 'PMos', 'NMos2', 'PMos2'].includes(type) ? ['diode'] : []), ...(['NFet', 'PFet'].includes(type) ? ['bulk'] : []), ...(['Switch', 'SwitchSpdt', 'SwitchSpdt2'].includes(type) ? ['contacts', 'nc', 'action'] : []), ...(type === 'SwitchRotary' ? ['n', 'dtheta', 'theta0', 'radius', 'arrowlen', 'arrowcontact'] : []), ...(type === 'SwitchDIP' ? ['n', 'pattern', 'switchcolor', 'swidth', 'spacing'] : []), ...(['SwitchDpst', 'SwitchDpdt'].includes(type) ? ['contacts', 'link'] : []), ...(['Bjt', 'JFet', 'NpnSchottky', 'PnpSchottky', 'BjtNpn', 'BjtPnp', 'BjtPnp2c', 'JFetN', 'JFetP', 'NMos', 'PMos', 'NMos2', 'PMos2'].includes(type) ? ['circle'] : []), ...(type === 'Hemt' ? ['split', 'source_arrow'] : []), ...(type === 'AudioJack' ? ['ring', 'switch', 'ringswitch', 'dots', 'open', 'radius'] : []), ...(/^Outlet[A-L]$/.test(type) ? ['plug'] : []), ...(type === 'Arrowhead' ? ['headwidth', 'headlength'] : []), ...(type === 'DotDotDot' ? ['radius', 'open'] : []), ...(type === 'Tag' ? ['width', 'height'] : []), ...(type === 'Arrow' ? ['double'] : []), ...(type === 'LoopCurrent' ? ['elms', 'pad', 'direction', 'theta1', 'theta2'] : []), ...(type === 'CurrentLabel' ? ['top', 'ofst', 'headlength', 'headwidth'] : []), ...(type === 'CurrentLabelInline' ? ['direction', 'start', 'ofst', 'headlength', 'headwidth'] : []), ...(['Nullor', 'VoltageTransactor', 'TransimpedanceTransactor', 'CurrentTransactor', 'TransadmittanceTransactor'].includes(type) ? ['reverse_output'] : []), ...(type === 'Triode' ? ['heater', 'split'] : []), ...(['VacuumTube', 'TubeDiode', 'Tetrode', 'Pentode'].includes(type) ? ['cathode', 'anodetype', 'grids', 'heater', 'split', 'strap'] : []), ...(type === 'NixieTube' ? ['anodes', 'cathode', 'anodetype', 'grid'] : []), ...(type === 'DualVacuumTube' ? ['grids_left', 'grids_right', 'heater', 'cathode', 'anodetype'] : [])].includes(key)) throw new Error(`Unsupported argument: ${key}`);
          if (Object.prototype.hasOwnProperty.call(options, key)) throw new Error(`Duplicate argument: ${key}`);
          options[key] = value === undefined ? true : value;
        }
      }
      for (const key of ['hold', 'flip', 'reverse']) if (key in options && options[key] !== true) throw new Error(`${key} must be specified without a value.`);
      // Schemdraw's dot(open=True) / idot(open=True) draw a hollow circle.
      for (const key of ['idot', 'dot']) if (key in options && options[key] !== true && options[key] !== 'open') throw new Error(`${key} must be specified without a value, or as ${key}="open".`);
      for (const key of ['contacts', 'nc', 'link']) if (options[key] === true) throw new Error(`${key} must be True or False.`);
      for (const key of ['at', 'to', 'tox', 'toy']) if (key in options && typeof options[key] !== 'string') throw new Error(`${key} must specify a terminal.`);
      if ('endpoints' in options && typeof options.endpoints !== 'string') throw new Error('endpoints must specify a start and end reference.');
      // Schemdraw accepts .left()/.up()/.down()/.right() on every Element as a
      // drawing direction. The stand-alone symbols below only implement `theta`,
      // so map the keyword to the equivalent angle instead of rejecting it.
      const THETA_ONLY_TYPES = new Set(['Antenna', 'AntennaLoop', 'AntennaLoop2', 'Arrowhead',
        'AudioJack', 'CurrentTransactor', 'Dot', 'DotDotDot', 'DualVacuumTube', 'Ground',
        'GroundChassis', 'GroundSignal', 'Header', 'Ic', 'IcDIP', 'Label', 'MeterAnalog',
        'MeterBox', 'MeterDigital', 'Mic', 'NixieTube', 'NoConnect', 'Nullor', 'Opamp',
        'OrthoLines', 'OutletA', 'OutletB', 'OutletC', 'OutletD', 'OutletE', 'OutletF',
        'OutletG', 'OutletH', 'OutletI', 'OutletJ', 'OutletK', 'OutletL', 'Pentode',
        'Rectifier', 'SevenSegment', 'Speaker', 'SwitchDIP', 'SwitchRotary', 'Tetrode',
        'TransadmittanceTransactor', 'Transformer', 'TransimpedanceTransactor', 'Triode',
        'TubeDiode', 'VacuumTube', 'Vdd', 'VoltageTransactor', 'Vss', 'Wire']);
      // Point-like symbols have no orientation at all; Schemdraw accepts the
      // direction call and ignores it.
      const NO_ORIENTATION_TYPES = new Set(['Dot', 'NoConnect', 'Ground', 'GroundSignal',
        'GroundChassis', 'Vdd', 'Vss']);
      if (selectedDirection && THETA_ONLY_TYPES.has(type)) {
        if (NO_ORIENTATION_TYPES.has(type)) {
          selectedDirection = null;
        } else if (!('theta' in options)) {
          options.theta = String({ right: 0, up: 90, left: 180, down: 270 }[selectedDirection]);
          selectedDirection = null;
        }
      }
      const color = 'color' in options ? readColor(options.color) : 'black';
      const stroke = `fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
      const textFill = 'color' in options ? ` fill="${color}"` : '';
      if (record.sub) {
        // Schemdraw's ElementDrawing: replay the stored drawing at the current
        // position. The body keeps its own unit and font size, the cursor ends
        // at the subdrawing's final position, and the direction resets to right.
        const def = subs[type];
        const placement = ['at', 'anchor', 'theta'];
        const provided = Object.create(null);
        for (const key of Object.keys(options)) {
          if (placement.includes(key)) continue;
          if (!def.params.includes(key)) throw new Error(`Unknown subcircuit argument for ${type}: ${key}`);
          if (typeof options[key] !== 'string') throw new Error(`Subcircuit parameter ${key} requires a value.`);
          provided[key] = options[key];
        }
        const missing = def.params.filter(key => !Object.prototype.hasOwnProperty.call(provided, key));
        if (missing.length) throw new Error(`Subcircuit ${type} requires parameters: ${missing.join(', ')}`);
        if (selectedDirection || length !== null) throw new Error(`Subcircuit ${type} supports at, anchor, theta, and its parameters.`);
        if (depth > 8) throw new Error('Subcircuits are nested too deeply.');
        let body = def.source;
        for (const [key, value] of Object.entries(provided)) body = body.split('${' + key + '}').join(value);
        const leftover = /\$\{([A-Za-z_]\w*)\}/.exec(body);
        if (leftover) throw new Error(`Unknown subcircuit parameter: ${leftover[1]}`);
        const inner = parse(body, subs);
        const local = renderRecords(inner, log, subs, depth + 1);
        if (!Number.isFinite(local.minX)) throw new Error(`Subcircuit ${type} draws nothing.`);
        let theta = 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          theta = Number(options.theta);
        }
        const origin = 'at' in options ? atPoint(options.at) : [x, y];
        let shift = [0, 0];
        if ('anchor' in options) {
          const target = local.names[options.anchor];
          if (!target || !target.center) throw new Error(`Unknown subcircuit anchor: ${options.anchor}`);
          shift = target.center;
        }
        const rad = -theta * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
        const tf = ([px, py]) => {
          const qx = px - shift[0], qy = py - shift[1];
          return [origin[0] + qx * cos - qy * sin, origin[1] + qx * sin + qy * cos];
        };
        const transform = `translate(${origin[0]} ${origin[1]})`
          + (theta ? ` rotate(${-theta})` : '')
          + (shift[0] || shift[1] ? ` translate(${-shift[0]} ${-shift[1]})` : '');
        elements.push(`<g transform="${transform}">${local.elements.join('')}</g>`);
        for (const corner of [[local.minX, local.minY], [local.minX, local.maxY], [local.maxX, local.minY], [local.maxX, local.maxY]]) {
          const [bx, by] = tf(corner);
          bounds(bx, by, bx, by);
        }
        if (name) {
          // Anchors defined with `anchor:` come first (Schemdraw's drawing
          // anchors); named parts are also exposed as single points.
          const out = Object.create(null);
          for (const [key, point] of Object.entries(local.blockAnchors)) out[key] = tf(point);
          for (const [key, anchorSet] of Object.entries(local.names)) {
            if (!Object.prototype.hasOwnProperty.call(out, key) && anchorSet && Array.isArray(anchorSet.center)) out[key] = tf(anchorSet.center);
          }
          names[name] = out;
        }
        [x, y] = tf([local.x, local.y]);
        direction = 'right';
        log(`Subcircuit ${type}: ${'at' in options ? 'at=' + options.at : 'sequential'}`);
        continue;
      }
      const labelStyleAllowed = label => type === 'Opamp' || type === 'IcDIP' || DSP_TYPES.has(type) || (type === 'Header' && label.color === undefined);
      if (!isMeter && (labels.some(label => (!labelStyleAllowed(label) && (label.fontsize !== undefined || label.color !== undefined)) || (!logicGateTypes.has(type) && type !== 'Opamp' && ['name', 'in1', 'in2', 'display'].includes(label.loc))) || (type !== 'NixieTube' && ['needle_percent', 'window_fill', 'input_fill', 'signal', 'signal_color', 'signal_lw', 'grid'].some(key => key in options)))) throw new Error(`The specified arguments are not supported for ${type}.`);
      if (type !== 'Wire' && (['shape', 'k'].some(key => key in options) || (type !== 'Line' && 'arrow' in options))) throw new Error(`Wire arguments cannot be used with ${type}.`);
      if (type === 'Line' && 'arrow' in options && !['->', '<-', '<->', '|->', '|-o', 'o-', '-o', 'o-o'].includes(options.arrow)) throw new Error('Invalid Line arrow.');
      if (type === 'Rectifier') {
        // Schemdraw's Rectifier: four diodes forming a bridge, with N/S/E/W
        // anchors. It is a compound element, so it does not move the cursor.
        if (selectedDirection || length !== null || Object.keys(options).some(key => !['at', 'anchor', 'theta', 'color', 'fill', 'flip', 'reverse'].includes(key))) throw new Error('Rectifier supports at, anchor, theta, color, fill, flip, and reverse.');
        if ('at' in options) [x, y] = atPoint(options.at);
        let theta = 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          theta = Number(options.theta);
        }
        const c = 76.36753236814713, full = 2 * 76.36753236814713;
        const rectFlip = 'flip' in options, rectReverse = 'reverse' in options;
        // Element._flipreverse() over the bridge's own bbox (0..full, -c..c).
        const rectRefl = ([px, py]) => [rectReverse ? full - px : px, rectFlip ? -py : py];
        const local = { W: [0, 0], N: [c, -c], E: [full, 0], S: [c, c] };
        for (const key of Object.keys(local)) local[key] = rectRefl(local[key]);
        const paths = [
          `M 0,0 L ${c - 42.639},${-(c - 42.639)} M 36.275,-49.002 L 49.002,-36.275 M 42.639,-42.639 L ${c},${-c}`,
          `M ${c},${-c} L 110.097,-42.639 M 125.37,-40.093 L 112.642,-27.365 M 119.006,-33.729 L ${full},0`,
          `M ${full},0 L 119.006,33.729 M 112.642,27.365 L 125.37,40.093 M 110.097,42.639 L ${c},${c}`,
          `M ${c},${c} L 42.639,42.639 M 49.002,36.275 L 36.275,49.002 M 33.729,33.729 L 0,0`
        ];
        const triangles = [
          '27.365,-40.093 42.639,-42.639 40.093,-27.365',
          '116.46,-49.002 119.006,-33.729 103.733,-36.275',
          '103.733,36.275 119.006,33.729 116.46,49.002',
          '40.093,27.365 42.639,42.639 27.365,40.093'
        ];
        const rad = -theta * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
        const tf = ([px, py]) => [x + px * cos - py * sin, y + px * sin + py * cos];
        let body = '';
        for (const d of paths) {
          // Rotate the fixed paths by baking them into a group instead.
          body += `<path d="${d}" ${stroke}/>`;
        }
        for (const points of triangles) {
          body += `<polygon points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
        }
        const rectInner = (rectFlip || rectReverse)
          ? ` transform="translate(${rectReverse ? full : 0} 0) scale(${rectReverse ? -1 : 1} ${rectFlip ? -1 : 1})"`
          : '';
        elements.push(`<g transform="translate(${x} ${y}) rotate(${-theta})"><g${rectInner}>${body}</g></g>`);
        const anchors = Object.create(null);
        for (const [key, point] of Object.entries(local)) anchors[key] = tf(point);
        for (const corner of [[0, 0], [c, -c], [full, 0], [c, c]]) {
          const [bx, by] = tf(corner);
          bounds(bx - 4, by - 4, bx + 4, by + 4);
        }
        if (name) {
          names[name] = anchors;
          namedBoxes[name] = { ...elemBox };
        }
        log(`Rectifier: at (${x / 36}, ${-y / 36})`);
        continue;
      }
      if (type === 'DualVacuumTube') {
        // Schemdraw's DualVacuumTube (elements/tubes.py): two elements in one
        // envelope, width = 1.5·tube_w, each element offset by ±0.2·width.
        const allowed = ['at', 'anchor', 'theta', 'flip', 'reverse', 'color', 'grids_left', 'grids_right', 'heater', 'cathode', 'anodetype'];
        if (selectedDirection || length !== null || Object.keys(options).some(key => !allowed.includes(key))) throw new Error('DualVacuumTube supports at, anchor, theta, color, grids_left, grids_right, heater, cathode, and anodetype.');
        const intOpt = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (typeof options[key] !== 'string' || !/^\d+$/.test(options[key]) || Number(options[key]) > 100) throw new Error(`${key} must be a non-negative integer.`);
          return Number(options[key]);
        };
        const gridsLeft = intOpt('grids_left', 1), gridsRight = intOpt('grids_right', 1);
        let heater = true;
        if ('heater' in options) {
          if (!['True', 'False'].includes(options.heater)) throw new Error('heater must be True or False.');
          heater = options.heater === 'True';
        }
        if ('cathode' in options && options.cathode !== 'heated') throw new Error('DualVacuumTube only supports cathode="heated".');
        if ('anodetype' in options && options.anodetype !== 'plate') throw new Error('DualVacuumTube only supports anodetype="plate".');
        let theta = 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          theta = Number(options.theta);
        }
        const TUBE_W = 1.75 * 36, WIDTH = TUBE_W * 1.5, H = TUBE_W;
        const GRID_W = TUBE_W * 0.4, GRID_GAP = TUBE_W / 9, DOT_R = 0.075 * 36;
        const halfW = WIDTH / 2, elemLeft = -WIDTH * 0.2, elemRight = WIDTH * 0.2;
        const sq2 = (TUBE_W / 2) / Math.SQRT2;
        const localAnchors = {
          N: [0, 0], S: [0, H], E: [halfW, H / 2], W: [-halfW, H / 2],
          NE: [sq2, TUBE_W / 2 - sq2], NW: [-sq2, TUBE_W / 2 - sq2],
          SE: [sq2, TUBE_W / 2 + sq2], SW: [-sq2, TUBE_W / 2 + sq2]
        };
        const dualFlip = 'flip' in options, dualReverse = 'reverse' in options;
        // SegmentPoly with cornerradius: Schemdraw applies _flipreverse() to the
        // vertices and only then rounds them. Mirroring the rounded path instead
        // leaves a 0.57 px residual at the degenerate corner radius (H/2), so the
        // envelope is rounded separately from the inner body.
        const envVerts = [[-halfW, 0], [halfW, 0], [halfW, -H], [-halfW, -H]];
        const envOrder = (dualReverse ? [...envVerts].reverse() : envVerts)
          .map(([px, py]) => [dualReverse ? -px : px, dualFlip ? -py : py]);
        const envelope = `<path d="${roundCornersPath(envOrder, Math.min(halfW, H / 2), true)}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
        let body = '';
        const segLine = (x1, y1, x2, y2, lw = 2) => { body += `<path d="M ${x1},${y1} L ${x2},${y2}" fill="none" stroke="${color}" stroke-width="${lw}" stroke-linecap="round"/>`; };
        const drawElement = (xc, grids, suffix) => {
          // Schemdraw works in y-up coordinates with the anode at y=0; here y
          // grows downward, so grid_top/grid_bottom/cathode are mirrored.
          const gridTop = H / 2 - (Math.max(0, grids - 1) * GRID_GAP) / 2;
          const gridBot = gridTop + GRID_GAP * Math.max(0, grids - 1);
          const gridLeft = xc - GRID_W / 2, gridRight = xc + GRID_W / 2;
          const anodeY = gridTop - GRID_GAP;
          segLine(gridLeft, anodeY, gridRight, anodeY);
          segLine(xc, 0, xc, anodeY);
          localAnchors[`anode${suffix}`] = [xc, 0];
          const nDashes = 3, xGap = GRID_W / (nDashes + 2), dashW = (GRID_W - xGap * (nDashes - 1)) / nDashes;
          for (let j = 0; j < grids; j++) {
            const gy = gridTop + GRID_GAP * j;
            for (let i = 0; i < nDashes; i++) {
              const gx = gridLeft + i * (dashW + xGap);
              segLine(gx, gy, gx + dashW, gy);
            }
            if (grids === 1) {
              localAnchors[`grid${suffix}`] = [gridLeft - xGap, gy];
              localAnchors[`grid${suffix}_R`] = [gridRight + xGap, gy];
            } else {
              localAnchors[`grid${suffix}_${j + 1}`] = [gridLeft - xGap, gy];
              localAnchors[`grid${suffix}_${j + 1}R`] = [gridRight + xGap, gy];
            }
          }
          const catY = gridBot + GRID_GAP, catDrop = DOT_R * 2;
          body += `<path d="M ${gridLeft},${catY + catDrop} L ${gridLeft},${catY} L ${gridRight},${catY} L ${gridRight},${catY + catDrop}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
          localAnchors[`cathode${suffix}`] = [gridLeft, catY + catDrop];
          localAnchors[`cathode${suffix}_R`] = [gridRight, catY + catDrop];
          return catY;
        };
        const catA = drawElement(elemLeft, gridsLeft, 'A');
        const catB = drawElement(elemRight, gridsRight, 'B');
        if (heater) {
          const catY = Math.max(catA, catB);
          const heatTop = catY + GRID_GAP * 1.25;
          const heatLeft = -GRID_W / 3.5, heatRight = GRID_W / 3.5;
          const heatBot = H + GRID_GAP, heatBend = heatTop + Math.SQRT2 * heatRight;
          body += `<path d="M ${heatLeft},${heatBot} L ${heatLeft},${heatBend} L 0,${heatTop} L ${heatRight},${heatBend} L ${heatRight},${heatBot}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
          localAnchors.heat1 = [heatLeft, heatBot];
          localAnchors.heat2 = [heatRight, heatBot];
        }
        // Element._flipreverse(): the envelope is centred on x = 0 and spans
        // y = 0..H on screen, so the mirrors are about x = 0 and y = 0.
        const dualRefl = ([px, py]) => [dualReverse ? -px : px, dualFlip ? -py : py];
        for (const key of Object.keys(localAnchors)) localAnchors[key] = dualRefl(localAnchors[key]);
        if ('anchor' in options && !Object.prototype.hasOwnProperty.call(localAnchors, options.anchor)) throw new Error(`Unknown anchor: ${options.anchor}`);
        const origin = 'at' in options ? atPoint(options.at) : [x, y];
        const offset = 'anchor' in options ? localAnchors[options.anchor] : [0, 0];
        const rad = -theta * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
        const tf = ([px, py]) => [origin[0] + (px - offset[0]) * cos - (py - offset[1]) * sin, origin[1] + (px - offset[0]) * sin + (py - offset[1]) * cos];
        const transform = `translate(${origin[0]} ${origin[1]})`
          + (theta ? ` rotate(${-theta})` : '')
          + (offset[0] || offset[1] ? ` translate(${-offset[0]} ${-offset[1]})` : '');
        // A real transform attribute: `scale(...)` written as a bare attribute
        // was not valid SVG and left the body unmirrored.
        const dualInner = (dualFlip || dualReverse)
          ? ` transform="scale(${dualReverse ? -1 : 1} ${dualFlip ? -1 : 1})"`
          : '';
        elements.push(`<g transform="${transform}">${envelope}${dualInner ? `<g${dualInner}>${body}</g>` : body}</g>`);
        labels.forEach((label, i) => {
          if (label.rotate !== undefined) throw new Error('DualVacuumTube does not support label rotation.');
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          if (label.loc) {
            if (!Object.prototype.hasOwnProperty.call(localAnchors, label.loc)) throw new Error(`Unknown DualVacuumTube label anchor: ${label.loc}`);
            const [px, py] = localAnchors[label.loc];
            const hints = { NE: [.12, .12, 'left'], NW: [-.12, .12, 'right'], SE: [.12, -.12, 'left'], SW: [-.12, -.12, 'right'] }[label.loc];
            const ox = hints ? hints[0] : (Array.isArray(label.ofst) ? label.ofst[0] : 0);
            const oy = hints ? hints[1] : (Array.isArray(label.ofst) ? label.ofst[1] : (label.ofst == null ? 0.1 : label.ofst));
            const halign = hints ? hints[2] : 'center', valign = 'center';
            const [lx, ly] = tf([px + ox * 36, py - oy * 36]);
            const anchor = { left: 'start', center: 'middle', right: 'end' }[label.halign || halign];
            elements.push(`<text x="${lx}" y="${ly - size}" dominant-baseline="central" text-anchor="${anchor}"${textFill} font-family="sans-serif" font-size="${size}"><tspan x="${lx}" dy="${size}">${labelContent(label.text)}</tspan></text>`);
            return;
          }
          const [lx, ly] = tf([0, -0.1 * 36 - i * (size + 2)]);
          elements.push(`<text x="${lx}" y="${ly - size}" dominant-baseline="ideographic" text-anchor="middle"${textFill} font-family="sans-serif" font-size="${size}"><tspan x="${lx}" dy="${size}">${labelContent(label.text)}</tspan></text>`);
        });
        const anchors = Object.create(null);
        for (const [key, point] of Object.entries(localAnchors)) anchors[key] = tf(point);
        // Mirror the extent together with the body so the viewBox covers the
        // flipped tube (the heater reaches H + GRID_GAP below the envelope).
        const yTop = dualFlip ? -H : 0, yBottom = dualFlip ? 0 : H;
        for (const corner of [[-halfW, yTop], [halfW, yTop], [halfW, yBottom], [-halfW, yBottom]]) {
          const [bx, by] = tf(corner);
          bounds(bx, by, bx, by);
        }
        if (name) {
          names[name] = anchors;
          namedTypes[name] = type;
          namedDirs[name] = [1, 0];
          namedBoxes[name] = { ...elemBox };
        }
        log(`DualVacuumTube: at (${origin[0] / 36}, ${-origin[1] / 36})`);
        continue;
      }
      if (['VacuumTube', 'TubeDiode', 'Triode', 'Tetrode', 'Pentode', 'NixieTube'].includes(type)) {
        // Schemdraw elements/tubes.py. The generic TubeBase geometry is shared
        // through vacuumTubeParts()/nixieTubeParts(); each type only fixes the
        // grid count, cathode style and anchor aliases, exactly as the Python
        // subclasses do.
        const allowed = ['at', 'anchor', 'theta', 'color', 'heater', 'split',
          ...(type === 'NixieTube' ? ['anodes', 'cathode', 'anodetype', 'grid'] : []),
          'flip', 'reverse',
          ...(type === 'VacuumTube' ? ['cathode', 'anodetype', 'grids'] : []),
          ...(type === 'Pentode' ? ['strap'] : [])];
        if (selectedDirection || length !== null || Object.keys(options).some(key => !allowed.includes(key))) {
          throw new Error(`${type} supports at, anchor, theta, color${type === 'NixieTube' ? ', anodes, cathode, anodetype, grid' : ''}${type === 'VacuumTube' ? ', cathode, anodetype, grids' : ''}, heater, split${type === 'Pentode' ? ', strap' : ''}, and labels.`);
        }
        const bool = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (!['True', 'False'].includes(options[key])) throw new Error(`${key} must be True or False.`);
          return options[key] === 'True';
        };
        let theta = 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          theta = Number(options.theta);
        }
        const split = options.split === undefined ? 'none' : options.split;
        if (!['none', 'left', 'right'].includes(split)) throw new Error('split must be none, left, or right.');

        let parts;
        if (type === 'NixieTube') {
          const anodes = 'anodes' in options ? Number(options.anodes) : 3;
          if (!Number.isSafeInteger(anodes) || anodes < 1 || anodes > 32) throw new Error('anodes must be an integer between 1 and 32.');
          const cathode = options.cathode === undefined ? 'T' : options.cathode;
          if (!['T', 'cold', 'heated', 'none'].includes(cathode)) throw new Error('NixieTube cathode must be T, cold, heated, or none.');
          const anodetype = options.anodetype === undefined ? 'narrow' : options.anodetype;
          if (!['narrow', 'dot'].includes(anodetype)) throw new Error('NixieTube anodetype must be narrow or dot.');
          parts = nixieTubeParts({ anodes, cathode, anodetype, grid: bool('grid', false) });
        } else {
          const cathode = options.cathode === undefined ? 'heated' : options.cathode;
          if (!['heated', 'cold', 'none'].includes(cathode)) throw new Error('cathode must be heated, cold, or none.');
          const anodetype = options.anodetype === undefined ? 'plate' : options.anodetype;
          if (!['plate', 'dot', 'narrow', 'none'].includes(anodetype)) throw new Error('anodetype must be plate, dot, narrow, or none.');
          let grids = 1;
          if (type === 'TubeDiode') grids = 0;
          else if (type === 'Triode') grids = 1;
          else if (type === 'Tetrode') grids = 2;
          else if (type === 'Pentode') grids = 3;
          else if (type === 'VacuumTube' && 'grids' in options) {
            grids = Number(options.grids);
            if (!Number.isSafeInteger(grids) || grids < 0 || grids > 8) throw new Error('grids must be an integer between 0 and 8.');
          }
          const heaterDefault = type === 'VacuumTube';
          parts = vacuumTubeParts({
            grids, cathode, anodetype, split,
            heater: bool('heater', heaterDefault)
          });
          // Anchor aliases, mirroring the Python subclasses.
          const alias = (from, to) => {
            if (parts.anchors[from]) parts.anchors[to] = parts.anchors[from];
            if (parts.labelHints[from]) parts.labelHints[to] = parts.labelHints[from];
          };
          if (type === 'Triode') {
            alias('grid', 'control'); alias('grid_R', 'control_R');
          }
          if (type === 'Tetrode') {
            alias('grid_1', 'screen'); alias('grid_1R', 'screen_R');
            alias('grid_2', 'control'); alias('grid_2R', 'control_R');
          }
          if (type === 'Pentode') {
            alias('grid_1', 'suppressor'); alias('grid_1R', 'suppressor_R');
            alias('grid_2', 'screen'); alias('grid_2R', 'screen_R');
            alias('grid_3', 'control'); alias('grid_3R', 'control_R');
            if (bool('strap', false) && parts.anchors.cathode_R && parts.anchors.suppressor_R) {
              const c = [parts.anchors.cathode_R[0], parts.anchors.cathode_R[1] + TUBE_DOT * 2];
              // Schemdraw uses grid_w/2 here, not the suppressor anchor's x.
              const s = [TUBE_GRID_W / 2, parts.anchors.suppressor_R[1]];
              const r = [c[0] + TUBE_YGAP * 0.75, c[1] + TUBE_YGAP / 2];
              const r2 = [r[0], s[1] - TUBE_YGAP / 2];
              parts.lines.push({ pts: [c, r, r2, s], lw: 2 });
            }
          }
        }

        const origin = 'at' in options ? atPoint(options.at) : [x, y];
        const anchorName = options.anchor === undefined ? null : options.anchor;
        if (anchorName !== null && !Object.prototype.hasOwnProperty.call(parts.anchors, anchorName)) {
          throw new Error(`Unknown ${type} anchor: ${anchorName}`);
        }
        // parts.anchors are in Schemdraw's y-up frame; tf() works in screen
        // coordinates, so the y component is negated here.
        // Element._flipreverse(): flip mirrors about y = 0; reverse mirrors about
        // the `center` anchor when the element defines one, otherwise about the
        // middle of the drawn bbox (Element.get_bbox(includetext=False)).
        const tubeFlip = 'flip' in options, tubeReverse = 'reverse' in options;
        const tubeBounds = tubeBBox(parts);
        const reverseCenter = parts.anchors.center
          ? parts.anchors.center[0]
          : (tubeBounds.xmin + tubeBounds.xmax) / 2;

        const refl = ([px, py]) => [tubeReverse ? 2 * reverseCenter - px : px, tubeFlip ? -py : py];
        const offset = anchorName === null ? [0, 0] : (() => {
          const [mx, my] = refl(parts.anchors[anchorName]);
          return [mx, -my];
        })();
        const rad = -theta * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
        const tf = ([px, py]) => [
          origin[0] + (px - offset[0]) * cos - (py - offset[1]) * sin,
          origin[1] + (px - offset[0]) * sin + (py - offset[1]) * cos
        ];

        // Mirror the local y-up points before converting to screen coordinates
        // (Element._flipreverse), instead of wrapping the emitted group in a
        // scale(1 -1): the group form double-applied the inversion to segments
        // built with an explicit -py, which shifted the cathode arms by 5.4 px.
        let body = '';
        for (const line of parts.lines) {
          if (line.round) {
            // Rebuild the rounded outline from mirrored vertices so the corner
            // arcs are generated in the mirrored frame (Schemdraw rounds after
            // Element._flipreverse).
            // SegmentPoly.doreverse() mirrors AND reverses the vertex order;
            // without the reversal the corner arcs start at a different sample.
            const base = tubeReverse ? [...line.verts].reverse() : line.verts;
            const verts = base.map(refl);
            body += `<path d="${roundCornersPath(verts, line.radius, true)}" fill="none" stroke="${color}" stroke-width="${line.lw}" stroke-linecap="round" stroke-linejoin="round"/>`;
            continue;
          }
          const d = line.pts.map(([px, py], i) => {
            const [mx, my] = refl([px, py]);
            return `${i ? 'L' : 'M'} ${mx.toFixed(3)},${(-my).toFixed(3)}`;
          }).join(' ');
          body += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${line.lw}" stroke-linecap="round" stroke-linejoin="round"/>`;
        }
        for (const [cx, cy, r, lw] of parts.circles) {
          body += `<circle cx="${cx.toFixed(3)}" cy="${(-cy).toFixed(3)}" r="${r}" fill="none" stroke="${color}" stroke-width="${lw}"/>`;
        }
        const transformGroup = `translate(${origin[0]} ${origin[1]})`
          + (theta ? ` rotate(${-theta})` : '')
          + (offset[0] || offset[1] ? ` translate(${-offset[0]} ${-offset[1]})` : '');
        elements.push(`<g transform="${transformGroup}">${body}</g>`);

        labels.forEach((label, i) => {
          if (label.rotate !== undefined) throw new Error(`${type} does not support label rotation.`);
          if (label.loc) {
            if (!Object.prototype.hasOwnProperty.call(parts.anchors, label.loc)) throw new Error(`Unknown ${type} label anchor: ${label.loc}`);
            // TubeBase registers a _labelhints entry per terminal. A user
            // `ofst` overrides the hint offset, while halign/valign still come
            // from the hint unless the label sets them explicitly.
            const hint = parts.labelHints[label.loc];
            const size = label.fontsize === undefined
              ? (hint && hint.fontsize !== undefined ? hint.fontsize : labelSize)
              : label.fontsize;
            const halign = label.halign || (hint && hint.halign) || 'center';
            const valign = label.valign || (hint && hint.valign) || 'center';
            let ox = 0, oy = 0.1;
            if (label.ofst != null) {
              if (Array.isArray(label.ofst)) [ox, oy] = label.ofst;
              else {
                [ox, oy] = {
                  'center-bottom': [0, label.ofst], 'right-bottom': [-label.ofst, label.ofst],
                  'right-center': [-label.ofst, 0], 'right-top': [-label.ofst, -label.ofst],
                  'center-top': [0, -label.ofst], 'left-top': [label.ofst, -label.ofst],
                  'left-center': [label.ofst, 0], 'left-bottom': [label.ofst, label.ofst]
                }[`${halign}-${valign}`] || [0, label.ofst];
              }
            } else if (hint && hint.ofst) [ox, oy] = hint.ofst;
            const [px, py] = parts.anchors[label.loc];
            const [lx, ly] = tf([px + ox * 36, -py - oy * 36]);
            const anchorText = { left: 'start', center: 'middle', right: 'end' }[halign];
            const baseline = valign === 'center' ? 'central' : valign === 'top' ? 'hanging' : 'ideographic';
            // SegmentText draws at the anchor with a tspan dy of one font size,
            // so the text y attribute sits one line above the anchor.
            const yAttr = ly - size;
            elements.push(`<text x="${lx}" y="${yAttr}" text-anchor="${anchorText}" dominant-baseline="${baseline}"${textFill} font-family="sans-serif" font-size="${size}"><tspan x="${lx}" dy="${size}">${labelContent(label.text)}</tspan></text>`);
            return;
          }
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          const [lx, ly] = tf([0, -0.1 * 36 - i * (size + 2)]);
          elements.push(`<text x="${lx}" y="${ly - size}" dominant-baseline="ideographic" text-anchor="middle"${textFill} font-family="sans-serif" font-size="${size}"><tspan>${labelContent(label.text)}</tspan></text>`);
        });

        const anchors = Object.create(null);
        for (const [key, point] of Object.entries(parts.anchors)) {
          const [mx, my] = refl(point);
          anchors[key] = tf([mx, -my]);
        }
        for (const [cx, cy] of [[-parts.width / 2, 0], [parts.width / 2, 0],
          [parts.width / 2, -parts.height], [-parts.width / 2, -parts.height]]) {
          const [bx, by] = tf([cx, cy]);
          bounds(bx, by, bx, by);
        }
        if (name) {
          names[name] = anchors;
          namedTypes[name] = type;
          namedDirs[name] = [1, 0];
          namedBoxes[name] = { ...elemBox };
        }
        log(`${type}: at (${origin[0] / 36}, ${-origin[1] / 36})`);
        continue;
      }
      if (['Nullor', 'VoltageTransactor', 'TransimpedanceTransactor', 'CurrentTransactor', 'TransadmittanceTransactor'].includes(type)) {
        // Schemdraw's two-port transactor family (elements.twoports): a
        // 2.15 x 1.9 unit box with in_p/in_n/out_p/out_n anchors, a vertical
        // input branch, and a controlled source on the output side.
        const allowed = ['at', 'anchor', 'theta', 'color', 'reverse', 'flip', 'reverse_output'];
        if (selectedDirection || length !== null || Object.keys(options).some(key => !allowed.includes(key))) throw new Error(`${type} supports at, anchor, theta, color, reverse, flip, and reverse_output.`);
        if (labels.some(label => label.items || label.halign != null || label.ofst != null || label.rotate !== undefined || label.loc != null)) throw new Error(`${type} does not support label arguments.`);
        let reverseOutput = false;
        if ('reverse_output' in options) {
          if (type === 'Nullor') throw new Error('reverse_output is not supported for Nullor.');
          if (!['True', 'False'].includes(options.reverse_output)) throw new Error('reverse_output must be True or False.');
          reverseOutput = options.reverse_output === 'True';
        }
        let theta = 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          theta = Number(options.theta);
        }
        // Schemdraw ElementTwoport defaults: width=2.15, unit=1.5,
        // boxpadx=0.2, boxpady=0.2, minw=0.5, tp_termlen=0.5.
        const BOX_W = 2.15 * 36;
        const BOX_PAD = 0.2 * 36;
        const MINW = 0.5 * 36;
        const CHILD_LEN = 1.5 * 36;
        const HW = BOX_W / 2;
        const HH = (CHILD_LEN + 2 * BOX_PAD) / 2;
        const TERM_LEN = 0.5 * 36;
        const TERMX = HW + TERM_LEN;
        const TERMY = CHILD_LEN / 2;
        // ElementTwoport places each child at boxpadx + max(child height/2, minw/2).
        // Line and Gap report zero height before placement, Nullator/Norator 0.5;
        // the controlled source glyph is 1 unit tall.
        const childPad = type === 'Nullor' ? 0.3 * 36 : BOX_PAD;
        const outputHalf = (type === 'Nullor' ? 0.5 : 1) * 36 / 2;
        const inX = -HW + childPad + MINW / 2;
        const outX = HW - childPad - outputHalf;
        const localAnchors = { in_p: [-TERMX, -TERMY], in_n: [-TERMX, TERMY], out_p: [TERMX, -TERMY], out_n: [TERMX, TERMY], center: [0, 0] };
        // ElementCompound.__init__ exposes every anchor of the named child
        // elements as `<attribute>.<anchor>`. The input is a Line (no lead
        // shortening) or a Gap/Nullator (0.25-unit leads); both outputs have
        // 0.25-unit leads.
        const inputLine = type === 'TransimpedanceTransactor' || type === 'CurrentTransactor';
        const childLead = 0.25 * 36;
        for (const [prefix, cx, branch] of [
          ['input_component', inX, inputLine ? 0 : TERMY - childLead],
          ['output_component', outX, TERMY - childLead]
        ]) {
          localAnchors[`${prefix}.start`] = [cx, -TERMY];
          localAnchors[`${prefix}.istart`] = [cx, -branch];
          localAnchors[`${prefix}.iend`] = [cx, branch];
          localAnchors[`${prefix}.end`] = [cx, TERMY];
          localAnchors[`${prefix}.center`] = [cx, 0];
        }
        if ('anchor' in options && !Object.prototype.hasOwnProperty.call(localAnchors, options.anchor)) throw new Error(`Unknown anchor: ${options.anchor}`);
        const reverse = 'reverse' in options, flip = 'flip' in options;
        const reflect = ([px, py]) => [reverse ? -px : px, flip ? -py : py];
        // Without an anchor Schemdraw puts the box's left edge at the cursor.
        const offset = 'anchor' in options ? reflect(localAnchors[options.anchor]) : [-1.075 * 36, 0];
        const origin = 'at' in options ? atPoint(options.at) : [x, y];
        const rad = -theta * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
        const tf = ([px, py]) => {
          let [qx, qy] = reflect([px, py]);
          qx -= offset[0]; qy -= offset[1];
          return [origin[0] + qx * cos - qy * sin, origin[1] + qx * sin + qy * cos];
        };
        let body = '';
        const path = d => { body += `<path d="${d}" ${stroke}/>`; };
        const seg = (x1, y1, x2, y2) => path(`M ${x1},${y1} L ${x2},${y2}`);
        path(`M ${-HW},${-HH} L ${HW},${-HH} L ${HW},${HH} L ${-HW},${HH} Z`);
        for (const side of [-1, 1]) {
          seg(-TERMX, side * TERMY, -HW, side * TERMY);
          seg(inX, side * TERMY, -HW, side * TERMY);
          seg(outX, side * TERMY, HW, side * TERMY);
          seg(HW, side * TERMY, TERMX, side * TERMY);
        }
        if (type === 'Nullor') {
          // Nullator ellipse on the input side, norator (two circles) on the output side.
          body += `<ellipse cx="${inX}" cy="0" rx="9" ry="18" fill="none" stroke="${color}" stroke-width="2"/>`;
          body += `<circle cx="${outX}" cy="-9" r="9" fill="none" stroke="${color}" stroke-width="2"/>`;
          body += `<circle cx="${outX}" cy="9" r="9" fill="none" stroke="${color}" stroke-width="2"/>`;
          seg(inX, -TERMY, inX, -18);
          seg(inX, 18, inX, TERMY);
          seg(outX, -TERMY, outX, -18);
          seg(outX, 18, outX, TERMY);
        } else {
          const inputLine = type === 'TransimpedanceTransactor' || type === 'CurrentTransactor';
          if (inputLine) {
            seg(inX, -TERMY, inX, TERMY);
            // ElementTwoport adds CurrentLabelInline(ofst=-0.15, headlength=0.3)
            // to the input branch. Its arrowhead is 0.3 wide, the base sits at
            // the segment start and the tip 2 px short of the segment end.
            const inlineHead = 0.3 * 36, inlineOfst = 0.15 * 36;
            body += `<path d="M ${inX},${inlineOfst - 2} L ${inX - inlineHead / 2},${-inlineOfst} L ${inX + inlineHead / 2},${-inlineOfst} Z" fill="${color}" stroke="${color}"/>`;
          }
          seg(outX, -TERMY, outX, -18);
          seg(outX, 18, outX, TERMY);
          path(`M ${outX},-18 L ${outX + 18},0 L ${outX},18 L ${outX - 18},0 Z`);
          if (type === 'VoltageTransactor' || type === 'TransimpedanceTransactor') {
            // SourceControlledV: ±0.2 marks at 0.25 and 0.75 along the 1-unit body.
            const markArm = 0.2 * 36 / 2, markY = 0.25 * 36;
            const plusY = reverseOutput ? markY : -markY, minusY = -plusY;
            path(`M ${outX - markArm},${plusY} L ${outX + markArm},${plusY} M ${outX},${plusY - markArm} L ${outX},${plusY + markArm}`);
            seg(outX - markArm, minusY, outX + markArm, minusY);
          } else {
            // SourceControlledI: arrow .25→.75 with arrowlength .25, width .15.
            const arrowTip = 0.25 * 36 - 2, arrowHalf = 0.15 * 36 / 2, arrowTail = -0.25 * 36;
            const tipY = reverseOutput ? arrowTip : -arrowTip;
            body += `<path d="M ${outX},${tipY} L ${outX - arrowHalf},0 L ${outX + arrowHalf},0 Z" fill="${color}" stroke="${color}"/>`;
            seg(outX, 0, outX, reverseOutput ? arrowTail : -arrowTail);
          }
        }
        const transform = `translate(${origin[0]} ${origin[1]})`
          + (theta ? ` rotate(${-theta})` : '')
          + ` translate(${-offset[0]} ${-offset[1]}) scale(${reverse ? -1 : 1} ${flip ? -1 : 1})`;
        elements.push(`<g transform="${transform}">${body}</g>`);
        // Voltage transactors mark the input port. Schemdraw places these as
        // SegmentText at `input_component.start/end ± 0.05` with
        // align=('right','bottom'/'top'); reverse/flip mirror the alignment.
        if (type === 'VoltageTransactor' || type === 'TransadmittanceTransactor') {
          // 0.75 is the input branch half-height; SegmentText offsets by 0.05.
          const signY = (0.75 - 0.05) * 36;
          const signAnchor = reverse ? 'start' : 'end';
          for (const [mark, dy, baseline] of [
            ['+', -signY, flip ? 'ideographic' : 'hanging'],
            ['−', signY, flip ? 'hanging' : 'ideographic']
          ]) {
            const [tx, ty] = tf([inX, dy]);
            elements.push(`<text x="${tx}" y="${ty - labelSize}" dominant-baseline="${baseline}" text-anchor="${signAnchor}"${textFill} font-family="sans-serif" font-size="${labelSize}"><tspan x="${tx}" dy="${labelSize}">${mark}</tspan></text>`);
          }
        }
        // Element labels sit above the box, centred, regardless of flip.
        // Schemdraw's label anchor is bbox.ymax + lblofst (0.1 unit); text_tosvg
        // writes y = anchor - fontsize with an ideographic baseline and a
        // tspan dy=fontsize.
        labels.forEach((label, i) => {
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          const lx = origin[0];
          const anchorY = origin[1] - HH - 0.1 * 36 - i * (size + 2);
          elements.push(`<text x="${lx}" y="${anchorY - size}" dominant-baseline="ideographic" text-anchor="middle"${textFill} font-family="sans-serif" font-size="${size}"><tspan x="${lx}" dy="${size}">${labelContent(label.text)}</tspan></text>`);
        });
        const anchors = Object.create(null);
        for (const [key, point] of Object.entries(localAnchors)) anchors[key] = tf(point);
        for (const corner of [[-HW, -HH], [HW, -HH], [HW, HH], [-HW, HH]]) {
          const [bx, by] = tf(corner);
          bounds(bx, by, bx, by);
        }
        if (labels.length) bounds(origin[0] - 60, origin[1] - HH - 0.1 * 36 - labelSize * (labels.length + 1) - labels.length * 2, origin[0] + 60, origin[1] - HH);
        if (name) {
          names[name] = anchors;
          namedTypes[name] = type;
          namedDirs[name] = [1, 0];
          namedBoxes[name] = { x1: origin[0] - HW, y1: origin[1] - HH, x2: origin[0] + HW, y2: origin[1] + HH };
        }
        log(`${type}: at (${origin[0] / 36}, ${-origin[1] / 36})`);
        continue;
      }
      if (type === 'CurrentLabel') {
        // Schemdraw's CurrentLabel: a short arrow drawn parallel to an existing
        // element, offset to one side, with the label outside the arrow.
        const allowed = ['at', 'color', 'top', 'ofst', 'length', 'reverse', 'headlength', 'headwidth'];
        if (selectedDirection || Object.keys(options).some(key => !allowed.includes(key))) throw new Error('CurrentLabel supports at, top, ofst, length, reverse, headlength, headwidth, color, and labels.');
        if (!('at' in options)) throw new Error('CurrentLabel requires at=<element>.');
        const ref = String(options.at);
        let cx0, cy0, dir = [1, 0];
        if (Object.prototype.hasOwnProperty.call(names, ref)) {
          [cx0, cy0] = names[ref].center;
          dir = namedDirs[ref] || [1, 0];
        } else if (/^\(/.test(ref)) {
          [cx0, cy0] = atPoint(ref);
        } else throw new Error(`CurrentLabel at must name an element: ${ref}`);
        const number = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (typeof options[key] !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key]) || !(Number(options[key]) >= 0)) throw new Error(`CurrentLabel ${key} must be a positive number.`);
          return Number(options[key]) * 36;
        };
        const len = number('length', 2 * 36);
        const ofst = number('ofst', 0.15 * 36);
        const headLen = number('headlength', 0.3 * 36);
        const headW = number('headwidth', 0.2 * 36);
        let onTop = true;
        if ('top' in options) {
          if (!['True', 'False'].includes(options.top)) throw new Error('CurrentLabel top must be True or False.');
          onTop = options.top === 'True';
        }
        let reverse = 'reverse' in options;
        // Schemdraw keeps a per-element hint (`ilabel`) saying which side the
        // current arrow belongs on. `reverse` on the element mirrors it.
        const ilabel = {
          AnalogNFet: 'left', AnalogPFet: 'left', AnalogBiasedFet: 'left',
          NFet: 'left', PFet: 'left', JFet: 'left', Hemt: 'left',
          NMos: 'right', PMos: 'right', Bjt: 'right',
          NFet2: 'bottom', PFet2: 'bottom', JFet2: 'bottom', Bjt2: 'bottom'
        }[namedTypes[ref] || ''] || 'top';
        const flipSide = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
        let side = ilabel;
        // A reversed element mirrors the arrow to the other side.
        if (namedReversed[ref] && (side === 'left' || side === 'right')) side = flipSide[side];
        if (!onTop && (side === 'top' || side === 'bottom')) side = flipSide[side];
        let ox, oy, ax, ay, bx, by, labelAxis = null;
        if (side === 'left' || side === 'right') {
          // Vertical arrow beside the element, as wide as its channel.
          const box = namedBoxes[ref];
          const anchorX = names[ref].drain ? names[ref].drain[0] : cx0;
          ox = anchorX + (side === 'right' ? ofst : -ofst);
          oy = box && Number.isFinite(box.y1) ? (box.y1 + box.y2) / 2 : cy0;
          ax = ox; ay = oy - len / 2;
          bx = ox; by = oy + len / 2;
        } else {
          const px = -dir[1], py = dir[0];
          const sign = side === 'top' ? -1 : 1;
          // Offset from the element's edge, not its centreline (Schemdraw bbox).
          const [aboveEdge, belowEdge] = sideExtent(namedTypes[ref] || '');
          const edge = side === 'top' ? aboveEdge : belowEdge;
          const total = edge + ofst;
          ox = cx0 + px * sign * total; oy = cy0 + py * sign * total;
          ax = ox - dir[0] * len / 2; ay = oy - dir[1] * len / 2;
          bx = ox + dir[0] * len / 2; by = oy + dir[1] * len / 2;
          labelAxis = { px, py, sign, total };
        }
        const [sx, sy, ex, ey] = reverse ? [bx, by, ax, ay] : [ax, ay, bx, by];
        // Schemdraw shortens the line by the arrow length before drawing the head.
        const ux0 = (ex - sx) / (len || 1), uy0 = (ey - sy) / (len || 1);
        elements.push(`<path d="M ${sx.toFixed(3)},${sy.toFixed(3)} L ${(ex - ux0 * headLen).toFixed(3)},${(ey - uy0 * headLen).toFixed(3)}" ${stroke}/>`);
        const ux = (ex - sx) / (len || 1), uy = (ey - sy) / (len || 1);
        // Schemdraw's arrow(): the tip sits 2px short of the line end and the
        // base is one arrowlength back from the end.
        const tipX = ex - ux * 2, tipY = ey - uy * 2;
        const hx = ex - ux * headLen, hy = ey - uy * headLen;
        elements.push(`<path d="M ${tipX.toFixed(3)},${tipY.toFixed(3)} L ${(hx - uy * headW / 2).toFixed(3)},${(hy + ux * headW / 2).toFixed(3)} L ${(hx + uy * headW / 2).toFixed(3)},${(hy - ux * headW / 2).toFixed(3)} Z" fill="${color}" stroke="${color}"/>`);
        bounds(Math.min(ax, bx) - 6, Math.min(ay, by) - 6, Math.max(ax, bx) + 6, Math.max(ay, by) + 6);
        for (const label of labels) {
          if (label.items || label.halign != null || label.ofst != null || label.rotate !== undefined) throw new Error('CurrentLabel does not support label arguments.');
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          // Schemdraw puts the label just past the arrow's bbox edge (0.1 unit).
          let lx, ly, anchorText = 'middle', baseline = '';
          if (labelAxis) {
            const { px, py, sign, total } = labelAxis;
            const gap = total + 3.6;
            lx = cx0 + px * sign * gap; ly = cy0 + py * sign * gap;
            baseline = sign > 0 ? ' dominant-baseline="hanging"' : '';
          } else {
            const gap = ofst + 3.6;
            lx = ox + (side === 'right' ? gap : -gap);
            ly = oy;
            anchorText = side === 'right' ? 'start' : 'end';
            baseline = ' dominant-baseline="central"';
          }
          elements.push(`<text x="${lx.toFixed(3)}" y="${ly.toFixed(3)}" text-anchor="${anchorText}"${baseline}${textFill} font-family="sans-serif" font-size="${size}">${labelContent(label.text)}</text>`);
          const width = Math.max(size, Array.from(label.text).length * size * 0.71);
          bounds(lx - width, ly - size, lx + width, ly + size);
        }
        log(`CurrentLabel: at=${ref}`);
        continue;
      }
      if (type === 'CurrentLabelInline') {
        // Schemdraw's CurrentLabelInline: a short inline arrow placed on an
        // existing element, used for currents entering or leaving a port.
        const allowed = ['at', 'color', 'direction', 'ofst', 'start', 'headlength', 'headwidth'];
        if (selectedDirection || length !== null || Object.keys(options).some(key => !allowed.includes(key))) throw new Error('CurrentLabelInline supports at, direction, ofst, start, headlength, headwidth, color, and labels.');
        if (!('at' in options)) throw new Error('CurrentLabelInline requires at=<element>.');
        const ref = String(options.at);
        let cx0, cy0, dir = [1, 0];
        if (Object.prototype.hasOwnProperty.call(names, ref)) {
          [cx0, cy0] = names[ref].center;
          dir = namedDirs[ref] || [1, 0];
        } else if (/^\(/.test(ref)) [cx0, cy0] = atPoint(ref);
        else throw new Error(`CurrentLabelInline at must name an element: ${ref}`);
        const signed = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (typeof options[key] !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key])) throw new Error(`CurrentLabelInline ${key} must be a number.`);
          return Number(options[key]);
        };
        const direction = options.direction === undefined ? 'in' : String(options.direction);
        if (!['in', 'out'].includes(direction)) throw new Error('CurrentLabelInline direction must be in or out.');
        let start = true;
        if ('start' in options) {
          if (!['True', 'False'].includes(options.start)) throw new Error('CurrentLabelInline start must be True or False.');
          start = options.start === 'True';
        }
        const headLen = signed('headlength', 0.3) * 36;
        const headW = signed('headwidth', 0.3) * 36;
        if (!(headLen > 0) || !(headW > 0)) throw new Error('CurrentLabelInline headlength and headwidth must be positive numbers.');
        let x0 = signed('ofst', 0.8) * 36, dx = headLen;
        if (direction === 'in') { x0 += headLen; dx = -dx; }
        if (start) { x0 = -x0; dx = -dx; }
        const ux = dir[0], uy = dir[1], sgn = Math.sign(dx) || 1;
        const sx = cx0 + ux * x0, sy = cy0 + uy * x0;
        const ex = cx0 + ux * (x0 + dx), ey = cy0 + uy * (x0 + dx);
        // The arrow base is one headlength before the end; the tip stops 2 px short.
        const hx = ex - ux * headLen * sgn, hy = ey - uy * headLen * sgn;
        const len = Math.abs(dx);
        if (len > headLen) elements.push(`<path d="M ${sx.toFixed(3)},${sy.toFixed(3)} L ${hx.toFixed(3)},${hy.toFixed(3)}" ${stroke}/>`);
        const tipX = ex - ux * 2 * sgn, tipY = ey - uy * 2 * sgn;
        elements.push(`<path d="M ${tipX.toFixed(3)},${tipY.toFixed(3)} L ${(hx - uy * headW / 2).toFixed(3)},${(hy + ux * headW / 2).toFixed(3)} L ${(hx + uy * headW / 2).toFixed(3)},${(hy - ux * headW / 2).toFixed(3)} Z" fill="${color}" stroke="${color}"/>`);
        bounds(Math.min(sx, ex) - 6, Math.min(sy, ey) - 6, Math.max(sx, ex) + 6, Math.max(sy, ey) + 6);
        for (const label of labels) {
          if (label.items || label.halign != null || label.ofst != null || label.rotate !== undefined || label.loc != null) throw new Error('CurrentLabelInline does not support label arguments.');
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          // Schemdraw's lblofst is 0 for this element: the label anchor is the
          // arrow bbox top (headwidth above the centreline).
          const lx = cx0, anchorY = cy0 - headW;
          const ly = anchorY - size;
          elements.push(`<text x="${lx.toFixed(3)}" y="${ly.toFixed(3)}" dominant-baseline="ideographic" text-anchor="middle"${textFill} font-family="sans-serif" font-size="${size}"><tspan x="${lx.toFixed(3)}" dy="${size}">${labelContent(label.text)}</tspan></text>`);
          const width = Math.max(size, Array.from(label.text).length * size * 0.71);
          bounds(lx - width, ly - size, lx + width, ly + size);
        }
        log(`CurrentLabelInline: at=${ref}`);
        continue;
      }
      if (type === 'LoopCurrent') {
        // Schemdraw's LoopCurrent: take four elements (top, right, bottom, left)
        // and draw an elliptical loop arrow inside their bounding box, inset by
        // `pad`, with the label at the loop centre.
        if (selectedDirection || length !== null || ['at', 'to', 'tox', 'toy', 'endpoints', 'anchor', 'theta', 'shift', 'drop', 'hold', 'flip', 'reverse'].some(key => key in options)) throw new Error('LoopCurrent supports elms, pad, direction, theta1, theta2, color, and labels.');
        const match = /^\[\s*([^\]]*)\]\s*$/.exec(options.elms === undefined ? '' : String(options.elms));
        if (!match) throw new Error('LoopCurrent requires elms=[top right bottom left].');
        const refs = match[1].split(/[\s,]+/).filter(Boolean);
        if (refs.length !== 4) throw new Error('LoopCurrent requires exactly four element names.');
        const unknown = refs.find(ref => !Object.prototype.hasOwnProperty.call(namedTypes, ref));
        if (unknown !== undefined) throw new Error(`Unknown element in LoopCurrent: ${unknown}`);
        const halves = refs.map(ref => loopHalfExtent(namedTypes[ref]));
        const axis = ref => {
          const [sx, sy] = names[ref].start, [ex, ey] = names[ref].end;
          return [(sx + ex) / 2, (sy + ey) / 2];
        };
        let padPx = 0.2 * 36;
        if ('pad' in options) {
          if (typeof options.pad !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.pad)) throw new Error('LoopCurrent pad must be a number.');
          padPx = Number(options.pad) * 36;
          if (!Number.isFinite(padPx)) throw new Error('LoopCurrent pad is too large.');
        }
        const [topX, topY] = axis(refs[0]), [rightX] = axis(refs[1]);
        const [, bottomY] = axis(refs[2]), [leftX] = axis(refs[3]);
        const top = topY + halves[0] + padPx, bottom = bottomY - halves[2] - padPx;
        const left = leftX + halves[3] + padPx, right = rightX - halves[1] - padPx;
        if (!(right > left) || !(bottom > top)) throw new Error('LoopCurrent loop has no area.');
        const cx = (left + right) / 2, cy = (top + bottom) / 2;
        const rx = (right - left) / 2, ry = (bottom - top) / 2;
        let theta1 = 35, theta2 = -35;
        for (const key of ['theta1', 'theta2']) {
          if (!(key in options)) continue;
          if (typeof options[key] !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key]) || !Number.isFinite(Number(options[key]))) throw new Error(`LoopCurrent ${key} must be a finite number.`);
          if (key === 'theta1') theta1 = Number(options.theta1); else theta2 = Number(options.theta2);
        }
        const cw = options.direction === undefined || options.direction === 'cw';
        if (options.direction !== undefined && !['cw', 'ccw'].includes(options.direction)) throw new Error('LoopCurrent direction must be cw or ccw.');
        // The backend turns the requested angle into the ellipse's parametric angle.
        const parametric = deg => Math.atan2(rx * Math.sin(deg * Math.PI / 180), ry * Math.cos(deg * Math.PI / 180));
        const t1 = parametric(theta1), t2 = parametric(theta2);
        const startT = cw ? t1 : t2, endT = cw ? t2 + 2 * Math.PI : t1 - 2 * Math.PI;
        const steps = 72, pts = [];
        for (let i = 0; i <= steps; i++) {
          const t = startT + (endT - startT) * i / steps;
          pts.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
        }
        const d = pts.map(([px, py], i) => `${i ? 'L' : 'M'} ${px.toFixed(3)},${py.toFixed(3)}`).join(' ');
        elements.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`);
        // Arrowhead at the end, pointing along the last segment.
        const [ex, ey] = pts[pts.length - 1], [px, py] = pts[pts.length - 2];
        const len = Math.hypot(ex - px, ey - py) || 1;
        const ux = (ex - px) / len, uy = (ey - py) / len;
        const backX = ex - 9 * ux, backY = ey - 9 * uy;
        elements.push(`<path d="M ${ex.toFixed(3)},${ey.toFixed(3)} L ${(backX - 2.7 * uy).toFixed(3)},${(backY + 2.7 * ux).toFixed(3)} L ${(backX + 2.7 * uy).toFixed(3)},${(backY - 2.7 * ux).toFixed(3)} Z" fill="${color}" stroke="${color}"/>`);
        bounds(cx - rx - 4, cy - ry - 4, cx + rx + 4, cy + ry + 4);
        for (const label of labels) {
          if (label.items || label.halign != null || label.ofst != null || label.rotate !== undefined) throw new Error('LoopCurrent does not support label arguments.');
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          elements.push(`<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"${label.color ? ` fill="${label.color}"` : textFill} font-family="sans-serif" font-size="${size}">${labelContent(label.text)}</text>`);
          const width = Math.max(size, Array.from(label.text).length * size * 0.71);
          bounds(cx - width, cy - size, cx + width, cy + size);
        }
        log(`LoopCurrent: ${refs.join(', ')}`);
        continue;
      }
      if (type === 'SevenSegment') {
        const allowedSS = ['at', 'anchor', 'drop', 'theta', 'flip', 'reverse', 'color', 'decimal', 'digit', 'segcolor', 'tilt', 'labelsegments', 'anode', 'cathode'];
        if (labels.some(label => label.items || label.halign != null || label.ofst != null || label.rotate !== undefined) || Object.keys(options).some(key => !allowedSS.includes(key))) throw new Error('SevenSegment supports decimal, digit, segcolor, tilt, labelsegments, anode, cathode, at, anchor, drop, theta, color, and labels.');
        const bool = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (!['True', 'False'].includes(options[key])) throw new Error(`${key} must be True or False.`);
          return options[key] === 'True';
        };
        const decimal = bool('decimal', false), anode = bool('anode', false), cathode = bool('cathode', false), labelsegments = bool('labelsegments', true);
        const digit = options.digit === undefined ? '8' : String(options.digit);
        if (Array.from(digit).length !== 1) throw new Error('digit must be a single character.');
        const segcolor = options.segcolor === undefined ? 'red' : readColor(options.segcolor);
        let tilt = 10;
        if ('tilt' in options) {
          if (typeof options.tilt !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.tilt) || !Number.isFinite(Number(options.tilt))) throw new Error('tilt must be a finite number.');
          tilt = Number(options.tilt);
        }
        if ('at' in options) [x, y] = atPoint(options.at);
        const W = 108, HH = (decimal ? 5.9 : 5.3) * 36;
        // Element._flipreverse(): an Ic carries a `center` anchor, so reverse
        // mirrors about its x (W/2) and flip about y = 0 (screen y = 0).
        const ssFlip = 'flip' in options, ssReverse = 'reverse' in options;
        const ssRefl = ([px, py]) => [ssReverse ? W - px : px, ssFlip ? -py : py];
        const ssText = (content, px, py, anchor, baseline = '', size = 11) => {
          const [lx, ly] = ssRefl([px, py]);
          const a = ssReverse ? ({ start: 'end', end: 'start', middle: 'middle' }[anchor] || anchor) : anchor;
          let b = baseline;
          if (ssFlip) b = baseline === 'hanging' ? 'ideographic' : baseline === 'ideographic' ? 'hanging' : (baseline === '' ? 'hanging' : baseline);
          return `<text x="${lx}" y="${ly}" text-anchor="${a}"${b ? ` dominant-baseline="${b}"` : ''}${textFill} font-family="sans-serif" font-size="${size}">${content}</text>`;
        };
        const slots = decimal ? 8 : 7;
        const pins = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((n, i) => ({ side: 'L', num: n, anchor: n, slot: `${slots - i}/${slots}` }));
        if (decimal) pins.push({ side: 'L', num: 'dp', anchor: 'dp', slot: `1/${slots}` });
        if (anode) pins.push({ side: 'T', num: 'ca', anchor: 'anode' });
        if (cathode) pins.push({ side: 'B', num: 'cc', anchor: 'cathode' });
        const anchors = { center: ssRefl([W / 2, -HH / 2]), xy: ssRefl([0, 0]) };
        let leads = '', texts = '';
        for (const side of ['L', 'R', 'T', 'B']) {
          const list = pins.filter(p => p.side === side);
          const len = side === 'L' || side === 'R' ? HH : W;
          const count = list.length;
          const step = 0.6 * 36;
          const pad = count > 1 ? (len - step * (count - 1)) / 2 : len / 2;
          list.forEach((pin, i) => {
            const idx = pin.slot ? Number(pin.slot.split('/')[0]) - 1 : (count > 1 ? i : 0);
            const z = count > 1 ? pad + idx * step : len / 2;
            const p = side === 'L' ? [0, -z] : side === 'R' ? [W, -z] : side === 'T' ? [z, -HH] : [z, 0];
            const rawEnd = side === 'L' ? [p[0] - 18, p[1]] : side === 'R' ? [p[0] + 18, p[1]] : side === 'T' ? [p[0], p[1] - 18] : [p[0], p[1] + 18];
            const q = ssRefl(p), end = ssRefl(rawEnd);
            leads += `M ${q[0]},${q[1]} L ${end[0]},${end[1]} `;
            if (side === 'L') texts += ssText(pin.num, -2.7, -z - 2.7, 'end');
            else if (side === 'R') texts += ssText(pin.num, W + 2.7, -z - 2.7, 'start');
            else if (side === 'T') texts += ssText(pin.num, z + 2.7, -HH - 2.7, 'start');
            else texts += ssText(pin.num, z + 2.7, 2.7, 'start', 'hanging');
            anchors[pin.anchor] = end;
            anchors[`pin${pin.num}`] = end;
            anchors[`in${side}${i + 1}`] = end;
          });
        }
        // Digit segment geometry, matching Schemdraw's sevensegdigit().
        const seglen = 1.5, segw = .3, spacing2 = .12, halfw = segw / 2, marginy = segw / 5, halfspace = spacing2 / 2;
        const boxh = decimal ? 5.9 : 5.3;
        const lam = Math.sin(tilt * Math.PI / 180);
        const left = .8 - lam * seglen, bottom = (boxh - seglen * 2) / 2;
        const baseDx = [halfspace, halfspace + halfw, seglen - halfspace - halfw, seglen - halfspace, seglen - halfspace - halfw, halfspace + halfw];
        const baseDy = [0, halfw, halfw, 0, -halfw, -halfw];
        const shift = (xs, ys) => xs.map((v, i) => [v + lam * ys[i] + left, ys[i] + bottom]);
        const segA = shift(baseDx, baseDy.map(v => v + seglen * 2));
        const segD = shift(baseDx, baseDy);
        const segG = shift(baseDx, baseDy.map(v => v + seglen));
        const vertx = [0, halfw, halfw, 0, -halfw, -halfw];
        const verty = [halfspace, halfspace + halfw, seglen - halfspace - halfw, seglen - halfspace, seglen - halfspace - halfw, halfspace + halfw];
        const segE = shift(vertx, verty);
        const segF = shift(vertx, verty.map(v => v + seglen));
        const segB = shift(vertx.map(v => v + seglen), verty.map(v => v + seglen));
        const segC = shift(vertx.map(v => v + seglen), verty);
        const fills = {
          a: '23567890acef'.includes(digit.toLowerCase()),
          b: '12347890ad'.includes(digit.toLowerCase()),
          c: '13456789 0abd'.replace(' ', '').includes(digit.toLowerCase()),
          d: '2356890bcde'.includes(digit.toLowerCase()),
          e: '2680abcdef'.includes(digit.toLowerCase()),
          f: '456890abcef'.includes(digit.toLowerCase()),
          g: '2345689abdef'.includes(digit.toLowerCase())
        };
        const poly = (pts, name) => {
          const points = pts.map(([px, py]) => {
            const [qx, qy] = ssRefl([px * 36, -py * 36]);
            return `${qx.toFixed(3)},${qy.toFixed(3)}`;
          }).join(' ');
          return `<polygon points="${points}" fill="${fills[name] ? segcolor : 'none'}" stroke="gray" stroke-width="0.5"/>`;
        };
        let glyph = poly(segA, 'a') + poly(segB, 'b') + poly(segC, 'c') + poly(segD, 'd') + poly(segE, 'e') + poly(segF, 'f') + poly(segG, 'g');
        if (decimal) {
          const [dx0, dy0] = ssRefl([(left + seglen + segw + .075) * 36, -bottom * 36]);
          glyph += `<circle cx="${dx0}" cy="${dy0}" r="5.4" fill="${segcolor}" stroke="gray" stroke-width="0.5"/>`;
        }
        if (labelsegments) {
          const labels = {
            a: [seglen / 2 + halfspace, seglen * 2 + halfw + marginy, 'middle', ''],
            g: [seglen / 2 + halfspace, seglen + halfw + marginy, 'middle', ''],
            d: [seglen / 2 + halfspace, halfw + marginy, 'middle', ''],
            b: [seglen + halfw + halfspace, seglen * 1.5, 'start', 'central'],
            c: [seglen + halfw + halfspace, seglen * .5, 'start', 'central'],
            e: [-halfw - halfspace, seglen * .5, 'end', 'central'],
            f: [-halfw - halfspace, seglen * 1.5, 'end', 'central']
          };
          for (const [ch, [sx2, sy2, anchor2, base2]] of Object.entries(labels)) {
            const tx = (sx2 + lam * sy2 + left) * 36, ty = -(sy2 + bottom) * 36;
            glyph += ssText(ch, tx, ty, anchor2, base2, 10);
          }
        }
        const radians = typeof direction === 'number' ? direction * Math.PI / 180 : 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          const degs = ((Number(options.theta) % 360) + 360) % 360;
          direction = ({ 0: 'right', 90: 'up', 180: 'left', 270: 'down' })[degs] || Number(options.theta);
        } else if (selectedDirection) direction = selectedDirection;
        const rad2 = typeof direction === 'number' ? direction * Math.PI / 180 : 0;
        const [dx2, dy2, angle2] = typeof direction === 'number' ? [Math.cos(rad2), -Math.sin(rad2), -direction] : directions[direction];
        const placed = placeComponent({ anchors }, [x, y], { direction: [dx2, dy2], anchor: options.anchor === undefined ? null : options.anchor });
        if ('drop' in options && !Object.prototype.hasOwnProperty.call(placed.anchors, options.drop)) throw new Error(`Unknown SevenSegment drop: ${options.drop}`);
        // .anchor() moves the glyph so the named terminal sits at the insertion point.
        const [bodyX, bodyY] = placed.transform(0, 0);
        const boxPts = [[0, 0], [W, 0], [W, -HH], [0, -HH]].map(ssRefl);
        const boxPath = boxPts.map(([px, py], i) => `${i ? 'L' : 'M'} ${px},${py}`).join(' ') + ' Z';
        const [labelX, labelY] = ssRefl([W / 2, -HH / 2]);
        let body = `<path d="${boxPath}" ${stroke}/><path d="${leads}" ${stroke}/>${glyph}`;
        for (const label of labels) body += `<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="central"${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(label.text)}</text>`;
        elements.push(`<g transform="translate(${bodyX} ${bodyY}) rotate(${angle2})">${body}${texts}</g>`);
        for (const corner of [[-20, -HH - 20], [W + 20, 20], [-20, 20], [W + 20, -HH - 20]]) {
          const [qx, qy] = ssRefl(corner);
          const [bx2, by2] = placed.transform(qx, qy);
          bounds(bx2, by2, bx2, by2);
        }
        if (name) names[name] = placed.anchors;
        if ('drop' in options) [x, y] = placed.anchors[options.drop];
        log(`SevenSegment: digit=${digit}`);
        continue;
      }
      if (chipDefinitions[type]) {
        const def = chipDefinitions[type];
        const allowedChip = ['at', 'anchor', 'drop', 'theta', 'color', 'preclr', 'preclrinvert', 'size', 'flip', 'reverse'];
        if (labels.some(label => label.items || label.halign != null || label.rotate !== undefined || ['name', 'in1', 'in2', 'display'].includes(label.loc)) || Object.keys(options).some(key => !allowedChip.includes(key))) throw new Error(`${type} supports at, anchor, drop, theta, color, preclr, preclrinvert, size, flip, reverse, and labels.`);
        for (const key of ['preclr', 'preclrinvert', 'flip', 'reverse']) if (key in options && key !== 'preclr' && options[key] !== true) throw new Error(`${key} must be specified without a value.`);
        if ('preclr' in options && !['True', 'False'].includes(options.preclr)) throw new Error('preclr must be True or False.');
        if (('preclr' in options || 'preclrinvert' in options) && !def.preclr) throw new Error(`preclr and preclrinvert cannot be used with ${type}.`);
        if ('preclrinvert' in options && !('preclr' in options && options.preclr === 'True')) throw new Error('preclrinvert requires preclr=True.');
        const preclrInvert = 'preclrinvert' in options;
        let width = def.w, height = def.h;
        if ('size' in options) {
          const sizeMatch = /^\(\s*(\d+(?:\.\d+)?|\.\d+)\s+(\d+(?:\.\d+)?|\.\d+)\s*\)$/.exec(typeof options.size === 'string' ? options.size : '');
          if (!sizeMatch) throw new Error(`${type} size must be specified as size="(width height)".`);
          width = Number(sizeMatch[1]); height = Number(sizeMatch[2]);
          if (!(width > 0) || !(height > 0)) throw new Error(`${type} size must be positive.`);
        }
        const flip = 'flip' in options, reverse = 'reverse' in options;
        if ('at' in options) [x, y] = atPoint(options.at);
        const W = width * 36, HH = height * 36, leadLen = def.lead * 36;
        const pins = def.pins.concat('preclr' in options && options.preclr === 'True' ? def.preclr : []);
        const sides = { L: [], R: [], T: [], B: [] };
        for (const pin of pins) sides[pin.side].push(pin);
        const anchors = { center: [W / 2, -HH / 2], xy: [0, 0] };
        let leads = '', shapes = '';
        const pinTexts = [];
        const addPinText = (side, pin, x, y, value, size, h, v, isNumber) => {
          const item = { side, pin, x, y, value, size, h, v, isNumber };
          pinTexts.push(item);
          return item;
        };
        for (const side of ['L', 'R', 'T', 'B']) {
          const list = sides[side];
          const len = side === 'L' || side === 'R' ? HH : W;
          const count = Math.max(list.length, 0, ...list.map(pin => pin.slot ? Number(pin.slot.split('/')[1]) : 1));
          const sp = def.spacing !== undefined ? def.spacing * 36 : (count > 1 ? (len - 36) / (count - 1) : 0);
          const pad = def.spacing !== undefined ? (len - sp * (count - 1)) / 2 : 18;
          list.forEach((pin, i) => {
            const idx = pin.slot ? Number(pin.slot.split('/')[0]) - 1 : (count > 1 ? i : 0);
            const z = count > 1 ? pad + idx * sp : len / 2;
            const p = side === 'L' ? [0, -z] : side === 'R' ? [W, -z] : side === 'T' ? [z, -HH] : [z, 0];
            let leadStart = p;
            const invert = pin.invert || (preclrInvert && pin.preclr);
            if (invert) {
              const sign = side === 'L' || side === 'T' ? -1 : 1;
              const c = side === 'L' || side === 'R' ? [p[0] + sign * 5.4, p[1]] : [p[0], p[1] + sign * 5.4];
              shapes += `<circle cx="${c[0]}" cy="${c[1]}" r="5.4" fill="none" stroke="${color}" stroke-width="2"/>`;
              leadStart = side === 'L' || side === 'R' ? [c[0] + sign * 5.4, c[1]] : [c[0], c[1] + sign * 5.4];
            }
            const end = side === 'L' ? [p[0] - leadLen, p[1]] : side === 'R' ? [p[0] + leadLen, p[1]] : side === 'T' ? [p[0], p[1] - leadLen] : [p[0], p[1] + leadLen];
            leads += `M ${leadStart[0]},${leadStart[1]} L ${end[0]},${end[1]} `;
            if (pin.clock) {
              leads += `M 0,${p[1] - 6.3} L 12.6,${p[1]} L 0,${p[1] + 6.3} `;
              anchors.CLK = end;
              anchors['>'] = end;
            } else if (pin.name) {
              const ofst = side === 'L' ? [5.4, 0] : side === 'R' ? [-5.4, 0] : side === 'T' ? [0, 5.4] : [0, -5.4];
              const base = { L: ['left', 'center'], R: ['right', 'center'], T: ['center', 'top'], B: ['center', 'bottom'] }[side];
              const nameText = addPinText(side, p, p[0] + ofst[0], p[1] + ofst[1], pin.name, 14, base[0], base[1], false);
              if (pin.overline) nameText.overline = true;
              anchors[pin.anchor || (pin.name === '>' ? 'CLK' : pin.name)] = end;
            } else if (pin.anchor) anchors[pin.anchor] = end;
            if (pin.num) {
              // Fixed-pin chips never call .side(), so their pin labels use
              // Schemdraw's plblofst default of 0.075 units (2.7 px).
              const shift = invert ? 10.8 : 0;
              const pofst = side === 'L' ? [-2.7 - shift, -2.7] : side === 'R' ? [2.7 + shift, -2.7] : side === 'T' ? [2.7, -2.7 - shift] : [2.7, 2.7 + shift];
              const base = { L: ['right', 'bottom'], R: ['left', 'bottom'], T: ['left', 'bottom'], B: ['left', 'top'] }[side];
              addPinText(side, p, p[0] + pofst[0], p[1] + pofst[1], pin.num, 11, base[0], base[1], true);
            }
            anchors[`in${side}${i + 1}`] = end;
            if (pin.num) anchors[`pin${pin.num}`] = end;
          });
        }
        // Pin texts stay upright. flip/reverse mirror their positions, and
        // Schemdraw swaps the vertical/horizontal alignment on the affected
        // sides. Numbers keep their offset from the pin on the flipped axis.
        const mirrorH = h => ({ left: 'right', right: 'left' }[h] || h);
        const mirrorV = v => ({ top: 'bottom', bottom: 'top' }[v] || v);
        for (const item of pinTexts) {
          if (flip) {
            item.y = (item.isNumber && (item.side === 'L' || item.side === 'R')) ? item.y - 2 * item.pin[1] : -item.y;
            if (item.side === 'T' || item.side === 'B') item.v = mirrorV(item.v);
          }
          if (reverse) {
            item.x = (item.isNumber && (item.side === 'T' || item.side === 'B')) ? item.x + W - 2 * item.pin[0] : W - item.x;
            if (item.side === 'L' || item.side === 'R') item.h = mirrorH(item.h);
          }
        }
        // Local terminals follow the same reflection as the glyph.
        for (const key of Object.keys(anchors)) {
          if (key === 'xy') continue;
          const [ax, ay] = anchors[key];
          anchors[key] = [reverse ? W - ax : ax, flip ? -ay : ay];
        }
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          const degrees = ((Number(options.theta) % 360) + 360) % 360;
          direction = ({ 0: 'right', 90: 'up', 180: 'left', 270: 'down' })[degrees] || Number(options.theta);
        } else if (selectedDirection) direction = selectedDirection;
        const radians = typeof direction === 'number' ? direction * Math.PI / 180 : 0;
        const [dx2, dy2, angle2] = typeof direction === 'number' ? [Math.cos(radians), -Math.sin(radians), -direction] : directions[direction];
        const placed = placeComponent({ anchors }, [x, y], { direction: [dx2, dy2], anchor: options.anchor === undefined ? null : options.anchor });
        if ('drop' in options && !Object.prototype.hasOwnProperty.call(placed.anchors, options.drop)) throw new Error(`Unknown ${type} drop: ${options.drop}`);
        // .anchor() moves the glyph so the named terminal sits at the insertion point.
        const [bodyX, bodyY] = placed.transform(0, 0);
        const geometry = `<path d="M 0,0 L ${W},0 L ${W},${-HH} L 0,${-HH} Z" ${stroke}/><path d="${leads}" ${stroke}/>${shapes}`;
        // Mirror the glyph about the box center; pin and element labels are
        // positioned separately below so they remain upright.
        const mirror = reverse
          ? (flip ? `translate(${W} 0) scale(-1 -1)` : `translate(${W} 0) scale(-1 1)`)
          : (flip ? 'scale(1 -1)' : '');
        let body = mirror ? `<g transform="${mirror}">${geometry}</g>` : geometry;
        // A center label still carries lblofst (0.1 unit) on both axes, as in
        // Element._align_label, and flip/reverse mirror that offset.
        if (def.label && !labels.length) body += `<text x="${W / 2 + (reverse ? -3.6 : 3.6)}" y="${(flip ? HH / 2 : -HH / 2) + (flip ? 3.6 : -3.6)}" text-anchor="middle" dominant-baseline="central"${textFill} font-family="sans-serif" font-size="${labelSize}">${def.label}</text>`;
        // usize is the label size in points (14 by default); the offset of a
        // one-value label is 0.1 drawing units, which is 3.6 SVG units.
        for (const label of labels) {
          const usize = label.fontsize === undefined ? 14 : label.fontsize;
          const pofst = 0.1 * 36;
          const base = { center: ['center', 'center'], top: ['center', 'bottom'], bot: ['center', 'top'], bottom: ['center', 'top'], left: ['right', 'center'], right: ['left', 'center'] }[label.loc || 'center'];
          const [ox, oy] = label.loc && label.loc !== 'center' ? anchorLabelOffset(base[0], base[1], pofst) : [pofst, pofst];
          const lx = reverse ? W - (W / 2 + ox) : W / 2 + ox;
          const ly = flip ? -(-HH / 2 - oy) : -HH / 2 - oy;
          const h = reverse ? mirrorH(base[0]) : base[0];
          const v = flip ? mirrorV(base[1]) : base[1];
          const fill = label.color ? ` fill="${label.color}"` : textFill;
          const rotate = typeof label.rotate === 'number' ? ` transform="rotate(${-label.rotate} ${lx} ${ly})"` : '';
          body += `<text x="${lx}" y="${ly}" text-anchor="${{ left: 'start', center: 'middle', right: 'end' }[h]}" dominant-baseline="${v === 'center' ? 'central' : v === 'top' ? 'hanging' : 'ideographic'}"${rotate}${fill} font-family="sans-serif" font-size="${usize}"><tspan x="${lx}" dy="${usize}">${labelContent(label.text)}</tspan></text>`;
        }
        const texts = pinTexts.map(({ x: tx, y: ty, value, size, h, v, overline }) => {
          // Schemdraw renders Qbar as $\overline{Q}$; its SVG backend emits an
          // overline decoration on the tspan so the bar follows the glyph width.
          const content = overline
            ? `<tspan text-decoration="overline">${escapeText(value)}</tspan>`
            : escapeText(value);
          return `<text x="${tx}" y="${ty}" text-anchor="${{ left: 'start', center: 'middle', right: 'end' }[h]}" dominant-baseline="${v === 'center' ? 'central' : v === 'top' ? 'hanging' : 'ideographic'}"${textFill} font-family="sans-serif" font-size="${size}">${content}</text>`;
        }).join('');
        elements.push(`<g transform="translate(${bodyX} ${bodyY}) rotate(${angle2})">${body}${texts}</g>`);
        const top = flip ? -20 : -HH - 20, bottom = flip ? HH + 20 : 20;
        for (const [lx, ly] of [[-20, top], [W + 20, top], [-20, bottom], [W + 20, bottom]]) {
          const [bx2, by2] = placed.transform(lx, ly);
          bounds(bx2, by2, bx2, by2);
        }
        if (name) names[name] = placed.anchors;
        if ('drop' in options) [x, y] = placed.anchors[options.drop];
        log(`${type}: pins=${pins.length}`);
        continue;
      }
      if (['DE9', 'DB25', 'DA15', 'DC37', 'DD50'].includes(type)) {
        const positive = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (typeof options[key] !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key]) || !(Number(options[key]) > 0)) throw new Error(`${key} must be a positive number.`);
          return Number(options[key]) * 36;
        };
        const sp = positive('pinspacing', 21.6), edge = positive('edge', 10.8);
        let number = false;
        if ('number' in options) {
          if (!['True', 'False'].includes(options.number)) throw new Error('number must be True or False.');
          number = options.number === 'True';
        }
        const pinfill = options.pinfill === undefined || options.pinfill === 'bg' ? 'white' : readColor(options.pinfill);
        if ('at' in options) [x, y] = atPoint(options.at);
        const cfg = {
          DE9: { rows: 4, cols: [4, 5], starts: [9, 5], colsX: 1, baseRows: 4 },
          DA15: { rows: 7, cols: [7, 8], starts: [15, 8], colsX: 1, baseRows: 7 },
          DB25: { rows: 12, cols: [12, 13], starts: [25, 13], colsX: 1, baseRows: 12 },
          DC37: { rows: 18, cols: [18, 19], starts: [37, 19], colsX: 1, baseRows: 18 },
          DD50: { rows: 16, cols: [17, 16, 17], starts: [50, 33, 17], colsX: 2, baseRows: 16 }
        }[type];
        const w = cfg.colsX * sp + 2 * edge;
        const h1 = cfg.baseRows * sp + 2 * edge, h2 = h1 + 18;
        const pts = [[0, 0], [0, -h1], [w, -h2], [w, 18]];
        // Circular-arc corner rounding, matching Schemdraw's `SegmentPoly(
        // cornerradius=...)`: the tangent length is r / tan(half angle) and the
        // arc radius shrinks when the edge is too short. A quadratic with the
        // control point on the corner (the previous approach) stays inside the
        // corner and makes the shape measurably taller than Schemdraw's.
        // Port of Schemdraw's segments.roundcorners(). That routine does not
        // build a tangent fillet: it puts the arc centre at the vertex pushed
        // inward by hypot(segment, radius), so the outline extends past the
        // polygon corner. The D-sub family is defined by Schemdraw's output, so
        // the algorithm is reproduced rather than "corrected"; a deviation here
        // shows up as a size mismatch against every regenerated reference.
        // Schemdraw also mutates `radius` when an edge is too short, and that
        // carried-over value affects the following corners, so it is kept.
        const rounded = (points, r) => {
          const up = points.map(([px, py]) => [px, -py]);   // y-up working frame
          const n = up.length;
          const ring = [];
          let radius = r;
          // Schemdraw walks the vertices in reverse; the mutated `radius` makes
          // the order observable, so the same order is used here.
          for (let k = n - 1; k >= 0; k--) {
            const p1 = up[k], p2 = up[(k + n - 1) % n], p3 = up[(k + n - 2) % n];
            const dx1 = p2[0] - p1[0], dy1 = p2[1] - p1[1];
            const dx2 = p2[0] - p3[0], dy2 = p2[1] - p3[1];
            const angle = (Math.atan2(dy1, dx1) - Math.atan2(dy2, dx2)) / 2;
            const tan = Math.abs(Math.tan(angle));
            const len1 = Math.hypot(dx1, dy1), len2 = Math.hypot(dx2, dy2);
            let segment = tan > 1e-9 ? radius / tan : Math.min(len1, len2);
            const length = Math.min(len1, len2);
            if (segment > length) { segment = length; radius = length * tan; }
            if (!(len1 > 0) || !(len2 > 0) || !(segment > 0)) { ring.push([p2[0], p2[1]]); continue; }
            const p1c = [p2[0] - dx1 * (segment / len1), p2[1] - dy1 * (segment / len1)];
            const p2c = [p2[0] - dx2 * (segment / len2), p2[1] - dy2 * (segment / len2)];
            const dx = 2 * p2[0] - p1c[0] - p2c[0];
            const dy = 2 * p2[1] - p1c[1] - p2c[1];
            const L = Math.hypot(dx, dy) || 1;
            const dlen = Math.hypot(segment, radius);
            const cx = p2[0] - dx * (dlen / L), cy = p2[1] - dy * (dlen / L);
            const start = Math.atan2(p1c[1] - cy, p1c[0] - cx);
            let finish = Math.atan2(p2c[1] - cy, p2c[0] - cx);
            while (finish < start) finish += Math.PI * 2;
            // Schemdraw samples each corner arc with 100 inclusive points.
            const steps = 100;
            for (let step = 0; step < steps; step++) {
              const t = start + (finish - start) * step / (steps - 1);
              ring.push([cx + radius * Math.cos(t), cy + radius * Math.sin(t)]);
            }
          }
          const d = ring.map(([px, py], idx) =>
            `${idx ? 'L' : 'M'} ${px.toFixed(3)},${(-py).toFixed(3)}`).join(' ');
          return d + ' Z';
        };
        // SegmentPoly.doreverse()/doflip() mirror the vertices before the
        // renderer rounds the corners, and `rounded()` mutates its radius per
        // corner, so the rounding must run on the mirrored vertices. For flip
        // the rounded geometry is mirrored back because the glyph group already
        // applies scale(1 -1).
        let shapeD;
        if ('flip' in options) {
          const mirrored = rounded(pts.map(([px, py]) => [px, -py]), 9);
          shapeD = mirrored.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g,
            (_, px, py) => `${px},${(-Number(py)).toFixed(3)}`);
        } else {
          shapeD = rounded(pts, 9);
        }
        let glyph = `<path d="${shapeD}" ${stroke}/>`;
        const anchors = { xy: [0, 0] }, pinCircles = [];
        const addPin = (px, py, num) => {
          anchors[`pin${num}`] = [px, py];
          // Drawn only in the overlay layer below: a background-filled marker must
          // sit above every stroke, so emitting it here as well would double it.
          pinCircles.push([px, py]);
          if (number) glyph += `<text x="${px}" y="${py - 12.6}" text-anchor="middle" dominant-baseline="ideographic"${textFill} font-family="sans-serif" font-size="9">${num}</text>`;
        };
        for (let c = 0; c < cfg.cols.length; c++) {
          const px = edge + c * sp;
          for (let i = 0; i < cfg.cols[c]; i++) {
            // DD50 has three pin columns: the middle one is the short (h1)
            // column, the outer two are the tall (h2) columns. Other D-subs put
            // the short column first. Getting this backwards shifts every pin
            // by a quarter pitch (5.4 px).
            const leftStyle = type === 'DD50' ? c === 1 : c === 0;
            const py = leftStyle
              ? -(h1 - (i + 0.5) * sp - edge)
              : -(h2 - (i + 0.75) * sp - edge);
            addPin(px, py, cfg.starts[c] - i);
          }
        }
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          const degrees = ((Number(options.theta) % 360) + 360) % 360;
          direction = ({ 0: 'right', 90: 'up', 180: 'left', 270: 'down' })[degrees] || Number(options.theta);
        } else if (selectedDirection) direction = selectedDirection;
        const radians = typeof direction === 'number' ? direction * Math.PI / 180 : 0;
        const [dx2, dy2, angle2] = typeof direction === 'number' ? [Math.cos(radians), -Math.sin(radians), -direction] : directions[direction];
        // flip mirrors the body and its anchors about the local x axis, the same
        // way Element.flip() does; without it the pins stay where they were and
        // the numbering lands on the wrong side.
        const dsubFlip = 'flip' in options, dsubReverse = 'reverse' in options;
        const placed = placeComponent({ anchors, reverseCenter: w / 2 }, [x, y], {
          direction: [dx2, dy2],
          anchor: options.anchor === undefined ? null : options.anchor,
          flip: dsubFlip,
          reverse: dsubReverse
        });
        // With `reverse` the inner group mirrors about w/2, so the group pivot is
        // the image of the local origin (`placed.transform(w, 0)`), not (0, 0).
        const [bodyX, bodyY] = placed.transform(dsubReverse ? [w, 0] : [0, 0]);
        for (const label of labels) glyph += `<text x="${w / 2}" y="${-h2 / 2}" text-anchor="middle" dominant-baseline="central"${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(label.text)}</text>`;
        const dsubInner = (dsubFlip || dsubReverse)
          ? ` transform="translate(${dsubReverse ? w : 0} 0) scale(${dsubReverse ? -1 : 1} ${dsubFlip ? -1 : 1})"`
          : '';
        elements.push(`<g transform="translate(${bodyX} ${bodyY}) rotate(${angle2})"><g${dsubInner}>${glyph}</g></g>`);
        for (const [px, py] of pinCircles) {
          const [wx, wy] = placed.transform(px, py);
          bgMarker(wx, wy, 3.6, color, pinfill);
        }
        for (const [lx, ly] of [[-10, 20], [-10, -h2 - 10], [w + 10, 20], [w + 10, -h2 - 10]]) {
          const [bx2, by2] = placed.transform(lx, ly);
          bounds(bx2, by2, bx2, by2);
        }
        if (name) names[name] = placed.anchors;
        log(`${type}: pins=${Object.keys(anchors).filter(k => k.startsWith('pin')).length}`);
        continue;
      }
      if (['CoaxConnect', 'Plug', 'Jack', 'Terminal', 'Jumper'].includes(type)) {
        const positive = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (typeof options[key] !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key]) || !(Number(options[key]) > 0)) throw new Error(`${key} must be a positive number.`);
          return Number(options[key]) * 36;
        };
        if ('at' in options) [x, y] = atPoint(options.at);
        let glyph = '', anchors = { xy: [0, 0] }, labelX = 0, labelY = 0;
        // Inner "bg"-filled markers are re-drawn on the overlay layer.
        let coverFill = null, coverRadius = 0, coverShadow = '';
        if (type === 'CoaxConnect') {
          const r1 = positive('radius', 14.4), r2 = positive('radiusinner', 4.32);
          const fill = options.fillinner === undefined || options.fillinner === 'bg' ? 'white' : readColor(options.fillinner);
          // The inner disc is background-filled, so it is painted by the overlay
          // pass; drawing it here as well duplicates the circle.
          glyph = `<circle cx="0" cy="0" r="${r1}" fill="none" stroke="${color}" stroke-width="2"/>`;
          anchors = { center: [0, 0], N: [0, -r1], S: [0, r1], E: [r1, 0], W: [-r1, 0], xy: [0, 0] };
          labelX = 0; labelY = r1 + 12;
          coverFill = fill; coverRadius = r2;
        } else if (type === 'Plug') {
          glyph = `<path d="M 0,0 L 36,0 M 27,-9 L 36,0 L 27,9" ${stroke}/>`;
          anchors = { start: [0, 0], end: [36, 0], center: [18, 0], xy: [0, 0] };
          labelX = 18; labelY = -18;
        } else if (type === 'Jack') {
          glyph = `<path d="M 0,0 L -9,-9 M -9,9 L 0,0 L 36,0" ${stroke}/>`;
          anchors = { start: [0, 0], end: [36, 0], center: [13.5, 0], xy: [0, 0] };
          labelX = 13.5; labelY = -18;
        } else if (type === 'Terminal') {
          const r = positive('r', 6.48);
          const open = !('open' in options) || options.open === 'True';
          if ('open' in options && !['True', 'False'].includes(options.open)) throw new Error('open must be True or False.');
          // Open terminals are drained once, in the overlay pass below, so the
          // background-filled circle is not painted twice.
          glyph = open
            ? ''
            : `<circle cx="0" cy="0" r="${r}" fill="${color}" stroke="${color}" stroke-width="2"/><path d="M ${-r},${2 * r} L ${r},${-2 * r}" ${stroke}/>`;
          anchors = { start: [0, 0], center: [0, 0], end: [0, 0], xy: [0, 0] };
          labelX = 0; labelY = r + 14;
          if (open) { coverFill = 'white'; coverRadius = r; coverShadow = `<path d="M ${-r},${2 * r} L ${r},${-2 * r}" ${stroke}/>`; }
        } else {
          const spacing = positive('pinspacing', 21.6);
          glyph = `<path d="M -9,9 L ${spacing + 9},9 L ${spacing + 9},-9 L -9,-9 Z" ${stroke}/>`;
          anchors = { center: [spacing / 2 + 9, 0], xy: [0, 0] };
          labelX = spacing / 2 + 9; labelY = -16;
        }
        for (const label of labels) glyph += `<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="central"${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(label.text)}</text>`;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          const degrees = ((Number(options.theta) % 360) + 360) % 360;
          direction = ({ 0: 'right', 90: 'up', 180: 'left', 270: 'down' })[degrees] || Number(options.theta);
        } else if (selectedDirection) direction = selectedDirection;
        const radians = typeof direction === 'number' ? direction * Math.PI / 180 : 0;
        const [dx2, dy2, angle2] = typeof direction === 'number' ? [Math.cos(radians), -Math.sin(radians), -direction] : directions[direction];
        // Schemdraw mirrors these connector glyphs and anchors with
        // flip/reverse (Element._flipreverse).
        const connFlip = 'flip' in options, connReverse = 'reverse' in options;
        const connCenter = type === 'CoaxConnect' ? 0 : 18;
        const placed = placeComponent({ anchors, reverseCenter: connCenter }, [x, y], {
          direction: [dx2, dy2],
          anchor: options.anchor === undefined ? null : options.anchor,
          flip: connFlip,
          reverse: connReverse
        });
        const [bodyX, bodyY] = placed.transform(0, 0);
        // Element._flipreverse(): a real transform attribute (a bare `scale(...)`
        // attribute is ignored by SVG parsers).
        const connInner = (connFlip || connReverse)
          ? ` transform="scale(${connReverse ? -1 : 1} ${connFlip ? -1 : 1})"`
          : '';
        elements.push(`<g transform="translate(${bodyX} ${bodyY}) rotate(${angle2})"><g${connInner}>${glyph}</g></g>`);
        // Redraw the cover circle (and the terminal slash on top of it) last.
        if (coverFill !== null) {
          const slash = (connFlip || connReverse) && coverShadow
            ? `<g transform="scale(${connReverse ? -1 : 1} ${connFlip ? -1 : 1})">${coverShadow}</g>`
            : coverShadow;
          overlay.push(`<g transform="translate(${bodyX} ${bodyY}) rotate(${angle2})"><circle cx="0" cy="0" r="${coverRadius}" fill="${coverFill}" stroke="${color}" stroke-width="2"/>${slash}</g>`);
        }
        const bbox = type === 'CoaxConnect' ? 20 : type === 'Jumper' ? 40 : 24;
        for (const [lx, ly] of [[-bbox, -bbox], [-bbox, bbox], [bbox, -bbox], [bbox, bbox]]) {
          const [bx2, by2] = placed.transform(lx, ly);
          bounds(bx2, by2, bx2, by2);
        }
        if (name) names[name] = placed.anchors;
        log(`${type}: connector`);
        continue;
      }
      if (type === 'BusConnect') {
        const num = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (typeof options[key] !== 'string' || !/^\d+$/.test(options[key]) || !Number.isSafeInteger(Number(options[key])) || Number(options[key]) <= 0 || Number(options[key]) > 100) throw new Error(`${key} must be an integer between 1 and 100.`);
          return Number(options[key]);
        };
        const positive = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (typeof options[key] !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key]) || !(Number(options[key]) > 0)) throw new Error(`${key} must be a positive number.`);
          return Number(options[key]) * 36;
        };
        const n = num('n', 1);
        let up = true;
        if ('slant_up' in options) {
          if (!['True', 'False'].includes(options.slant_up)) throw new Error('slant_up must be True or False.');
          up = options.slant_up === 'True';
        }
        const dy = positive('dy', 21.6), l = positive('l', 108), lwbus = 'lwbus' in options ? Number(options.lwbus) : 4;
        if (!(lwbus > 0) || !Number.isFinite(lwbus)) throw new Error('lwbus must be a positive number.');
        if ('at' in options) [x, y] = atPoint(options.at);
        const slanty = up ? 18 : -18;
        const anchors = { start: [l, -18], end: [l, -(18 - n * dy)], xy: [0, 0] };
        let glyph = '';
        for (let i = 0; i < n; i++) {
          const py = i * dy;
          glyph += `<path d="M 0,${py} L ${l - 18},${py} L ${l},${py - slanty}" ${stroke}/>`;
          anchors[`pin${i + 1}`] = [0, py];
        }
        glyph += `<path d="M ${l},-18 L ${l},${-(slanty - n * dy)}" fill="none" stroke="${color}" stroke-width="${lwbus}" stroke-linecap="round"/>`;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          const degrees = ((Number(options.theta) % 360) + 360) % 360;
          direction = ({ 0: 'right', 90: 'up', 180: 'left', 270: 'down' })[degrees] || Number(options.theta);
        } else if (selectedDirection) direction = selectedDirection;
        const radians = typeof direction === 'number' ? direction * Math.PI / 180 : 0;
        const [dx2, dy2, angle2] = typeof direction === 'number' ? [Math.cos(radians), -Math.sin(radians), -direction] : directions[direction];
        // Schemdraw mirrors BusConnect's segments and anchors under
        // reverse/flip, about the element centre.
        const busReverse = 'reverse' in options, busFlip = 'flip' in options;
        const placed = placeComponent({ anchors, reverseCenter: l / 2 }, [x, y], {
          direction: [dx2, dy2],
          anchor: options.anchor === undefined ? null : options.anchor,
          reverse: busReverse,
          flip: busFlip
        });
        const [bodyX, bodyY] = placed.transform(0, 0);
        const busInner = (busReverse || busFlip)
          ? ` transform="translate(${busReverse ? l : 0} 0) scale(${busReverse ? -1 : 1} ${busFlip ? -1 : 1})"`
          : '';
        elements.push(`<g transform="translate(${bodyX} ${bodyY}) rotate(${angle2})"><g${busInner}>${glyph}</g></g>`);
        for (const [lx, ly] of [[0, 0], [0, (n - 1) * dy], [l, -20], [l, 20]]) {
          const [bx2, by2] = placed.transform(lx, ly);
          bounds(bx2, by2, bx2, by2);
        }
        if (name) names[name] = placed.anchors;
        log(`BusConnect: n=${n} up=${up}`);
        continue;
      }
      if (type === 'Relay') {
        const bool = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (!['True', 'False'].includes(options[key])) throw new Error(`${key} must be True or False.`);
          return options[key] === 'True';
        };
        const switchStyle = options.switch === undefined ? 'spst' : options.switch;
        if (!['spst', 'spdt', 'dpst', 'dpdt'].includes(switchStyle)) throw new Error('Relay switch must be spst, spdt, dpst, or dpdt.');
        const unit = options.unit === undefined ? 2 : Number(options.unit);
        if (!Number.isFinite(unit) || unit !== 2) throw new Error('Relay unit only supports 2.');
        const core = bool('core', true), link = bool('link', true), box = bool('box', true);
        const cycl = bool('cycl', false);
        const swreverse = bool('swreverse', false), swflip = bool('swflip', false);
        if ('boxpad' in options && Number(options.boxpad) !== 0.25) throw new Error('Relay boxpad only supports 0.25.');
        const boxfill = options.boxfill === undefined || options.boxfill === 'none' ? 'none' : readColor(options.boxfill);
        if ('at' in options) [x, y] = atPoint(options.at);
        const switchShift = cycl ? 9.17888446931108 : 0;
        const boxLeft = cycl ? -16.111470524389393 : -9;
        const boxRight = { spst: 59.22, spdt: 76.14, dpst: 95.22, dpdt: 126.54 }[switchStyle] + switchShift;
        const linkStart = cycl ? 20.878884469311085 : 11.7;
        const linkEnd = (swflip
          ? { spst: 19.08, spdt: 18.72, dpst: 40.32, dpdt: 69.12 }
          : { spst: 27.72, spdt: 42.12, dpst: 63.72, dpdt: 92.52 })[switchStyle] + (cycl ? 18.358 : 0);
        const flipX = { spst: 79.92, spdt: 96.84, dpst: 115.92, dpdt: 147.24 }[switchStyle];
        const centerX = (boxLeft + boxRight) / 2;
        let body = '';
        if (box) body += `<rect x="${boxLeft}" y="7.2" width="${boxRight - boxLeft}" height="57.6" fill="${boxfill}" stroke="${color}" stroke-width="2"/>`;
        if (cycl) {
          body += `<path d="M 0,0 L 0,18 ${relayCycloid} L 0,72" ${stroke}/>`;
        } else {
          // Segment.doflip() reverses the arc direction, which moves each
          // semicircle to the other side of the coil line.
          const arcSweep = ('flip' in options) !== ('reverse' in options) ? 0 : 1;
          body += `<path d="M 0,0 L 0,18 M 0,54 L 0,72 M 0,18 a 4.5 4.5 -270 1 ${arcSweep} 0 9 M 0,27 a 4.5 4.5 -270 1 ${arcSweep} 0 9 M 0,36 a 4.5 4.5 -270 1 ${arcSweep} 0 9 M 0,45 a 4.5 4.5 -270 1 ${arcSweep} 0 9" ${stroke}/>`;
        }
        if (core) body += `<path d="M ${cycl ? 19.07888446931109 : 9.9},18 L ${cycl ? 19.07888446931109 : 9.9},54" ${stroke}/>`;
        const anchors = { in1: [0, 0], in2: [0, 72], center: [centerX, 36], xy: [0, 0] };
        let switchBody = '';
        if (switchStyle === 'spst') {
          switchBody += `<path d="M 34.02,0 L 34.02,18 M 34.02,54 L 34.02,72 M 37.62,26.64 L 50.22,46.8" ${stroke}/>`;
          switchBody += `<circle cx="34.02" cy="22.32" r="4.32" fill="white" stroke="${color}" stroke-width="2"/><circle cx="34.02" cy="49.68" r="4.32" fill="white" stroke="${color}" stroke-width="2"/>`;
          anchors.a = [34.02, 0]; anchors.b = [34.02, 72];
        } else if (switchStyle === 'spdt') {
          switchBody += `<path d="M 48.42,22.32 L 48.42,11.16 L 48.42,0 M 62.82,49.68 L 62.82,60.84 L 62.82,72 M 34.02,49.68 L 34.02,60.84 L 34.02,72 M 52.02,26.64 L 57.42,43.2" ${stroke}/>`;
          switchBody += `<circle cx="48.42" cy="22.32" r="4.32" fill="white" stroke="${color}" stroke-width="2"/><circle cx="34.02" cy="49.68" r="4.32" fill="white" stroke="${color}" stroke-width="2"/><circle cx="62.82" cy="49.68" r="4.32" fill="white" stroke="${color}" stroke-width="2"/>`;
          anchors.a = [48.42, 0]; anchors.b = [62.82, 72]; anchors.c = [34.02, 72];
        } else if (switchStyle === 'dpst') {
          switchBody += `<path d="M 70.02,22.32 L 70.02,11.16 L 70.02,0 M 34.02,22.32 L 34.02,11.16 L 34.02,0 M 70.02,49.68 L 70.02,60.84 L 70.02,72 M 34.02,49.68 L 34.02,60.84 L 34.02,72 M 37.62,26.64 L 50.22,46.8 M 73.62,26.64 L 86.22,46.8" ${stroke}/>`;
          switchBody += `<circle cx="70.02" cy="22.32" r="4.32" fill="white" stroke="${color}" stroke-width="2"/><circle cx="70.02" cy="49.68" r="4.32" fill="white" stroke="${color}" stroke-width="2"/><circle cx="34.02" cy="22.32" r="4.32" fill="white" stroke="${color}" stroke-width="2"/><circle cx="34.02" cy="49.68" r="4.32" fill="white" stroke="${color}" stroke-width="2"/>`;
          anchors.t1 = [70.02, 72]; anchors.t2 = [34.02, 72]; anchors.p1 = [70.02, 0]; anchors.p2 = [34.02, 0];
        } else {
          switchBody += `<path d="M 98.82,22.32 L 98.82,11.16 L 98.82,0 M 48.42,22.32 L 48.42,11.16 L 48.42,0 M 113.22,49.68 L 113.22,60.84 L 113.22,72 M 84.42,49.68 L 84.42,60.84 L 84.42,72 M 62.82,49.68 L 62.82,60.84 L 62.82,72 M 34.02,49.68 L 34.02,60.84 L 34.02,72 M 52.02,26.64 L 57.42,43.2 M 102.42,26.64 L 107.82,43.2" ${stroke}/>`;
          switchBody += `<circle cx="98.82" cy="22.32" r="4.32" fill="white" stroke="${color}" stroke-width="2"/><circle cx="84.42" cy="49.68" r="4.32" fill="white" stroke="${color}" stroke-width="2"/><circle cx="113.22" cy="49.68" r="4.32" fill="white" stroke="${color}" stroke-width="2"/><circle cx="48.42" cy="22.32" r="4.32" fill="white" stroke="${color}" stroke-width="2"/><circle cx="34.02" cy="49.68" r="4.32" fill="white" stroke="${color}" stroke-width="2"/><circle cx="62.82" cy="49.68" r="4.32" fill="white" stroke="${color}" stroke-width="2"/>`;
          anchors.t1 = [113.22, 72]; anchors.t2 = [84.42, 72]; anchors.t3 = [62.82, 72]; anchors.t4 = [34.02, 72]; anchors.p1 = [98.82, 0]; anchors.p2 = [48.42, 0];
        }
        let renderedSwitch = switchBody;
        if (swreverse || swflip) {
          const transform = swflip && swreverse ? `translate(${flipX} 72) scale(-1 -1)`
            : swflip ? `translate(${flipX} 0) scale(-1 1)`
              : `translate(0 72) scale(1 -1)`;
          renderedSwitch = `<g transform="${transform}">${switchBody}</g>`;
          for (const key of Object.keys(anchors)) {
            if (['in1', 'in2', 'center', 'xy'].includes(key)) continue;
            const [ax, ay] = anchors[key];
            const keepY = switchStyle === 'spst' && (key === 'a' || key === 'b');
            anchors[key] = [(swflip ? flipX - ax : ax) + switchShift, swreverse && !keepY ? 72 - ay : ay];
          }
        } else if (switchShift) {
          for (const key of Object.keys(anchors)) {
            if (['in1', 'in2', 'center', 'xy'].includes(key)) continue;
            anchors[key] = [anchors[key][0] + switchShift, anchors[key][1]];
          }
        }
        if (switchShift) renderedSwitch = `<g transform="translate(${switchShift} 0)">${renderedSwitch}</g>`;
        body += renderedSwitch;
        if (link) body += `<path d="M ${linkStart},36 L ${linkEnd},36" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="2 3.3" stroke-linecap="round"/>`;
        for (const label of labels) body += `<text x="${centerX}" y="13" text-anchor="middle" dominant-baseline="central"${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(label.text)}</text>`;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          const degrees = ((Number(options.theta) % 360) + 360) % 360;
          direction = ({ 0: 'right', 90: 'up', 180: 'left', 270: 'down' })[degrees] || Number(options.theta);
        } else if (selectedDirection) direction = selectedDirection;
        const radians = typeof direction === 'number' ? direction * Math.PI / 180 : 0;
        const [dx2, dy2, angle2] = typeof direction === 'number' ? [Math.cos(radians), -Math.sin(radians), -direction] : directions[direction];
        const relayFlip = 'flip' in options, relayReverse = 'reverse' in options;
        const relayCenter = (boxLeft + boxRight) / 2;
        const placed = placeComponent({ anchors, reverseCenter: relayCenter }, [x, y], {
          direction: [dx2, dy2],
          anchor: options.anchor === undefined ? null : options.anchor,
          flip: relayFlip,
          reverse: relayReverse
        });
        // The inner group mirrors about relayCenter, so under reverse the pivot
        // is the image of the local origin, not (0, 0).
        const [bodyX, bodyY] = placed.transform(relayReverse ? [2 * relayCenter, 0] : [0, 0]);
        const relayInner = (relayFlip || relayReverse)
          ? ` transform="translate(${relayReverse ? 2 * relayCenter : 0} 0) scale(${relayReverse ? -1 : 1} ${relayFlip ? -1 : 1})"`
          : '';
        elements.push(`<g transform="translate(${bodyX} ${bodyY}) rotate(${angle2})"><g${relayInner}>${body}</g></g>`);
        // No extra markers here: the switch body already draws its contact
        // circles, and a/b/c are the coil ends and throw terminals, where
        // Schemdraw draws no dot. Marking them added two circles at y = 0/72.
        for (const [lx, ly] of [[boxLeft, 7.2], [boxLeft, 64.8], [boxRight, 7.2], [boxRight, 64.8]]) {
          const [bx2, by2] = placed.transform(lx, ly);
          bounds(bx2, by2, bx2, by2);
        }
        if (name) names[name] = placed.anchors;
        log(`Relay: switch=${switchStyle} core=${core} link=${link} box=${box}`);
        continue;
      }
      if (type === 'Optocoupler') {
        const bool = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (!['True', 'False'].includes(options[key])) throw new Error(`${key} must be True or False.`);
          return options[key] === 'True';
        };
        const box = bool('box', true), base = bool('base', false);
        let boxpad = 0.2;
        if ('boxpad' in options) {
          if (typeof options.boxpad !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.boxpad) || !(Number(options.boxpad) > 0)) throw new Error('boxpad must be a positive number.');
          boxpad = Number(options.boxpad);
        }
        const boxfill = options.boxfill === undefined || options.boxfill === 'none' ? 'none' : readColor(options.boxfill);
        if ('at' in options) [x, y] = atPoint(options.at);
        const pad = boxpad * 36;
        const boxLeft = -9 - pad, boxRight = 63.06 + pad, boxTop = -pad, boxBottom = 54 + pad;
        const anchors = { anode: [boxLeft, 0], cathode: [boxLeft, 54], collector: [boxRight, 1.92], emitter: [boxRight, 52.08], center: [(boxLeft + boxRight) / 2, 27], xy: [0, 0] };
        if (base) anchors.base = [43.8, boxBottom];
        let body = '';
        if (box) body += `<rect x="${boxLeft}" y="${boxTop}" width="${boxRight - boxLeft}" height="${boxBottom - boxTop}" fill="${boxfill}" stroke="${color}" stroke-width="2"/>`;
        body += `<path d="M 0,0 L 0,20.7 M 9,33.3 L -9,33.3 M 0,33.3 L 0,54" ${stroke}/><path d="M 9,20.7 L 0,33.3 L -9,20.7 Z" fill="${color}"/>`;
        body += `<path d="M 49.2,13.8 L 49.2,40.2 M 49.2,20.4 L 63.06,8.52 L 63.06,1.92 M 49.2,33.6 L 63.06,45.48 L 63.06,52.08 M 49.2,33.6 L 56.227,39.623" ${stroke}/><path d="M 61.541,44.178 L 53.884,42.356 L 58.57,36.89 Z" fill="${color}"/>`;
        body += `<path d="M 18,19.8 L 32.4,19.8 M 18,34.2 L 32.4,34.2" ${stroke}/><path d="M 37.6,19.8 L 32.4,22.5 L 32.4,17.1 Z M 37.6,34.2 L 32.4,36.9 L 32.4,31.5 Z" fill="${color}"/>`;
        body += `<path d="M 63.06,1.92 L ${boxRight},1.92 M 63.06,52.08 L ${boxRight},52.08 M 0,0 L ${boxLeft},0 M 0,54 L ${boxLeft},54" ${stroke}/>`;
        if (base) body += `<path d="M 49.2,27 L 43.8,27 L 43.8,${boxBottom}" ${stroke}/>`;
        for (const label of labels) body += `<text x="${(boxLeft + boxRight) / 2}" y="27" text-anchor="middle" dominant-baseline="central"${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(label.text)}</text>`;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          const degrees = ((Number(options.theta) % 360) + 360) % 360;
          direction = ({ 0: 'right', 90: 'up', 180: 'left', 270: 'down' })[degrees] || Number(options.theta);
        } else if (selectedDirection) direction = selectedDirection;
        const radians = typeof direction === 'number' ? direction * Math.PI / 180 : 0;
        const [dx2, dy2, angle2] = typeof direction === 'number' ? [Math.cos(radians), -Math.sin(radians), -direction] : directions[direction];
        // Schemdraw's _flipreverse() mirrors the segments and the anchors; the
        // artwork group gets the same transform.
        const optoFlip = 'flip' in options, optoReverse = 'reverse' in options;
        const placed = placeComponent({ anchors, reverseCenter: (boxLeft + boxRight) / 2 }, [x, y], {
          direction: [dx2, dy2],
          anchor: options.anchor === undefined ? null : options.anchor,
          flip: optoFlip,
          reverse: optoReverse
        });
        const [bodyX, bodyY] = placed.transform(0, 0);
        const optoInner = (optoFlip || optoReverse)
          ? ` transform="translate(${optoReverse ? (boxLeft + boxRight) : 0} 0) scale(${optoReverse ? -1 : 1} ${optoFlip ? -1 : 1})"`
          : '';
        elements.push(`<g transform="translate(${bodyX} ${bodyY}) rotate(${angle2})"><g${optoInner}>${body}</g></g>`);
        for (const [lx, ly] of [[boxLeft, boxTop], [boxLeft, boxBottom], [boxRight, boxTop], [boxRight, boxBottom]]) {
          const [bx2, by2] = placed.transform(lx, ly);
          bounds(bx2, by2, bx2, by2);
        }
        if (name) names[name] = placed.anchors;
        log(`Optocoupler: box=${box} base=${base}`);
        continue;
      }
      if (type === 'Ic' || type === 'Multiplexer') {
        const isMux = type === 'Multiplexer';
        const allowedIc = ['at', 'anchor', 'drop', 'theta', 'color', 'flip', 'reverse', 'size', 'pin', 'side', 'pinspacing', 'plblofst', 'botlabel', ...(isMux ? ['demux', 'slant', 'pinspacing', 'flip', 'reverse'] : [])];
        if (labels.some(label => label.items || label.halign != null || label.ofst != null || label.rotate !== undefined) || Object.keys(options).some(key => !allowedIc.includes(key))) throw new Error(`${type} supports size, side, pin, pinspacing, plblofst, botlabel, at, anchor, drop, theta, color, and labels${isMux ? ', demux, slant, pinspacing, flip, reverse' : ''}.`);
        const sizeMatch = /^\(\s*(\d+(?:\.\d+)?|\.\d+)\s+(\d+(?:\.\d+)?|\.\d+)\s*\)$/.exec(options.size === undefined ? '' : options.size);
        if (options.size !== undefined && !sizeMatch) throw new Error(`${type} size must be specified as "(width height)".`);
        if ('at' in options) [x, y] = atPoint(options.at);
        let W = sizeMatch ? Number(sizeMatch[1]) * 36 : 0;
        let HH = sizeMatch ? Number(sizeMatch[2]) * 36 : 0;
        if (sizeMatch && (!(W > 0) || !(HH > 0))) throw new Error(`${type} size must be positive.`);
        const unitNumber = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (typeof options[key] !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key]) || !Number.isFinite(Number(options[key]))) throw new Error(`${key} must be a non-negative number.`);
          return Number(options[key]);
        };
        // Schemdraw's Ic `pinspacing` parameter is the default spacing for
        // sides that do not call .side(); `plblofst` is the matching default
        // for pin-number offsets.
        const icPinspacing = unitNumber('pinspacing', 0);
        const plblofst = unitNumber('plblofst', 0.075);
        if ('botlabel' in options && typeof options.botlabel !== 'string') throw new Error('botlabel must be a string.');
        const botLabel = 'botlabel' in options ? options.botlabel : null;
        // Schemdraw's IcSide defaults. Sides set with .side() use pinlabel_ofst
        // 0.05 and spacing 0, while untouched sides use pinspacing/plblofst.
        const defaultSide = () => ({
          spacing: icPinspacing, pad: 0.5, leadlen: 0.5,
          label_ofst: 0.15, label_size: 14,
          pinlabel_ofst: plblofst, pinlabel_size: 11
        });
        const sides = { L: defaultSide(), R: defaultSide(), T: defaultSide(), B: defaultSide() };
        for (const raw of options.side || []) {
          const parts = String(raw).trim().split(/\s+/);
          const side = parts[0] ? parts[0][0].toUpperCase() : '';
          if (!Object.prototype.hasOwnProperty.call(sides, side)) throw new Error(`side must be L, R, T, or B: ${raw}`);
          const setup = Object.assign(defaultSide(), { spacing: 0, pinlabel_ofst: 0.05 });
          for (const token of parts.slice(1)) {
            const match = /^([a-z_]+)=(.+)$/.exec(token);
            if (!match || !Object.prototype.hasOwnProperty.call(setup, match[1])) throw new Error(`Unsupported Ic side argument: ${token}`);
            const value = Number(match[2]);
            if (!Number.isFinite(value) || value < 0) throw new Error(`Ic side ${match[1]} must be a non-negative number.`);
            setup[match[1]] = value;
          }
          sides[side] = setup;
        }
        let demux = false, slant = 0, pinspacing = 0;
        if (isMux) {
          if ('demux' in options) {
            if (!['True', 'False'].includes(options.demux)) throw new Error('demux must be True or False.');
            demux = options.demux === 'True';
          }
          const number = (key, fallback, max) => {
            if (!(key in options)) return fallback;
            if (typeof options[key] !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key]) || !Number.isFinite(Number(options[key])) || Number(options[key]) > max || Number(options[key]) < -max) throw new Error(`${key} must be a number from -${max} to ${max}.`);
            return Number(options[key]);
          };
          slant = number('slant', 25, 89);
          pinspacing = number('pinspacing', 0, 100);
          if (pinspacing < 0) throw new Error('pinspacing must be a positive number.');
        }
        const pins = { L: [], R: [], T: [], B: [] };
        const used = new Set(['center', 'xy']);
        for (const raw of options.pin || []) {
          const parts = String(raw).trim().split(/\s+/);
          if (parts.length < 2) throw new Error(`pin must be specified as "side name number": ${raw}`);
          // Schemdraw takes the first letter of the side name, so both `L` and
          // `left` work.
          const side = parts[0].charAt(0).toUpperCase();
          if (!Object.prototype.hasOwnProperty.call(pins, side)) throw new Error(`pin side must be L, R, T, or B: ${raw}`);
          const name = parts[1] === '-' ? null : parts[1];
          const num = parts[2] === undefined || parts[2] === '-' ? null : parts[2];
          if (name !== null && !/^[A-Za-z_]\w*$/.test(name) && !(isMux && name === '>')) throw new Error(`pin name must contain only letters, digits, and underscores: ${name}`);
          if (num !== null && !/^[A-Za-z0-9_]+$/.test(num)) throw new Error(`Invalid pin number: ${num}`);
          // Optional pin attributes: slot="X/Y" and invert (Schemdraw's IcPin).
          let slot = null, invert = false;
          for (const token of parts.slice(3)) {
            if (token === 'invert') { invert = true; continue; }
            const attr = /^slot=(\d+)\/(\d+)$/.exec(token);
            if (!attr) throw new Error(`Unsupported Ic pin argument: ${token}`);
            const index = Number(attr[1]), count = Number(attr[2]);
            if (!(index >= 1) || !(count >= index) || count > 100) throw new Error(`Invalid Ic pin slot: ${token}`);
            slot = [index, count];
          }
          if (name && used.has(name)) throw new Error(`Duplicate terminal name: ${name}`);
          // Schemdraw does not reject duplicate pin numbers; the `pin<number>`
          // anchor is overwritten by the later pin. Keep that behaviour so
          // gallery examples with repeated numbers (e.g. pin='4' twice) render.
          if (name) used.add(name);
          if (num) used.add('pin' + num);
          pins[side].push({ name, num, clock: name === '>', slot, invert });
        }
        // Schemdraw's _setsize: compute the box from the per-side pads and
        // spacing when size is omitted, then center each side's pins.
        // Schemdraw's _countpins uses the largest slot denominator, so gaps
        // such as slot 9/22 and 16/22 stay empty.
        const counts = Object.fromEntries(['L', 'R', 'T', 'B'].map(side =>
          [side, Math.max(pins[side].length, 0, ...pins[side].map(pin => pin.slot ? pin.slot[1] : 0))]));
        if (!sizeMatch) {
          const lengths = {};
          const labelWidths = { L: 0, R: 0 };
          for (const side of ['L', 'R', 'T', 'B']) {
            const setup = sides[side];
            if (setup.spacing === 0) setup.spacing = 0.6;
            lengths[side] = setup.pad * 2 + setup.spacing * (counts[side] - 1);
            if (side === 'L' || side === 'R') {
              for (const pin of pins[side]) {
                if (pin.name) labelWidths[side] = Math.max(labelWidths[side], textWidth(pin.name, 14) / 36);
              }
            }
          }
          // Schemdraw uses edgepad 0.5 and lofst 0.15 for the minimum box.
          const labelw = labelWidths.L + labelWidths.R + 4 * 0.15;
          W = Math.max(lengths.T, lengths.B, 2.5, labelw) * 36;
          HH = Math.max(lengths.L, lengths.R, 2.5) * 36;
          for (const side of ['L', 'R']) sides[side].pad = (HH / 36 - sides[side].spacing * (counts[side] - 1)) / 2;
          for (const side of ['T', 'B']) sides[side].pad = (W / 36 - sides[side].spacing * (counts[side] - 1)) / 2;
        } else {
          // Schemdraw's _autopinlayout: keep the requested spacing and
          // recenter the pins along the specified box size.
          for (const side of ['L', 'R', 'T', 'B']) {
            const setup = sides[side];
            const length = side === 'T' || side === 'B' ? W / 36 : HH / 36;
            if (setup.spacing === 0) {
              if (counts[side] > 1) setup.spacing = (length - 2 * setup.pad) / (counts[side] - 1);
              else setup.pad = length / 2;
            } else {
              setup.pad = (length - setup.spacing * (counts[side] - 1)) / 2;
            }
          }
        }
        const anchors = { center: [W / 2, -HH / 2], xy: [0, 0] };
        let leads = '', bubbles = '';
        // Pin text positions are collected in local SVG coordinates (y down)
        // and written out once flip/reverse have been applied.
        const pending = [];
        const text = (px, py, value, size, align, side) => {
          pending.push({ px, py, value, size, align, side });
        };
        // The glyph is built in drawing coordinates (y up). The body group
        // mirrors it once, so the box sits above the origin (negative SVG y).
        const effectiveSlant = isMux ? (demux ? slant : -slant) : 0;
        const tan = Math.tan(effectiveSlant * Math.PI / 180);
        const corners = effectiveSlant < 0
          ? [[0, W * tan], [W, 0], [W, HH], [0, HH - W * tan]]
          : effectiveSlant > 0
            ? [[0, 0], [W, -W * tan], [W, HH + W * tan], [0, HH]]
            : [[0, 0], [W, 0], [W, HH], [0, HH]];
        // Schemdraw's _pinpos measures L/R pins from the bottom edge and
        // follows the slanted top/bottom edges for T/B pins.
        const topAt = z => HH + (effectiveSlant < 0 ? -W * tan : 0) + z * tan;
        const bottomAt = z => (effectiveSlant < 0 ? W * tan : 0) - z * tan;
        for (const side of ['L', 'R', 'T', 'B']) {
          const list = pins[side], n = counts[side], setup = sides[side];
          const len = side === 'L' || side === 'R' ? HH : W;
          const spacing = isMux && pinspacing > 0 ? pinspacing : setup.spacing;
          const sidePad = isMux && pinspacing > 0 ? (len / 36 - spacing * (n - 1)) / 2 : setup.pad;
          const leadLen = setup.leadlen * 36;
          const bubbleR = 0.15 * 36;
          list.forEach((pin, i) => {
            const index = pin.slot ? pin.slot[0] - 1 : i;
            const z = n > 1 ? (sidePad + index * spacing) * 36 : len / 2;
            const point = side === 'L' ? [0, z]
              : side === 'R' ? [W, z]
              : side === 'T' ? [z, topAt(z)]
              : [z, bottomAt(z)];
            const leadext = { L: [-leadLen, 0], R: [leadLen, 0], T: [0, leadLen], B: [0, -leadLen] }[side];
            const end = [point[0] + leadext[0], point[1] + leadext[1]];
            let start = point;
            if (pin.invert) {
              // Schemdraw's invert bubble sits just outside the box; the lead
              // starts after the bubble and the pin number moves out by 2r.
              const ofst = { L: [-bubbleR, 0], R: [bubbleR, 0], T: [0, bubbleR], B: [0, -bubbleR] }[side];
              const c = [point[0] + ofst[0], point[1] + ofst[1]];
              bubbles += `<circle cx="${c[0]}" cy="${c[1]}" r="${bubbleR}" fill="none" stroke="${color}" stroke-width="2"/>`;
              start = [point[0] + 2 * ofst[0], point[1] + 2 * ofst[1]];
            }
            leads += `M ${start[0]},${start[1]} L ${end[0]},${end[1]} `;
            anchors[`in${side}${i + 1}`] = [end[0], -end[1]];
            if (pin.name) anchors[pin.name] = [end[0], -end[1]];
            if (pin.num) anchors[`pin${pin.num}`] = [end[0], -end[1]];
            if (pin.clock) {
              // Schemdraw's _drawclkpin: sizes scale with the label font size.
              const clkw = 0.4 * setup.label_size / 16 * 36;
              const clkh = 0.2 * setup.label_size / 16 * 36;
              const dir = { L: 1, R: -1, T: -1, B: 1 }[side];
              if (side === 'T' || side === 'B') leads += `M ${point[0] - clkh},${point[1]} L ${point[0]},${point[1] + dir * clkw} L ${point[0] + clkh},${point[1]} `;
              else leads += `M ${point[0]},${point[1] + clkh} L ${point[0] + dir * clkw},${point[1]} L ${point[0]},${point[1] - clkh} `;
              anchors.CLK = [end[0], -end[1]];
              anchors['>'] = [end[0], -end[1]];
            }
            const lofst = { L: [setup.label_ofst * 36, 0], R: [-setup.label_ofst * 36, 0], T: [0, -setup.label_ofst * 36], B: [0, setup.label_ofst * 36] }[side];
            const lalign = { L: ['left', 'center'], R: ['right', 'center'], T: ['center', 'top'], B: ['center', 'bottom'] }[side];
            if (pin.name && !pin.clock) text(point[0] + lofst[0], -(point[1] + lofst[1]), pin.name, setup.label_size, lalign, side);
            if (pin.num) {
              const p = setup.pinlabel_ofst * 36;
              const shift = pin.invert ? 2 * bubbleR : 0;
              const pofst = { L: [-p - shift, p], R: [p + shift, p], T: [p, p + shift], B: [p, -p - shift] }[side];
              const palign = { L: ['right', 'bottom'], R: ['left', 'bottom'], T: ['left', 'bottom'], B: ['left', 'top'] }[side];
              text(point[0] + pofst[0], -(point[1] + pofst[1]), pin.num, setup.pinlabel_size, palign, side);
            }
          });
        }
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          const degrees = ((Number(options.theta) % 360) + 360) % 360;
          direction = ({ 0: 'right', 90: 'up', 180: 'left', 270: 'down' })[degrees] || Number(options.theta);
        } else if (selectedDirection) direction = selectedDirection;
        const radians = typeof direction === 'number' ? direction * Math.PI / 180 : 0;
        const [dx2, dy2, angle2] = typeof direction === 'number' ? [Math.cos(radians), -Math.sin(radians), -direction] : directions[direction];
        // Element._flipreverse() applies to every Element, not just Multiplexer.
        const flip = 'flip' in options, reverse = 'reverse' in options;
        let shape = `M ${corners.map(([px, py]) => `${px},${py}`).join(' L ')} Z`;
        const transformPath = (d, mate) => d.replace(/([ML])\s*(-?[\d.e+-]+),(-?[\d.e+-]+)/g,
          (_, cmd, px, py) => { const [mx, my] = mate(Number(px), Number(py)); return `${cmd} ${mx},${my}`; });
        const swapAlign = (value, a, b) => value === a ? b : value === b ? a : value;
        // Schemdraw mirrors segments/anchors and flips the vertical alignment
        // of T/B texts; pin texts themselves stay upright.
        if (flip) {
          shape = transformPath(shape, (px, py) => [px, -py]);
          leads = transformPath(leads, (px, py) => [px, -py]);
          for (const item of pending) {
            item.py = -item.py;
            if (item.side === 'T' || item.side === 'B') item.align = [item.align[0], swapAlign(item.align[1], 'top', 'bottom')];
          }
          for (const key of Object.keys(anchors)) anchors[key] = [anchors[key][0], -anchors[key][1]];
        }
        if (reverse) {
          shape = transformPath(shape, (px, py) => [W - px, py]);
          leads = transformPath(leads, (px, py) => [W - px, py]);
          for (const item of pending) {
            item.px = W - item.px;
            if (item.side === 'L' || item.side === 'R') item.align = [swapAlign(item.align[0], 'left', 'right'), item.align[1]];
          }
          for (const key of Object.keys(anchors)) anchors[key] = [W - anchors[key][0], anchors[key][1]];
        }
        const placed = placeComponent({ anchors }, [x, y], { direction: [dx2, dy2], anchor: options.anchor === undefined ? null : options.anchor });
        if ('drop' in options && !Object.prototype.hasOwnProperty.call(placed.anchors, options.drop)) throw new Error(`Unknown ${type} drop: ${options.drop}`);
        const texts = pending.map(({ px, py, value, size, align }) => {
          const anchor = { left: 'start', center: 'middle', right: 'end' }[align[0]];
          // Schemdraw's text_tosvg uses the ideographic baseline for
          // valign='bottom' (pin numbers on every side except top).
          const baseline = align[1] === 'center' ? 'central' : align[1] === 'top' ? 'hanging' : 'ideographic';
          return `<text x="${px}" y="${py}" text-anchor="${anchor}" dominant-baseline="${baseline}"${textFill} font-family="sans-serif" font-size="${size}">${escapeText(value)}</text>`;
        }).join('');
        // The component label sits at the box center (loc='center'), so flip
        // moves it with the box. Schemdraw still applies lblofst (0.1 unit) to
        // both axes for a center label, and flip/reverse mirror that offset.
        const labelX = W / 2 + (reverse ? -3.6 : 3.6);
        const labelY = (flip ? HH / 2 : -HH / 2) + (flip ? 3.6 : -3.6);
        const labelTexts = labels.map(label => `<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="central"${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(label.text)}</text>`).join('');
        // `botlabel` is Schemdraw's label at the bottom edge of the element
        // (0.1 units below the bbox, so below any bottom leads).
        const bottomLead = Math.max(0, ...pins.B.map(() => sides.B.leadlen * 36));
        const botLabelText = botLabel === null ? '' :
          `<text x="${W / 2}" y="${bottomLead + 3.6}" text-anchor="middle" dominant-baseline="hanging"${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(botLabel)}</text>`;
        const body = `<g transform="scale(1 -1)"><path d="${shape}" ${stroke}/><path d="${leads}" ${stroke}/>${bubbles}</g>${labelTexts}${botLabelText}`;
        // .anchor() moves the glyph so the named terminal sits at the insertion
        // point; use the anchor-adjusted local origin for the whole group.
        const [bodyX, bodyY] = placed.transform(0, 0);
        elements.push(`<g transform="translate(${bodyX} ${bodyY}) rotate(${angle2})">${body}${texts}</g>`);
        // Reserve room for the leads and pin numbers. When there are no side
        // labels, keep Schemdraw's full unit of margin around the box.
        const sideLabel = ['L', 'R'].some(side => (options.pin || []).some(raw => {
          const parts = String(raw).trim().split(/\s+/);
          return parts[0].charAt(0).toUpperCase() === side && parts[1] && parts[1] !== '-';
        }));
        const maxLead = Math.max(...['L', 'R', 'T', 'B'].map(side => sides[side].leadlen * 36));
        const margin = Math.max(sideLabel ? 21.6 : 39.6, maxLead + 3.6);
        const frame = corners.map(([px, py]) => {
          let fx = px, fy = py;
          if (flip) fy = -fy;
          if (reverse) fx = W - fx;
          return [fx, fy];
        });
        const xs = frame.map(point => point[0]), ys = frame.map(point => point[1]);
        const box = [
          [Math.min(...xs) - margin, -Math.max(...ys) - margin],
          [Math.max(...xs) + margin, -Math.max(...ys) - margin],
          [Math.min(...xs) - margin, -Math.min(...ys) + margin],
          [Math.max(...xs) + margin, -Math.min(...ys) + margin]
        ];
        for (const [lx, ly] of box) {
          const [bx2, by2] = placed.transform(lx, ly);
          bounds(bx2, by2, bx2, by2);
        }
        if (name) names[name] = placed.anchors;
        if ('drop' in options) [x, y] = placed.anchors[options.drop];
        log(`${type}: size=${(W / 36).toFixed(2)}x${(HH / 36).toFixed(2)} pins=${(options.pin || []).length}`);
        continue;
      }
      if (['IcDIP', 'Header', 'Transformer'].includes(type)) {
        const specific = type === 'IcDIP' ? ['pins', 'notch', 'width', 'pinw', 'spacing', 'number', 'pfontsize', 'flip', 'reverse'] : type === 'Header' ? ['rows', 'cols', 'style', 'numbering', 'shownumber', 'pinspacing', 'edge', 'pinfill', 'pinsleft', 'pinsright', 'pinalignleft', 'pinalignright', 'pinfontsizeleft', 'pinfontsizeright', 'flip', 'reverse', 'dx', 'dy'] : ['t1', 't2', 'core', 'loop', 'align', 'flip', 'reverse'];
        const headerLabels = type === 'Header' ? labels : [];
        // IcDIP pin-name labels (Schemdraw's `Element._place_label`): one label
        // per pin anchor (p1..pN, p1_in..pN_in) or box edge, no list labels.
        const dipLabels = type === 'IcDIP' ? labels : [];
        if (headerLabels.some(label => label.items || label.halign != null || label.ofst != null || label.rotate !== undefined || (label.loc && label.loc !== 'top')) || headerLabels.length > 1
          || dipLabels.some(label => label.items)
          || (type === 'Transformer' && labels.length)
          || length !== null || Object.keys(options).some(k => !['at', 'anchor', 'drop', 'theta', 'color', ...specific].includes(k))) throw new Error(`The specified arguments are not supported for ${type}.`);
        if (selectedDirection && 'theta' in options) throw new Error('A direction and theta cannot be specified together.');
        if (type === 'Header' && selectedDirection && selectedDirection !== 'right') throw new Error('Header only supports the right direction.');
        const num = (key, fallback, integer = false, max = 100) => {
          const v = options[key];
          if (v === undefined) return fallback;
          if (typeof v !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(v) || !Number.isFinite(Number(v)) || Number(v) <= 0 || Number(v) > max || (integer && !Number.isSafeInteger(Number(v)))) throw new Error(`${key} must be a positive ${integer ? 'integer' : 'number'} within range.`);
          return Number(v);
        };
        const bool = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (!['True', 'False'].includes(options[key])) throw new Error(`${key} must be True or False.`);
          return options[key] === 'True';
        };
        const anchors = { xy: [0, 0] }, shapes = [], texts = [], pinMarks = [];
        // Reverse mirrors about the element centre; each branch records its own
        // width here (Schemdraw falls back to the bbox centre when the element
        // defines no `center` anchor).
        let mirrorW = 0;
        let box, headerW = 0, headerH = 0, dipPins = 0;
        const path = d => shapes.push(`<path d="${d}" ${stroke}/>`);
        const text = (px, py, value, size, align = 'middle', baseline = 'central') => texts.push({ px, py, value, size, align, baseline });
        if (type === 'IcDIP') {
          const pins = num('pins', 8, true, 100), w = num('width', 3) * 36, pw = num('pinw', .6) * 36, space = num('spacing', .5) * 36;
          dipPins = pins;
          if (pins % 2) throw new Error('IcDIP pins must be an even number.');
          const height = pins / 2 * pw + (pins / 2 + 1) * space;
          mirrorW = w;
          const notch = bool('notch', true), number = bool('number', true), fs = num('pfontsize', 10, false, 1000);
          path(`M 0,0 H ${w} V ${-height} H 0 Z`);
          if (notch) path(`M ${w / 2 - pw / 2},${-height} A ${pw / 2},${pw / 2} 0 0 0 ${w / 2 + pw / 2},${-height}`);
          for (let i = 0; i < pins / 2; i++) {
            const y1 = -(space + i * (space + pw)), y2 = y1 - pw, ym = (y1 + y2) / 2, left = pins / 2 - i, right = pins / 2 + i + 1;
            path(`M 0,${y1} V ${y2} H ${-pw} V ${y1} Z M ${w},${y1} V ${y2} H ${w + pw} V ${y1} Z`);
            anchors[`p${left}`] = [-pw, ym]; anchors[`p${left}_in`] = [0, ym];
            anchors[`p${right}`] = [w + pw, ym]; anchors[`p${right}_in`] = [w, ym];
            if (number) { text(-pw / 2, ym, left, fs); text(w + pw / 2, ym, right, fs); }
          }
          box = [Math.min(-pw, notch ? w / 2 - pw / 2 : 0), -height, Math.max(w + pw, notch ? w / 2 + pw / 2 : w), 0];
        } else if (type === 'Header') {
          const rows = num('rows', 4, true, 100), cols = num('cols', 1, true, 100), spacing = num('pinspacing', .6) * 36, edge = num('edge', .3) * 36;
          const style = options.style || 'round', numbering = options.numbering || 'lr', shownumber = bool('shownumber', false);
          const pinList = (key) => {
            if (!(key in options)) return null;
            const parsed = readLabel(options[key]);
            if (!parsed.items) throw new Error(`${key} must use the form ['A' 'B'].`);
            return parsed.items;
          };
          const pinLeft = pinList('pinsleft'), pinRight = pinList('pinsright');
          const fontSize = (key) => {
            if (!(key in options)) return 9;
            if (typeof options[key] !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key]) || !(Number(options[key]) > 0)) throw new Error(`${key} must be a positive number.`);
            return Number(options[key]);
          };
          const pinFontLeft = fontSize('pinfontsizeleft'), pinFontRight = fontSize('pinfontsizeright');
          if (!['round', 'square', 'screw'].includes(style) || !['lr', 'ud', 'ccw'].includes(numbering)) throw new Error('Invalid Header style or numbering.');
          // Schemdraw resolves the default 'bg' fill to its default white background.
          const fill = options.pinfill === undefined || options.pinfill === 'bg' ? 'white' : readColor(options.pinfill);
          const w = (cols - 1) * spacing + 2 * edge, h = (rows - 1) * spacing + 2 * edge, r = 3.6;
          headerW = w; headerH = h; mirrorW = w;
          path(`M 0,0 V ${-h} H ${w} V 0 Z`);
          for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
            const px = col * spacing + edge, py = -h + row * spacing + edge;
            const n = numbering === 'lr' ? row * cols + col + 1 : numbering === 'ud' ? row + col * rows + 1 : col % 2 ? rows * col + rows - row : row + 1;
            anchors[`pin${n}`] = [px, py];
            if (style === 'square') {
              // Markers are emitted once, in the overlay pass (see pinMarks below).
              pinMarks.push({ px, py, r, style, fill: 'white' });
            } else {
              pinMarks.push({ px, py, r: style === 'screw' ? r * 1.75 : r, style, fill });
              if (style === 'screw') path(`M ${px+r},${py-r} L ${px-r},${py+r}`);
            }
            if (shownumber) text(col % 2 ? w + 1.8 : -1.8, py, n, 9, col % 2 ? 'start' : 'end', 'ideographic');
            // Pin name labels (Schemdraw `pinsleft` / `pinsright`).
            if (pinLeft && (cols === 1 || col % 2 === 0)) text(-1.8, py, pinLeft[row] ?? '', pinFontLeft, 'end', 'ideographic');
            if (pinRight && (cols === 1 || col % 2 === 1)) text(w + 1.8, py, pinRight[row] ?? '', pinFontRight, 'start', 'ideographic');
          }
          box = [-7, -h - 7, w + 7, 7];
        } else {
          const t1 = num('t1', 4, true, 100), t2 = num('t2', 4, true, 100), core = bool('core', true);
          if (bool('loop', false)) throw new Error('Transformer loop=True is not supported.');
          const align = options.align || 'center';
          if (!['center', 'bottom', 'top'].includes(align)) throw new Error('Invalid Transformer align.');
          const cw = (core ? 1 : .75) * 36, step = .4 * 36, lh = t1 * step, rh = t2 * step;
          const rb = align === 'center' ? (lh-rh)/2 : align === 'bottom' ? 0 : lh-rh;
          anchors.p1 = [0, -lh]; anchors.p2 = [0, 0]; anchors.s1 = [cw, -rb-rh]; anchors.s2 = [cw, -rb];
          for (let k = 0; k < t1; k++) { path(`M 0,${-k*step} A ${step/2},${step/2} 0 0 0 0,${-(k+1)*step}`); if (k < t1-1) anchors[`tapP${k+1}`] = [0, -(k+1)*step]; }
          for (let k = 0; k < t2; k++) { path(`M ${cw},${-rb-k*step} A ${step/2},${step/2} 0 0 1 ${cw},${-rb-(k+1)*step}`); if (k < t2-1) anchors[`tapS${k+1}`] = [cw, -rb-(k+1)*step]; }
          const top = Math.max(lh, rb+rh), bot = Math.min(0, rb);
          if (core) path(`M ${cw*.4},${-top} V ${-bot} M ${cw*.6},${-top} V ${-bot}`);
          box = [-step/2, -top, cw+step/2, -bot];
        }
        // Schemdraw's generic flip mirrors the element about its local x axis.
        // Text stays upright, so only the positions (and anchors/box) mirror.
        // Element._flipreverse(): mirror segments and anchors about y = 0 (flip)
        // and about the element centre x (reverse). IcDIP mirrors about its own
        // width, Header/Transformer about theirs.
        const headerFlip = 'flip' in options;
        const headerReverse = 'reverse' in options;

        if (headerFlip) {
          for (const key of Object.keys(anchors)) anchors[key] = [anchors[key][0], -anchors[key][1]];
          for (const item of texts) item.py = -item.py;
          for (const mark of pinMarks) mark.py = -mark.py;
          box = [box[0], -box[3], box[2], -box[1]];
        }
        if (headerReverse) {
          for (const key of Object.keys(anchors)) anchors[key] = [mirrorW - anchors[key][0], anchors[key][1]];
          for (const item of texts) item.px = mirrorW - item.px;
          for (const mark of pinMarks) mark.px = mirrorW - mark.px;
          box = [mirrorW - box[2], box[1], mirrorW - box[0], box[3]];
        }
        let theta = type === 'Header' ? 0 : selectedDirection ? ({right: 0, up: 90, left: 180, down: -90})[selectedDirection] : typeof direction === 'number' ? direction : ({right: 0, up: 90, left: 180, down: -90})[direction];
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          theta = Number(options.theta);
        }
        const a = -theta * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a);
        // Copy the point: `at` may reference a named anchor array that must not
        // be changed by the dx/dy offset below.
        const origin = 'at' in options ? [...atPoint(options.at)] : [x, y];
        // Schemdraw's .at(xy, dx=..., dy=...) offsets the placement point in
        // drawing units (positive dy is up).
        for (const key of ['dx', 'dy']) {
          if (!(key in options)) continue;
          if (typeof options[key] !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key]) || !Number.isFinite(Number(options[key]))) throw new Error(`Header ${key} must be a finite number.`);
          if (key === 'dx') origin[0] += Number(options[key]) * 36;
          else origin[1] -= Number(options[key]) * 36;
        }
        const placed = placeComponent({ anchors }, origin, { direction: [dx, dy], anchor: options.anchor === undefined ? null : options.anchor });
        if ('drop' in options && !Object.prototype.hasOwnProperty.call(anchors, options.drop)) throw new Error(`Unknown drop: ${options.drop}`);
        const [ox, oy] = placed.transform(0, 0);
        const headerMirror = (headerFlip || headerReverse)
          ? ` translate(${headerReverse ? mirrorW : 0} 0) scale(${headerReverse ? -1 : 1} ${headerFlip ? -1 : 1})`
          : '';
        elements.push(`<g transform="translate(${ox} ${oy}) rotate(${-theta})${headerMirror}">${shapes.join('')}</g>`);
        for (const mark of pinMarks) {
          const [wx, wy] = placed.transform(mark.px, mark.py);
          if (mark.style === 'square') {
            overlay.push(`<rect x="${wx - mark.r}" y="${wy - mark.r}" width="${2 * mark.r}" height="${2 * mark.r}" fill="${mark.fill}" stroke="${color}" stroke-width="2"/>`);
          } else {
            bgMarker(wx, wy, mark.r, color, mark.fill);
          }
        }
        for (const [px, py] of [[box[0],box[1]], [box[0],box[3]], [box[2],box[1]], [box[2],box[3]]]) { const [bx, by] = placed.transform(px, py); bounds(bx-2, by-2, bx+2, by+2); }
        for (const t of texts) {
          const [tx, ty] = placed.transform(t.px, t.py), width = String(t.value).length * t.size;
          bounds(tx-width, ty-t.size, tx+width, ty+t.size);
          if (t.baseline === 'ideographic') elements.push(`<text x="${tx}" y="${ty - t.size}" text-anchor="${t.align}" dominant-baseline="ideographic" fill="${color}" font-family="sans-serif" font-size="${t.size}"><tspan x="${tx}" dy="${t.size}">${t.value}</tspan></text>`);
          else elements.push(`<text x="${tx}" y="${ty}" text-anchor="${t.align}" dominant-baseline="central" fill="${color}" font-family="sans-serif" font-size="${t.size}">${t.value}</text>`);
        }
        // IcDIP pin-name labels, ported from Schemdraw's Element._place_label:
        // the anchor is a pin (pN / pN_in) or box edge, alignment comes from
        // which bbox edge the anchor sits on, and the default 0.1-unit offset
        // is expanded exactly like _align_label's (halign, valign) table.
        for (const label of dipLabels) {
          const loc = label.loc == null ? 'top'
            : ({ bot: 'bottom', B: 'bottom', lft: 'left', L: 'left', rgt: 'right', R: 'right', T: 'top' }[label.loc] || label.loc);
          const [x0, y0, x1, y1] = box; // SVG-local: y0 is the top edge, y1 the bottom.
          let ax, ay, halign, valign;
          if (loc === 'center') {
            ax = (x0 + x1) / 2; ay = (y0 + y1) / 2;
            halign = 'center'; valign = 'center';
          } else if (['top', 'bottom', 'left', 'right'].includes(loc)) {
            ax = loc === 'left' ? x0 : loc === 'right' ? x1 : (x0 + x1) / 2;
            ay = loc === 'top' ? y0 : loc === 'bottom' ? y1 : (y0 + y1) / 2;
            halign = loc === 'left' ? 'right' : loc === 'right' ? 'left' : 'center';
            valign = loc === 'top' ? 'bottom' : loc === 'bottom' ? 'top' : 'center';
          } else if (Object.prototype.hasOwnProperty.call(anchors, loc)) {
            [ax, ay] = anchors[loc];
            // Schemdraw compares anchors to the bbox edges with abs_tol=.15 units.
            const tol = .15 * 36;
            halign = Math.abs(ax - x0) <= tol ? 'right' : Math.abs(ax - x1) <= tol ? 'left' : 'center';
            valign = Math.abs(ay - y1) <= tol ? 'top' : Math.abs(ay - y0) <= tol ? 'bottom' : 'center';
          } else {
            throw new Error(`IcDIP label loc must be p1..p${dipPins}, p1_in..p${dipPins}_in, top, bottom, left, right, or center.`);
          }
          let ox, oy;
          if (Array.isArray(label.ofst)) {
            // `ofst=(x y)` is in element-local coordinates (positive y up).
            [ox, oy] = label.ofst;
          } else {
            const pofst = label.ofst == null ? .1 : label.ofst;
            // Schemdraw expands a numeric offset with the bbox-derived
            // alignment, before any user halign/valign override.
            ox = halign === 'right' ? -pofst : halign === 'left' ? pofst : 0;
            oy = valign === 'bottom' ? pofst : valign === 'top' ? -pofst : 0;
          }
          halign = label.halign || halign;
          valign = label.valign || valign;
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          const [lx, ly] = placed.transform(ax + ox * 36, ay - oy * 36);
          const align = { left: 'start', center: 'middle', right: 'end' }[halign];
          const baseline = valign === 'top' ? 'hanging' : valign === 'bottom' ? 'ideographic' : 'central';
          const lines = String(label.text).split('\n');
          const spans = lines.map(line => `<tspan x="${lx}" dy="${size}">${labelContent(line)}</tspan>`).join('');
          // Schemdraw's text_tosvg: h = lines*fontsize, y = ytext - h, where
          // center uses y + h/2 - size/2, top uses y + h - size, bottom uses y.
          const h = lines.length * size;
          const ytext = valign === 'center' ? ly + h / 2 - size / 2
            : valign === 'top' ? ly + h - size : ly;
          const yAttr = ytext - h;
          // Optional label rotation (Schemdraw: rotate=True uses the element
          // angle, keeps text upright for 90<theta<270; a number is absolute).
          let rotation = 0;
          if (label.rotate === true) {
            rotation = ((theta % 360) + 360) % 360;
            if (rotation > 90 && rotation < 270) rotation -= 180;
          } else if (typeof label.rotate === 'number') {
            rotation = ((label.rotate % 360) + 360) % 360;
          }
          const rotateAttr = rotation ? ` transform="rotate(${-rotation} ${lx} ${ly})"` : '';
          const width = Math.max(size, Math.max(...lines.map(line => textWidth(labelContent(line), size))));
          const bx = align === 'start' ? lx : align === 'end' ? lx - width : lx - width / 2;
          bounds(bx, yAttr, bx + width, yAttr + (lines.length + 1) * size);
          elements.push(`<text x="${lx}" y="${yAttr}" text-anchor="${align}" dominant-baseline="${baseline}"${rotateAttr}${label.color ? ` fill="${label.color}"` : textFill} font-family="sans-serif" font-size="${size}">${spans}</text>`);
        }
        // Header labels default to Schemdraw's 'top' location: 0.1 units
        // above the (possibly flipped) box, centred.
        for (const label of headerLabels) {
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          const top = headerFlip ? 0 : -headerH;
          const [lx, ly] = placed.transform(headerW / 2, top - 3.6);
          elements.push(`<text x="${lx}" y="${ly}" text-anchor="middle"${textFill} font-family="sans-serif" font-size="${size}">${labelContent(label.text)}</text>`);
          const width = Math.max(size, Array.from(label.text).length * size * .6);
          bounds(lx - width, ly - size - 4, lx + width, ly + 4);
        }
        if (name) names[name] = placed.anchors;
        if ('drop' in options) { [x, y] = placed.anchors[options.drop]; direction = theta; }
        log(`${type}: ${'drop' in options ? 'drop=' + options.drop : 'cursor unchanged'}`);
        continue;
      }
      if (type === 'OrthoLines') {
        if (labels.length || selectedDirection || length !== null || Object.keys(options).some(key => !['at', 'to', 'delta', 'n', 'dy', 'xstart', 'color'].includes(key))) throw new Error('OrthoLines supports n, dy, xstart, at, to, delta, and color.');
        let n = 1;
        if ('n' in options) {
          if (typeof options.n !== 'string' || !/^\d+$/.test(options.n) || !Number.isSafeInteger(Number(options.n)) || Number(options.n) < 1 || Number(options.n) > 100) throw new Error('OrthoLines n must be an integer from 1 to 100.');
          n = Number(options.n);
        }
        let ndy = 0.6 * 36;
        if ('dy' in options) {
          if (typeof options.dy !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.dy) || !(Number(options.dy) > 0)) throw new Error('OrthoLines dy must be a positive number.');
          ndy = Number(options.dy) * 36;
        }
        let xstart = null;
        if ('xstart' in options) {
          if (typeof options.xstart !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.xstart) || Number(options.xstart) < 0 || Number(options.xstart) > 1) throw new Error('OrthoLines xstart must be between 0 and 1.');
          xstart = Number(options.xstart);
        }
        if ('at' in options) [x, y] = atPoint(options.at);
        let end;
        if ('delta' in options) {
          const m = /^\(\s*(\S+)\s+(\S+)\s*\)$/.exec(String(options.delta));
          if (!m) throw new Error('OrthoLines delta must be specified as delta="(dx dy)".');
          end = [x + readMove(m[1], unit), y - readMove(m[2], unit)];
        } else if ('to' in options) {
          end = atPoint(options.to);
        } else throw new Error('OrthoLines requires to or delta.');
        const originX = x, originY = -y;
        const ddx = end[0] - x, ddy = -end[1] - originY;
        const lines = [];
        if (Math.abs(ddy) < 0.05 * 36) {
          for (let i = 0; i < n; i++) {
            const yy = -i * ndy;
            lines.push([[0, yy], [ddx, yy]]);
          }
        } else {
          let x0;
          if (xstart !== null) {
            x0 = ddy > 0 ? ddx * xstart : ddx * xstart - ndy - ndy * (n - 1) * xstart;
          } else {
            x0 = ddx > 0 ? ddx / 2 - (ndy * (n - 1)) / 2 : ddx / 2 + (ndy * (n - 1)) / 2;
          }
          for (let i = 0; i < n; i++) {
            const yy = -i * ndy;
            let xx;
            if (ddy > 0) xx = ddx > 0 ? x0 + ndy * i : x0 - ndy * i;
            else xx = ddx > 0 ? x0 + (n - i) * ndy : x0 - (n - i) * ndy;
            lines.push([[0, yy], [xx, yy], [xx, yy + ddy], [ddx, yy + ddy]]);
          }
        }
        for (const vertices of lines) {
          const world = vertices.map(([vx, vy]) => [originX + vx, -(originY + vy)]);
          elements.push(`<path d="${world.map((p, i) => `${i ? 'L' : 'M'} ${p[0]},${p[1]}`).join(' ')}" ${stroke}/>`);
          for (const [px, py] of world) bounds(px - 2, py - 2, px + 2, py + 2);
        }
        log(`OrthoLines: n=${n} dy=${(ndy / 36).toFixed(2)}`);
        continue;
      }
      if (type === 'Wire') {
        if (labels.some(label => label.rotate !== undefined || (label.ofst != null && !Array.isArray(label.ofst)))) throw new Error('Wire labels do not support rotate or numeric ofst.');
        if (selectedDirection || length !== null || Object.keys(options).some(key => !['at', 'to', 'shape', 'k', 'arrow', 'color', 'hold', 'delta', 'dx', 'dy', 'dot', 'idot'].includes(key))) throw new Error('Wire supports shape, k, arrow, at, to, delta, dx, dy, dot, idot, hold, color, and label.');
        const wireShape = options.shape === undefined ? '-' : options.shape;
        if (!['-', '-|', '|-', 'z', 'N', 'n', 'c'].includes(wireShape)) throw new Error(`Unsupported Wire shape: ${wireShape}`);
        if ('arrow' in options && options.arrow !== '->') throw new Error('Wire arrow only supports ->.');
        let k = 36;
        if ('k' in options) {
          if (typeof options.k !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.k) || !Number.isFinite(Number(options.k) * 36)) throw new Error('Wire k must be a finite number.');
          k = Number(options.k) * 36;
        }
        const offset = (key) => {
          if (!(key in options)) return 0;
          if (typeof options[key] !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key]) || !Number.isFinite(Number(options[key]) * 36)) throw new Error(`Wire ${key} must be a finite number.`);
          return Number(options[key]) * 36;
        };
        if ('at' in options) [x, y] = atPoint(options.at);
        const start = [x, y];
        let end;
        if ('delta' in options) {
          const m = /^\(\s*(\S+)\s+(\S+)\s*\)$/.exec(String(options.delta));
          if (!m) throw new Error('Wire delta must be specified as delta="(dx dy)".');
          const dx = readMove(m[1], unit), dy = readMove(m[2], unit);
          end = [x + dx, y - dy];
        } else if ('to' in options) {
          const target = atPoint(options.to);
          end = [target[0] + offset('dx'), target[1] - offset('dy')];
        } else end = [108, 72];
        const dx = end[0] - x, dy = end[1] - y;
        let vertices, mid;
        if (wireShape === '-') { vertices = [start, end]; mid = [x + dx / 2, y + dy / 2]; }
        else if (wireShape === '-|') { vertices = [start, [end[0], y], end]; mid = [end[0], y + dy / 2]; direction = dy < 0 ? 'up' : 'down'; }
        else if (wireShape === '|-') { vertices = [start, [x, end[1]], end]; mid = [x + dx / 2, end[1]]; direction = dx > 0 ? 'right' : 'left'; }
        else if (wireShape === 'z') { const step = dx > 0 ? Math.abs(k) : -Math.abs(k); vertices = [start, [x + step, y], [end[0] - step, end[1]], end]; mid = [x + dx / 2, y + dy / 2]; direction = dx > 0 ? 'right' : 'left'; }
        else if (wireShape === 'N') { const step = dy < 0 ? -Math.abs(k) : Math.abs(k); vertices = [start, [x, y + step], [end[0], end[1] - step], end]; mid = [x + dx / 2, y + dy / 2]; direction = dy < 0 ? 'up' : 'down'; }
        else if (wireShape === 'n') { vertices = [start, [x, y - k], [end[0], y - k], end]; mid = [x + dx / 2, y - k]; direction = -dy > k ? 'up' : 'down'; }
        else { vertices = [start, [x + k, y], [x + k, end[1]], end]; mid = [x + k, y + dy / 2]; direction = dx > k ? 'right' : 'left'; }
        if (vertices.some(p => p.some(n => !Number.isFinite(n)))) throw new Error('Wire coordinates are too large.');
        const path = vertices.map((p, i) => `${i ? 'L' : 'M'} ${p[0]},${p[1]}`).join(' ');
        elements.push(`<path d="${path}" ${stroke}/>`);
        for (const [vx, vy] of vertices) bounds(vx - 2, vy - 2, vx + 2, vy + 2);
        if ('arrow' in options) {
          let i = vertices.length - 2;
          while (i >= 0 && vertices[i][0] === end[0] && vertices[i][1] === end[1]) i--;
          if (i < 0) throw new Error('Cannot add an arrow to a zero-length Wire.');
          const ax = end[0] - vertices[i][0], ay = end[1] - vertices[i][1], len = Math.hypot(ax, ay);
          const ux = ax / len, uy = ay / len, bx = end[0] - 9 * ux, by = end[1] - 9 * uy;
          const corners = [[bx - 2.7 * uy, by + 2.7 * ux], [bx + 2.7 * uy, by - 2.7 * ux]];
          elements.push(`<path d="M ${end[0]},${end[1]} L ${corners[0][0]},${corners[0][1]} L ${corners[1][0]},${corners[1][1]} Z" fill="${color}" stroke="${color}"/>`);
          for (const [vx, vy] of corners) bounds(vx - 1, vy - 1, vx + 1, vy + 1);
        }
        const anchors = { start, end, mid, xy: start };
        // Schemdraw's Wire.dot()/idot() place a filled dot at the end/start.
        for (const [key, px, py] of [['idot', start[0], start[1]], ['dot', end[0], end[1]]]) {
          if (!(key in options)) continue;
          if (options[key] === 'open') whiteMarker(px, py, 2.7, color);
          else elements.push(`<circle cx="${px}" cy="${py}" r="2.7" fill="${color}" stroke="${color}" stroke-width="2"/>`);
        }
        const xs = vertices.map(p => p[0]), ys = vertices.map(p => p[1]);
        const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
        for (const label of labels) {
          if (label.items || typeof label.text !== 'string') throw new Error('Wire does not support list labels.');
          const loc = label.loc || 'mid';
          let lx, ly, ha = 'center', va = 'center';
          if (Object.prototype.hasOwnProperty.call(anchors, loc)) {
            [lx, ly] = anchors[loc];
            ha = Math.abs(lx - left) <= 5.4 ? 'right' : Math.abs(lx - right) <= 5.4 ? 'left' : 'center';
            va = Math.abs(ly - bottom) <= 5.4 ? 'top' : Math.abs(ly - top) <= 5.4 ? 'bottom' : 'center';
          } else if (loc === 'center') { lx = (left + right) / 2; ly = (top + bottom) / 2; }
          else if (loc === 'top') { lx = (left + right) / 2; ly = top; va = 'bottom'; }
          else if (loc === 'bot' || loc === 'bottom') { lx = (left + right) / 2; ly = bottom; va = 'top'; }
          else if (loc === 'left') { lx = left; ly = (top + bottom) / 2; ha = 'right'; }
          else if (loc === 'right') { lx = right; ly = (top + bottom) / 2; ha = 'left'; }
          else throw new Error(`Unsupported Wire label loc: ${loc}`);
          if (label.ofst == null) {
            const offset = 3.6;
            lx += ha === 'left' ? offset : ha === 'right' ? -offset : 0;
            ly += va === 'top' ? offset : va === 'bottom' ? -offset : (Object.prototype.hasOwnProperty.call(anchors, loc) ? -offset : 0);
          } else {
            const ox = label.ofst[0] * 36, oy = label.ofst[1] * 36;
            if (!Number.isFinite(ox) || !Number.isFinite(oy)) throw new Error('Wire label ofst must be a finite number.');
            lx += ox; ly -= oy;
          }
          ha = label.halign || ha;
          if (!['left', 'right', 'center'].includes(ha)) throw new Error(`Invalid label halign: ${ha}`);
          const anchor = { left: 'start', right: 'end', center: 'middle' }[ha];
          const baseline = va === 'top' ? 'hanging' : va === 'bottom' ? 'auto' : 'central';
          const visible = label.text.startsWith('$') && label.text.endsWith('$') ? label.text.replace(/[$_{}]/g, '') : label.text;
          const width = Math.max(12, Array.from(visible).length * 10);
          bounds(lx - (ha === 'right' ? width : ha === 'center' ? width / 2 : 0), ly - 18, lx + (ha === 'left' ? width : ha === 'center' ? width / 2 : 0), ly + 18);
          elements.push(`<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="${baseline}"${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(label.text)}</text>`);
        }
        if (name) {
          names[name] = anchors;
          namedBoxes[name] = { ...elemBox };
        }
        [x, y] = end;
        if ('hold' in options) [x, y, direction] = previousState;
        log(`Wire: shape=${wireShape}`);
        continue;
      }
      if (isMeter) {
        const analog = type === 'MeterAnalog', digital = type === 'MeterDigital', scope = type === 'Oscilloscope';
        const allowed = ['at', 'anchor', 'theta', 'flip', 'reverse', 'color', 'input_fill', 'width', 'corner', 'inputs', 'input_ofst', 'input_lw', 'input_rad',
          ...(analog ? ['needle_percent', 'window_fill', 'needle_color', 'needle_width'] : []),
          ...(digital || scope ? ['screen_fill', 'screen_lw'] : []),
          ...(scope ? ['signal', 'signal_color', 'signal_lw', 'grid', 'grid_color', 'grid_lw'] : [])];
        if (Object.keys(options).some(key => !allowed.includes(key))) throw new Error(`The specified arguments are not supported for ${type}.`);
        if ('at' in options) [x, y] = atPoint(options.at);
        const numeric = (key, fallback, positive = false, scale = false) => {
          if (options[key] === undefined) return fallback;
          if (typeof options[key] !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key]) || !Number.isFinite(Number(options[key])) || (positive && Number(options[key]) <= 0)) throw new Error(`${key} must be a finite positive number.`);
          return Number(options[key]) * (scale ? 36 : 1);
        };
        const boolOpt = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (!['True', 'False'].includes(options[key])) throw new Error(`${key} must be True or False.`);
          return options[key] === 'True';
        };
        const colorOpt = (key, fallback) => {
          if (options[key] === undefined) return fallback;
          if (options[key] === 'bg') return 'white';
          return readColor(options[key]);
        };
        const W = numeric('width', 54, true, true), corner = numeric('corner', 7.2, true, true);
        const inputs = boolOpt('inputs', true);
        let inputOfst = [14.4, 10.8];
        if ('input_ofst' in options) {
          const m = /^\(\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\)$/.exec(options.input_ofst);
          if (!m) throw new Error('input_ofst must be specified as input_ofst="(x y)".');
          inputOfst = [Number(m[1]) * 36, Number(m[2]) * 36];
        }
        const inputRad = numeric('input_rad', 3.6, true, true), inputLw = numeric('input_lw', 1, true);
        const inputFill = colorOpt('input_fill', 'none');
        const needle = numeric('needle_percent', 70);
        if (needle < 0 || needle > 100) throw new Error('needle_percent must be between 0 and 100.');
        const needleColor = colorOpt('needle_color', 'black'), needleWidth = numeric('needle_width', 1.5, true);
        const windowFill = colorOpt('window_fill', 'none');
        const screenFill = colorOpt('screen_fill', 'none'), screenLw = numeric('screen_lw', 1, true);
        const gridOn = boolOpt('grid', true), gridColor = colorOpt('grid_color', '#666666'), gridLw = numeric('grid_lw', 0.3, true);
        const signalWidth = numeric('signal_lw', 2, true), signalColor = colorOpt('signal_color', '#e0213b');
        const signal = options.signal === undefined ? 'none' : options.signal;
        if (!['none', 'sine', 'square', 'triangle'].includes(signal)) throw new Error(`Invalid signal: ${signal}`);
        const anchors = {
          N: [W / 2, -W], S: [W / 2, 0], E: [W, -W / 2], W: [0, -W / 2],
          NE: [W, -W], SE: [W, 0], NW: [0, -W], SW: [0, 0],
          in1: [inputOfst[0], -inputOfst[1]], in2: [W - inputOfst[0], -inputOfst[1]],
          name: [W / 2, 0], xy: [0, 0]
        };
        if (digital) anchors.display = [W / 2, -(0.85 * W - W / 3)];
        const definition = { anchors, defaultDrop: 'in2' };
        // Schemdraw's meter boxes are plain Elements: theta / a direction
        // keyword rotates the symbol and its anchors through the shared
        // Transform port.
        let meterTheta = 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          meterTheta = Number(options.theta);
        } else if (selectedDirection) {
          meterTheta = ({ right: 0, up: 90, left: 180, down: 270 })[selectedDirection];
        }
        const radians = typeof direction === 'number' ? direction * Math.PI / 180 : 0;
        const [dx, dy, angle] = typeof direction === 'number' ? [Math.cos(radians), -Math.sin(radians), -direction] : directions[direction];
        const placed = placeElement(definition.anchors, [x, y], {
          theta: meterTheta,
          flip: 'flip' in options,
          reverse: 'reverse' in options,
          center: W / 2,
          anchor: options.anchor === undefined ? null : options.anchor,
          zoom: 1
        });
        const meterAnchor = placed.anchorPoint;
        // Segment/SegmentPoly/SegmentCircle all implement doflip(), while
        // SegmentPath.doflip() is commented out in schemdraw. The box, inputs
        // and needle therefore flip; the analog window does not.
        const placedOps = placed;
        // Geometry is built as operations in Schemdraw's local frame (box
        // 0..W with y up, i.e. y = -W..0 on screen) and every point is mapped
        // through placeElement.put(), the same transform the anchors use.
        // A text group is no longer wrapped in an SVG transform list, which is
        // what made the artwork rotate about a different origin than the pins.
        const ops = [];
        // Schemdraw mirrors the polygon vertices first (SegmentPoly.doflip /
        // doreverse) and rounds the corners afterwards, so the arcs are built in
        // the mirrored frame. Do the same: mirror the verts, then round.
        // SegmentPoly.doreverse() also reverses the vertex order, which keeps the
        // winding (and therefore the corner arcs) consistent.
        let boxVerts = [[0, 0], [0, W], [W, W], [W, 0]].map(([px, py]) => [
          'reverse' in options ? W - px : px,
          'flip' in options ? -py : py
        ]);
        if ('reverse' in options) boxVerts = boxVerts.reverse();
        const meterFullGroup = `translate(${x} ${y})`
          + (meterTheta ? ` rotate(${-meterTheta})` : '')
          + ` translate(${-meterAnchor[0]} ${-meterAnchor[1]})`;
        ops.push({ kind: 'raw', svg: `<g transform="${meterFullGroup}"><path d="${
          roundCornersPath(boxVerts, corner, true)}" fill="none" stroke="${color}" stroke-width="2"/></g>` });
        if (inputs) {
          ops.push({ kind: 'circle', cx: inputOfst[0], cy: -inputOfst[1], r: inputRad, fill: inputFill, lw: inputLw });
          ops.push({ kind: 'circle', cx: W - inputOfst[0], cy: -inputOfst[1], r: inputRad, fill: inputFill, lw: inputLw });
        }
        if (analog) {
          // Schemdraw MeterAnalog: arcy = 1.2, arcy2 = 0.86, arch = 0.2 and the
          // lower curve control is arcy2 + arch*0.7 (not + arch). Window lw = 1,
          // needle lw = needle_width.
          const center = W / 2, arcy = 43.2, arcy2 = 30.96, arch = 7.2;
          const a = (112 - 45 * needle / 100) * Math.PI / 180;
          const dial = `M ${center - W / 3},-${arcy} Q ${center},-${arcy + arch} ${center + W / 3},-${arcy}`
            + ` L ${center + W / 4},-${arcy2} Q ${center},-${arcy2 + arch * 0.7} ${center - W / 4},-${arcy2} Z`;
          const needlePath = `M ${center + 33.84 * Math.cos(a)},${-33.84 * Math.sin(a)}`
            + ` L ${center + 43.2 * Math.cos(a)},${-43.2 * Math.sin(a)}`;
          // SegmentPath keeps its coordinates under flip (only reverse applies),
          // while the plain Segment needle flips; reproduce both cases.
          const dialMirror = ('reverse' in options)
            ? ` translate(${2 * (W / 2)} 0) scale(-1 1)` : '';
          const dialGroup = `translate(${x} ${y})`
            + (meterTheta ? ` rotate(${-meterTheta})` : '')
            + ` translate(${-meterAnchor[0]} ${-meterAnchor[1]})`
            + dialMirror;
          // SegmentPath implements doflip(); plain Segment (the needle) does not,
          // so a flip mirrors the window but leaves the needle alone.
          const needleGroup = `translate(${x} ${y})`
            + (meterTheta ? ` rotate(${-meterTheta})` : '')
            + ` translate(${-meterAnchor[0]} ${-meterAnchor[1]})`
            + ((('reverse' in options) || ('flip' in options))
              ? ` translate(${'reverse' in options ? 2 * (W / 2) : 0} 0) scale(${'reverse' in options ? -1 : 1} ${'flip' in options ? -1 : 1})`
              : '');
          ops.push({ kind: 'raw', svg: `<g transform="${dialGroup}">`
            + `<path d="${dial}" fill="${windowFill}" stroke="${color}" stroke-width="1"/></g>`
            + `<g transform="${needleGroup}">`
            + `<path d="${needlePath}" fill="none" stroke="${needleColor}" stroke-width="${needleWidth}"/></g>` });
        }
        if (digital) {
          const wleft = W * .1, wright = W * .9, wtop = W * .85, wheight = W / 3;
          ops.push({ kind: 'rect', x: wleft, y: -wtop, w: wright - wleft, h: wheight, rx: 0, fill: screenFill, lw: screenLw });
        }
        if (scope) {
          const wleft = W * .15, wright = W * .85, wwidth = wright - wleft;
          const grid = wwidth / 5, wheight = grid * 3, wtop = W * .9, wbot = wtop - wheight;
          ops.push({ kind: 'rect', x: wleft, y: -wtop, w: wwidth, h: wheight, rx: 0, fill: screenFill, lw: screenLw });
          if (gridOn) {
            for (let i = 1; i <= 4; i++) {
              ops.push({ kind: 'path', pts: [[wleft + i * grid, -wtop], [wleft + i * grid, -wbot]], fill: 'none', lw: gridLw, color: gridColor });
            }
            for (let i = 1; i <= 2; i++) {
              ops.push({ kind: 'path', pts: [[wleft, -(wbot + i * grid)], [wright, -(wbot + i * grid)]], fill: 'none', lw: gridLw, color: gridColor });
            }
          }
          const sbot = wbot + wheight / 4, stop = wtop - wheight / 4;
          const e1 = wleft + wwidth / 3 - 3.6, e2 = wleft + wwidth * 2 / 3 - 3.6, e3 = wright - 3.6;
          let pts = [];
          if (signal === 'sine') pts = Array.from({ length: 20 }, (_, i) => [wleft + wwidth * i / 19, -(wbot + wheight / 2 + Math.sin(i / 19 * Math.PI * 2) * wheight / 3)]);
          if (signal === 'square') pts = [[wleft, -sbot], [e1, -sbot], [e1, -stop], [e2, -stop], [e2, -sbot], [e3, -sbot], [e3, -stop], [wright, -stop]];
          if (signal === 'triangle') pts = [[wleft, -sbot], [e1, -stop], [e2, -sbot], [e3, -stop], [wright, -(stop - 3.6)]];
          if (pts.length) ops.push({ kind: 'path', pts, fill: 'none', lw: signalWidth, color: signalColor });
        }

        const axisAligned = Math.abs(meterTheta % 90) < 1e-9;
        let shape = '';
        for (const op of ops) {
          if (op.kind === 'raw') { shape += op.svg; continue; }
          if (op.kind === 'circle') {
            const [cx, cy] = placedOps.put([op.cx, op.cy]);
            shape += `<circle cx="${cx.toFixed(3)}" cy="${cy.toFixed(3)}" r="${op.r}" fill="${op.fill}" stroke="${color}" stroke-width="${op.lw}"/>`;
          } else if (op.kind === 'path') {
            const d = op.pts.map((point, i) => {
              const [px, py] = placedOps.put(point);
              return `${i ? 'L' : 'M'} ${px.toFixed(3)},${py.toFixed(3)}`;
            }).join(' ');
            shape += `<path d="${d}" fill="${op.fill}" stroke="${op.color || color}" stroke-width="${op.lw}" stroke-linecap="round" stroke-linejoin="round"/>`;
          } else {
            const corners = [[op.x, op.y], [op.x + op.w, op.y], [op.x + op.w, op.y + op.h], [op.x, op.y + op.h]].map(placedOps.put);
            if (axisAligned) {
              const xs = corners.map(c => c[0]), ys = corners.map(c => c[1]);
              const x0 = Math.min(...xs), y0 = Math.min(...ys);
              shape += `<rect x="${x0.toFixed(3)}" y="${y0.toFixed(3)}" width="${(Math.max(...xs) - x0).toFixed(3)}" height="${(Math.max(...ys) - y0).toFixed(3)}" rx="${op.rx}" fill="${op.fill}" stroke="${color}" stroke-width="${op.lw}"/>`;
            } else {
              const d = corners.map((c, i) => `${i ? 'L' : 'M'} ${c[0].toFixed(3)},${c[1].toFixed(3)}`).join(' ');
              shape += `<path d="${d} Z" fill="${op.fill}" stroke="${color}" stroke-width="${op.lw}" stroke-linejoin="round"/>`;
            }
          }
        }
        elements.push(shape);
        const margin = Math.max(2, signalWidth / 2);
        for (const corner2 of [[0, 0], [W, 0], [0, -W], [W, -W]]) {
          const [bx, by] = placed.transform(corner2);
          bounds(bx - margin, by - margin, bx + margin, by + margin);
        }
        for (const label of labels) {
          if (label.items || label.halign != null || label.ofst != null || label.rotate !== undefined || !['name', 'in1', 'in2', 'display'].includes(label.loc) || !Object.prototype.hasOwnProperty.call(definition.anchors, label.loc)) throw new Error(`${type} label loc must be ${digital ? 'name, in1, in2, or display' : 'name, in1, or in2'}.`);
          const [localX, localY] = definition.anchors[label.loc];
          const size = label.fontsize === undefined ? (label.loc === 'display' ? (labelSizeSet ? labelSize : 11) : labelSize) : label.fontsize;
          const [lx, ty] = placed.transform(localX, localY - (label.loc === 'in1' || label.loc === 'in2' ? inputRad + 3.6 : 3.6));
          const width = Math.max(size, Array.from(label.text).length * size * .75);
          bounds(lx - width / 2, ty - size * 1.2, lx + width / 2, ty + size * .3);
          elements.push(`<text x="${lx}" y="${ty}" text-anchor="middle" dominant-baseline="auto" fill="${label.color || color}" font-family="sans-serif" font-size="${size}">${labelContent(label.text)}</text>`);
        }
        if (name) names[name] = placed.anchors;
        [x, y] = placed.anchors[definition.defaultDrop];
        log(`${type}: drop=in2`);
        continue;
      }
      const oneTerminalType = ['Ground', 'GroundSignal', 'GroundChassis', 'Vdd', 'Vss', 'NoConnect'].includes(type);
      // List labels are positioned by their own edge logic, so loc/ofst/halign
      // are checked separately from the single-label rules below.
      if (labels.some(label => label.items && label.loc != null && !['top', 'bot', 'bottom', 'left', 'right', 'center'].includes(label.loc))) throw new Error('List labels support loc top, bot, left, right, or center.');
      // Two-terminal parts place labels with the schemdraw rules, so ofst,
      // halign and valign are accepted there. Other elements keep the old limits.
      // Stand-alone symbols whose labels are placed with Schemdraw's
      // Element._place_label() against their local bbox.
      const bboxLabelType = ['Speaker', 'Mic', 'AudioJack', 'Antenna', 'AntennaLoop', 'AntennaLoop2', 'Tag'].includes(type);
      const genericLabel = Object.prototype.hasOwnProperty.call(twoTerminalParts, type)
        || bboxLabelType
        || ['BjtNpn2', 'BjtPnp2', 'BjtPnp2c2', 'NMos2', 'PMos2', 'NFet2', 'PFet2', 'JFetN2', 'JFetP2',
          'Potentiometer', 'PotentiometerIEC', 'PotentiometerIEEE', 'Rshunt', 'SCR', 'Triac',
          'Battery', 'BatteryCell', 'BatteryDouble', 'SourceI', 'Zener', 'LED', 'Diac',
          'Fuse', 'FuseIEC', 'FuseIEEE', 'Breaker', 'Motor'].includes(type);
      const transistorType = Boolean(componentDefinitions[type] && componentDefinitions[type].transistor);
      // dsp symbols place labels with Schemdraw's bbox/rotalign rules, so they
      // accept ofst, halign and valign like the two-terminal parts.
      const dspLabel = DSP_TYPES.has(type);
      if (labels.some(label => !label.items && type !== 'Opamp' && (
        ['start', 'end'].includes(label.loc)
        || (['base', 'collector', 'emitter'].includes(label.loc) && !transistorType)
        || (type === 'Dot' && label.ofst != null && !Array.isArray(label.ofst))
        || (label.valign != null && !genericLabel && !transistorType && !dspLabel)
        || (label.halign != null && !genericLabel && type !== 'Dot' && !oneTerminalType && !transistorType && !dspLabel)
        || (label.ofst != null && !genericLabel && type !== 'Dot' && !oneTerminalType && !transistorType && !dspLabel)
        || (label.rotate !== undefined && !(type === 'Resistor' && (!label.loc || label.loc === 'top')) && !oneTerminalType && !genericLabel)
      ))) throw new Error(`The specified label arguments are not supported for ${type}.`);
      const transistor = Boolean(componentDefinitions[type] && componentDefinitions[type].transistor);
      if ('anchor' in options && typeof options.anchor !== 'string') throw new Error('anchor must specify a terminal name.');
      if ('drop' in options && (!(transistor || logicGateTypes.has(type) || DSP_TYPES.has(type)) || typeof options.drop !== 'string')) throw new Error('drop must specify a terminal name.');
      if (('leads' in options && type !== 'Opamp') || ('lead' in options && type !== 'Ground')) throw new Error(`That constructor argument cannot be used with ${type}.`);
      const transistors = ['Bjt', 'JFet', 'Hemt', 'NpnSchottky', 'PnpSchottky', 'BjtNpn', 'BjtPnp', 'BjtPnp2c', 'BjtNpn2', 'BjtPnp2', 'BjtPnp2c2', 'IgbtN', 'IgbtP', 'NpnPhoto', 'PnpPhoto', 'AnalogNFet', 'AnalogPFet', 'AnalogBiasedFet', 'NMos2', 'PMos2', 'NFet2', 'PFet2', 'JFetN2', 'JFetP2', 'JFetN', 'JFetP', 'NFet', 'PFet', 'NMos', 'PMos'];
      if ('reverse' in options && !['Opamp', 'SourceV', 'SourceI', 'Zener', 'Potentiometer', 'Rshunt', 'SCR', 'Triac', 'Ground', 'GroundSignal', 'GroundChassis', 'Vdd', 'Vss', 'NoConnect', 'CurrentMirror', 'VoltageMirror', 'Breaker', 'Inductor2', 'CPE', 'Nullator', 'Norator', 'Memristor2', 'ResistorVar', 'Capacitor2', 'ResistorVarIEC', 'ResistorVarIEEE', 'PotentiometerIEC', 'PotentiometerIEEE', 'FuseIEC', 'FuseIEEE', 'DiodeTunnel', 'DiodeTVS', 'DiodeShockley', 'Josephson', 'Diac', 'Fuse', 'LED', 'Dot', 'Gap', 'Photoresistor', 'PhotoresistorBox', 'PhotoresistorIEC', 'PhotoresistorIEEE', 'Coax', 'Triax', 'Motor', 'BusLine', 'DataBusLine', 'Battery', 'BatteryCell', 'BatteryDouble', ...transistors, ...Object.keys(twoTerminalParts), ...logicGateTypes, 'SwitchRotary', 'SwitchDIP', 'Antenna', 'AntennaLoop', 'AntennaLoop2', 'Speaker', 'Mic', 'AudioJack', "OutletA","OutletB","OutletC","OutletD","OutletE","OutletF","OutletG","OutletH","OutletI","OutletJ","OutletK","OutletL", 'Tag', 'Label', 'Arrowhead', 'DotDotDot', ...DSP_TYPES].includes(type)) throw new Error(`${type} does not support reverse.`);
      if ('flip' in options && !['Opamp', 'Zener', 'LED', 'Diac', 'Fuse', 'Dot', 'Gap', 'Battery', 'BatteryCell', 'BatteryDouble', 'SourceI', 'Potentiometer', 'Rshunt', 'SCR', 'Triac', 'Ground', 'GroundSignal', 'GroundChassis', 'Vdd', 'Vss', 'NoConnect', 'CurrentMirror', 'VoltageMirror', 'Breaker', 'Inductor2', 'CPE', 'Nullator', 'Norator', 'Memristor2', 'ResistorVar', 'Capacitor2', 'ResistorVarIEC', 'ResistorVarIEEE', 'PotentiometerIEC', 'PotentiometerIEEE', 'FuseIEC', 'FuseIEEE', 'DiodeTunnel', 'DiodeTVS', 'DiodeShockley', 'Josephson', 'Photoresistor', 'PhotoresistorBox', 'PhotoresistorIEC', 'PhotoresistorIEEE', 'Coax', 'Triax', 'Motor', 'BusLine', 'DataBusLine', ...transistors, ...Object.keys(twoTerminalParts), ...logicGateTypes, 'SwitchRotary', 'SwitchDIP', 'Antenna', 'AntennaLoop', 'AntennaLoop2', 'Speaker', 'Mic', 'AudioJack', "OutletA","OutletB","OutletC","OutletD","OutletE","OutletF","OutletG","OutletH","OutletI","OutletJ","OutletK","OutletL", 'Tag', 'Label', 'Arrowhead', 'DotDotDot', ...DSP_TYPES].includes(type)) throw new Error(`${type} does not support flip.`);
      let zoom = 1;
      if ('scale' in options) {
        if (typeof options.scale !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.scale) || !(Number(options.scale) > 0)) throw new Error('scale must be a finite positive number.');
        zoom = Number(options.scale);
      }
      let shift = 0;
      if ('shift' in options) {
        if (['BjtNpn', 'Dot', 'Opamp', 'Ground'].includes(type)) throw new Error(`${type} does not support shift.`);
        if (typeof options.shift !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.shift) || !Number.isFinite(Number(options.shift))) throw new Error('shift must be a finite number.');
        shift = Number(options.shift);
      }
      let bulk = false;
      if ('bulk' in options) {
        if (!['NFet2', 'PFet2', 'NFet', 'PFet', 'AnalogNFet', 'AnalogPFet', 'AnalogBiasedFet'].includes(type)) throw new Error('bulk can only be specified for NFet/PFET-family components.');
        if (!['True', 'False'].includes(options.bulk)) throw new Error('bulk must be True or False.');
        bulk = options.bulk === 'True';
      }
      let circle = false;
      if ('circle' in options) {
        if (!['JFetN2', 'JFetP2', 'Bjt', 'JFet', 'NpnSchottky', 'PnpSchottky', 'BjtNpn', 'BjtPnp', 'BjtPnp2c', 'JFetN', 'JFetP', 'NMos', 'PMos', 'NMos2', 'PMos2', 'BjtNpn2', 'BjtPnp2', 'BjtPnp2c2'].includes(type)) throw new Error('circle can only be specified for BJT/JFET/MOSFET-family components.');
        if (!['True', 'False'].includes(options.circle)) throw new Error('circle must be True or False.');
        circle = options.circle === 'True';
      }
      let dots = true;
      if ('dots' in options) {
        if (type !== 'Breaker' && type !== 'AudioJack') throw new Error('dots can only be specified for Breaker.');
        if (!['True', 'False'].includes(options.dots)) throw new Error('dots must be True or False.');
        dots = options.dots === 'True';
      }
      // Switch-specific flags (Switch / SwitchSpdt).
      if (['Switch', 'SwitchSpdt', 'SwitchSpdt2', 'SwitchDpst', 'SwitchDpdt'].includes(type)) {
        for (const key of ['contacts', 'nc', 'link']) {
          if (key in options && !['True', 'False'].includes(options[key])) throw new Error(`${key} must be True or False.`);
        }
        if ('nc' in options && type !== 'Switch') throw new Error('nc can only be specified for Switch.');
        if ('action' in options && !['open', 'close'].includes(options.action)) throw new Error('action must be "open" or "close".');
      }
      let loops = 4, coreLines = 0;
      if (type === 'Inductor2') {
        const num = (key, fallback, allowZero = false) => {
          if (!(key in options)) return fallback;
          // Schemdraw's core/loops are ints; Python treats True/False as 1/0.
          if (options[key] === 'True') return 1;
          if (options[key] === 'False') return 0;
          const value = Number(options[key]);
          if (typeof options[key] !== 'string' || !/^\d+$/.test(options[key]) || !Number.isSafeInteger(value) || value < (allowZero ? 0 : 1) || value > 100) throw new Error(`${key} must be an integer within range.`);
          return value;
        };
        loops = num('loops', 4);
        coreLines = num('core', 0, true);
      }
      let polar = false;
      if ('polar' in options) {
        if (type !== 'Capacitor2' && type !== 'Capacitor') throw new Error('polar can only be specified for Capacitor or Capacitor2.');
        if (!['True', 'False'].includes(options.polar)) throw new Error('polar must be True or False.');
        polar = options.polar === 'True';
      }
      let josephsonBox = false;
      if ('box' in options && type === 'Josephson') {
        if (!['True', 'False'].includes(options.box)) throw new Error('box must be True or False.');
        josephsonBox = options.box === 'True';
      }
      let coaxRadius = 10.8, coaxLead = 21.6;
      if (type === 'Coax') {
        const positive = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (typeof options[key] !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key]) || !(Number(options[key]) > 0)) throw new Error(`${key} must be a positive number.`);
          return Number(options[key]) * 36;
        };
        coaxRadius = positive('radius', 10.8);
        coaxLead = positive('leadlen', 21.6);
      }
      // Triax dimensions (Schemdraw defaults: leadlen .6, r1 .3, r2 .6,
      // shield offsets .3).
      let triaxLead = 21.6, triaxR1 = 10.8, triaxR2 = 21.6, triaxOfsStart = 10.8, triaxOfsEnd = 10.8;
      if (type === 'Triax') {
        const positive = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (typeof options[key] !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key]) || !(Number(options[key]) >= 0)) throw new Error(`${key} must be a non-negative number.`);
          return Number(options[key]) * 36;
        };
        triaxLead = positive('leadlen', 21.6);
        triaxR1 = positive('radiusinner', 10.8);
        triaxR2 = positive('radiusouter', 21.6);
        triaxOfsStart = positive('shieldofststart', 10.8);
        triaxOfsEnd = positive('shieldofstend', 10.8);
      }
      let busLw = 4;
      if (type === 'BusLine' && 'lw' in options) {
        if (typeof options.lw !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.lw) || !(Number(options.lw) > 0)) throw new Error('lw must be a positive number.');
        busLw = Number(options.lw);
      }
      let tapH = 0.72 * 36;
      if ('tap_length' in options) {
        if (type !== 'Potentiometer' && type !== 'PotentiometerIEC' && type !== 'PotentiometerIEEE') throw new Error('tap_length can only be specified for Potentiometer, PotentiometerIEC, or PotentiometerIEEE.');
        if (typeof options.tap_length !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.tap_length) || !(Number(options.tap_length) > 0) || !Number.isFinite(Number(options.tap_length) * 36)) throw new Error('tap_length must be a finite positive number.');
        tapH = Number(options.tap_length) * 36;
      }
      // flip mirrors the local y axis, which matches Schemdraw's Element.flip().
      const sy = 'flip' in options ? -1 : 1;
      if ('theta' in options) {
        if (type === 'Dot') throw new Error(`${type} does not support theta.`);
        if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
      }
      if ('length' in options) {
        if (length !== null) throw new Error('Only one length may be specified.');
        if (typeof options.length !== 'string') throw new Error('A length value is required.');
        length = readLength(options.length, unit);
      }
      if ('endpoints' in options && ['BjtNpn', 'Dot', 'Opamp', 'Ground'].includes(type)) throw new Error(`${type} endpoints cannot be combined with the specified options.`);
      if ('at' in options) [x, y] = atPoint(options.at);
      const atPlacement = 'at' in options ? [x, y] : null;
      let definition = componentDefinitions[type];
      if (definition && definition.analog) {
        const bool = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (!['True', 'False'].includes(options[key])) throw new Error(`${key} must be True or False.`);
          return options[key] === 'True';
        };
        const bulk = bool('bulk', false), offsetGate = bool('offset_gate', true), sourceArrow = bool('source_arrow', true);
        const gateY = offsetGate ? (type === 'AnalogPFet' ? 18 : 42) : 30;
        const anchors = {
          source: type === 'AnalogPFet' ? [0, 0] : [0, 60],
          drain: type === 'AnalogPFet' ? [0, 60] : [0, 0],
          gate: [33, gateY],
          center: [0, 30],
          xy: [0, 0]
        };
        if (bulk) anchors.bulk = [0, 30];
        const segments = [
          { path: 'M 0,0 L 0,15 L 15,15 L 15,45 L 0,45 L 0,60', filled: false },
          { path: `M 18,18 L 18,42 M 18,${gateY} L 33,${gateY}`, filled: false }
        ];
        if (!bulk && sourceArrow) {
          if (type === 'AnalogBiasedFet') {
            segments.push({ circle: [4.5, 45, 2.25], filled: true });
          } else if (type === 'AnalogPFet') {
            segments.push({ path: 'M 0,15 L 6,15', filled: false });
            segments.push({ path: 'M 13,15 L 6,19.5 L 6,10.5 Z', filled: true });
          } else {
            segments.push({ path: 'M 15,45 L 9,45', filled: false });
            segments.push({ path: 'M 2,45 L 9,40.5 L 9,49.5 Z', filled: true });
          }
        }
        if (bulk) {
          if (type === 'AnalogPFet') {
            segments.push({ path: 'M 15,30 L 9,30', filled: false });
            segments.push({ path: 'M 2,30 L 9,25.5 L 9,34.5 Z', filled: true });
          } else if (type === 'AnalogBiasedFet') {
            segments.push({ path: 'M 0,30 L 15,30', filled: false });
            segments.push({ circle: [10.5, 30, 2.25], filled: true });
          } else {
            segments.push({ path: 'M 0,30 L 6,30', filled: false });
            segments.push({ path: 'M 13,30 L 6,34.5 L 6,25.5 Z', filled: true });
          }
        }
        definition = { ...definition, anchors, segments, defaultDrop: type === 'AnalogPFet' ? 'drain' : 'source' };
      }
      if (definition && definition.transistor) {
        const modes = ['at', 'anchor', 'theta', 'color', 'drop', 'hold', 'flip', 'reverse',
          ...(definition.analog ? ['bulk', 'offset_gate', 'source_arrow'] : []),
          ...(['NMos', 'PMos'].includes(type) ? ['diode'] : []),
          ...(['NFet', 'PFet'].includes(type) ? ['bulk'] : []),
          ...(definition.extendable || ['BjtNpn', 'BjtPnp', 'BjtPnp2c', 'JFetN', 'JFetP', 'NMos', 'PMos'].includes(type) ? ['circle'] : []),
          ...(definition.hemt ? ['split', 'source_arrow'] : [])];
        if (length !== null || Object.keys(options).some(key => !modes.includes(key))) throw new Error(`${type} supports at, anchor, direction, theta, color, drop, hold, flip, reverse, and terminal labels.`);
        if ('anchor' in options && typeof options.anchor !== 'string') throw new Error('anchor must specify a terminal name.');
        if ('theta' in options) {
          const degrees = ((Number(options.theta) % 360) + 360) % 360;
          direction = ({ 0: 'right', 90: 'up', 180: 'left', 270: 'down' })[degrees] || Number(options.theta);
        } else if (selectedDirection) direction = selectedDirection;
        const arbitrary = typeof direction === 'number';
        const radians = arbitrary ? direction * Math.PI / 180 : 0;
        const [dx, dy, angle] = arbitrary ? [Math.cos(radians), -Math.sin(radians), -direction] : directions[direction];
        const anchorName = options.anchor === undefined ? null : options.anchor;
        const { transform, anchors } = placeComponent(definition, [x, y], {
          direction: [dx, dy],
          anchor: anchorName,
          flip: 'flip' in options,
          reverse: 'reverse' in options
        });
        // Element.hold() (schemdraw element.py): restore the drawing position and
        // direction saved before placement. This is a full state pop, unlike the
        // two-terminal hold that keeps the element's own direction.
        const heldState = 'hold' in options ? [x, y, direction] : null;
        const drop = options.drop === undefined ? definition.defaultDrop : options.drop;
        if (!Object.prototype.hasOwnProperty.call(anchors, drop)) throw new Error(`Unknown ${type} drop: ${drop}`);
        // Schemdraw's xy anchor is the unreflected local origin moved by .anchor().
        if (Object.prototype.hasOwnProperty.call(definition.anchors, 'xy')) {
          const ax = anchorName === null ? 0 : definition.anchors[anchorName][0];
          const ay = anchorName === null ? 0 : definition.anchors[anchorName][1];
          anchors.xy = [x - dx * ax + dy * ay, y - dy * ax - dx * ay];
        }
        // Schemdraw mirrors the glyph about the center anchor and aligns a named
        // anchor to the insertion point before rotating; express that as an
        // inner transform around the raw glyph.
        const sx = 'reverse' in options ? -1 : 1, sy2 = 'flip' in options ? -1 : 1;
        const anchorPoint = anchorName === null ? [0, 0] : definition.anchors[anchorName];
        const bx = (sx === -1 ? 2 * definition.reverseCenter : 0) - sx * anchorPoint[0];
        const by = -sy2 * anchorPoint[1];
        const inner = (sx === 1 && sy2 === 1 && bx === 0 && by === 0) ? '' : ` transform="translate(${bx} ${by}) scale(${sx} ${sy2})"`;
        // Optional enclosing circle, positioned exactly as Schemdraw does for
        // each transistor family (values are in the glyph's screen coordinates).
        const circleMap = {
          Bjt: [19.8, 0, 19.8], BjtNpn: [19.8, 0, 19.8], BjtPnp: [19.8, 0, 19.8], BjtPnp2c: [19.8, 0, 19.8],
          NpnSchottky: [19.8, 0, 19.8], PnpSchottky: [19.8, 0, 19.8],
          JFet: [9, 24, 26.4], JFetN: [9, 24, 26.4], JFetP: [9, 24, 26.4],
          NMos: [-3, 30, 21], PMos: [-3, 30, 21]
        }[type];
        const circleSeg = options.circle === 'True' && circleMap
          ? `<circle cx="${circleMap[0]}" cy="${circleMap[1]}" r="${circleMap[2]}" fill="none" stroke="${color}" stroke-width="2"/>`
          : '';
        // HEMT glyph, ported from Schemdraw's `Hemt`: the gate bar is split or
        // solid and the source lead carries a directional arrow.
        let hemtSeg = circleSeg;
        if (definition.hemt) {
          const split = options.split === undefined || options.split === 'True';
          const arrowMode = options.source_arrow === undefined ? true : options.source_arrow;
          const gate = split
            ? 'M 24,10.8 L 24,17.28 M 24,23.76 L 24,30.24 M 24,36.72 L 24,43.2'
            : 'M 24,10.8 L 24,43.2';
          hemtSeg = `<path d="M 0,0 L 0,15 L 24,15 ${gate} M 24,39 L 0,39 L 0,54" ${stroke}/>` +
            `<path d="M 24,27 L 43.2,27" ${stroke}/>`;
          if (arrowMode === '>' || arrowMode === '&gt;') {
            hemtSeg += `<path d="M 0,39 L 15,39" ${stroke}/><path d="M 22,39 L 15,42.6 L 15,35.4 Z" fill="${color}"/>`;
          } else if (arrowMode !== 'False') {
            hemtSeg += `<path d="M 9,39 L 24,39" ${stroke}/><path d="M 2,39 L 9,35.4 L 9,42.6 Z" fill="${color}"/>`;
          }
        }
        // `diode=True` on the vertical MOSFETs adds the body diode beside the
        // channel (Schemdraw `_Mosfet`: u = 1/24 unit).
        let diodeSeg = '';
        if (options.diode === 'True' && (type === 'NMos' || type === 'PMos')) {
          const d = 1;
          diodeSeg = `<path d="M 0,${21 * d} L ${9 * d},${21 * d} L ${9 * d},${27 * d}" ${stroke}/>` +
            `<path d="M ${6 * d},${27 * d} L ${12 * d},${27 * d}" ${stroke}/>` +
            `<polygon points="${9 * d},${27 * d} ${6 * d},${33 * d} ${12 * d},${33 * d} " fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>` +
            `<path d="M ${9 * d},${33 * d} L ${9 * d},${39 * d} L 0,${39 * d}" ${stroke}/>`;
        }
        // `bulk=True` on NFet/PFet adds the bulk lead with its arrowhead.
        if (options.bulk === 'True' && (type === 'NFet' || type === 'PFet')) {
          diodeSeg += `<path d="M 0,27 L 15,27" ${stroke}/>` +
            `<path d="M 22,27 L 15,30.6 L 15,23.4 Z" fill="${color}"/>`;
        }
        elements.push(`<g transform="translate(${x} ${y}) rotate(${angle})"><g${inner}>${definition.hemt ? hemtSeg : renderPathSegments(definition.segments, color, stroke) + circleSeg + diodeSeg}</g></g>`);
        const [ex1, ex2, ey1, ey2] = definition.extent;
        for (const corner of [[ex1, ey1], [ex1, ey2], [ex2, ey1], [ex2, ey2]]) {
          const [bx2, by2] = transform(...corner);
          bounds(bx2 - 2, by2 - 2, bx2 + 2, by2 + 2);
        }
        // The optional circle extends past the bare glyph's extent.
        if (options.circle === 'True' && circleMap) {
          for (const [cx2, cy2] of [[circleMap[0] - circleMap[2], circleMap[1] - circleMap[2]],
            [circleMap[0] + circleMap[2], circleMap[1] + circleMap[2]]]) {
            const [bx2, by2] = transform(cx2, cy2);
            bounds(bx2 - 2, by2 - 2, bx2 + 2, by2 + 2);
          }
        }
        const labelPoints = definition.anchors;
        // Top/bottom/left/right labels use the element's box on screen, so a
        // rotated transistor still gets its label above or below as drawn.
        // Schemdraw uses the glyph's segment bbox (no margin); the enclosing
        // circle is measured as 0..1.1 units, so the label sits further out
        // when circle=True.
        let glyphX1 = Infinity, glyphY1 = Infinity, glyphX2 = -Infinity, glyphY2 = -Infinity;
        for (const seg of definition.segments) {
          if (typeof seg.path === 'string') {
            for (const m of seg.path.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)) {
              const gx = Number(m[1]), gy = Number(m[2]);
              glyphX1 = Math.min(glyphX1, gx); glyphX2 = Math.max(glyphX2, gx);
              glyphY1 = Math.min(glyphY1, gy); glyphY2 = Math.max(glyphY2, gy);
            }
          } else if (Array.isArray(seg.circle)) {
            const [cx, cy, r] = seg.circle;
            glyphX1 = Math.min(glyphX1, cx - r); glyphX2 = Math.max(glyphX2, cx + r);
            glyphY1 = Math.min(glyphY1, cy - r); glyphY2 = Math.max(glyphY2, cy + r);
          }
        }
        const hasGlyphBox = Number.isFinite(glyphX1);
        const labelEx1 = 'circle' in options ? Math.min(hasGlyphBox ? glyphX1 : ex1, 0) : (hasGlyphBox ? glyphX1 : ex1);
        const labelEx2 = 'circle' in options ? Math.max(hasGlyphBox ? glyphX2 : ex2, 1.1 * 36) : (hasGlyphBox ? glyphX2 : ex2);
        const labelEy1 = hasGlyphBox ? glyphY1 : ey1;
        const labelEy2 = hasGlyphBox ? glyphY2 : ey2;
        const screenCorners = [[labelEx1, labelEy1], [labelEx1, labelEy2], [labelEx2, labelEy1], [labelEx2, labelEy2]].map(corner => transform(corner[0], corner[1]));
        const screenX1 = Math.min(...screenCorners.map(c => c[0])), screenX2 = Math.max(...screenCorners.map(c => c[0]));
        const screenY1 = Math.min(...screenCorners.map(c => c[1])), screenY2 = Math.max(...screenCorners.map(c => c[1]));
        // Schemdraw's transistor classes set `lblloc`: BJT/MOSFET families use
        // the right side, JFET/FET families the left, 2-terminal variants the
        // bottom.
        const rightDefault = ['Bjt', 'BjtNpn', 'BjtPnp', 'BjtPnp2c', 'NpnSchottky', 'PnpSchottky',
          'IgbtN', 'IgbtP', 'NpnPhoto', 'PnpPhoto', 'NMos', 'PMos', 'CurrentMirror', 'VoltageMirror'].includes(type);
        const leftDefault = ['JFet', 'JFetN', 'JFetP', 'Hemt', 'NFet', 'PFet', 'AnalogNFet', 'AnalogPFet', 'AnalogBiasedFet'].includes(type);
        const transistorDefaultLoc = rightDefault ? 'right' : leftDefault ? 'left' : 'bottom';
        for (const label of labels) {
          if (label.items) throw new Error(`${type} does not support list labels.`);
          // `ofst` moves the label away from the bbox edge (default lblofst 0.1).
          const labelOffset = () => {
            if (label.ofst == null) return 3.6;
            if (Array.isArray(label.ofst)) throw new Error(`${type} label ofst must be a number.`);
            if (!Number.isFinite(label.ofst)) throw new Error(`${type} label ofst must be a finite number.`);
            return label.ofst * 36;
          };
          const locI = label.loc || transistorDefaultLoc;
          const loc = locI;
          let lx, ly, anchor = 'middle', baseline = 'central', screenPlaced = false;
          if (loc !== 'xy' && Object.prototype.hasOwnProperty.call(labelPoints, loc)) {
            [lx, ly] = labelPoints[loc];
            if (type === 'BjtNpn' || type === 'BjtPnp') {
              if (loc === 'base') { lx -= 7; ly -= 3; anchor = 'end'; }
              else if (loc === 'collector') { lx += 4; ly -= 3; anchor = 'start'; }
              else if (loc === 'emitter') { lx += 4; ly += 3; anchor = 'start'; }
              else { ly -= 19; baseline = 'ideographic'; }
            } else if (type === 'BjtPnp2c' && loc === 'C2') {
              lx += 7; anchor = 'start';
            } else {
              const [cx0, cy0] = labelPoints.center || [0, 0];
              const vx = lx - cx0, vy = ly - cy0, len = Math.hypot(vx, vy) || 1;
              lx += vx / len * 7; ly += vy / len * 7;
            }
          } else if (loc === 'top') { lx = (screenX1 + screenX2) / 2; ly = screenY1 - labelOffset(); baseline = 'ideographic'; screenPlaced = true; }
          else if (loc === 'bot' || loc === 'bottom') { lx = (screenX1 + screenX2) / 2; ly = screenY2 + labelOffset(); baseline = 'hanging'; screenPlaced = true; }
          else if (loc === 'left') { lx = screenX1 - labelOffset(); ly = (screenY1 + screenY2) / 2; anchor = 'end'; screenPlaced = true; }
          else if (loc === 'right') { lx = screenX2 + labelOffset(); ly = (screenY1 + screenY2) / 2; anchor = 'start'; screenPlaced = true; }
          else throw new Error(`Unsupported ${type} label loc: ${loc}`);
          const [tx, ty] = screenPlaced ? [lx, ly] : transform(lx, ly);
          // Multi-line labels follow Schemdraw's text_tosvg layout: y is the
          // anchor minus (lines+1)/2·size and every tspan advances by `size`.
          const lines = String(label.text).split('\n');
          const valign = baseline === ' dominant-baseline="hanging"' ? 'top'
            : baseline === ' dominant-baseline="central"' ? 'center' : 'bottom';
          const yAttr = valign === 'center' ? ty - (lines.length + 1) / 2 * labelSize
            : valign === 'top' ? ty - labelSize
              : ty - lines.length * labelSize;
          const spans = lines.map(line => `<tspan x="${tx}" dy="${labelSize}">${labelContent(line)}</tspan>`).join('');
          const width = Math.max(12, Math.max(...lines.map(line => Array.from(line).length)) * 10);
          bounds(tx - (anchor === 'start' ? 0 : anchor === 'end' ? width : width / 2), yAttr - labelSize, tx + (anchor === 'end' ? 0 : anchor === 'start' ? width : width / 2), yAttr + (lines.length + 1) * labelSize);
          elements.push(`<text x="${tx}" y="${yAttr}" text-anchor="${anchor}" dominant-baseline="${baseline}"${textFill} font-family="sans-serif" font-size="${labelSize}">${spans}</text>`);
        }
        if (name) {
          names[name] = anchors;
          namedBoxes[name] = { ...elemBox };
          namedTypes[name] = type;
          namedDirs[name] = [dx, dy];
          namedReversed[name] = 'reverse' in options;
        }
        [x, y] = anchors[drop];
        if (heldState) [x, y, direction] = heldState;
        log(`${type}: drop=${drop}`);
        continue;
      }
      if (type === 'Dot') {
        if (selectedDirection || length !== null || 'to' in options || 'tox' in options || 'toy' in options || 'idot' in options || 'dot' in options || 'hold' in options || 'anchor' in options) throw new Error('Dot currently supports at, color, and label.');
        const dotOpen = options.open === 'True';
        elements.push(`<circle cx="${x}" cy="${y}" r="${componentDefinitions.Dot.radius}" fill="${dotOpen ? 'white' : color}" stroke="${color}" stroke-width="2"/>`);
        if (dotOpen) whiteMarker(x, y, componentDefinitions.Dot.radius, color);
        bounds(x - 3.7, y - 3.7, x + 3.7, y + 3.7);
        for (const label of labels) {
          if (label.items) throw new Error('Dot does not support list labels.');
          const loc = label.loc || 'top';
          const placement = {
            top: [0, -2.7, 0, -3.6, 'center', 'ideographic'],
            bot: [0, 2.7, 0, 3.6, 'center', 'hanging'],
            left: [-2.7, 0, -3.6, 0, 'right', 'central'],
            right: [2.7, 0, 3.6, 0, 'left', 'central']
          }[loc];
          if (!placement) throw new Error(`Unsupported Dot label loc: ${loc}`);
          const [bx, by, defaultX, defaultY, defaultAlign, baseline] = placement;
          const ox = label.ofst == null ? defaultX : label.ofst[0] * 36;
          const oy = label.ofst == null ? defaultY : -label.ofst[1] * 36;
          const lx = x + bx + ox, ly = y + by + oy;
          if (!Number.isFinite(lx) || !Number.isFinite(ly)) throw new Error('Dot label position is too large.');
          const align = label.halign || defaultAlign;
          const anchor = { left: 'start', center: 'middle', right: 'end' }[align];
          const visible = label.text.startsWith('$') && label.text.endsWith('$') ? label.text.replace(/[$_{}]/g, '') : label.text;
          const width = Math.max(12, Array.from(visible).length * 10);
          bounds(lx - (align === 'right' ? width : align === 'center' ? width / 2 : 0), ly - 18,
            lx + (align === 'left' ? width : align === 'center' ? width / 2 : 0), ly + 18);
          elements.push(`<text x="${lx}" y="${ly - labelSize}" text-anchor="${anchor}" dominant-baseline="${baseline}"${textFill} font-family="sans-serif" font-size="${labelSize}"><tspan x="${lx}" dy="${labelSize}">${labelContent(label.text)}</tspan></text>`);
        }
        if (name) names[name] = placeComponent(componentDefinitions.Dot, [x, y]).anchors;
        // Schemdraw's Dot sets drop=(0,0) and theta=0: the cursor moves to the
        // dot and the direction resets to right.
        direction = 'right';
        log(`Dot: color=${color}`);
        continue;
      }
      if (type === 'Opamp') {
        const opampHints = {
          in1: [-.1, .1, 'right', 'bottom', 9], in2: [-.1, .1, 'right', 'bottom', 9],
          out: [0, .1, 'left', 'bottom', 9], vd: [-.1, .25, 'right', 'bottom', 9],
          vs: [-.1, -.25, 'right', 'top', 9], n1: [-.1, -.25, 'right', 'top', 9],
          n1a: [-.1, -.3, 'right', 'top', 9], n2: [-.1, .25, 'right', 'bottom', 9],
          n2a: [-.1, .3, 'right', 'bottom', 9]
        };
        if (('leads' in options && !['True', 'False'].includes(options.leads)) || length !== null || 'to' in options || 'tox' in options || 'toy' in options || 'dot' in options || 'idot' in options) throw new Error('Opamp supports leads=True/False, anchor, at, hold, and labels.');
        if (labels.some(label => label.items || label.rotate !== undefined || (label.loc != null && label.loc !== 'center' && !Object.prototype.hasOwnProperty.call(opampHints, label.loc)))) throw new Error('Opamp labels support loc center, in1, in2, out, vd, vs, n1, n2, n1a, n2a.');
        const width = 45 * Math.sqrt(3), lead = options.leads === 'True' ? 22.5 : 0;
        const definition = componentDefinitions.Opamp(lead);
        if ('anchor' in options) {
          if (!Object.prototype.hasOwnProperty.call(definition.anchors, options.anchor)) throw new Error(`Unsupported Opamp anchor: ${options.anchor}`);
        }
        // Schemdraw's Opamp is an Element2Term, so .theta() rotates the whole
        // symbol and its anchors with it.
        let opampTheta = 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          opampTheta = Number(options.theta);
        } else if (selectedDirection) {
          opampTheta = ({ right: 0, up: 90, left: 180, down: -90 })[selectedDirection];
        }
        const opampRad = opampTheta * Math.PI / 180;
        const opampDir = [Math.cos(opampRad), -Math.sin(opampRad)];
        // Faithful port of Element2Term._place: mirror the local geometry
        // (Element._flipreverse), subtract the anchor, zoom, rotate, translate.
        // Transforming coordinates instead of nesting SVG groups keeps flip,
        // reverse, theta and scale in one place and avoids double transforms.
        // Element2Term._place() through the shared port (flip/reverse → anchor
        // → zoom → rotate → translate), so the symbol follows the same code
        // path as every other element.
        const placed = placeElement(definition.anchors, [x, y], {
          theta: opampTheta,
          flip: 'flip' in options,
          reverse: 'reverse' in options,
          center: lead + width / 2,
          anchor: options.anchor === undefined ? null : options.anchor,
          zoom
        });
        const anchors = placed.anchors;
        const put = placed.put;
        const segments = [[[lead, -45], [lead + width, 0], [lead, 45], [lead, -45]]];
        if (lead) {
          segments.push([[0, -22.5], [lead, -22.5]], [[0, 22.5], [lead, 22.5]],
            [[lead + width, 0], [lead + width + lead, 0]]);
        }
        if (options.sign !== 'False') {
          segments.push([[lead + 6.143, -22.5], [lead + 13.343, -22.5]],
            [[lead + 6.143, 22.5], [lead + 13.343, 22.5]],
            [[lead + 9.743, 18.9], [lead + 9.743, 26.1]]);
        }
        let opampBody = '';
        for (const seg of segments) {
          const d = seg.map((point, i) => {
            const [wx, wy] = put(point);
            return `${i ? 'L' : 'M'} ${wx.toFixed(3)},${wy.toFixed(3)}`;
          }).join(' ');
          opampBody += `<path d="${d}" ${stroke}/>`;
        }
        elements.push(opampBody);
        for (const [cx, cy] of [[lead, -45], [lead + width, 0], [lead, 45],
          [lead - 22.5, -22.5], [lead - 22.5, 22.5], [lead + width + lead, 0]]) {
          const [bx2, by2] = put([cx, cy]);
          bounds(bx2, by2, bx2, by2);
        }
        // Pin labels use Schemdraw's Opamp LabelHints (ofst in units, y up).
        for (const label of labels) {
          const hint = opampHints[label.loc];
          const size = label.fontsize === undefined ? (hint ? hint[4] : labelSize) : label.fontsize;
          const ox = Array.isArray(label.ofst) ? label.ofst[0] : (hint ? hint[0] : (label.ofst == null ? 0.1 : label.ofst));
          let oy;
          if (Array.isArray(label.ofst)) oy = label.ofst[1];
          else if (hint) oy = hint[1];
          else oy = (label.ofst == null ? 0.1 : label.ofst);
          // Label offsets live in the element's local frame, so they rotate with
          // the symbol (Schemdraw applies LabelHints before the transform).
          const anchorPoint = label.loc === 'center'
            ? anchors.center
            : anchors[label.loc || 'center'];
          // The hint offset lives in the element's local frame, so flip/reverse
          // mirror it before the rotation (Schemdraw adjusts the hints in
          // _place_label the same way).
          // A `center` label sits at the glyph centre and does not mirror with
          // flip/reverse; the terminal labels do.
          const centred = label.loc === 'center';
          const sx = (!centred && 'reverse' in options ? -1 : 1) * ox * 36 * zoom;
          const sy = (!centred && 'flip' in options ? 1 : -1) * oy * 36 * zoom;
          const lca = Math.cos(-opampRad), lsa = Math.sin(-opampRad);
          const lx = anchorPoint[0] + sx * lca - sy * lsa;
          const ly = anchorPoint[1] + sx * lsa + sy * lca;
          const halign = label.halign || (hint ? hint[2] : 'center');
          const valign = label.valign || (hint ? hint[3] : 'center');
          const anchorText = { left: 'start', center: 'middle', right: 'end' }[halign];
          const baseline = valign === 'center' ? 'central' : valign === 'top' ? 'hanging' : 'ideographic';
          const lines = String(label.text).split('\n');
          const yAttr = valign === 'center' ? ly - (lines.length + 1) / 2 * size
            : valign === 'top' ? ly - size
              : ly - lines.length * size;
          const spans = lines.map(line => `<tspan x="${lx}" dy="${size}">${labelContent(line)}</tspan>`).join('');
          const visible = label.text.startsWith('$') && label.text.endsWith('$') ? label.text.replace(/[$_{}]/g, '') : label.text;
          const w = Math.max(12, Array.from(visible).length * size * 0.71);
          bounds(lx - w, yAttr - size, lx + w, yAttr + (lines.length + 1) * size);
          elements.push(`<text x="${lx}" y="${yAttr}" text-anchor="${anchorText}" dominant-baseline="${baseline}"${label.color ? ` fill="${label.color}"` : textFill} font-family="sans-serif" font-size="${size}">${spans}</text>`);
        }
        if (name) {
          names[name] = anchors;
          namedBoxes[name] = { ...elemBox };
        }
        [x, y] = anchors[definition.defaultDrop];
        direction = 'right';
        if ('hold' in options) [x, y, direction] = previousState;
        log(`Opamp: leads=${lead ? 'True' : 'False'}`);
        continue;
      }
      if (logicGateTypes.has(type)) {
        const allowedGate = ['at', 'anchor', 'theta', 'color', 'drop', 'hold', 'flip', 'reverse'];
        if (logicMultiInputTypes.has(type)) allowedGate.push('inputs', 'inputnots', 'leadin', 'leadout');
        if (type === 'Tristate') allowedGate.push('outputnot', 'controlnot');
        if (Object.keys(options).some(key => !allowedGate.includes(key)) || length !== null ||
          ['to', 'tox', 'toy', 'endpoints'].some(key => key in options)) throw new Error(`${type} supports at, anchor, direction, theta, color, drop, hold, flip, reverse, and labels.`);
        if ('anchor' in options && typeof options.anchor !== 'string') throw new Error('anchor must specify a terminal name.');
        if ('drop' in options && typeof options.drop !== 'string') throw new Error('drop must specify a terminal name.');
        if (labels.some(label => label.items)) throw new Error(`${type} does not support list labels.`);
        if ('theta' in options) {
          const degrees = ((Number(options.theta) % 360) + 360) % 360;
          direction = ({ 0: 'right', 90: 'up', 180: 'left', 270: 'down' })[degrees] || Number(options.theta);
        } else if (selectedDirection) direction = selectedDirection;
        const arbitrary = typeof direction === 'number';
        const radians = arbitrary ? direction * Math.PI / 180 : 0;
        const [dx, dy, angle] = arbitrary ? [Math.cos(radians), -Math.sin(radians), -direction] : directions[direction];
        const definition = buildLogicGate(type, options);
        const anchorName = options.anchor === undefined ? null : options.anchor;
        if (anchorName !== null && !Object.prototype.hasOwnProperty.call(definition.anchors, anchorName)) throw new Error(`Unsupported ${type} anchor: ${anchorName}`);
        const placed = placeComponent(definition, [x, y], {
          direction: [dx, dy],
          anchor: anchorName,
          flip: 'flip' in options,
          reverse: 'reverse' in options
        });
        // Schemdraw's reverse() mirrors the artwork about the element centre,
        // but Element2Term._place still reports start/end/center from the
        // unmirrored span. Only the gate terminals mirror with the symbol.
        // Element2Term gates (Buf/Not/Schmitt/Tgate/Tristate) report start/end
        // from the unmirrored span; the multi-input gates are Element-based and
        // their `end` is the output anchor, so it mirrors with the symbol.
        const element2TermGates = ['Buf', 'Not', 'NotNot', 'Schmitt', 'SchmittNot', 'Tgate', 'Tristate'];
        if ('reverse' in options && element2TermGates.includes(type)) {
          const plain = placeComponent(definition, [x, y], {
            direction: [dx, dy], anchor: anchorName
          });
          for (const key of ['start', 'end', 'center']) {
            if (plain.anchors[key]) placed.anchors[key] = plain.anchors[key];
          }
        }
        const sx = 'reverse' in options ? -1 : 1, sy2 = 'flip' in options ? -1 : 1;
        const anchorPoint = anchorName === null ? [0, 0] : definition.anchors[anchorName];
        const bx = (sx === -1 ? 2 * definition.reverseCenter : 0) - sx * anchorPoint[0];
        const by = -sy2 * anchorPoint[1];
        const inner = (sx === 1 && sy2 === 1 && bx === 0 && by === 0) ? '' : ` transform="translate(${bx} ${by}) scale(${sx} ${sy2})"`;
        elements.push(`<g transform="translate(${x} ${y}) rotate(${angle})"><g${inner}>${renderPathSegments(definition.segments, color, stroke)}</g></g>`);
        const [ex1, ex2, ey1, ey2] = definition.extent;
        for (const corner of [[ex1, ey1], [ex1, ey2], [ex2, ey1], [ex2, ey2]]) {
          const [gx, gy] = placed.transform(...corner);
          bounds(gx - 2, gy - 2, gx + 2, gy + 2);
        }
        for (const label of labels) {
          const loc = label.loc || 'top';
          let lx, ly, anchor = 'middle', baseline = 'central';
          if (Object.prototype.hasOwnProperty.call(definition.anchors, loc)) {
            [lx, ly] = definition.anchors[loc];
            if (/^in\d+$/.test(loc)) { lx -= 7; anchor = 'end'; }
            else if (loc === 'out' || loc === 'end') { lx += 7; anchor = 'start'; }
            else if (loc === 'c' || loc === 'cbar') { lx += 7; anchor = 'start'; }
            else if (loc === 'start') { lx -= 7; anchor = 'end'; }
          } else if (loc === 'top') { lx = (ex1 + ex2) / 2; ly = ey1 + 2 - 3.6; baseline = 'ideographic'; }
          else if (loc === 'bot' || loc === 'bottom') { lx = (ex1 + ex2) / 2; ly = ey2 - 2 + 3.6; baseline = 'hanging'; }
          else if (loc === 'left') { lx = ex1 + 2 - 3.6; ly = 0; anchor = 'end'; }
          else if (loc === 'right') { lx = ex2 - 2 + 3.6; ly = 0; anchor = 'start'; }
          else throw new Error(`Unsupported ${type} label loc: ${loc}`);
          const [tx, ty] = placed.transform(lx, ly);
          const width = Math.max(12, Array.from(label.text).length * 10);
          bounds(tx - (anchor === 'start' ? 0 : anchor === 'end' ? width : width / 2), ty - 18,
            tx + (anchor === 'end' ? 0 : anchor === 'start' ? width : width / 2), ty + 8);
          elements.push(`<text x="${tx}" y="${ty}" text-anchor="${anchor}" dominant-baseline="${baseline}"${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(label.text)}</text>`);
        }
        if (name) names[name] = placed.anchors;
        const drop = options.drop === undefined ? definition.defaultDrop : options.drop;
        if (!Object.prototype.hasOwnProperty.call(placed.anchors, drop)) throw new Error(`Unknown ${type} drop: ${drop}`);
        [x, y] = placed.anchors[drop];
        if ('hold' in options) [x, y, direction] = previousState;
        log(`${type}: drop=${drop}`);
        continue;
      }
      if (['Arrowhead', 'DotDotDot', 'Label', 'Tag'].includes(type)) {
        // Annotation elements: they are drawn at the current point and never
        // change it, except DotDotDot which advances by 2 units like Schemdraw.
        const annotAllowed = ['at', 'color', 'hold', 'theta', 'flip', 'reverse',
          ...(type === 'Arrowhead' ? ['headwidth', 'headlength'] : []),
          ...(type === 'DotDotDot' ? ['radius', 'open'] : []),
          ...(type === 'Tag' ? ['width', 'height'] : [])];
        // A Tag may take a direction: schemdraw's `.left()` / `.right()` choose
        // which way the pointer faces.
        if ((selectedDirection && type !== 'Tag') || length !== null || Object.keys(options).some(key => !annotAllowed.includes(key))) throw new Error(`${type} supports at${type === 'Arrowhead' ? ', headwidth, headlength' : ''}${type === 'DotDotDot' ? ', radius, open' : ''}${type === 'Tag' ? ', width, height, direction' : ''}, color, hold, theta, flip, reverse, and labels.`);
        const tagLeft = type === 'Tag' && selectedDirection === 'left';
        const num = (key, fallback, positive = true) => {
          if (!(key in options)) return fallback * 36;
          if (typeof options[key] !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key]) || !(Number(options[key]) > 0)) throw new Error(`${key} must be a positive number.`);
          return Number(options[key]) * 36;
        };
        const boolOpt = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (!['True', 'False'].includes(options[key])) throw new Error(`${key} must be True or False.`);
          return options[key] === 'True';
        };
        if ('at' in options) [x, y] = atPoint(options.at);
        let theta = 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          theta = Number(options.theta);
        }
        const sx = ('reverse' in options && type !== 'Tag') ? -1 : 1, sy2 = 'flip' in options ? -1 : 1;
        const tf = `translate(${x} ${y})` + (theta ? ` rotate(${-theta})` : '') + ((sx !== 1 || sy2 !== 1) ? ` scale(${sx} ${sy2})` : '');
        let body = '';
        if (type === 'Arrowhead') {
          const hw = num('headwidth', 0.15), hl = num('headlength', 0.25);
          // Schemdraw's Segment((-headlength,0) → (0,0), arrow='->') collapses to
          // a bare head: tip 2 px short of the anchor, base one headlength back.
          body = `<path d="M -2,0 L ${(-hl).toFixed(3)},${(hw / 2).toFixed(3)} L ${(-hl).toFixed(3)},${(-hw / 2).toFixed(3)} Z" fill="${color}"/>`;
        } else if (type === 'DotDotDot') {
          const r = num('radius', 0.075), openDot = boolOpt('open', false);
          body = [0.5, 1, 1.5].map(c => `<circle cx="${(c * 36).toFixed(3)}" cy="0" r="${r.toFixed(3)}" fill="${openDot ? 'white' : color}" stroke="${color}" stroke-width="2"/>`).join('');
          // Open dots must not be crossed by later wires: redraw them on top.
          if (openDot) {
            const toWorld = localToWorld(x, y, sx, sy2, theta);
            for (const c of [0.5, 1, 1.5]) {
              const [wx, wy] = toWorld(c * 36, 0);
              whiteMarker(wx, wy, r, color);
            }
          }
        } else if (type === 'Tag') {
          const w = num('width', 1.5), h = num('height', 0.625) / 2;
          // Schemdraw's Tag: vertex (0,0), two points at x=(w-h), and the far
          // edge at x=w. `reverse` mirrors about the body centre; `.left()` is
          // a 180° turn (the same as negating x for this y-symmetric polygon).
          // Schemdraw's Tag cuts the point at 45°: the notch corner sits at
          // x = h, not at w - h, which would make a shallow wedge.
          let pts = [[0, 0], [h, h], [w, h], [w, -h], [h, -h]];
          if ('reverse' in options) pts = pts.map(([px, py]) => [w - px, py]);
          if (tagLeft) pts = pts.map(([px, py]) => [-px, py]);
          body = `<polygon points="${pts.map(([px, py]) => `${px.toFixed(3)},${(-py).toFixed(3)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
        }
        if (body) elements.push(`<g transform="${tf}">${body}</g>`);
        if (type === 'Tag') {
          // Tag labels use Element._place_label with lblloc=center, lblofst=0
          // and the Tag's private 12px default font size.
          const w = num('width', 1.5) / 36, h = num('height', 0.625) / 72;
          const tagBBox = reflectBBox({ xmin: 0, ymin: -h, xmax: w, ymax: h }, options, w / 2);
          const labelTheta = theta + (tagLeft ? 180 : 0);
          const lrad = -labelTheta * Math.PI / 180, lcos = Math.cos(lrad), lsin = Math.sin(lrad);
          const toWorldTag = (px, py) => {
            const lx = px * 36, ly = -py * 36;
            return [x + lx * lcos - ly * lsin, y + lx * lsin + ly * lcos];
          };
          for (const label of labels) {
            if (label.items) throw new Error('Tag does not support list labels.');
            const placement = localLabelPlacement(reflectLabelHints(label, options), tagBBox, labelTheta, 'center', 0);
            const [lx, ly] = toWorldTag(placement.x, placement.y);
            const lines = String(label.text).split('\n');
            // Tag._element_defaults sets fontsize=12, which overrides the
            // drawing's `config: fontsize` just as Schemdraw's ChainMap does.
            const size = label.fontsize === undefined ? 12 : label.fontsize;
            const anchor = { left: 'start', center: 'middle', right: 'end' }[placement.halign];
            const baseline = placement.valign === 'center' ? 'central' : placement.valign === 'top' ? 'hanging' : 'ideographic';
            const yAttr = placement.valign === 'center' ? ly - (lines.length + 1) / 2 * size
              : placement.valign === 'top' ? ly - size
                : ly - lines.length * size;
            const spans = lines.map(line => `<tspan x="${lx}" dy="${size}">${labelContent(line)}</tspan>`).join('');
            const width = Math.max(12, Math.max(...lines.map(line => Array.from(line).length)) * size * 0.75);
            bounds(lx - (anchor === 'start' ? 0 : anchor === 'end' ? width : width / 2), yAttr,
              lx + (anchor === 'end' ? 0 : anchor === 'start' ? width : width / 2), yAttr + (lines.length + 1) * size);
            const transform = placement.rotate ? ` transform="rotate(${-placement.rotate} ${lx} ${ly})"` : '';
            elements.push(`<text x="${lx}" y="${yAttr}" text-anchor="${anchor}" dominant-baseline="${baseline}"${transform} fill="${label.color || color}" font-family="sans-serif" font-size="${size}">${spans}</text>`);
          }
          const tagPts = [[tagBBox.xmin, tagBBox.ymin], [tagBBox.xmax, tagBBox.ymin], [tagBBox.xmin, tagBBox.ymax], [tagBBox.xmax, tagBBox.ymax]].map(([px, py]) => toWorldTag(px, py));
          bounds(Math.min(...tagPts.map(p => p[0])) - 4, Math.min(...tagPts.map(p => p[1])) - 14,
            Math.max(...tagPts.map(p => p[0])) + 4, Math.max(...tagPts.map(p => p[1])) + 14);
          if (name) {
            const startX = 'reverse' in options ? w : 0;
            const [ax, ay] = toWorldTag(startX, 0);
            names[name] = { start: [ax, ay], center: [x, y], end: [x, y], xy: [x, y] };
          }
          log(`${type}: at (${x / 36}, ${-y / 36})`);
          if ('hold' in options) [x, y, direction] = previousState;
          continue;
        }
        for (const label of labels) {
          if (label.items || label.halign != null || label.ofst != null) throw new Error(`${type} does not support label arguments.`);
          const loc = label.loc || 'center';
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          let lx = x, ly = y;
          if (loc === 'center') {
            // Body centre from the shape just drawn (Arrowhead/DotDotDot).
            lx = x;
          }
          else if (loc === 'top') ly = y - 10;
          else if (loc === 'bot' || loc === 'bottom') ly = y + 10;
          else if (loc === 'left') lx = x - 6;
          else if (loc === 'right') lx = x + 6;
          else throw new Error(`Unsupported ${type} label loc: ${loc}`);
          const anchor = loc === 'left' ? 'end' : loc === 'right' ? 'start' : 'middle';
          const width = Math.max(size, Array.from(label.text).length * size * 0.75);
          bounds(lx - width, ly - size, lx + width, ly + size);
          elements.push(`<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="central" fill="${label.color || color}" font-family="sans-serif" font-size="${size}">${labelContent(label.text)}</text>`);
        }
        if (type === 'Arrowhead') bounds(x - 12, y - 6, x + 4, y + 6);
        else if (type === 'DotDotDot') bounds(x + 12, y - 6, x + 60, y + 6);
        if (name) names[name] = { start: [x, y], center: [x, y], end: [x, y], xy: [x, y] };
        // DotDotDot's drop is (2, 0); the other annotation elements keep place.
        if (type === 'DotDotDot') { x += sx * 2 * 36; }
        log(`${type}: at (${x / 36}, ${-y / 36})`);
        if ('hold' in options) [x, y, direction] = previousState;
        continue;
      }
      if (/^Outlet[A-L]$/.test(type)) {
        if (selectedDirection || length !== null || Object.keys(options).some(key => !['at', 'color', 'hold', 'theta', 'flip', 'reverse', 'plug'].includes(key))) throw new Error(`${type} supports at, color, hold, theta, flip, reverse, plug, and labels.`);
        const plug = 'plug' in options ? (options.plug === 'True' ? true : options.plug === 'False' ? false : (() => { throw new Error('plug must be True or False.'); })()) : false;
        if ('at' in options) [x, y] = atPoint(options.at);
        let theta = 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          theta = Number(options.theta);
        }
        const sx = 'reverse' in options ? -1 : 1, sy2 = 'flip' in options ? -1 : 1;
        const def = buildOutlet(type, plug);
        const P = 36;
        let glyph = '';
        for (const seg of def.segments) {
          const f = seg.fill === undefined ? 'none' : (seg.fill === 'black' ? color : 'white');
          if (seg.type === 'circle') {
            glyph += `<circle cx="${(seg.c[0] * P).toFixed(4)}" cy="${(-seg.c[1] * P).toFixed(4)}" r="${(seg.r * P).toFixed(4)}" fill="${f}" stroke="${color}" stroke-width="2"/>`;
          } else if (seg.type === 'poly') {
            const pts = seg.verts.map(([vx, vy]) => `${(vx * P).toFixed(3)},${(-vy * P).toFixed(3)}`).join(' ');
            glyph += `<polygon points="${pts} " style="stroke:${color};fill:${f};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"/>`;
          } else {
            glyph += `<path d="${seg.verts.map(([vx, vy], i) => `${i ? 'L' : 'M'} ${(vx * P).toFixed(4)},${(-vy * P).toFixed(4)}`).join(' ')} Z" fill="${f}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
          }
        }
        const tf = `translate(${x} ${y})` + (theta ? ` rotate(${-theta})` : '') + ((sx !== 1 || sy2 !== 1) ? ` scale(${sx} ${sy2})` : '');
        elements.push(`<g transform="${tf}">${glyph}</g>`);
        for (const label of labels) {
          if (label.items || label.halign != null || label.ofst != null || label.rotate !== undefined) throw new Error(`${type} does not support label arguments.`);
          const loc = label.loc || 'top';
          let lx = x, ly = y;
          if (loc === 'top') ly = y - 58;
          else if (loc === 'bot' || loc === 'bottom') ly = y + 58;
          else if (loc === 'left') lx = x - 60;
          else if (loc === 'right') lx = x + 60;
          else throw new Error(`Unsupported ${type} label loc: ${loc}`);
          const anchor = loc === 'left' ? 'end' : loc === 'right' ? 'start' : 'middle';
          const width = Math.max(12, Array.from(label.text).length * 10);
          bounds(lx - width, ly - 18, lx + width, ly + 8);
          elements.push(`<text x="${lx}" y="${ly}" text-anchor="${anchor}"${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(label.text)}</text>`);
        }
        // The viewport must follow the shape actually drawn: OutletJ's hexagon
        // is 3.3 units wide and OutletL's box 2.97 units wide, both wider than
        // a fixed 48px box, so they were clipped at the SVG edges.
        let exmin = 0, exmax = 0, eymin = 0, eymax = 0;
        let edge = false;
        for (const seg of def.segments) {
          const verts = seg.type === 'circle' ? [seg.c] : seg.verts;
          for (const [vx, vy] of verts) {
            const r = seg.type === 'circle' ? seg.r * P : 0;
            exmin = Math.min(exmin, vx * P - r); exmax = Math.max(exmax, vx * P + r);
            eymin = Math.min(eymin, -vy * P - r); eymax = Math.max(eymax, -vy * P + r);
            if (seg.fill !== undefined) edge = true;
          }
        }
        // Open shapes (the unfilled body) carry their ink on the stroke, so the
        // box grows by the 1px half-width just as Schemdraw's segment bbox and
        // the text/label paths here do.
        const stroke = edge ? 0 : 1;
        if (sx < 0) [exmin, exmax] = [exmax, exmin];
        if (sy2 < 0) [eymin, eymax] = [eymax, eymin];
        bounds(x + exmin - stroke, y + eymin - stroke, x + exmax + stroke, y + eymax + stroke);
        if (name) {
          // Same order as the SVG group: scale (flip/reverse) → rotate → translate.
          // Ignoring the rotation left the pins of a rotated outlet behind.
          const aRad = -theta * Math.PI / 180, aCos = Math.cos(aRad), aSin = Math.sin(aRad);
          const out = Object.create(null);
          for (const key of Object.keys(def.anchors)) {
            const lx = sx * def.anchors[key][0] * P, ly = -sy2 * def.anchors[key][1] * P;
            out[key] = [x + lx * aCos - ly * aSin, y + lx * aSin + ly * aCos];
          }
          out.start = [x, y]; out.center = [x, y]; out.end = [x, y]; out.xy = [x, y];
          names[name] = out;
        }
        log(`${type}: at (${x / 36}, ${-y / 36})`);
        if ('hold' in options) [x, y, direction] = previousState;
        continue;
      }
      if (type === 'AudioJack') {
        // Faithful port of Schemdraw's `misc.AudioJack`: the same local variables
        // (length/ringlen/tiplen/sleeveheight/…) drive the geometry, and the
        // anchors are reported in drawing units as Schemdraw does.
        if (selectedDirection || length !== null || Object.keys(options).some(key => !['at', 'color', 'hold', 'theta', 'flip', 'reverse', 'ring', 'switch', 'ringswitch', 'dots', 'open', 'radius'].includes(key))) throw new Error('AudioJack supports at, color, hold, theta, flip, reverse, ring, switch, ringswitch, dots, open, radius, and labels.');
        const jackBool = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (!['True', 'False'].includes(options[key])) throw new Error(`${key} must be True or False.`);
          return options[key] === 'True';
        };
        const ring = jackBool('ring', false), ringSwitch = jackBool('ringswitch', false), dots = jackBool('dots', true), sw = jackBool('switch', false);
        const openJack = jackBool('open', true);
        let r = 0.075;
        if ('radius' in options) {
          if (typeof options.radius !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.radius) || !(Number(options.radius) > 0)) throw new Error('radius must be a positive number.');
          r = Number(options.radius);
        }
        if ('at' in options) [x, y] = atPoint(options.at);
        let theta = 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          theta = Number(options.theta);
        }
        const P = 36, fill = openJack ? 'white' : 'none';
        const len = 2.0, ringlen = .75, tiplen = .55, swidth = .2, sleeveheight = 1.0;
        let tipy = 1.0, ringy = .1, sleevey = .35;
        const swdy = .4, swlen = .5;
        if (sw) tipy += .2;
        if (ring && ringSwitch) { sleevey += .2; ringy -= .2; }
        const u = v => v * P;
        const jackDot = (cy, color) => dots ? `<circle cx="0" cy="${(-u(cy)).toFixed(4)}" r="${u(r).toFixed(4)}" fill="${fill}" stroke="${color}" stroke-width="2"/>` : '';
        const jackAnchors = {};
        let glyph = '';
        if (ring) {
          glyph += jackDot(-sleevey, color);
          glyph += `<path d="M ${u(-r).toFixed(4)},${(-u(-sleevey)).toFixed(4)} L ${u(-len).toFixed(4)},${(-u(-sleevey)).toFixed(4)} L ${u(-len).toFixed(4)},0 L ${u(-len).toFixed(4)},${(-u(sleeveheight)).toFixed(4)} L ${u(-len - swidth).toFixed(4)},${(-u(sleeveheight)).toFixed(4)} L ${u(-len - swidth).toFixed(4)},0 L ${u(-len).toFixed(4)},0" ${stroke}/>`;
          jackAnchors.sleeve = [0, -sleevey];
          glyph += jackDot(ringy, color);
          glyph += `<path d="M ${u(-r).toFixed(4)},${(-u(ringy)).toFixed(4)} L ${u(-len * .75).toFixed(4)},${(-u(ringy)).toFixed(4)} L ${u(-len * ringlen - 2 * r).toFixed(4)},${(-u(ringy + 2 * r)).toFixed(4)} L ${u(-len * ringlen - r * 4).toFixed(4)},${(-u(ringy)).toFixed(4)}" ${stroke}/>`;
          jackAnchors.ring = [0, ringy];
        } else {
          glyph += jackDot(0, color);
          glyph += `<path d="M ${u(-r).toFixed(4)},0 L ${u(-len).toFixed(4)},0 L ${u(-len).toFixed(4)},${(-u(sleeveheight)).toFixed(4)} L ${u(-len + swidth).toFixed(4)},${(-u(sleeveheight)).toFixed(4)} L ${u(-len + swidth).toFixed(4)},0" ${stroke}/>`;
          jackAnchors.sleeve = [0, 0];
        }
        glyph += jackDot(tipy, color);
        glyph += `<path d="M ${u(-r).toFixed(4)},${(-u(tipy)).toFixed(4)} L ${u(-len * .55).toFixed(4)},${(-u(tipy)).toFixed(4)} L ${u(-len * tiplen - 2 * r).toFixed(4)},${(-u(tipy - 2 * r)).toFixed(4)} L ${u(-len * tiplen - r * 4).toFixed(4)},${(-u(tipy)).toFixed(4)}" ${stroke}/>`;
        jackAnchors.tip = [0, tipy];
        const hx0 = u(-swlen);
        // The switch connector's arrow is Schemdraw's `Segment(..., arrow='->')`;
        // segmentArrow() renders it with the backend's own maths.
        const arrowStem = (hx, yFrom, yTo) => segmentArrow(hx, -u(yFrom), hx, -u(yTo), color, stroke);
        if (sw) {
          glyph += jackDot(tipy - swdy, color);
          glyph += `<path d="M 0,${(-u(tipy - swdy)).toFixed(4)} L ${u(-swlen).toFixed(4)},${(-u(tipy - swdy)).toFixed(4)}" ${stroke}/>`;
          glyph += arrowStem(hx0, tipy - swdy, tipy);
          jackAnchors.tipswitch = [0, tipy - swdy];
        }
        if (ring && ringSwitch) {
          glyph += jackDot(ringy + swdy, color);
          glyph += `<path d="M 0,${(-u(ringy + swdy)).toFixed(4)} L ${u(-swlen).toFixed(4)},${(-u(ringy + swdy)).toFixed(4)}" ${stroke}/>`;
          glyph += arrowStem(hx0, ringy + swdy, ringy);
          jackAnchors.ringswitch = [0, ringy + swdy];
        }
        // Local bbox from Schemdraw's get_bbox() (drawing units, y up). The
        // contact dots and the switch arrow widen it.
        const glyphBox = {
          xmin: -len - (ring ? swidth : 0),
          ymin: -(ring ? sleevey : 0) - (dots ? r : 0),
          xmax: dots ? r : -r,
          ymax: tipy + (sw ? 0.15 : (dots ? r : 0))
        };
        const sx = 'reverse' in options ? -1 : 1, sy2 = 'flip' in options ? -1 : 1;
        const glyphCenter = (glyphBox.xmin + glyphBox.xmax) / 2;
        const refl = (sx !== 1 || sy2 !== 1)
          ? ` translate(${sx === -1 ? 2 * glyphCenter * P : 0} 0) scale(${sx} ${sy2})` : '';
        const tf = `translate(${x} ${y})` + (theta ? ` rotate(${-theta})` : '') + refl;
        elements.push(`<g transform="${tf}">${glyph}</g>`);
        const rad = -theta * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
        const toWorldFrame = (px, py) => {
          const lx = px * P, ly = -py * P;
          return [x + lx * cos - ly * sin, y + lx * sin + ly * cos];
        };
        const toWorld = (px, py) => toWorldFrame(
          sx === -1 ? 2 * glyphCenter - px : px,
          sy2 === -1 ? -py : py
        );
        // The white contact dots must sit above leads drawn afterwards.
        if (dots && fill === 'white') {
          for (const key of Object.keys(jackAnchors)) {
            const [wx, wy] = toWorld(jackAnchors[key][0], jackAnchors[key][1]);
            whiteMarker(wx, wy, r * P, color);
          }
        }
        const labelBox = reflectBBox(glyphBox, options, glyphCenter);
        for (const label of labels) {
          if (label.items) throw new Error('AudioJack does not support list labels.');
          const placement = localLabelPlacement(reflectLabelHints(label, options), labelBox, theta, 'top', 0.1);
          const [lx, ly] = toWorldFrame(placement.x, placement.y);
          const lines = String(label.text).split('\n');
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          const anchor = { left: 'start', center: 'middle', right: 'end' }[placement.halign];
          const baseline = placement.valign === 'center' ? 'central' : placement.valign === 'top' ? 'hanging' : 'ideographic';
          const yAttr = placement.valign === 'center' ? ly - (lines.length + 1) / 2 * size
            : placement.valign === 'top' ? ly - size
              : ly - lines.length * size;
          const spans = lines.map(line => `<tspan x="${lx}" dy="${size}">${labelContent(line)}</tspan>`).join('');
          const width = Math.max(12, Math.max(...lines.map(line => Array.from(line).length)) * size * 0.71);
          bounds(lx - (anchor === 'start' ? 0 : anchor === 'end' ? width : width / 2), yAttr - size,
            lx + (anchor === 'end' ? 0 : anchor === 'start' ? width : width / 2), yAttr + (lines.length + 1) * size);
          const transform = placement.rotate ? ` transform="rotate(${-placement.rotate} ${lx} ${ly})"` : '';
          elements.push(`<text x="${lx}" y="${yAttr}" text-anchor="${anchor}" dominant-baseline="${baseline}"${transform}${label.color ? ` fill="${label.color}"` : textFill} font-family="sans-serif" font-size="${size}">${spans}</text>`);
        }
        const [jx1, jy1] = toWorldFrame(labelBox.xmin, labelBox.ymin);
        const [jx2, jy2] = toWorldFrame(labelBox.xmax, labelBox.ymax);
        bounds(Math.min(jx1, jx2), Math.min(jy1, jy2), Math.max(jx1, jx2), Math.max(jy1, jy2));
        if (name) {
          const out = Object.create(null);
          for (const key of Object.keys(jackAnchors)) out[key] = toWorld(jackAnchors[key][0], jackAnchors[key][1]);
          out.start = [x, y]; out.center = [x, y]; out.end = [x, y]; out.xy = [x, y];
          names[name] = out;
        }
        log(`AudioJack: at (${x / 36}, ${-y / 36})`);
        if ('hold' in options) [x, y, direction] = previousState;
        continue;
      }
      if (type === 'Speaker' || type === 'Mic') {
        // Two-input audio symbols (Schemdraw `misc.Speaker` / `Mic`). Both use a
        // 0.25-unit body with a 0.5-unit lead spacing; the glyph is written in
        // Schemdraw's default frame with radius/height = 0.25 (9 px).
        if (selectedDirection || length !== null || Object.keys(options).some(key => !['at', 'color', 'hold', 'theta', 'flip', 'reverse'].includes(key))) throw new Error(`${type} supports at, color, hold, theta, flip, reverse, and labels.`);
        if ('at' in options) [x, y] = atPoint(options.at);
        let theta = 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          theta = Number(options.theta);
        }
        const sx = 'reverse' in options ? -1 : 1, sy2 = 'flip' in options ? -1 : 1;
        // Ported from schemdraw/elements/misc.py with its own constants:
        // resheight = 0.25 unit (9 px), sph = 0.5 unit (18 px).
        const P = 36, rh = 0.25 * P, sph = 0.5 * P;
        let glyph;
        if (type === 'Speaker') {
          glyph = `<path d="M 0,0 L ${rh},0 M 0,${sph} L ${rh},${sph}" ${stroke}/>` +
            `<polygon points="${rh},${-sph / 2} ${rh},${sph * 1.5} ${rh * 2},${sph * 1.5} ${rh * 2},${-sph / 2}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>` +
            `<polyline points="${rh * 2},${-sph / 2} ${rh * 3.5},${-sph * 1.25} ${rh * 3.5},${sph * 2.25} ${rh * 2},${sph * 1.5}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
        } else {
          // Mic: two leads, a vertical flat, and a half circle of radius 4·resheight.
          glyph = `<path d="M 0,0 L ${rh},0 M 0,${sph} L ${rh},${sph}" ${stroke}/>` +
            `<path d="M ${-rh * 2},${-rh} L ${-rh * 2},${rh * 3}" ${stroke}/>` +
            `<path d="M ${-rh * 2},${-rh} a ${rh * 2} ${rh * 2} 0 1 1 0 ${rh * 4}" ${stroke}/>`;
        }
        // Local bbox from Schemdraw's get_bbox() (drawing units, y up).
        const glyphBox = type === 'Speaker'
          ? { xmin: 0, ymin: -1.125, xmax: 0.875, ymax: 0.625 }
          : { xmin: -0.5, ymin: -0.75, xmax: 0.25, ymax: 0.25 };
        const glyphCenter = (glyphBox.xmin + glyphBox.xmax) / 2;
        // Reverse mirrors about the bbox centre; flip mirrors about y = 0.
        const refl = (sx !== 1 || sy2 !== 1)
          ? ` translate(${sx === -1 ? 2 * glyphCenter * P : 0} 0) scale(${sx} ${sy2})` : '';
        const tf = `translate(${x} ${y})` + (theta ? ` rotate(${-theta})` : '') + refl;
        elements.push(`<g transform="${tf}">${glyph}</g>`);
        const rad = -theta * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
        const toWorld = (px, py) => {
          const lx = px * P, ly = -py * P;
          return [x + lx * cos - ly * sin, y + lx * sin + ly * cos];
        };
        const labelBox = reflectBBox(glyphBox, options, glyphCenter);
        for (const label of labels) {
          if (label.items) throw new Error(`${type} does not support list labels.`);
          const placement = localLabelPlacement(reflectLabelHints(label, options), labelBox, theta, 'top', 0.1);
          const [lx, ly] = toWorld(placement.x, placement.y);
          const lines = String(label.text).split('\n');
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          const anchor = { left: 'start', center: 'middle', right: 'end' }[placement.halign];
          const baseline = placement.valign === 'center' ? 'central' : placement.valign === 'top' ? 'hanging' : 'ideographic';
          const yAttr = placement.valign === 'center' ? ly - (lines.length + 1) / 2 * size
            : placement.valign === 'top' ? ly - size
              : ly - lines.length * size;
          const spans = lines.map(line => `<tspan x="${lx}" dy="${size}">${labelContent(line)}</tspan>`).join('');
          const width = Math.max(12, Math.max(...lines.map(line => Array.from(line).length)) * size * 0.71);
          bounds(lx - (anchor === 'start' ? 0 : anchor === 'end' ? width : width / 2), yAttr - size,
            lx + (anchor === 'end' ? 0 : anchor === 'start' ? width : width / 2), yAttr + (lines.length + 1) * size);
          const transform = placement.rotate ? ` transform="rotate(${-placement.rotate} ${lx} ${ly})"` : '';
          elements.push(`<text x="${lx}" y="${yAttr}" text-anchor="${anchor}" dominant-baseline="${baseline}"${transform}${label.color ? ` fill="${label.color}"` : textFill} font-family="sans-serif" font-size="${size}">${spans}</text>`);
        }
        const [bx1, by1] = toWorld(labelBox.xmin, labelBox.ymin);
        const [bx2, by2] = toWorld(labelBox.xmax, labelBox.ymax);
        bounds(Math.min(bx1, bx2), Math.min(by1, by2), Math.max(bx1, bx2), Math.max(by1, by2));
        if (name) {
          const anchorPoint = (px, py) => toWorld(
            sx === -1 ? 2 * glyphCenter - px : px,
            sy2 === -1 ? -py : py
          );
          const [in1x, in1y] = anchorPoint(type === 'Speaker' ? 0 : 0.25, 0);
          const [in2x, in2y] = anchorPoint(type === 'Speaker' ? 0 : 0.25, -0.5);
          names[name] = { in1: [in1x, in1y], in2: [in2x, in2y], start: [x, y], center: [x, y], end: [x, y], xy: [x, y] };
        }
        log(`${type}: at (${x / 36}, ${-y / 36})`);
        if ('hold' in options) [x, y, direction] = previousState;
        continue;
      }
      if (['Antenna', 'AntennaLoop', 'AntennaLoop2'].includes(type)) {
        // One-terminal symbols placed at the current point; they never change it.
        if (selectedDirection || length !== null || Object.keys(options).some(key => !['at', 'color', 'hold', 'theta', 'flip', 'reverse'].includes(key))) throw new Error(`${type} supports at, color, hold, theta, flip, reverse, and labels.`);
        if ('at' in options) [x, y] = atPoint(options.at);
        const glyph = {
          Antenna: 'M 0,0 L 0,-21.6 L -13.68,-43.2 L 13.68,-43.2 L 0,-21.6',
          AntennaLoop: 'M 0,0 L 0,-7.2 L -18,-25.2 L 3.6,-46.8 L 25.2,-25.2 L 7.2,-7.2 L 7.2,0',
          AntennaLoop2: 'M 0,0 L 0,-9 L -22.5,-9 L -22.5,-54 L 22.5,-54 L 22.5,-18 L -13.5,-18 L -13.5,-63 L 31.5,-63 L 31.5,-9 L 9,-9 L 9,0'
        }[type];
        let theta = 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          theta = Number(options.theta);
        }
        // Local bbox from Schemdraw's get_bbox() (drawing units, y up).
        const glyphBox = {
          Antenna: { xmin: -0.38, ymin: 0, xmax: 0.38, ymax: 1.2 },
          AntennaLoop: { xmin: -0.5, ymin: 0, xmax: 0.7, ymax: 1.3 },
          AntennaLoop2: { xmin: -0.625, ymin: 0, xmax: 0.875, ymax: 1.75 }
        }[type];
        const sx = 'reverse' in options ? -1 : 1, sy2 = 'flip' in options ? -1 : 1;
        const glyphCenter = (glyphBox.xmin + glyphBox.xmax) / 2;
        const refl = (sx !== 1 || sy2 !== 1)
          ? ` translate(${sx === -1 ? 2 * glyphCenter * 36 : 0} 0) scale(${sx} ${sy2})` : '';
        const tf = `translate(${x} ${y})` + (theta ? ` rotate(${-theta})` : '') + refl;
        elements.push(`<g transform="${tf}"><path d="${glyph}" ${stroke}/></g>`);
        const rad = -theta * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
        const toWorld = (px, py) => {
          const lx = px * 36, ly = -py * 36;
          return [x + lx * cos - ly * sin, y + lx * sin + ly * cos];
        };
        const labelBox = reflectBBox(glyphBox, options, glyphCenter);
        for (const label of labels) {
          if (label.items) throw new Error(`${type} does not support list labels.`);
          const placement = localLabelPlacement(reflectLabelHints(label, options), labelBox, theta, 'top', 0.1);
          const [lx, ly] = toWorld(placement.x, placement.y);
          const lines = String(label.text).split('\n');
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          const anchor = { left: 'start', center: 'middle', right: 'end' }[placement.halign];
          const baseline = placement.valign === 'center' ? 'central' : placement.valign === 'top' ? 'hanging' : 'ideographic';
          const yAttr = placement.valign === 'center' ? ly - (lines.length + 1) / 2 * size
            : placement.valign === 'top' ? ly - size
              : ly - lines.length * size;
          const spans = lines.map(line => `<tspan x="${lx}" dy="${size}">${labelContent(line)}</tspan>`).join('');
          const width = Math.max(12, Math.max(...lines.map(line => Array.from(line).length)) * size * 0.71);
          bounds(lx - (anchor === 'start' ? 0 : anchor === 'end' ? width : width / 2), yAttr - size,
            lx + (anchor === 'end' ? 0 : anchor === 'start' ? width : width / 2), yAttr + (lines.length + 1) * size);
          const transform = placement.rotate ? ` transform="rotate(${-placement.rotate} ${lx} ${ly})"` : '';
          elements.push(`<text x="${lx}" y="${yAttr}" text-anchor="${anchor}" dominant-baseline="${baseline}"${transform}${label.color ? ` fill="${label.color}"` : textFill} font-family="sans-serif" font-size="${size}">${spans}</text>`);
        }
        const [ax1, ay1] = toWorld(labelBox.xmin, labelBox.ymin);
        const [ax2, ay2] = toWorld(labelBox.xmax, labelBox.ymax);
        bounds(Math.min(ax1, ax2), Math.min(ay1, ay2), Math.max(ax1, ax2), Math.max(ay1, ay2));
        if (name) {
          // Schemdraw's AntennaLoop / AntennaLoop2 end anchor is offset by the lead.
          const endX = type === 'Antenna' ? 0 : type === 'AntennaLoop' ? 0.2 : 0.25;
          const anchorPoint = (px, py) => toWorld(sx === -1 ? 2 * glyphCenter - px : px, sy2 === -1 ? -py : py);
          const [ex, ey] = anchorPoint(endX, 0);
          const [stx, sty] = anchorPoint(0, 0);
          names[name] = { start: [stx, sty], center: [x, y], end: [ex, ey], xy: [x, y] };
        }
        log(`${type}: at (${x / 36}, ${-y / 36})`);
        if ('hold' in options) [x, y, direction] = previousState;
        continue;
      }
      if (['Ground', 'GroundSignal', 'GroundChassis', 'Vdd', 'Vss', 'NoConnect'].includes(type)) {
        if (selectedDirection || length !== null || Object.keys(options).some(key => !['at', 'color', 'hold', 'theta', 'flip', 'reverse', 'lead'].includes(key))) throw new Error(`${type} supports at, color, hold, theta, flip, reverse, and label.`);
        if (labels.some(label => label.loc != null && !['top', 'bot', 'bottom'].includes(label.loc))) throw new Error(`${type} label loc must be top or bot.`);
        if ('lead' in options && type !== 'Ground') throw new Error(`lead cannot be used with ${type}.`);
        if ('lead' in options && !['True', 'False'].includes(options.lead)) throw new Error('lead must be True or False.');
        const lead = type === 'Ground' && options.lead !== 'False' ? 14.4 : 0;
        let body;
        if (type === 'Ground') body = `${lead ? 'M 0,0 L 0,14.4 ' : ''}M -9,${lead} L 9,${lead} M -6.3,${lead + 4.32} L 6.3,${lead + 4.32} M -1.8,${lead + 8.64} L 1.8,${lead + 8.64}`;
        else if (type === 'GroundSignal') body = 'M 0,0 L 0,14.4 L -9,14.4 L 0,23.4 L 9,14.4 L 0,14.4';
        else if (type === 'GroundChassis') body = 'M 0,0 L 0,14.4 L -6.75,23.4 M 0,14.4 L -6.75,14.4 L -13.5,23.4 M 0,14.4 L 6.75,14.4 L 0,23.4';
        else if (type === 'Vdd') body = 'M 0,0 L 0,-14.4 M 0,-14.4 L -6.75,-14.4 M 0,-14.4 L 6.75,-14.4';
        else if (type === 'Vss') body = 'M 0,0 L 0,14.4 M 0,14.4 L -6.75,14.4 M 0,14.4 L 6.75,14.4';
        else body = 'M -6.75,6.75 L 6.75,-6.75 M -6.75,-6.75 L 6.75,6.75';
        let theta = 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          theta = Number(options.theta);
        }
        const sx = 'reverse' in options ? -1 : 1, sy2 = 'flip' in options ? -1 : 1;
        const tf = `translate(${x} ${y})` + (theta ? ` rotate(${-theta})` : '') + ((sx !== 1 || sy2 !== 1) ? ` scale(${sx} ${sy2})` : '');
        elements.push(`<g transform="${tf}"><path d="${body}" ${stroke}/></g>`);
        // Labels follow Schemdraw's default side: above for grounds/Vdd, below for Vss/NoConnect.
        const ext = type === 'Vdd' ? [-14.4, 0] : type === 'Vss' ? [0, 14.4] : type === 'NoConnect' ? [-6.75, 6.75] : type === 'Ground' ? [0, lead + 8.64] : [0, 23.4];
        const xext = type === 'GroundChassis' ? [-13.5, 6.75] : (type === 'Ground' || type === 'GroundSignal') ? [-9, 9] : [-6.75, 6.75];
        const rotalign = [['center', 'bottom'], ['right', 'bottom'], ['right', 'center'], ['right', 'top'],
          ['center', 'top'], ['left', 'top'], ['left', 'center'], ['left', 'bottom']];
        // Mirror the symbol extents for flip/reverse before placing labels.
        const extF = sy2 === -1 ? [-ext[1], -ext[0]] : ext;
        const xextF = sx === -1 ? [-xext[1], -xext[0]] : xext;
        for (const label of labels) {
          let loc = label.loc || (['Vss', 'NoConnect'].includes(type) ? 'bottom' : 'top');
          const normalizedTheta = ((theta % 360) + 360) % 360;
          // Schemdraw keeps the label on the same visual side: flip the side
          // when the element points left/down.
          if (normalizedTheta > 90 && normalizedTheta <= 270) {
            loc = ({ top: 'bot', bot: 'top', bottom: 'top', left: 'right', right: 'left' })[loc] || loc;
          }
          const rotation = label.rotate === true ? theta : typeof label.rotate === 'number' ? label.rotate : 0;
          let th = theta - rotation;
          if (loc === 'bot' || loc === 'bottom') th += 180;
          else if (loc === 'left') th += 90;
          else if (loc === 'right') th += 270;
          const sector = Math.round((((th % 360) + 360) % 360) / 45) % 8;
          let anchor = { left: 'start', center: 'middle', right: 'end' }[rotalign[sector][0]];
          if (label.halign) anchor = { left: 'start', center: 'middle', right: 'end' }[label.halign];
          const baseline = rotalign[sector][1] === 'top' ? ' dominant-baseline="hanging"'
            : rotalign[sector][1] === 'center' ? ' dominant-baseline="central"' : '';
          const rad = theta * Math.PI / 180, cosT = Math.cos(rad), sinT = Math.sin(rad);
          const items = label.items || [label.text];
          items.forEach((text, i) => {
            const frac = label.items ? (i + 1) / (label.items.length + 1) : 0.5;
            let lx0 = xextF[0] + (xextF[1] - xextF[0]) * frac;
            // (x y) replaces the default lblofst (0.1 unit) on the axis it sets;
            // one value replaces it across the label's side (_place_label).
            const ofstX = Array.isArray(label.ofst) ? label.ofst[0] : null;
            const ofstY = Array.isArray(label.ofst) ? label.ofst[1] : (typeof label.ofst === 'number' ? label.ofst : null);
            const along = ofstX == null ? 0 : ofstX * 36;
            const across = (ofstY == null ? 0.1 : (loc === 'top' ? ofstY : -ofstY)) * 36;
            const isSide = loc === 'left' || loc === 'right';
            if (isSide) lx0 += loc === 'right' ? across : -across;
            const ly0 = loc === 'top' ? extF[0] - across : extF[1] + across;
            if (!isSide) lx0 += along;
            // Rotate the label position with theta (extents are already mirrored).
            const lx = x + lx0 * cosT + ly0 * sinT;
            const ly = y - lx0 * sinT + ly0 * cosT;
            const transform = rotation ? ` transform="rotate(${-rotation} ${lx} ${ly})"` : '';
            elements.push(`<text x="${lx}" y="${ly}" text-anchor="${anchor}"${baseline}${transform}${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(text)}</text>`);
            const width = Math.max(12, Array.from(text).length * 10);
            bounds(lx - width, ly - 20, lx + width, ly + 20);
          });
        }
        bounds(x - 15, y - 25, x + 15, y + 25);
        if (name) names[name] = { start: [x, y], center: [x, y], end: [x, y], xy: [x, y] };
        log(`${type}: at (${x / 36}, ${-y / 36})`);
        if ('hold' in options) [x, y, direction] = previousState;
        continue;
      }
      if (type === 'SwitchRotary' || type === 'SwitchDIP') {
        // Free-standing symbols: they are placed at the current point (or `at`)
        // and do not move the drawing position unless `hold` is omitted, like
        // Schemdraw's Element with an explicit anchor.
        if (length !== null || 'anchor' in options || ['to', 'tox', 'toy', 'endpoints'].some(key => key in options)) throw new Error(`${type} does not support length, anchor, to/tox/toy, or endpoints.`);
        if ('at' in options) [x, y] = atPoint(options.at);
        // Schemdraw's Element accepts theta / direction for these symbols.
        let swTheta = 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          swTheta = Number(options.theta);
        } else if (selectedDirection) {
          swTheta = ({ right: 0, up: 90, left: 180, down: 270 })[selectedDirection];
        }
        const gateBool2 = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (!['True', 'False'].includes(options[key])) throw new Error(`${key} must be True or False.`);
          return options[key] === 'True';
        };
        const positive = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (typeof options[key] !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(options[key]) || !(Number(options[key]) > 0)) throw new Error(`${key} must be a positive number.`);
          return Number(options[key]) * 36;
        };
        const count = (key, fallback) => {
          if (!(key in options)) return fallback;
          if (typeof options[key] !== 'string' || !/^\d+$/.test(options[key]) || !Number.isSafeInteger(Number(options[key]))) throw new Error(`${key} must be an integer.`);
          return Number(options[key]);
        };
        const sxw = 'reverse' in options ? -1 : 1, syw = 'flip' in options ? -1 : 1;
        let reachOne = 60, reachTwo = 60;
        const anchors = Object.create(null);
        let glyph = '';
        if (type === 'SwitchRotary') {
          const n = count('n', 4);
          if (n < 1 || n > 16) throw new Error('SwitchRotary n must be an integer between 1 and 16.');
          const radius = positive('radius', 36);
          const arrowlen = positive('arrowlen', 0.75 * 36);
          const arrowcontact = count('arrowcontact', 0);
          if (arrowcontact > n - 1) throw new Error('SwitchRotary arrowcontact must be between 0 and n-1.');
          const dtheta = 'dtheta' in options ? positive('dtheta', 0) / 36 : Math.min(35, 360 / (n + 1));
          const theta0 = 'theta0' in options ? positive('theta0', 0) / 36 : -dtheta * (n - 1) / 2;
          // Every contact dot, including the common terminal, is drawn by the
          // overlay pass; schemdraw puts no dot at the centre of rotation.
          for (let i = 0; i < n; i++) {
            const t = (theta0 + dtheta * i) * Math.PI / 180;
            const px = radius * Math.cos(t), py = radius * Math.sin(t);
            anchors[`T${i + 1}`] = [x + sxw * px, y + syw * -py];
            if (i === arrowcontact) {
              const ax2 = arrowlen * Math.cos(t), ay2 = -arrowlen * Math.sin(t);
              // Reuse the shared arrow geometry so the head matches Schemdraw's
              // Segment(arrow='->'); the inline head had a different tip
              // pull-back and base length, shifting it by about 1 px.
              glyph += segmentArrow(0, 0, ax2, ay2, color, stroke);
            }
          }
          anchors.P = [x, y];
          // Rotate the anchors before the contact markers are drawn, so the
          // overlay circles land on the rotated contacts (Schemdraw draws them
          // as part of the rotated element).
          if (swTheta) {
            const rRad = -swTheta * Math.PI / 180, rCos = Math.cos(rRad), rSin = Math.sin(rRad);
            for (const key of Object.keys(anchors)) {
              const ox = anchors[key][0] - x, oy = anchors[key][1] - y;
              anchors[key] = [x + ox * rCos - oy * rSin, y + ox * rSin + oy * rCos];
            }
          }
          // Contact circles are "bg" fills in Schemdraw and must stay on top.
          for (const key of Object.keys(anchors)) whiteMarker(anchors[key][0], anchors[key][1], 4.32, color);
          reachOne = reachTwo = Math.max(radius, arrowlen) + 10;
        } else {
          const n = count('n', 3);
          if (n < 1 || n > 32) throw new Error('SwitchDIP n must be an integer between 1 and 32.');
          const swidth = positive('swidth', 0.4 * 36);
          const spacing = positive('spacing', 0.2 * 36);
          const switchColor = options.switchcolor === undefined ? '#333333' : readColor(options.switchcolor);
          const pattern = [];
          if ('pattern' in options) {
            const match = /^\[([^\]]*)\]$/.exec(options.pattern);
            if (!match) throw new Error('pattern must use the form [True False True].');
            for (const item of match[1].split(/[\s,]+/).filter(Boolean)) {
              if (!['True', 'False', '0', '1'].includes(item)) throw new Error('pattern entries must be True, False, 0, or 1.');
              pattern.push(item === 'True' || item === '1');
            }
            if (pattern.length !== n) throw new Error(`pattern has ${pattern.length} entries but n=${n}.`);
          }
          const width = swidth * n + spacing * (n + 1), height = swidth * 2 + spacing * 2;
          glyph += `<rect x="0" y="${(-height).toFixed(3)}" width="${width.toFixed(3)}" height="${height.toFixed(3)}" fill="none" stroke="${color}" stroke-width="2"/>`;
          for (let i = 0; i < n; i++) {
            const lx = spacing * (i + 1) + swidth * i;
            const upper = pattern.length ? pattern[i] : false;
            const lower = pattern.length ? !pattern[i] : false;
            glyph += `<rect x="${lx.toFixed(3)}" y="${(-(spacing + swidth * 2)).toFixed(3)}" width="${swidth.toFixed(3)}" height="${swidth.toFixed(3)}" fill="${upper ? switchColor : 'none'}" stroke="${color}" stroke-width="2"/>`;
            glyph += `<rect x="${lx.toFixed(3)}" y="${(-(spacing + swidth)).toFixed(3)}" width="${swidth.toFixed(3)}" height="${swidth.toFixed(3)}" fill="${lower ? switchColor : 'none'}" stroke="${color}" stroke-width="2"/>`;
            const aRad = -swTheta * Math.PI / 180, aCos = Math.cos(aRad), aSin = Math.sin(aRad);
            const putDip = (ox, oy) => [x + ox * aCos - oy * aSin, y + ox * aSin + oy * aCos];
            anchors[`a${i + 1}`] = putDip(sxw * (lx + swidth / 2), 0);
            anchors[`b${i + 1}`] = putDip(sxw * (lx + swidth / 2), syw * -height);
          }
          reachOne = width + 10;
          reachTwo = height + 10;
        }
        // The glyph is built in screen coordinates; mirror it around the
        // insertion point for flip / reverse.
        glyph = sxw === 1 && syw === 1 ? glyph
          : `<g transform="translate(${x} ${y}) scale(${sxw} ${syw}) translate(${-x} ${-y})">${glyph}</g>`;
        if (swTheta) glyph = `<g transform="rotate(${-swTheta} ${x} ${y})">${glyph}</g>`;
        elements.push(glyph);
        // Bounds follow the actual extent so the viewBox is not inflated.
        bounds(x - reachOne, y - reachTwo, x + reachOne, y + reachTwo);
        for (const key in anchors) bounds(anchors[key][0] - 6, anchors[key][1] - 6, anchors[key][0] + 6, anchors[key][1] + 6);
        if (name) names[name] = Object.assign({ center: [x, y], xy: [x, y] }, anchors);
        log(`${type}: at (${x / 36}, ${-y / 36})`);
        if ('hold' in options) [x, y, direction] = previousState;
        continue;
      }
      if (DSP_TYPES.has(type)) {
        // Schemdraw's dsp symbols (and flow.Box) are stand-alone elements: they
        // are placed at the current point or `at`, then the drawing position
        // moves to the element's drop (E for the boxes and circles, `out` for
        // Amp/VGA, or the opposite compass point for a Box placed by
        // direction).
        if (length !== null) throw new Error(`${type} does not take a length.`);
        const spec = buildDsp(type, options, labelSize, color);
        if ('at' in options) [x, y] = atPoint(options.at);
        // Element._flipreverse(): Schemdraw mirrors the local segments and
        // anchors before placing the element. `reverse` uses the `center`
        // anchor if the element defines one, otherwise the bbox centre.
        const reverseElement = 'reverse' in options;
        const flipElement = 'flip' in options;
        const reflectCenter = spec.anchors.center
          ? spec.anchors.center[0]
          : (spec.bbox.xmin + spec.bbox.xmax) / 2;
        const reflectPoint = ([px, py]) => [
          reverseElement ? 2 * reflectCenter - px : px,
          flipElement ? -py : py
        ];
        const reflectedAnchors = Object.create(null);
        for (const [key, value] of Object.entries(spec.anchors)) reflectedAnchors[key] = reflectPoint(value);
        const reflectedBBox = reflectBBox(spec.bbox, options, reflectCenter);
        const drawingTheta = typeof direction === 'number' ? direction
          : ({ right: 0, up: 90, left: 180, down: 270 })[direction];
        let theta;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          theta = Number(options.theta);
        } else if (selectedDirection) {
          theta = ({ right: 0, up: 90, left: 180, down: 270 })[selectedDirection];
        } else {
          // flow.Box declares theta=0, so it does not follow the drawing angle.
          theta = type === 'Box' ? 0 : drawingTheta;
        }
        let anchorName = options.anchor === undefined ? null : options.anchor;
        let dropPoint = spec.dropPoint;
        if (type === 'Box' && anchorName === null) {
          // Box._place: choose the closest compass anchor to the drawing
          // direction and drop to the opposite point.
          const th = ((drawingTheta % 360) + 360) % 360;
          const thetas = [0, 45, 90, 135, 180, 225, 270, 315];
          const compass = ['W', 'SW', 'S', 'SE', 'E', 'NE', 'N', 'NW'];
          let index = 0, best = Infinity;
          thetas.forEach((value, i) => {
            const distance = Math.abs(value - th);
            if (distance < best) { best = distance; index = i; }
          });
          anchorName = compass[index];
          const opposite = anchorName.replace(/[NESW]/g, c => ({ N: 'S', S: 'N', E: 'W', W: 'E' })[c]);
          dropPoint = spec.anchors[opposite] || null;
        }
        if (anchorName !== null && !Object.prototype.hasOwnProperty.call(spec.anchors, anchorName)) throw new Error(`Unknown ${type} anchor: ${anchorName}`);
        if ('drop' in options) {
          if (!Object.prototype.hasOwnProperty.call(spec.anchors, options.drop)) throw new Error(`Unknown ${type} drop: ${options.drop}`);
          dropPoint = spec.anchors[options.drop];
        }
        const shift = anchorName === null ? [0, 0] : reflectPoint(spec.anchors[anchorName]);
        const originX = x, originY = y;
        const rad = -theta * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
        // Local drawing units (y up) → world SVG pixels. `tf` takes a point in
        // the element's original (pre-flip/reverse) frame, while `tfFrame`
        // takes one already expressed in the reflected frame (labels are
        // positioned against the reflected bbox but not reflected again).
        const tfFrame = ([px, py]) => {
          const qx = (px - shift[0]) * 36, qy = -(py - shift[1]) * 36;
          return [originX + qx * cos - qy * sin, originY + qx * sin + qy * cos];
        };
        const tf = point => tfFrame(reflectPoint(point));
        const transform = `translate(${originX} ${originY})`
          + (theta ? ` rotate(${-theta})` : '')
          + (shift[0] || shift[1] ? ` translate(${-shift[0] * 36} ${shift[1] * 36})` : '')
          + (reverseElement ? ` translate(${2 * reflectCenter * 36} 0) scale(-1 1)` : '')
          + (flipElement ? ' scale(1 -1)' : '');
        elements.push(`<g transform="${transform}">${spec.body}</g>`);
        // Glyph texts (Σ, mixer ports) are segments in Schemdraw: their
        // position follows the element, but the text itself stays upright.
        for (const glyph of spec.glyphs) {
          const [gx, gy] = tf([glyph.x / 36, -glyph.y / 36]);
          elements.push(`<text x="${gx}" y="${gy - glyph.size}" text-anchor="middle" dominant-baseline="central"${textFill} font-family="sans-serif" font-size="${glyph.size}"><tspan x="${gx}" dy="${glyph.size}">${labelContent(glyph.value)}</tspan></text>`);
        }
        const reflectedSpec = Object.assign({}, spec, { bbox: reflectedBBox, anchors: reflectedAnchors });
        for (const label of labels) {
          if (label.items) throw new Error(`${type} does not support list labels.`);
          if (label.rotate !== undefined) throw new Error(`${type} does not support label rotation.`);
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          const placement = dspLabelPosition(reflectLabelHints(label, options), reflectedSpec, theta);
          const [lx, ly] = tfFrame([placement.x / 36, -placement.y / 36]);
          const lines = String(label.text).split('\n');
          const yAttr = placement.valign === 'center' ? ly - (lines.length + 1) / 2 * size
            : placement.valign === 'top' ? ly - size
              : ly - lines.length * size;
          const anchor = { left: 'start', center: 'middle', right: 'end' }[placement.halign];
          const baseline = placement.valign === 'center' ? 'central' : placement.valign === 'top' ? 'hanging' : 'ideographic';
          const spans = lines.map(line => `<tspan x="${lx}" dy="${size}">${labelContent(line)}</tspan>`).join('');
          const visible = label.text.startsWith('$') && label.text.endsWith('$') ? label.text.replace(/[$_{}]/g, '') : label.text;
          const width = Math.max(12, Array.from(visible).length * size * 0.71);
          bounds(lx - (anchor === 'start' ? 0 : anchor === 'end' ? width : width / 2), yAttr,
            lx + (anchor === 'end' ? 0 : anchor === 'start' ? width : width / 2), yAttr + (lines.length + 1) * size);
          elements.push(`<text x="${lx}" y="${yAttr}" text-anchor="${anchor}" dominant-baseline="${baseline}"${label.color ? ` fill="${label.color}"` : textFill} font-family="sans-serif" font-size="${size}">${spans}</text>`);
        }
        const { xmin, ymin, xmax, ymax } = spec.bbox;
        for (const [bx, by] of [[xmin, ymin], [xmax, ymin], [xmin, ymax], [xmax, ymax]]) {
          const [wx, wy] = tf([bx, by]);
          bounds(wx, wy, wx, wy);
        }
        const placedAnchors = Object.create(null);
        for (const [key, value] of Object.entries(spec.anchors)) placedAnchors[key] = tf(value);
        // Schemdraw records `xy` from Transform(0,0), i.e. the unreflected
        // local origin after the anchor shift.
        placedAnchors.xy = tfFrame([0, 0]);
        if (name) {
          names[name] = placedAnchors;
          namedTypes[name] = type;
          namedBoxes[name] = { ...elemBox };
        }
        if (dropPoint) [x, y] = tf(dropPoint);
        // Element._place keeps dwgtheta for the drop unless the element itself
        // was given a direction or theta (flow.Box defaults theta to 0).
        direction = ('theta' in options || selectedDirection) ? theta : drawingTheta;
        log(`${type}: at (${originX / 36}, ${-originY / 36})`);
        if ('hold' in options) [x, y, direction] = previousState;
        continue;
      }
      if (type === 'SwitchSpdt2') {
        // Schemdraw's SwitchSpdt2 is an Element, not an Element2Term: the
        // 1-unit glyph has no leads. It is placed at the current point (or
        // `at`), and the drawing position moves to b (Schemdraw's drop).
        const allowed = ['at', 'anchor', 'theta', 'color', 'flip', 'reverse', 'action', 'contacts', 'hold'];
        if (length !== null || Object.keys(options).some(key => !allowed.includes(key))) throw new Error('SwitchSpdt2 supports at, anchor, direction, theta, color, flip, reverse, action, contacts, hold, and labels.');
        if ('anchor' in options && !['a', 'b', 'c'].includes(options.anchor)) throw new Error(`Unknown SwitchSpdt2 anchor: ${options.anchor}`);
        if ('at' in options) [x, y] = atPoint(options.at);
        const sx = 'reverse' in options ? -1 : 1, sy = 'flip' in options ? -1 : 1;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          direction = Number(options.theta);
        } else if (selectedDirection) direction = selectedDirection;
        else direction = 'right';
        const radians = typeof direction === 'number' ? direction * Math.PI / 180 : 0;
        const [dx, dy, angle] = typeof direction === 'number' ? [Math.cos(radians), -Math.sin(radians), -direction] : directions[direction];
        const contacts = options.contacts === undefined || options.contacts === 'True';
        const aLocal = contacts ? 4.32 : 0;
        const bLocal = contacts ? 31.68 : 36;
        const mirror = ([lx, ly]) => [sx === -1 ? 36 - lx : lx, sy === -1 ? -ly : ly];
        const world = ([lx, ly]) => {
          const [mx, my] = mirror([lx, ly]);
          return [x + mx * dx - my * dy, y + mx * dy + my * dx];
        };
        if ('anchor' in options) {
          const [ax, ay] = mirror(options.anchor === 'a' ? [aLocal, 0] : [bLocal, options.anchor === 'b' ? -14.4 : 14.4]);
          x -= ax * dx - ay * dy;
          y -= ax * dy + ay * dx;
        }
        const anchors = {
          a: world([aLocal, 0]),
          b: world([bLocal, -14.4]),
          c: world([bLocal, 14.4]),
          center: world([18, 0])
        };
        const flags = Object.assign(Object.create(null), options);
        flags.contacts = contacts;
        const body = twoTerminalParts.SwitchSpdt2.body(stroke, color, flags);
        elements.push(`<g transform="translate(${x} ${y}) rotate(${angle})"><g transform="translate(18 0) scale(${sx} ${sy}) translate(-18 0)">${body}</g></g>`);
        for (const [lx, ly] of [[-2, -24], [38, -24], [-2, 24], [38, 24]]) {
          const [bx, by] = world([lx, ly]);
          bounds(bx - 2, by - 2, bx + 2, by + 2);
        }
        // SwitchSpdt2's LabelHints from switches.py. They are applied to an
        // explicit loc=a/b/c before Element._place_label runs.
        const spdt2Hints = {
          a: { ofst: [0, -0.18], halign: 'center', valign: 'top' },
          b: { ofst: [0, 0.18], halign: 'center', valign: 'bottom' },
          c: { ofst: [0, -0.18], halign: 'center', valign: 'top' }
        };
        // Element._place_label places labels against the local bbox and the
        // element's drawing angle. SwitchSpdt2 is an Element, not an
        // Element2Term, so its labels use the generic bbox/rotalign path.
        const baseBox = contacts
          ? { xmin: 0, ymin: -0.52, xmax: 1, ymax: 0.52 }
          : { xmin: 0, ymin: options.action ? -0.0438 : 0, xmax: 1, ymax: 0.4 };
        const localBox = reflectBBox(baseBox, options, 0.5);
        const anchorUnits = {
          a: [(contacts ? 4.32 : 0) / 36, 0],
          b: [bLocal / 36, 0.4],
          c: [bLocal / 36, -0.4]
        };
        for (const key of Object.keys(anchorUnits)) {
          const [ax0, ay0] = anchorUnits[key];
          anchorUnits[key] = [
            sx === -1 ? 1 - ax0 : ax0,
            sy === -1 ? -ay0 : ay0
          ];
        }
        const thetaDegrees = typeof direction === 'number' ? direction
          : ({ right: 0, up: 90, left: 180, down: 270 })[direction];
        const toWorldFrame = ([lx, ly]) => [
          x + lx * dx - ly * dy,
          y + lx * dy + ly * dx
        ];
        for (const label of labels) {
          if (label.items) throw new Error('SwitchSpdt2 does not support list labels.');
          let hinted = Object.assign({}, label);
          const hint = label.loc && spdt2Hints[label.loc];
          if (hint) {
            if (hinted.ofst == null) hinted.ofst = hint.ofst.slice();
            if (!hinted.halign) hinted.halign = hint.halign;
            if (!hinted.valign) hinted.valign = hint.valign;
          }
          hinted = reflectLabelHints(hinted, options);
          const placement = localLabelPlacement(hinted, localBox, thetaDegrees, 'top', 0.1, anchorUnits);
          const [tx, ty] = toWorldFrame([placement.x * 36, -placement.y * 36]);
          const size = hinted.fontsize === undefined ? labelSize : hinted.fontsize;
          const anchor = { left: 'start', center: 'middle', right: 'end' }[placement.halign];
          const baseline = placement.valign === 'center' ? 'central' : placement.valign === 'top' ? 'hanging' : 'ideographic';
          const lines = String(label.text).split('\n');
          const yAttr = placement.valign === 'center' ? ty - (lines.length + 1) / 2 * size
            : placement.valign === 'top' ? ty - size
              : ty - lines.length * size;
          const spans = lines.map(line => `<tspan x="${tx}" dy="${size}">${labelContent(line)}</tspan>`).join('');
          const width = Math.max(12, Math.max(...lines.map(line => Array.from(line).length)) * size * 0.71);
          bounds(tx - (anchor === 'start' ? 0 : anchor === 'end' ? width : width / 2), yAttr - size,
            tx + (anchor === 'end' ? 0 : anchor === 'start' ? width : width / 2), yAttr + (lines.length + 1) * size);
          const transform = placement.rotate ? ` transform="rotate(${-placement.rotate} ${tx} ${ty})"` : '';
          elements.push(`<text x="${tx}" y="${yAttr}" text-anchor="${anchor}" dominant-baseline="${baseline}"${transform}${hinted.color ? ` fill="${hinted.color}"` : textFill} font-family="sans-serif" font-size="${size}">${spans}</text>`);
        }
        if (contacts) for (const key of ['a', 'b', 'c']) whiteMarker(anchors[key][0], anchors[key][1], 4.32, color);
        if (name) {
          names[name] = anchors;
          namedBoxes[name] = { ...elemBox };
        }
        [x, y] = anchors.b;
        log(`SwitchSpdt2: at (${x / 36}, ${-y / 36})`);
        if ('hold' in options) [x, y, direction] = previousState;
        continue;
      }
      let targetPoint = null;
      let targetDirectionOverridden = false;
      let targetPointIsAbsolute = true;
      if ('to' in options || 'endpoints' in options) {
        const isEndpoints = 'endpoints' in options;
        let targetStart = [x, y];
        if (isEndpoints) {
          // Schemdraw's Element2Term.endpoints() accepts named terminals and
          // numeric coordinates. Each side is either a `(x y)` pair or a
          // previously defined terminal reference. A length specified with
          // `length=` is overridden by the distance between the endpoints.
          const endpoint = '\\([^()]*\\)|[A-Za-z_]\\w*\\.[^\\s]+';
          const match = new RegExp(`^\\s*(${endpoint})\\s+(${endpoint})\\s*$`).exec(options.endpoints);
          if (!match) throw new Error('endpoints must specify two terminal references or (x y) coordinates separated by whitespace.');
          targetStart = atPoint(match[1]);
          targetPoint = atPoint(match[2]);
          // In schemdraw, `at` still positions the element while `endpoints`
          // only determine direction and length.
          if (atPlacement) {
            [x, y] = atPlacement;
            targetPointIsAbsolute = false;
          } else [x, y] = targetStart;
        } else targetPoint = atPoint(options.to);
        const vx = targetPoint[0] - targetStart[0], vy = targetPoint[1] - targetStart[1];
        length = Math.hypot(vx, vy);
        if (!Number.isFinite(length) || length === 0) throw new Error('Start and end points must be distinct finite positions.');
        let targetDirection;
        if (vy === 0) targetDirection = vx < 0 ? 'left' : 'right';
        else if (vx === 0) targetDirection = vy < 0 ? 'up' : 'down';
        else targetDirection = Math.atan2(-vy, vx) * 180 / Math.PI;
        if (isEndpoints) direction = targetDirection;
        else if (selectedDirection) {
          // Schemdraw's Element._place() lets a direction keyword override the
          // angle implied by `to`; the distance to the target still sets length.
          direction = selectedDirection;
          targetDirectionOverridden = true;
        } else if ('theta' in options) {
          // Schemdraw lets an explicit theta override the angle implied by
          // `to`; the distance to the target still sets length.
          direction = Number(options.theta);
          targetDirectionOverridden = true;
        } else direction = targetDirection;
      } else if ('tox' in options) {
        const target = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.tox)
          ? Number(options.tox) * 36
          : atPoint(options.tox)[0];
        if ('theta' in options) {
          // Schemdraw sets the length from the horizontal distance and the
          // angle, then places the element along theta: end = start + l·(cosθ, sinθ).
          const th = Number(options.theta) * Math.PI / 180;
          const dxu = x - target;
          const dyu = Math.tan(th) * dxu;
          length = Math.hypot(dxu, dyu);
          direction = Number(options.theta);
        } else {
          direction = target < x ? 'left' : 'right'; length = Math.abs(target - x);
        }
        if (selectedDirection) {
          direction = selectedDirection;
          targetDirectionOverridden = true;
        }
      } else if ('toy' in options) {
        const target = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.toy)
          ? -Number(options.toy) * 36
          : atPoint(options.toy)[1];
        if ('theta' in options) {
          // Schemdraw sets the length from the vertical distance and the angle,
          // then places the element along theta.
          const th = Number(options.theta) * Math.PI / 180;
          const dyu = -(target - y);
          const dxu = dyu / Math.tan(th);
          length = Math.hypot(dxu, dyu);
          direction = Number(options.theta);
        } else {
          direction = target < y ? 'up' : 'down'; length = Math.abs(target - y);
        }
        if (selectedDirection) {
          direction = selectedDirection;
          targetDirectionOverridden = true;
        }
      } else if (selectedDirection) direction = selectedDirection;
      else if ('theta' in options) {
        const degrees = ((Number(options.theta) % 360) + 360) % 360;
        direction = ({ 0: 'right', 90: 'up', 180: 'left', 270: 'down' })[degrees] || Number(options.theta);
      }
      else if (isSource || ['BjtNpn2', 'BjtPnp2', 'BjtPnp2c2', 'CurrentMirror', 'VoltageMirror', 'Nullator', 'Norator'].includes(type)) direction = 'up';
      if (length === null) length = unit;
      // When the length comes from a target point (to/tox/toy/endpoints) the
      // document did not ask for a specific size; Schemdraw draws such a part
      // however short the gap is, so the minimum-length guards below only apply
      // to explicit `length=` values.
      const lengthFromTarget = targetPoint !== null || 'tox' in options || 'toy' in options;
      if (type === 'Line' && 'arrow' in options && (!Number.isFinite(length) || length === 0)) throw new Error('Cannot add an arrow to a zero-length or invalid Line.');
      if (type === 'Gap' && length < 36) length = 36;
      if (targetPoint && type === 'Gap' && length !== Math.hypot(targetPoint[0] - x, targetPoint[1] - y)) throw new Error('Gap terminal spacing is too short.');
      if (!lengthFromTarget && (type === 'Resistor' ) && length < 36) throw new Error('Resistor length is too short.');
      if (!lengthFromTarget && (type === 'Inductor' ) && length < 36) throw new Error('Inductor length is too short.');
      if (!lengthFromTarget && (type === 'Capacitor' ) && length < 6.48) throw new Error('Capacitor length is too short.');
      if (!lengthFromTarget && (['Diode', 'Zener', 'LED', 'Diac', 'SCR', 'Triac'].includes(type) ) && length < 12.6) throw new Error(`${type} length is too short.`);
      const partDef = twoTerminalParts[type];
      // Schemdraw's Element2Term._place(): lead_len = (totlen - in_len)/2 and,
      // when lead_len <= 0 ("don't make element shorter"), the element keeps its
      // natural size and the cursor stops at its natural end. Scaling the body
      // down instead changes both the glyph and every downstream position.
      if (lengthFromTarget && partDef) {
        // `in_len` in Schemdraw is the body path only: zero for Line (its
        // segment is a single point, so _place extends it to the target), one
        // unit for the other path-drawn parts, and half*2 for glyph forms.
        // Clamping Line to the 3-unit drawing length made tox/toy targets
        // shorter than 36 px stop at 36 px and left the cursor misplaced.
        const naturalLength = type === 'Line' ? 0 : partDef.form === 'glyph' ? partDef.half * 2 : 36;
        if (length < naturalLength) length = naturalLength;
      }
      if (zoom !== 1 && !(partDef && (partDef.form === 'glyph' || partDef.form === 'path' || ['Source', 'SourceV', 'SourceSin', 'Line'].includes(type))) && !['Potentiometer', 'PotentiometerIEC', 'PotentiometerIEEE'].includes(type)) throw new Error(`scale is not supported for ${type}.`);
      if (!lengthFromTarget && partDef && partDef.form === 'glyph' && length < partDef.half * 2) throw new Error(`${type} length is too short.`);
      if (!lengthFromTarget && (['Potentiometer', 'Rshunt', 'Fuse'].includes(type) ) && length < 36) throw new Error(`${type} length is too short.`);
      if (!lengthFromTarget && (['BjtNpn2', 'BjtPnp2', 'BjtPnp2c2'].includes(type) ) && length < 39.6) throw new Error(`${type} length is too short.`);
      if (!lengthFromTarget && (['NMos2', 'PMos2'].includes(type) ) && length < 60) throw new Error(`${type} length is too short.`);
      if (!lengthFromTarget && (['NFet2', 'PFet2'].includes(type) ) && length < 54) throw new Error(`${type} length is too short.`);
      if (!lengthFromTarget && (['JFetN2', 'JFetP2'].includes(type) ) && length < 48) throw new Error(`${type} length is too short.`);
      if (!lengthFromTarget && (['CurrentMirror', 'VoltageMirror'].includes(type) ) && length < 36) throw new Error(`${type} length is too short.`);
      if (!lengthFromTarget && (type === 'Breaker' ) && length < 36) throw new Error('Breaker length is too short.');
      if (!lengthFromTarget && (type === 'Inductor2' ) && length < 36) throw new Error('Inductor2 length is too short.');
      if (!lengthFromTarget && (type === 'CPE' ) && length < 9) throw new Error('CPE length is too short.');
      if (!lengthFromTarget && (['Nullator', 'Norator'].includes(type) ) && length < 36) throw new Error(`${type} length is too short.`);
      if (!lengthFromTarget && (type === 'Memristor2' ) && length < 50.4) throw new Error('Memristor2 length is too short.');
      if (!lengthFromTarget && (type === 'ResistorVar' ) && length < 36) throw new Error('ResistorVar length is too short.');
      if (!lengthFromTarget && (['ResistorVarIEC', 'ResistorVarIEEE', 'PotentiometerIEC', 'PotentiometerIEEE', 'FuseIEC', 'FuseIEEE'].includes(type) ) && length < 36) throw new Error(`${type} length is too short.`);
      if (!lengthFromTarget && (type === 'Capacitor2' ) && length < 6.48) throw new Error('Capacitor2 length is too short.');
      if (!lengthFromTarget && (['DiodeTunnel', 'DiodeShockley'].includes(type) ) && length < 12.6) throw new Error(`${type} length is too short.`);
      if (!lengthFromTarget && (type === 'DiodeTVS' ) && length < 25.2) throw new Error('DiodeTVS length is too short.');
      if (!lengthFromTarget && (type === 'Josephson' ) && length < 18) throw new Error('Josephson length is too short.');
      if (!lengthFromTarget && (['Photoresistor', 'PhotoresistorBox', 'PhotoresistorIEC', 'PhotoresistorIEEE'].includes(type) ) && length < 36) throw new Error(`${type} length is too short.`);
      if (!lengthFromTarget && (type === 'Motor' ) && length < 51.84) throw new Error('Motor length is too short.');
      const batterySpan = type === 'Battery' ? 20.25 : type === 'BatteryCell' ? 6.75 : type === 'BatteryDouble' ? 60.75 : 0;
      if (batterySpan && length < batterySpan) throw new Error(`${type} length is too short.`);
      if (!lengthFromTarget && (isSource ) && length < 36) throw new Error(`${type} length is too short.`);
      const arbitraryAngle = typeof direction === 'number';
      const radians = arbitraryAngle ? direction * Math.PI / 180 : 0;
      const [dx, dy, angle] = arbitraryAngle ? [Math.cos(radians), -Math.sin(radians), -direction] : directions[direction];
      let startX = x, startY = y;
      let endX = targetPoint && targetPointIsAbsolute && !targetDirectionOverridden ? targetPoint[0] : x + dx * length;
      let endY = targetPoint && targetPointIsAbsolute && !targetDirectionOverridden ? targetPoint[1] : y + dy * length;
      let centerX = (x + endX) / 2, centerY = (y + endY) / 2;
      const bodyLength = partDef && partDef.form === 'glyph' ? partDef.half * 2 : ['BjtNpn2', 'BjtPnp2', 'BjtPnp2c2'].includes(type) ? 39.6 : ['NMos2', 'PMos2'].includes(type) ? 60 : ['NFet2', 'PFet2'].includes(type) ? 54 : ['JFetN2', 'JFetP2'].includes(type) ? 48 : type === 'CPE' ? 9 : type === 'Memristor2' ? 50.4 : type === 'Capacitor2' ? 6.48 : type === 'DiodeTVS' ? 25.2 : type === 'Josephson' ? 18 : type === 'Motor' ? 51.84 : ['BusLine', 'DataBusLine'].includes(type) ? 0 : ['Coax', 'Triax'].includes(type) ? length : ['CurrentMirror', 'VoltageMirror'].includes(type) ? 36 : type === 'Capacitor' ? 6.48 : ['Diode', 'DiodeTunnel', 'DiodeShockley', 'Zener', 'LED', 'Diac', 'SCR', 'Triac'].includes(type) ? 12.6 : type === 'Line' ? 0 : batterySpan || 36;
      // Gap labels are anchored to the terminal span, not the shifted body.
      const scaledBody = bodyLength * zoom;
      const shiftOffset = type === 'Gap' ? 0 : (length - scaledBody) / 2 * shift;
      if (!Number.isFinite(shiftOffset)) throw new Error('shift is too large.');
      const placementX = x, placementY = y;
      if ('anchor' in options) {
        // Schemdraw's .anchor(name): shift the element so the named local
        // anchor lands on the current drawing position (or the `at` point).
        const localAnchors = twoTerminalLocalAnchors(type, length, shiftOffset, sy, options, { tapH, zoom, batterySpan, coaxRadius, coaxLead, triaxLead, triaxR1, triaxR2, triaxOfsStart, triaxOfsEnd, bulk });
        if (!Object.prototype.hasOwnProperty.call(localAnchors, options.anchor)) throw new Error(`Unknown ${type} anchor: ${options.anchor}`);
        const [ax, ay] = localAnchors[options.anchor];
        x -= ax * dx - ay * dy;
        y -= ax * dy + ay * dx;
        startX = x; startY = y;
        endX = x + dx * length; endY = y + dy * length;
        centerX = (startX + endX) / 2; centerY = (startY + endY) / 2;
      }
      const bodyCenterX = centerX + dx * shiftOffset, bodyCenterY = centerY + dy * shiftOffset;
      let path = partDef && partDef.form === 'path' ? partDef.path : '';
      if (type === 'Line') {
        const arrow = options.arrow || '';
        path = `M ${arrow.includes('<') ? 9 : 0},0 L ${length - (arrow.includes('>') ? 9 : 0)},0`;
      }
      if (type === 'SourceSin') path = sourceSinPath(sy);
      if (type === 'Inductor') path = inductorPath(sy);
      if (type === 'Resistor' || type === 'ResistorIEEE') {
        const a = length / 2 - 18 + shiftOffset;
        path = `M 0,0 L ${a},0 L ${a + 3},${-9 * sy} L ${a + 9},${9 * sy} L ${a + 15},${-9 * sy} L ${a + 21},${9 * sy} L ${a + 27},${-9 * sy} L ${a + 33},${9 * sy} L ${a + 36},0 L ${length},0`;
      }
      if (type === 'Capacitor' && (length !== defaultUnit || shiftOffset !== 0)) {
        const first = length / 2 - 3.24 + shiftOffset, second = length / 2 + 3.24 + shiftOffset;
        path = `M 0,0 L ${first},0 M ${first},-9 L ${first},9 M ${second},-9 L ${second},9 M ${second},0 L ${length},0`;
      }
      if (type === 'Inductor' && (length !== defaultUnit || shiftOffset !== 0)) {
        const start = length / 2 - 18 + shiftOffset;
        path = `M 0,0 L ${start},0`;
        for (let i = 0; i < 4; i++) path += ` M ${start + i * 9},0 a 4.5,4.5 0 1 ${sy === 1 ? 1 : 0} 9,0`;
        path += ` M ${start + 36},0 L ${length},0`;
      }
      let shapeExtra = '';
      if (type === 'Inductor2') {
        const c = length / 2 + shiftOffset, a = c - 18;
        path = `M 0,0 L ${a},0 M ${a + 36},0 L ${length},0`;
        const points = cycloidPoints(loops);
        // Schemdraw's cycloid() is y-up; SVG y grows downwards, so negate it.
        let glyph = `M ${a},0` + points.map(([u, v]) => ` L ${(a + u * 36).toFixed(4)},${(-v * 36 * sy).toFixed(4)}`).join('');
        glyph += ` L ${a + 36},0`;
        for (let i = 0; i < coreLines; i++) {
          const y = -(18 + 4.32 * i) * sy;
          glyph += ` M ${a},${y} L ${a + 36},${y}`;
        }
        const body = `<path d="${glyph}" ${stroke}/>`;
        shapeExtra = 'reverse' in options ? `<g transform="translate(${2 * c} 0) scale(-1 1)">${body}</g>` : body;
      }
      if (type === 'CPE') {
        const c = length / 2 + shiftOffset;
        path = `M 0,0 L ${c - 4.5},0 M ${c + 4.5},0 L ${length},0`;
        let glyph = `M ${c - 4.5},0 L ${c - 13.5},0`;
        glyph += ` M ${c + 4.5},0 L ${c - 4.5},${9 * sy} M ${c + 4.5},0 L ${c - 4.5},${-9 * sy}`;
        glyph += ` M ${c - 4.5},0 L ${c - 13.5},${-9 * sy} M ${c - 4.5},0 L ${c - 13.5},${9 * sy}`;
        const body = `<path d="${glyph}" ${stroke}/>`;
        shapeExtra = 'reverse' in options ? `<g transform="translate(${2 * c} 0) scale(-1 1)">${body}</g>` : body;
      }
      if (type === 'Nullator' || type === 'Norator') {
        const c = length / 2 + shiftOffset, a = c - 18, b = c + 18;
        path = `M 0,0 L ${a},0 M ${b},0 L ${length},0`;
        let glyph;
        if (type === 'Nullator') {
          glyph = `<ellipse cx="${c}" cy="0" rx="18" ry="9" fill="none" stroke="${color}" stroke-width="2"/>`;
        } else {
          glyph = `<circle cx="${c - 9}" cy="0" r="9" fill="none" stroke="${color}" stroke-width="2"/><circle cx="${c + 9}" cy="0" r="9" fill="none" stroke="${color}" stroke-width="2"/>`;
        }
        shapeExtra = 'reverse' in options ? `<g transform="translate(${2 * c} 0) scale(-1 1)">${glyph}</g>` : glyph;
      }
      if (type === 'Memristor2') {
        const c = length / 2 + shiftOffset, a = c - 25.2;
        path = `M 0,0 L ${a},0 M ${a + 50.4},0 L ${length},0`;
        const pts = [[0, 0], [0, -9], [7.2, -9], [7.2, 9], [14.4, 9], [14.4, -9], [21.6, -9], [21.6, 9], [28.8, 9], [28.8, -9], [36, -9], [36, 9], [43.2, 9], [43.2, 0], [50.4, 0]];
        let glyph = `<path d="M ${pts.map(([px, py], i) => `${i ? 'L' : ''} ${a + px},${py * sy}`).join(' ')}" ${stroke}/>`;
        shapeExtra = 'reverse' in options ? `<g transform="translate(${2 * c} 0) scale(-1 1)">${glyph}</g>` : glyph;
      }
      if (type === 'ResistorVar' || type === 'ResistorVarIEEE') {
        const c = length / 2 + shiftOffset, a = c - 18;
        path = `M 0,0 L ${a},0 L ${a + 3},${-9 * sy} L ${a + 9},${9 * sy} L ${a + 15},${-9 * sy} L ${a + 21},${9 * sy} L ${a + 27},${-9 * sy} L ${a + 33},${9 * sy} L ${a + 36},0 L ${length},0`;
        let glyph = `<path d="M ${c - 9},${18 * sy} L ${c + 5.983},${-14.463 * sy}" ${stroke}/><path d="M ${c + 8.162},${-19.184 * sy} L ${c + 8.598},${-13.256 * sy} L ${c + 3.368},${-15.67 * sy} Z" fill="${color}"/>`;
        shapeExtra = 'reverse' in options ? `<g transform="translate(${2 * c} 0) scale(-1 1)">${glyph}</g>` : glyph;
      }
      if (type === 'ResistorVarIEC') {
        const c = length / 2 + shiftOffset, a = c - 18;
        path = `M 0,0 L ${a},0 M ${a + 36},0 L ${length},0`;
        let glyph = `<path d="M ${a},0 L ${a},${-9 * sy} L ${a + 36},${-9 * sy} L ${a + 36},${9 * sy} L ${a},${9 * sy} L ${a},0" ${stroke}/>`;
        glyph += `<path d="M ${c - 12},${18 * sy} L ${c + 8.226},${-14.868 * sy}" ${stroke}/><path d="M ${c + 10.952},${-19.297 * sy} L ${c + 10.679},${-13.359 * sy} L ${c + 5.774},${-16.377 * sy} Z" fill="${color}"/>`;
        shapeExtra = 'reverse' in options ? `<g transform="translate(${2 * c} 0) scale(-1 1)">${glyph}</g>` : glyph;
      }
      if (type === 'Capacitor2') {
        const c = length / 2 + shiftOffset, first = c - 3.24, second = c + 3.24;
        path = `M 0,0 L ${first},0 M ${second},0 L ${length},0`;
        let glyph = `<path d="M ${first},${-9 * sy} L ${first},${9 * sy} M ${second + 0.68},${9.56 * sy} a 4.86 11.25 0 0 ${sy === 1 ? 1 : 0} 0 ${-19.12 * sy}" ${stroke}/>`;
        if (polar) glyph += `<text x="${c - 11.016}" y="${-20.48 * sy}" text-anchor="middle" dominant-baseline="central"${textFill} font-family="sans-serif" font-size="${labelSize}">+</text>`;
        shapeExtra = 'reverse' in options ? `<g transform="translate(${2 * c} 0) scale(-1 1)">${glyph}</g>` : glyph;
      }
      if (type === 'DiodeTunnel') {
        const c = length / 2 + shiftOffset, first = c - 6.3, second = c + 6.3;
        path = `M 0,0 L ${first},0 M ${second},0 L ${length},0`;
        const glyph = `<path d="M ${first},${-9 * sy} L ${second},0 L ${first},${9 * sy} Z M ${second},${-9 * sy} L ${second},${9 * sy} M ${second},${-9 * sy} L ${second - 3.6},${-9 * sy} M ${second},${9 * sy} L ${second - 3.6},${9 * sy}" ${stroke}/>`;
        shapeExtra = 'reverse' in options ? `<g transform="translate(${2 * c} 0) scale(-1 1)">${glyph}</g>` : glyph;
      }
      if (type === 'DiodeTVS') {
        const c = length / 2 + shiftOffset, left = c - 12.6, mid = c, right = c + 12.6;
        path = `M 0,0 L ${left},0 M ${right},0 L ${length},0`;
        const glyph = `<path d="M ${left},${-9 * sy} L ${mid},0 L ${left},${9 * sy} Z M ${mid},0 L ${right},${-9 * sy} L ${right},${9 * sy} Z M ${mid + 3.6},${-9 * sy} L ${mid},${-9 * sy} L ${mid},${9 * sy} L ${mid - 3.6},${9 * sy}" ${stroke}/>`;
        shapeExtra = 'reverse' in options ? `<g transform="translate(${2 * c} 0) scale(-1 1)">${glyph}</g>` : glyph;
      }
      if (type === 'DiodeShockley') {
        const c = length / 2 + shiftOffset, first = c - 6.3, second = c + 6.3;
        path = `M 0,0 L ${first},0 M ${second},0 L ${length},0`;
        const glyph = `<path d="M ${first},${-9 * sy} L ${second},0 L ${first},${9 * sy} Z M ${second},${-9 * sy} L ${second},${9 * sy} M ${first},${9 * sy} L ${first},${-9 * sy} L ${second},0" ${stroke}/>`;
        shapeExtra = 'reverse' in options ? `<g transform="translate(${2 * c} 0) scale(-1 1)">${glyph}</g>` : glyph;
      }
      if (type === 'Josephson') {
        const c = length / 2 + shiftOffset;
        if (josephsonBox) {
          path = `M 0,0 L ${c - 9},0 M ${c + 9},0 L ${length},0`;
          shapeExtra = `<path d="M ${c - 9},${-9 * sy} L ${c + 9},${-9 * sy} L ${c + 9},${9 * sy} L ${c - 9},${9 * sy} Z M ${c - 9},${-9 * sy} L ${c + 9},${9 * sy} M ${c + 9},${-9 * sy} L ${c - 9},${9 * sy}" ${stroke}/>`;
        } else {
          path = `M 0,0 L ${c},0 M ${c},0 L ${length},0`;
          shapeExtra = `<path d="M ${c - 9},${-9 * sy} L ${c + 9},${9 * sy} M ${c + 9},${-9 * sy} L ${c - 9},${9 * sy}" ${stroke}/>`;
        }
      }
      if (['Photoresistor', 'PhotoresistorBox', 'PhotoresistorIEC', 'PhotoresistorIEEE'].includes(type)) {
        const c = length / 2 + shiftOffset, a = c - 18;
        if (type === 'Photoresistor' || type === 'PhotoresistorIEEE') {
          path = `M 0,0 L ${a},0 L ${a + 3},${-9 * sy} L ${a + 9},${9 * sy} L ${a + 15},${-9 * sy} L ${a + 21},${9 * sy} L ${a + 27},${-9 * sy} L ${a + 33},${9 * sy} L ${a + 36},0 L ${length},0`;
        } else {
          path = `M 0,0 L ${a},0 M ${a + 36},0 L ${length},0`;
        }
        let glyph = '';
        if (type === 'PhotoresistorBox' || type === 'PhotoresistorIEC') {
          glyph += `<path d="M ${a},0 L ${a},${-9 * sy} L ${a + 36},${-9 * sy} L ${a + 36},${9 * sy} L ${a},${9 * sy} L ${a},0" ${stroke}/>`;
        }
        glyph += `<path d="M ${c + 7.2},${-27 * sy} L ${c + 1.086},${-19.867 * sy} M ${c + 18},${-27 * sy} L ${c + 11.886},${-19.867 * sy}" ${stroke}/><path d="M ${c - 2.298},${-15.919 * sy} L ${c - 1.101},${-21.741 * sy} L ${c + 3.272},${-17.992 * sy} Z M ${c + 8.502},${-15.919 * sy} L ${c + 9.699},${-21.741 * sy} L ${c + 14.072},${-17.992 * sy} Z" fill="${color}"/>`;
        shapeExtra = 'reverse' in options ? `<g transform="translate(${2 * c} 0) scale(-1 1)">${glyph}</g>` : glyph;
      }
      if (type === 'Coax') {
        if (length <= 2 * coaxLead + coaxRadius) throw new Error('Coax length is too short.');
        const L = length, l = coaxLead, r = coaxRadius, c = L / 2 + shiftOffset;
        path = `M 0,0 L ${l},0 M ${L - l + r / 2},0 L ${L},0`;
        const glyph = `<ellipse cx="${l}" cy="0" rx="${r / 2}" ry="${r}" fill="none" stroke="${color}" stroke-width="2"/><path d="M ${l},${-r * sy} L ${L - l},${-r * sy} M ${l},${r * sy} L ${L - l},${r * sy} M ${L - l},${-r * sy} a ${r / 2} ${r} 0 0 ${sy === 1 ? 1 : 0} 0 ${2 * r * sy}" ${stroke}/>`;
        // Element._flipreverse() also mirrors the inner ellipse; `sy` is
        // already folded into the glyph's y coordinates.
        shapeExtra = 'reverse' in options
          ? `<g transform="translate(${2 * c} 0) scale(-1 1)">${glyph}</g>`
          : glyph;
      }
      if (type === 'Triax') {
        // Schemdraw Triax (elements/cables.py): length, leadlen, radiusinner,
        // radiusouter, shieldofststart, shieldofstend (all in units).
        const L = length, lead = triaxLead, r1 = triaxR1, r2 = triaxR2, ofsS = triaxOfsStart, ofsE = triaxOfsEnd;
        if (r2 < r1) throw new Error('Triax inner radius > outer radius');
        const xshield = r2 / 2 * Math.sqrt(1 - r1 * r1 / (r2 * r2));
        // The path is the center conductor; the guard and shield are glyphs.
        path = `M 0,0 L ${lead},0 M ${L - lead + r1 / 2},0 L ${L},0`;
        const lx = lead + ofsS, rx = L - lead - ofsE;
        let glyph = `<ellipse cx="${lead}" cy="0" rx="${r1 / 2}" ry="${r1}" fill="none" stroke="${color}" stroke-width="2"/>`;
        glyph += `<path d="M ${lead},${-r1} L ${lx + xshield},${-r1} M ${lead},${r1} L ${lx + xshield},${r1}" ${stroke}/>`;
        glyph += `<path d="M ${L - lead - ofsE + xshield},${-r1} L ${L - lead},${-r1} M ${L - lead - ofsE + xshield},${r1} L ${L - lead},${r1}" ${stroke}/>`;
        glyph += `<path d="M ${L - lead},${-r1} a ${r1 / 2} ${r1} 0 1 1 0 ${2 * r1}" ${stroke}/>`;
        glyph += `<path d="M ${lx},${-r2} L ${rx},${-r2} M ${lx},${r2} L ${rx},${r2}" ${stroke}/>`;
        // Shield end caps: Schemdraw emits these as SVG arcs from top to bottom
        // with sweep=1 (bulging outward).
        glyph += `<path d="M ${lx - xshield},${-r1} a ${r2 / 2} ${r2} 0 1 1 0 ${2 * r1}" ${stroke}/>`;
        glyph += `<path d="M ${rx},${-r2} a ${r2 / 2} ${r2} 0 1 1 0 ${2 * r2}" ${stroke}/>`;
        const triaxC = L / 2 + shiftOffset;
        shapeExtra = ('reverse' in options || sy === -1)
          ? `<g transform="${'reverse' in options ? `translate(${2 * triaxC} 0) ` : ''}scale(${'reverse' in options ? -1 : 1} ${sy})">${glyph}</g>`
          : glyph;
      }
      if (type === 'Motor') {
        const c = length / 2 + shiftOffset, a = c - 25.92;
        path = `M 0,0 L ${a},0 M ${a + 51.84},0 L ${length},0`;
        let glyph = `<circle cx="${c}" cy="0" r="18" fill="none" stroke="${color}" stroke-width="2"/>`;
        glyph += `<path d="M ${a + 7.92},${7.92 * sy} L ${a},${7.92 * sy} L ${a},${-7.92 * sy} L ${a + 7.92},${-7.92 * sy} M ${a + 43.92},${7.92 * sy} L ${a + 51.84},${7.92 * sy} L ${a + 51.84},${-7.92 * sy} L ${a + 43.92},${-7.92 * sy}" ${stroke}/>`;
        shapeExtra = 'reverse' in options ? `<g transform="translate(${2 * c} 0) scale(-1 1)">${glyph}</g>` : glyph;
      }
      if (type === 'BusLine') {
        path = '';
        shapeExtra = `<path d="M 0,0 L ${length},0" fill="none" stroke="${color}" stroke-width="${busLw}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      if (type === 'DataBusLine') {
        const c = length / 2 + shiftOffset;
        path = `M 0,0 L ${c},0 M ${c},0 L ${length},0`;
        const slash = `<path d="M ${c - 4.5},${-9 * sy} L ${c + 4.5},${9 * sy}" ${stroke}/>`;
        shapeExtra = 'reverse' in options
          ? `<g transform="translate(${2 * c} 0) scale(-1 1)">${slash}</g>`
          : slash;
      }
      if (type === 'Diode' && (length !== defaultUnit || shiftOffset !== 0)) {
        const first = length / 2 - 6.3 + shiftOffset, second = length / 2 + 6.3 + shiftOffset;
        path = `M 0,0 L ${first},0 M ${first},-9 L ${second},0 L ${first},9 Z M ${second},-9 L ${second},9 M ${second},0 L ${length},0`;
      }
      // Extra geometry for multi-terminal two-terminal-style parts. Schemdraw
      // defines these as Element2Term subclasses with additional anchors.
      // Schemdraw's reverse() mirrors an Element2Term's glyph about the body
      // center while the leads keep their extended positions.
      const reverseGroup = (glyph, c) => 'reverse' in options
        ? `<g transform="translate(${2 * c} 0) scale(-1 1)">${glyph}</g>`
        : glyph;
      if (type === 'BjtNpn2' || type === 'BjtPnp2' || type === 'BjtPnp2c2') {
        const c = length / 2 + shiftOffset;
        const a = c - 19.8, b = c + 19.8;
        const barA = c - 13.5, barB = c + 13.5;
        const diagL = c - 7.2, diagR = c + 7.2;
        const barY = -15.12 * sy, baseY = -28.62 * sy;
        path = `M 0,0 L ${a},0 M ${b},0 L ${length},0`;
        const arrow = (fx, fy, tx, ty) => {
          const len = Math.hypot(tx - fx, ty - fy);
          const ux = (tx - fx) / len, uy = (ty - fy) / len;
          const tipX = tx - 2 * ux, tipY = ty - 2 * uy;
          const bx = tipX - 7 * ux, by = tipY - 7 * uy;
          return `<path d="M ${fx},${fy} L ${tipX},${tipY}" ${stroke}/><path d="M ${tipX},${tipY} L ${bx - 3.6 * uy},${by + 3.6 * ux} L ${bx + 3.6 * uy},${by - 3.6 * ux} Z" fill="${color}"/>`;
        };
        let glyph = `<path d="M 0,0 L ${a},0 L ${diagL},${barY} L ${diagR},${barY} L ${b},0 L ${length},0 M ${barA},${barY} L ${barB},${barY} M ${c},${barY} L ${c},${baseY}" ${stroke}/>`;
        // Schemdraw 0.22 reversed the emitter arrow on BjtNpn2/BjtPnp2 (and
        // inherited BjtPnp2c2). Keep the 0.21 orientation until the upstream
        // fix lands; see reference/version_pins.json.
        glyph += type === 'BjtNpn2' ? arrow(diagL, barY, a, 0) : arrow(b, 0, diagR, barY);
        if (type === 'BjtPnp2c2') {
          // Second collector: a short diagonal from the C2 tap to the base bar.
          glyph += `<path d="M ${a + 9},0 L ${a + 21.6},${barY}" ${stroke}/>`;
        }
        if ('circle' in options) {
          // Bjt2 appends SegmentCircle((bjt_width/2, bjt_r/2), bjt_r).
          glyph += `<circle cx="${c}" cy="${-9.9 * sy}" r="19.8" fill="none" stroke="${color}" stroke-width="2"/>`;
        }
        shapeExtra = reverseGroup(glyph, c);
      }
      if (type === 'NMos2' || type === 'PMos2') {
        const c = length / 2 + shiftOffset, a = c - 30, b = c + 30;
        const gateX = c + (type === 'NMos2' ? 12 : -12);
        const gateEnd = c - (type === 'NMos2' ? 12 : -12);
        // Element2Term body: 20u wide with u = 1/12 drawing unit. The gate
        // and source arrow sit below the terminal line for the default flip.
        // Leads stay outside the reverse group so shift and reverse compose.
        path = `M 0,0 L ${a},0 M ${b},0 L ${length},0`;
        let glyph = `<path d="M ${a},0 L ${a + 21},0 L ${a + 21},${9 * sy} M ${a + 39},${9 * sy} L ${a + 39},0 L ${b},0 M ${a + 30},0 L ${a + (type === 'NMos2' ? 39 : 21)},0" ${stroke}/>`;
        glyph += `<path d="M ${a + 19.5},${9 * sy} L ${a + 22.5},${9 * sy} M ${a + 28.5},${9 * sy} L ${a + 31.5},${9 * sy} M ${a + 37.5},${9 * sy} L ${a + 40.5},${9 * sy}" ${stroke}/>`;
        glyph += `<path d="M ${gateX},${30 * sy} L ${gateX},${15 * sy} M ${gateX},${15 * sy} L ${gateEnd},${15 * sy}" ${stroke}/>`;
        if (type === 'NMos2') {
          glyph += `<path d="M ${a + 30},${3 * sy} L ${a + 30},0" ${stroke}/><path d="M ${a + 30},${7 * sy} L ${a + 27},${3 * sy} L ${a + 33},${3 * sy} Z" fill="${color}"/>`;
        } else {
          glyph += `<path d="M ${a + 30},${9 * sy} L ${a + 30},${6 * sy}" ${stroke}/><path d="M ${a + 30},${2 * sy} L ${a + 33},${6 * sy} L ${a + 27},${6 * sy} Z" fill="${color}"/>`;
        }
        // `diode=True` draws the body diode above the terminals (Schemdraw's
        // `_Mosfet2` geometry, measured from the body's left edge `a`).
        if (options.diode === 'True') {
          const d9 = -9 * sy, d6 = -6 * sy, d12 = -12 * sy;
          glyph += `<path d="M ${a + 21},0 L ${a + 21},${d9} L ${a + 27},${d9}" ${stroke}/>` +
            `<path d="M ${a + 27},${d6} L ${a + 27},${d12}" ${stroke}/>` +
            `<polygon points="${a + 27},${d9} ${a + 33},${d6} ${a + 33},${d12} " fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>` +
            `<path d="M ${a + 33},${d9} L ${a + 39},${d9} L ${a + 39},0" ${stroke}/>`;
        }
        // `circle=True` encloses the transistor (centre 10u, -1u; r 7u).
        if (options.circle === 'True') {
          glyph += `<circle cx="${c}" cy="${3 * sy}" r="21" fill="none" stroke="${color}" stroke-width="2"/>`;
        }
        shapeExtra = reverseGroup(glyph, c);
      }
      if (type === 'NFet2' || type === 'PFet2') {
        const c = length / 2 + shiftOffset, a = c - 27;
        // Element2Term body for the simple FET: a raised box from the line
        // with the gate bar and lead above it.
        path = `M 0,0 L ${a},0 M ${a + 54},0 L ${length},0`;
        let glyph = `<path d="M ${a},0 L ${a + 15},0 L ${a + 15},${-24 * sy} L ${a + 39},${-24 * sy} L ${a + 39},0 L ${a + 54},0" ${stroke}/>`;
        glyph += `<path d="M ${a + 15},${-30 * sy} L ${a + 39},${-30 * sy}" ${stroke}/>`;
        if (type === 'NFet2') {
          glyph += `<path d="M ${a + 27},${-30 * sy} L ${a + 27},${-49.2 * sy}" ${stroke}/>`;
        } else {
          glyph += `<circle cx="${a + 27}" cy="${-34.2 * sy}" r="4.2" fill="none" stroke="${color}" stroke-width="2"/>`;
          glyph += `<path d="M ${a + 27},${-38.4 * sy} L ${a + 27},${-49.2 * sy}" ${stroke}/>`;
        }
        if (bulk) {
          glyph += `<path d="M ${a + 27},0 L ${a + 27},${-15 * sy}" ${stroke}/><path d="M ${a + 27},${-22 * sy} L ${a + 30.6},${-15 * sy} L ${a + 23.4},${-15 * sy} Z" fill="${color}"/>`;
        }
        shapeExtra = reverseGroup(glyph, c);
      }
      if (type === 'JFetN2' || type === 'JFetP2') {
        const c = length / 2 + shiftOffset, a = c - 24;
        // JFet2 body: 48-unit raised box with the gate bar on top.
        path = `M 0,0 L ${a},0 M ${a + 48},0 L ${length},0`;
        let glyph = `<path d="M ${a},0 L ${a + 15},0 L ${a + 15},${-18 * sy} L ${a + 33},${-18 * sy} L ${a + 33},0 L ${a + 48},0" ${stroke}/>`;
        glyph += `<path d="M ${a + 10.2},${-18 * sy} L ${a + 37.8},${-18 * sy} M ${a + 33},${-18 * sy} L ${a + 33},${-33 * sy}" ${stroke}/>`;
        if (type === 'JFetN2') {
          glyph += `<path d="M ${a + 33},${-18 * sy} L ${a + 33},${-19.8 * sy}" ${stroke}/><path d="M ${a + 33},${-26.8 * sy} L ${a + 36.6},${-19.8 * sy} L ${a + 29.4},${-19.8 * sy} Z" fill="${color}"/>`;
        } else {
          glyph += `<path d="M ${a + 33},${-28.8 * sy} L ${a + 33},${-27 * sy}" ${stroke}/><path d="M ${a + 33},${-20 * sy} L ${a + 36.6},${-27 * sy} L ${a + 29.4},${-27 * sy} Z" fill="${color}"/>`;
        }
        if (circle) glyph += `<circle cx="${a + 24}" cy="${-9 * sy}" r="26.4" fill="none" stroke="${color}" stroke-width="2"/>`;
        shapeExtra = reverseGroup(glyph, c);
      }
      if (type === 'CurrentMirror' || type === 'VoltageMirror') {
        const c = length / 2 + shiftOffset, a = c - 18;
        path = `M 0,0 L ${a},0 M ${a + 36},0 L ${length},0`;
        let glyph;
        if (type === 'CurrentMirror') {
          glyph = `<circle cx="${a + 10.8}" cy="0" r="10.8" fill="none" stroke="${color}" stroke-width="2"/><circle cx="${a + 25.2}" cy="0" r="10.8" fill="none" stroke="${color}" stroke-width="2"/>`;
        } else {
          glyph = `<ellipse cx="${a + 10.8}" cy="0" rx="10.8" ry="5.4" fill="none" stroke="${color}" stroke-width="2"/><ellipse cx="${a + 25.2}" cy="0" rx="10.8" ry="5.4" fill="none" stroke="${color}" stroke-width="2"/>`;
        }
        shapeExtra = reverseGroup(glyph, c);
      }
      if (type === 'Breaker') {
        const c = length / 2 + shiftOffset, a = c - 18;
        path = `M 0,0 L ${a},0 M ${a + 36},0 L ${length},0`;
        let glyph = `<path d="M ${a + 0.63},${-3.06 * sy} a 18 11.7 0 0 ${sy === 1 ? 1 : 0} 34.74 0" ${stroke}/>`;
        if (dots) {
          glyph += `<circle cx="${a + 4.32}" cy="0" r="4.32" fill="none" stroke="${color}" stroke-width="2"/><circle cx="${a + 31.68}" cy="0" r="4.32" fill="none" stroke="${color}" stroke-width="2"/>`;
        }
        shapeExtra = reverseGroup(glyph, c);
      }
      if (type === 'Potentiometer' || type === 'PotentiometerIEEE') {
        // `scale` zooms the whole glyph (body + wiper) about its centre, while
        // the leads still span the element length (Schemdraw's zoom).
        const s = zoom;
        const c = length / 2 + shiftOffset, a = c - 18 * s, b = c + 18 * s;
        path = `M 0,0 L ${a},0 M ${b},0 L ${length},0`;
        const glyph = `<path d="M ${a},0 L ${a + 3 * s},${-9 * s * sy} L ${a + 9 * s},${9 * s * sy} L ${a + 15 * s},${-9 * s * sy} L ${a + 21 * s},${9 * s * sy} L ${a + 27 * s},${-9 * s * sy} L ${a + 33 * s},${9 * s * sy} L ${b},0" ${stroke}/>`;
        // Schemdraw draws the wiper arrow from the tap to the body; the head is
        // a fixed-size triangle whose tip stops 2 px short of the body edge
        // (body half-height 9 px, scaled by `zoom`).
        const tapTip = 9 * s + 2, tapBase = tapTip + 7;
        shapeExtra = reverseGroup(glyph, c) + `<path d="M ${c},${-tapH * s * sy} L ${c},${-tapBase * sy}" ${stroke}/><path d="M ${c},${-tapTip * sy} L ${c - 2.7},${-tapBase * sy} L ${c + 2.7},${-tapBase * sy} Z" fill="${color}"/>`;
      }
      if (type === 'PotentiometerIEC') {
        const s = zoom;
        const c = length / 2 + shiftOffset, a = c - 18 * s;
        path = `M 0,0 L ${a},0 M ${a + 36 * s},0 L ${length},0`;
        const tapTip = 9 * s + 2, tapBase = tapTip + 7;
        const glyph = `<path d="M ${a},0 L ${a},${-9 * s * sy} L ${a + 36 * s},${-9 * s * sy} L ${a + 36 * s},${9 * s * sy} L ${a},${9 * s * sy} L ${a},0 M ${c},${-tapH * s * sy} L ${c},${-tapBase * sy}" ${stroke}/><path d="M ${c},${-tapTip * sy} L ${c - 2.7},${-tapBase * sy} L ${c + 2.7},${-tapBase * sy} Z" fill="${color}"/>`;
        shapeExtra = reverseGroup(glyph, c);
      }
      if (type === 'Rshunt') {
        const c = length / 2 + shiftOffset, a = c - 18, b = c + 18;
        path = `M 0,0 L ${a},0 M ${b},0 L ${length},0`;
        const glyph = `<path d="M ${a},0 L ${a},${-9 * sy} L ${b},${-9 * sy} L ${b},${9 * sy} L ${a},${9 * sy} L ${a},0" ${stroke}/><path d="M ${a},0 L ${a - 13.5},${9 * sy} L ${a - 13.5},${18 * sy}" ${stroke}/><path d="M ${b},0 L ${b + 13.5},${9 * sy} L ${b + 13.5},${18 * sy}" ${stroke}/>`;
        shapeExtra = reverseGroup(glyph, c);
      }
      if (type === 'SCR') {
        const c = length / 2 + shiftOffset, first = c - 6.3, second = c + 6.3;
        path = `M 0,0 L ${first},0 M ${second},0 L ${length},0`;
        const glyph = `<path d="M ${first},${-9 * sy} L ${second},0 L ${first},${9 * sy} Z M ${second},${-9 * sy} L ${second},${9 * sy} M ${second},0 L ${second + 10.8},${10.8 * sy} L ${second + 10.8},${18 * sy}" ${stroke}/>`;
        shapeExtra = reverseGroup(glyph, c);
      }
      if (type === 'Triac') {
        const c = length / 2 + shiftOffset, first = c - 6.3, second = c + 6.3;
        path = `M 0,0 L ${first},0 M ${second},0 L ${length},0`;
        const glyph = `<path d="M ${second},${-16.2 * sy} L ${second},${16.2 * sy} M ${first},${-16.2 * sy} L ${first},${16.2 * sy} M ${first},${18 * sy} L ${second},${9 * sy} L ${first},0 Z M ${second},${-18 * sy} L ${first},${-9 * sy} L ${second},0 Z M ${second},${-9 * sy} L ${second + 18},${-18 * sy}" ${stroke}/>`;
        shapeExtra = reverseGroup(glyph, c);
      }
      if (type === 'LED') {
        // Two light arrows above the diode body, positioned relative to the
        // body's left edge as in Schemdraw's LED.
        const first = length / 2 - 6.3 + shiftOffset, second = first + 12.6;
        path = `M 0,0 L ${first},0 M ${first},${-9 * sy} L ${second},0 L ${first},${9 * sy} Z M ${second},${-9 * sy} L ${second},${9 * sy} M ${second},0 L ${length},0`;
        // Element._flipreverse() mirrors the light arrows about the body
        // centre together with the path; without this they stay on the left.
        shapeExtra = reverseGroup(`<path d="M ${first + 9},${-13.5 * sy} L ${first + 14.428},${-23 * sy}" ${stroke}/><path d="M ${first + 17.008},${-27.514 * sy} L ${first + 16.928},${-21.57 * sy} L ${first + 11.927},${-24.428 * sy} Z" fill="${color}"/><path d="M ${first + 0.9},${-13.5 * sy} L ${first + 6.328},${-23 * sy}" ${stroke}/><path d="M ${first + 8.908},${-27.514 * sy} L ${first + 8.828},${-21.57 * sy} L ${first + 3.827},${-24.428 * sy} Z" fill="${color}"/>`, length / 2 + shiftOffset);
      }
      if (type === 'Diac') {
        const first = length / 2 - 6.3 + shiftOffset, second = first + 12.6;
        path = `M 0,0 L ${first},0 M ${second},${-16.2 * sy} L ${second},${16.2 * sy} M ${first},${-16.2 * sy} L ${first},${16.2 * sy} M ${second},0 L ${length},0`;
        shapeExtra = reverseGroup(`<path d="M ${first},${18 * sy} L ${second},${9 * sy} L ${first},0 Z M ${second},${-18 * sy} L ${first},${-9 * sy} L ${second},0 Z" ${stroke}/>`, length / 2 + shiftOffset);
      }
      if (type === 'Fuse' || type === 'FuseIEEE') {
        const a = length / 2 - 18 + shiftOffset, b = a + 36;
        path = `M 0,0 L ${a},0 L ${a},${-9 * sy} L ${b},${-9 * sy} L ${b},${9 * sy} L ${a},${9 * sy} L ${a},0 M ${b},0 L ${length},0 M ${a},0 L ${b},0`;
      }
      if (type === 'FuseIEC') {
        const c = length / 2 + shiftOffset, a = c - 18;
        path = `M 0,0 L ${a},0 M ${a + 36},0 L ${length},0`;
        const glyph = `<path d="M ${a},0 L ${a},${-9 * sy} L ${a + 36},${-9 * sy} L ${a + 36},${9 * sy} L ${a},${9 * sy} L ${a},0 M ${c - 12.06},${-9 * sy} L ${c - 12.06},${9 * sy} M ${c + 12.06},${-9 * sy} L ${c + 12.06},${9 * sy}" ${stroke}/>`;
        shapeExtra = reverseGroup(glyph, c);
      }
      if (['Battery', 'BatteryCell', 'BatteryDouble'].includes(type)) {
        const bars = type === 'Battery' ? 4 : type === 'BatteryCell' ? 2 : 10;
        const a = length / 2 - batterySpan / 2 + shiftOffset;
        let barsPath = '';
        for (let i = 0; i < bars; i++) {
          const h = i % 2 === 0 ? 13.5 : 6.75;
          barsPath += `M ${a + i * 6.75},${-h * sy} L ${a + i * 6.75},${h * sy} `;
        }
        path = `M 0,0 L ${a},0 M ${a + batterySpan},0 L ${length},0`;
        shapeExtra = reverseGroup(`<path d="${barsPath}" ${stroke}/>`, length / 2 + shiftOffset);
      }
      let shape, fixedText = '';
      if (partDef && partDef.form === 'glyph') {
        const c = length / 2 + shiftOffset;
        const sx = 'reverse' in options ? -1 : 1;
        // fixedParts glyphs are written in default SVG coordinates (body centred
        // at x=54).
        const flags = Object.assign(Object.create(null), options);
        flags.contacts = !('contacts' in options) || options.contacts === 'True';
        flags.nc = 'nc' in options && options.nc === 'True';
        flags.link = !('link' in options) || options.link === 'True';
        const body = partDef.body(stroke, color, flags);
        // Double-pole switches draw their second pole below the terminal line in
        // screen coordinates, so they never take the y flip. The glyphs are
        // authored around x = 54 like the other fixedParts.
        const bodyFlip = sy;
        // `scale` zooms the glyph about its centre; the leads still reach the
        // element's terminals.
        const half = partDef.half * zoom;
        shape = `<g transform="translate(${c} 0) scale(${sx * zoom} ${bodyFlip * zoom}) translate(-54 0)">${body}</g>` +
          `<path d="M 0,0 L ${c - half},0 M ${c + half},0 L ${length},0" ${stroke}/>`;
        for (const t of partDef.texts || []) {
          // Keep glyph text upright like Schemdraw: place it in world coordinates
          // outside the rotated group.
          const gx = c + sx * zoom * (t.x - 54), gy = sy * zoom * t.y;
          const wx = x + dx * gx - dy * gy, wy = y + dy * gx + dx * gy;
          fixedText += `<text x="${wx}" y="${wy}" text-anchor="middle" dominant-baseline="central"${textFill} font-family="sans-serif" font-size="${labelSize}">${escapeText(t.value)}</text>`;
          bounds(wx - 14, wy - 14, wx + 14, wy + 14);
        }
      } else if (type === 'SourceI') {
        // Source circle with an internal arrow indicating current direction.
        const center = length / 2 + shiftOffset, lead = center - 18;
        const sx = 'reverse' in options ? -1 : 1;
        shape = `<circle cx="${center}" cy="0" r="18" fill="none" stroke="${color}" stroke-width="2"/><path d="M 0,0 L ${lead},0 M ${lead + 36},0 L ${length},0 M ${center - 9 * sx},0 L ${center},0" ${stroke}/><path d="M ${center + 7 * sx},0 L ${center},${2.7 * sy} L ${center},${-2.7 * sy} Z" fill="${color}"/>`;
      } else if (type === 'Zener') {
        const center = length / 2 + shiftOffset, first = center - 6.3, second = center + 6.3;
        const sx = 'reverse' in options ? -1 : 1, sy = 'flip' in options ? -1 : 1;
        const glyph = 'M -6.3,-9 L 6.3,0 L -6.3,9 Z M 6.3,-9 L 6.3,9 M 6.3,-9 L 9.9,-12.6 M 6.3,9 L 2.7,12.6';
        shape = `<path d="M 0,0 L ${first},0 M ${second},0 L ${length},0" ${stroke}/><path d="${glyph}" transform="translate(${center} 0) scale(${sx} ${sy})" ${stroke}/>`;
      } else if (isSource && (length !== defaultUnit || shiftOffset !== 0)) {
        // Sources keep their circle centred; `scale` shrinks the circle and the
        // internal marks, and the leads still reach the terminals.
        const center = length / 2 + shiftOffset, radius = 18 * zoom, lead = center - radius;
        const glyph = path.replace(/^M 0,0 L 36,0 M 72,0 L 108,0\s*/, '');
        const transform = 'reverse' in options
          ? `translate(${center + 54 * zoom} 0) scale(${-zoom} ${zoom})`
          : `translate(${center - 54 * zoom} 0) scale(${zoom})`;
        shape = `<circle cx="${center}" cy="0" r="${radius}" fill="none" stroke="${color}" stroke-width="2"/><path d="M 0,0 L ${lead},0 M ${lead + 2 * radius},0 L ${length},0" ${stroke}/>${glyph ? `<path d="${glyph}" transform="${transform}" ${stroke}/>` : ''}`;
      } else {
        // `scale` shrinks the circle itself when the source keeps its default length.
        const circle = isSource
          ? (zoom === 1
            ? `<circle cx="54" cy="0" r="18" fill="none" stroke="${color}" stroke-width="2"/>`
            : `<circle cx="54" cy="0" r="${18 * zoom}" fill="none" stroke="${color}" stroke-width="2"/>`)
          : '';
        const reflected = ('reverse' in options && !['Potentiometer', 'Rshunt', 'SCR', 'Triac', 'BjtNpn2', 'BjtPnp2', 'NMos2', 'PMos2'].includes(type))
          ? ` transform="translate(${2 * (length / 2 + shiftOffset)} 0) scale(-1 1)"` : '';
        if (type === 'Gap') shape = '';
        else if (zoom !== 1 && partDef && partDef.form === 'path') {
          // Path parts are drawn across the element's actual length. Zoom the
          // body about its centre, then redraw the leads so they still reach
          // the terminals (Schemdraw keeps the element length unchanged).
          const c = length / 2 + shiftOffset, half = (bodyLength / 2) * zoom;
          const zstroke = stroke.replace(/stroke-width="2"/g, `stroke-width="${2 / zoom}"`);
          const zcircle = circle.replace(/stroke-width="2"/g, `stroke-width="${2 / zoom}"`);
          shape = `<g transform="translate(${c} 0) scale(${zoom}) translate(${-c} 0)">${zcircle}<path d="${path}"${reflected} ${zstroke}/></g>` +
            `<path d="M 0,0 L ${c - half},0 M ${c + half},0 L ${length},0" ${stroke}/>`;
        } else if (zoom !== 1 && !['Potentiometer', 'PotentiometerIEC', 'PotentiometerIEEE'].includes(type)) {
          // Zoom the fixed 108-unit glyph about its centre, then add leads.
          // The group scale also scales stroke widths, so divide them back.
          const c = length / 2 + shiftOffset, half = 54 * zoom;
          const zstroke = stroke.replace(/stroke-width="2"/g, `stroke-width="${2 / zoom}"`);
          const zcircle = circle.replace(/stroke-width="2"/g, `stroke-width="${2 / zoom}"`);
          shape = `<g transform="translate(${c} 0) scale(${zoom}) translate(-54 0)">${zcircle}<path d="${path}"${reflected} ${zstroke}/></g>` +
            `<path d="M 0,0 L ${c - half},0 M ${c + half},0 L ${length},0" ${stroke}/>`;
        } else shape = `${circle}<path d="${path}"${reflected} ${stroke}/>`;
      }
      // Polarity marker for Capacitor(polar=True). Schemdraw appends
      // `SegmentText((-capgap*1.2, capgap), '+')` relative to the glyph origin,
      // which sits on the left plate. The element centre is capgap/2 further
      // along, so the sign sits capgap/2 + capgap*1.2 before the centre and
      // capgap above the axis (y up). capgap = 0.18.
      if (type === 'Capacitor' && options.polar === 'True') {
        const capgap = 0.18;
        const plusX = (capgap / 2 + capgap * 1.2) * 36;
        const localX = length / 2 + ('reverse' in options ? plusX : -plusX) + shiftOffset;
        const localY = -capgap * 36 * sy;
        // The text lives inside the element's rotate() group, so keep it local.
        shapeExtra += `<text x="${localX}" y="${localY}" text-anchor="middle" dominant-baseline="central"${textFill} font-family="sans-serif" font-size="${labelSize}">+</text>`;
      }
      // Core bar for Inductor(core=True): Schemdraw's extra segment at y = 0.25 unit.
      if (type === 'Inductor' && options.core === 'True') {
        const c2 = length / 2 + shiftOffset;
        shapeExtra += `<path d="M ${c2 - 18},${-9 * sy} L ${c2 + 18},${-9 * sy}" ${stroke}/>`;
      }
      // Filled body for Diode / LED (`fill=True` or a colour name).
      if ((type === 'Diode' || type === 'LED') && 'fill' in options) {
        const fillColor = options.fill === 'True' ? color : readColor(options.fill);
        const reflected = 'reverse' in options ? ' transform="translate(108 0) scale(-1 1)"' : '';
        shapeExtra += `<g${reflected}><polygon points="47.7,${-9 * sy} 60.3,0 47.7,${9 * sy}" fill="${fillColor}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/></g>`;
      }
      if (shapeExtra) shape += shapeExtra;
      if (type === 'Line' && 'arrow' in options) {
        // Schemdraw's Segment.doreverse() reverses the arrow spec and swaps
        // the heads, so `reverse` moves the arrow to the start of the line.
        const arrow = 'reverse' in options
          ? options.arrow.split('').reverse().join('').replace(/[<>]/g, c => c === '<' ? '>' : '<')
          : options.arrow;
        shape = `<path d="M ${arrow.includes('<') ? 9 : 0},0 L ${arrow.includes('>') ? length - 9 : length},0" ${stroke}/>`;
        if (arrow.includes('<')) shape += `<path d="M 2,0 L 9,2.7 L 9,-2.7 Z" fill="${color}"/>`;
        if (arrow.includes('>')) shape += `<path d="M ${length - 2},0 L ${length - 9},2.7 L ${length - 9},-2.7 Z" fill="${color}"/>`;
        if (arrow.startsWith('|')) shape += `<path d="M 0,-2.7 L 0,2.7" ${stroke}/>`;
        if (arrow.startsWith('o')) shape += `<circle cx="0" cy="0" r="2.7" fill="${color}" stroke="${color}" stroke-width="2"/>`;
        if (arrow.endsWith('o')) shape += `<circle cx="${length}" cy="0" r="2.7" fill="${color}" stroke="${color}" stroke-width="2"/>`;
        // Short lines can put arrow bases beyond the opposite terminal.
        const points = [];
        if (arrow.includes('<')) points.push([0, 0], [9, 2.7], [9, -2.7]);
        if (arrow.includes('>')) points.push([length, 0], [length - 9, 2.7], [length - 9, -2.7]);
        if (arrow.startsWith('|')) points.push([0, -2.7], [0, 2.7]);
        if (arrow.startsWith('o')) points.push([-2.7, -2.7], [2.7, 2.7], [-2.7, 2.7], [2.7, -2.7]);
        if (arrow.endsWith('o')) points.push([length - 3.7, -3.7], [length + 3.7, 3.7], [length - 3.7, 3.7], [length + 3.7, -3.7]);
        for (const [px, py] of points) {
          const bx = x + dx * px - dy * py, by = y + dy * px + dx * py;
          bounds(bx - 2, by - 2, bx + 2, by + 2);
        }
      }
      if (shape) elements.push(`<g transform="translate(${x} ${y}) rotate(${angle})">${shape}</g>`);
      if (fixedText) elements.push(fixedText);
      bounds(x - 12, y - 12, endX + 12, endY + 12);
      bounds(x + 12, y + 12, endX - 12, endY - 12);
      if (shiftOffset !== 0 || type === 'Zener') {
        const halfHeight = type === 'Zener' ? 14 : isSource ? 19 : type === 'Inductor' ? 6 : type === 'Line' || type === 'Gap' ? 2 : 10;
        const halfWidth = type === 'Zener' ? 11 : bodyLength / 2;
        for (const localX of [length / 2 + shiftOffset - halfWidth, length / 2 + shiftOffset + halfWidth]) {
          for (const localY of [-halfHeight, halfHeight]) {
            const bx = x + dx * localX - dy * localY, by = y + dy * localX + dx * localY;
            bounds(bx, by, bx, by);
          }
        }
      }
      if (['Potentiometer', 'Rshunt', 'SCR', 'Triac', 'LED', 'Diac', 'Fuse', 'Battery', 'BatteryCell', 'BatteryDouble'].includes(type)) {
        const c = length / 2 + shiftOffset;
        const first = c - 6.3, a = c - batterySpan / 2;
        let lx1, lx2, ly1, ly2;
        if (type === 'Potentiometer') {
          lx1 = c - 20; lx2 = c + 20;
          if (sy === 1) { ly1 = -tapH - 4; ly2 = 12; } else { ly1 = -12; ly2 = tapH + 4; }
        } else if (type === 'Rshunt') {
          lx1 = c - 35; lx2 = c + 35;
          ly1 = sy === 1 ? -12 : -20; ly2 = sy === 1 ? 20 : 12;
        } else if (type === 'SCR') {
          lx1 = c - 9; lx2 = c + 21;
          ly1 = sy === 1 ? -12 : -20; ly2 = sy === 1 ? 20 : 12;
        } else if (type === 'Triac') {
          lx1 = c - 9; lx2 = c + 28; ly1 = -20; ly2 = 20;
        } else if (type === 'LED') {
          lx1 = first - 3; lx2 = first + 20;
          ly1 = sy === 1 ? -30 : -12; ly2 = sy === 1 ? 12 : 30;
        } else if (type === 'Diac') {
          lx1 = first - 3; lx2 = first + 16; ly1 = -20; ly2 = 20;
        } else if (type === 'Fuse') {
          lx1 = c - 20; lx2 = c + 20; ly1 = -11; ly2 = 11;
        } else {
          lx1 = a - 3; lx2 = a + batterySpan + 3; ly1 = -16; ly2 = 16;
        }
        if ('reverse' in options) { [lx1, lx2] = [2 * c - lx2, 2 * c - lx1]; }
        for (const [lx, ly] of [[lx1, ly1], [lx1, ly2], [lx2, ly1], [lx2, ly2]]) {
          const bx = x + dx * lx - dy * ly, by = y + dy * lx + dx * ly;
          bounds(bx, by, bx, by);
        }
      }
      if (['BjtNpn2', 'BjtPnp2', 'BjtPnp2c2'].includes(type)) {
        const c = length / 2 + shiftOffset;
        const ly1 = sy === 1 ? -34 : 0, ly2 = sy === 1 ? 4 : 34;
        for (const [lx, ly] of [[c - 22, ly1], [c - 22, ly2], [c + 22, ly1], [c + 22, ly2]]) {
          const bx = x + dx * lx - dy * ly, by = y + dy * lx + dx * ly;
          bounds(bx, by, bx, by);
        }
      }
      if (['JFetN2', 'JFetP2'].includes(type)) {
        const c = length / 2 + shiftOffset;
        const ly1 = sy === 1 ? -36 : 2, ly2 = sy === 1 ? 2 : 36;
        for (const [lx, ly] of [[c - 30, ly1], [c - 30, ly2], [c + 30, ly1], [c + 30, ly2]]) {
          const bx = x + dx * lx - dy * ly, by = y + dy * lx + dx * ly;
          bounds(bx, by, bx, by);
        }
      }
      if (['CurrentMirror', 'VoltageMirror'].includes(type)) {
        const c = length / 2 + shiftOffset;
        for (const [lx, ly] of [[c - 20, -20], [c - 20, 20], [c + 20, -20], [c + 20, 20]]) {
          const bx = x + dx * lx - dy * ly, by = y + dy * lx + dx * ly;
          bounds(bx, by, bx, by);
        }
      }
      if (type === 'Breaker') {
        const c = length / 2 + shiftOffset;
        const ly1 = sy === 1 ? -16 : 2, ly2 = sy === 1 ? 2 : 16;
        for (const [lx, ly] of [[c - 20, ly1], [c - 20, ly2], [c + 20, ly1], [c + 20, ly2]]) {
          const bx = x + dx * lx - dy * ly, by = y + dy * lx + dx * ly;
          bounds(bx, by, bx, by);
        }
      }
      if (['CPE', 'Nullator', 'Norator'].includes(type)) {
        const c = length / 2 + shiftOffset;
        for (const [lx, ly] of [[c - 20, -12], [c - 20, 12], [c + 20, -12], [c + 20, 12]]) {
          const bx = x + dx * lx - dy * ly, by = y + dy * lx + dx * ly;
          bounds(bx, by, bx, by);
        }
      }
      if (['ResistorVar', 'ResistorVarIEC', 'ResistorVarIEEE'].includes(type)) {
        const c = length / 2 + shiftOffset;
        for (const [lx, ly] of [[c - 20, -24], [c - 20, 24], [c + 20, -24], [c + 20, 24]]) {
          const bx = x + dx * lx - dy * ly, by = y + dy * lx + dx * ly;
          bounds(bx, by, bx, by);
        }
      }
      if (['Potentiometer', 'PotentiometerIEC', 'PotentiometerIEEE'].includes(type)) {
        const c = length / 2 + shiftOffset;
        for (const [lx, ly] of [[c - 20, -30], [c - 20, 20], [c + 20, -30], [c + 20, 20]]) {
          const bx = x + dx * lx - dy * ly, by = y + dy * lx + dx * ly;
          bounds(bx, by, bx, by);
        }
      }
      if (type === 'Capacitor2') {
        const c = length / 2 + shiftOffset;
        for (const [lx, ly] of [[c - 16, -26], [c - 16, 26], [c + 16, -26], [c + 16, 26]]) {
          const bx = x + dx * lx - dy * ly, by = y + dy * lx + dx * ly;
          bounds(bx, by, bx, by);
        }
      }
      if (['DiodeTVS', 'Josephson'].includes(type)) {
        const c = length / 2 + shiftOffset;
        for (const [lx, ly] of [[c - 18, -14], [c - 18, 14], [c + 18, -14], [c + 18, 14]]) {
          const bx = x + dx * lx - dy * ly, by = y + dy * lx + dx * ly;
          bounds(bx, by, bx, by);
        }
      }
      if (['Photoresistor', 'PhotoresistorBox', 'PhotoresistorIEC', 'PhotoresistorIEEE'].includes(type)) {
        const c = length / 2 + shiftOffset;
        for (const [lx, ly] of [[c - 20, -32], [c - 20, 12], [c + 20, -32], [c + 20, 12]]) {
          const bx = x + dx * lx - dy * ly, by = y + dy * lx + dx * ly;
          bounds(bx, by, bx, by);
        }
      }
      if (type === 'Coax' || type === 'Triax') {
        const c = length / 2 + shiftOffset;
        const h = type === 'Coax' ? coaxRadius + 10 : 30;
        for (const [lx, ly] of [[c - 60, -h], [c - 60, h], [c + 60, -h], [c + 60, h]]) {
          const bx = x + dx * lx - dy * ly, by = y + dy * lx + dx * ly;
          bounds(bx, by, bx, by);
        }
      }
      if (type === 'Motor') {
        const c = length / 2 + shiftOffset;
        for (const [lx, ly] of [[c - 30, -22], [c - 30, 22], [c + 30, -22], [c + 30, 22]]) {
          const bx = x + dx * lx - dy * ly, by = y + dy * lx + dx * ly;
          bounds(bx, by, bx, by);
        }
      }
      if (['NMos2', 'PMos2'].includes(type)) {
        const c = length / 2 + shiftOffset;
        const ly1 = sy === 1 ? -2 : -34, ly2 = sy === 1 ? 34 : 2;
        for (const [lx, ly] of [[c - 33, ly1], [c - 33, ly2], [c + 33, ly1], [c + 33, ly2]]) {
          const bx = x + dx * lx - dy * ly, by = y + dy * lx + dx * ly;
          bounds(bx, by, bx, by);
        }
      }
      if (['NFet2', 'PFet2'].includes(type)) {
        const c = length / 2 + shiftOffset;
        const ly1 = sy === 1 ? -52 : 2, ly2 = sy === 1 ? 2 : 52;
        for (const [lx, ly] of [[c - 30, ly1], [c - 30, ly2], [c + 30, ly1], [c + 30, ly2]]) {
          const bx = x + dx * lx - dy * ly, by = y + dy * lx + dx * ly;
          bounds(bx, by, bx, by);
        }
      }
      if (partDef && partDef.form === 'glyph') {
        const c = length / 2 + shiftOffset, [ex1, ex2, ey1, ey2] = partDef.extent;
        for (const [lx, ly] of [[c + zoom * (ex1 - 54), ey1 * sy * zoom], [c + zoom * (ex1 - 54), ey2 * sy * zoom], [c + zoom * (ex2 - 54), ey1 * sy * zoom], [c + zoom * (ex2 - 54), ey2 * sy * zoom]]) {
          const bx = x + dx * lx - dy * ly, by = y + dy * lx + dx * ly;
          bounds(bx, by, bx, by);
        }
      }
      if (arbitraryAngle) bounds(centerX - 20, centerY - 20, centerX + 20, centerY + 20);
      if (isSource) bounds(bodyCenterX - 20, bodyCenterY - 20, bodyCenterX + 20, bodyCenterY + 20);
      // dot / idot draw at the element ends; "open" leaves the circle hollow.
      // Schemdraw's Element2Term uses dotradius 0.075 (2.7 px); the element
      // transform scales it with `scale`.
      const dotRadius = 2.7 * zoom;
      for (const [key, px, py] of [['idot', x, y], ['dot', endX, endY]]) {
        if (!(key in options)) continue;
        if (options[key] === 'open') {
          whiteMarker(px, py, dotRadius, color);
        } else elements.push(`<circle cx="${px}" cy="${py}" r="${dotRadius}" fill="${color}" stroke="${color}" stroke-width="2"/>`);
      }
      for (const label of labels) {
        if (label.items) {
          // Schemdraw's _place_label list branch: items are spread evenly along
          // one bbox edge (top/bottom: along x, left/right: along y, center:
          // along x at the middle). Alignment comes from _align_label.
          const extents = sideExtent(type, options);
          // dot()/idot() add a filled circle (Schemdraw's dotradius, 0.075
          // unit) to the bbox; it only widens elements thinner than the dot.
          const dotPad = ('dot' in options || 'idot' in options) ? 2.7 : 0;
          const above = Math.max('flip' in options ? extents[1] : extents[0], dotPad);
          const below = Math.max('flip' in options ? extents[0] : extents[1], dotPad);
          const dotR = 2.7;
          const bx1 = ('idot' in options ? -dotR : 0);
          const bx2 = length + ('dot' in options ? dotR : 0);
          const thetaDeg = arbitraryAngle ? direction : ({ right: 0, up: 90, left: 180, down: 270 })[direction];
          // Element._place_label() mirrors explicit alignment and an (x y)
          // offset when the element is flipped or reversed.
          const hinted = reflectLabelHints(label, options);
          let listLoc = hinted.loc || (type === 'Gap' ? 'center' : 'top');
          if (listLoc === 'bot') listLoc = 'bottom';
          if (thetaDeg > 90 && thetaDeg <= 270) {
            listLoc = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[listLoc] || listLoc;
          }
          let ox = 0, oy = 0;
          const ofst = hinted.ofst == null ? (type === 'Gap' ? 0 : 0.1) : hinted.ofst;
          if (Array.isArray(ofst)) { ox = ofst[0] * 36; oy = ofst[1] * 36; }
          else {
            const o = ofst * 36;
            if (listLoc === 'top') oy = o;
            else if (listLoc === 'bottom') oy = -o;
            else if (listLoc === 'left') ox = -o;
            else if (listLoc === 'right') ox = o;
            else oy = o;
          }
          if (listLoc === 'top' || listLoc === 'bottom') ox += shiftOffset;
          const th = ((thetaDeg + (listLoc === 'left' ? 90 : listLoc === 'bottom' ? 180 : listLoc === 'right' ? 270 : 0)) % 360 + 360) % 360;
          const rotalign = listLoc === 'center' ? ['center', 'center'] : [
            ['center', 'bottom'], ['right', 'bottom'], ['right', 'center'], ['right', 'top'],
            ['center', 'top'], ['left', 'top'], ['left', 'center'], ['left', 'bottom']
          ][Math.round(th / 45) % 8];
          const halign = hinted.halign || rotalign[0];
          const valign = hinted.valign || rotalign[1];
          const anchor = { left: 'start', center: 'middle', right: 'end' }[halign];
          const baseline = valign === 'center' ? 'central' : valign === 'top' ? 'hanging' : 'ideographic';
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          const items = label.items;
          const n = items.length;
          items.forEach((text, i) => {
            let px, py;
            if (listLoc === 'top' || listLoc === 'bottom' || listLoc === 'center') {
              px = bx1 + (bx2 - bx1) / (n + 1) * (i + 1);
              py = listLoc === 'top' ? above : listLoc === 'bottom' ? -below : (above - below) / 2;
            } else {
              px = listLoc === 'left' ? bx1 : bx2;
              py = -below + (above + below) / (n + 1) * (i + 1);
            }
            const localX = px + ox, localY = -(py + oy);
            const wx = x + dx * localX - dy * localY;
            const wy = y + dy * localX + dx * localY;
            const lines = String(text).split('\n');
            const yAttr = valign === 'center' ? wy - (lines.length + 1) / 2 * size
              : valign === 'top' ? wy - size
                : wy - lines.length * size;
            const spans = lines.map(line => `<tspan x="${wx}" dy="${size}">${labelContent(line)}</tspan>`).join('');
            const visible = text.startsWith('$') && text.endsWith('$') ? text.replace(/[$_{}]/g, '') : text;
            const width = Math.max(12, Array.from(visible).length * size * 0.71);
            bounds(wx - width, yAttr - size, wx + width, yAttr + (lines.length + 1) * size);
            elements.push(`<text x="${wx}" y="${yAttr}" text-anchor="${anchor}" dominant-baseline="${baseline}"${label.color ? ` fill="${label.color}"` : textFill} font-family="sans-serif" font-size="${size}">${spans}</text>`);
          });
          continue;
        }
        if (label.loc === 'istart' || label.loc === 'iend') {
          // Schemdraw's Source anchors istart/iend mark the ends of the 1-unit
          // body. The label sits at that anchor + ofst (local coordinates,
          // y up); reverse mirrors the ofst x.
          if (type !== 'MeterArrow') throw new Error(`${type} does not support ${label.loc} labels.`);
          const bc = length / 2 + shiftOffset;
          const base = bc + (label.loc === 'iend' ? 18 : -18);
          let ox = 0, oy = 0;
          if (Array.isArray(label.ofst)) { ox = label.ofst[0]; oy = label.ofst[1]; }
          else if (label.ofst != null) oy = label.ofst;
          if ('reverse' in options) ox = -ox;
          const localX = base + ox * 36, localY = -oy * 36;
          const lx = x + dx * localX - dy * localY, ly = y + dy * localX + dx * localY;
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          const width = Math.max(size, Array.from(label.text).length * size * 0.71);
          bounds(lx - width, ly - size, lx + width, ly + size);
          elements.push(`<text x="${lx}" y="${ly - size}" dominant-baseline="central" text-anchor="middle"${label.color ? ` fill="${label.color}"` : textFill} font-family="sans-serif" font-size="${size}"><tspan x="${lx}" dy="${size}">${labelContent(label.text)}</tspan></text>`);
          continue;
        }
        if (type === 'Resistor' && (!label.loc || label.loc === 'top') && label.rotate !== undefined) {
          const theta = arbitraryAngle ? direction : ({ right: 0, up: 90, left: 180, down: -90 })[direction];
          const norm = ((theta % 360) + 360) % 360;
          const flipped = norm > 90 && norm <= 270;
          const locSign = flipped ? -1 : 1;
          const ofst = label.ofst == null ? 0.1 : label.ofst;
          let ox = 0, oy = 0;
          if (Array.isArray(ofst)) { ox = ofst[0] * 36; oy = -ofst[1] * 36; }
          else oy = -locSign * ofst * 36;
          const localX = length / 2 + shiftOffset + ox, localY = -locSign * 9 + oy;
          const lx = x + dx * localX - dy * localY, ly = y + dy * localX + dx * localY;
          if (!Number.isFinite(lx) || !Number.isFinite(ly)) throw new Error('label position is too large.');
          let rotation = label.rotate === true ? norm : typeof label.rotate === 'number' ? ((label.rotate % 360) + 360) % 360 : 0;
          if (label.rotate === true && rotation > 90 && rotation < 270) rotation -= 180;
          const relative = ((theta - rotation + (flipped ? 180 : 0)) % 360 + 360) % 360;
          const alignment = [ ['middle','ideographic'], ['end','ideographic'], ['end','central'], ['end','hanging'], ['middle','hanging'], ['start','hanging'], ['start','central'], ['start','ideographic'] ][Math.round(relative / 45) % 8];
          const [anchor, baseline] = alignment;
          const visible = label.text.startsWith('$') && label.text.endsWith('$') ? label.text.replace(/[$_{}]/g, '') : label.text;
          const width = Math.max(12, Array.from(visible).length * 10);
          const extent = rotation ? width + 18 : Math.max(width, 18);
          bounds(lx - extent, ly - extent, lx + extent, ly + extent);
          const transform = rotation ? ` transform="rotate(${-rotation} ${lx} ${ly})"` : '';
          elements.push(`<text x="${lx}" y="${ly - labelSize}" text-anchor="${anchor}" dominant-baseline="${baseline}"${transform}${textFill} font-family="sans-serif" font-size="${labelSize}"><tspan x="${lx}" dy="${labelSize}">${labelContent(label.text)}</tspan></text>`);
          continue;
        }
        if (type === 'Line' && label.loc === 'right' && dx === 1 && dy === 0) {
          const lx = endX + 3.6, ly = endY;
          const visible = label.text.startsWith('$') && label.text.endsWith('$') ? label.text.replace(/[$_{}]/g, '') : label.text;
          const width = Math.max(12, Array.from(visible).length * 10);
          bounds(lx, ly - 12, lx + width, ly + 12);
          elements.push(`<text x="${lx}" y="${ly - labelSize}" text-anchor="start" dominant-baseline="central"${textFill} font-family="sans-serif" font-size="${labelSize}"><tspan x="${lx}" dy="${labelSize}">${labelContent(label.text)}</tspan></text>`);
          continue;
        }
        if ((Object.prototype.hasOwnProperty.call(twoTerminalParts, type) || ['Gap', 'Potentiometer', 'PotentiometerIEC', 'PotentiometerIEEE', 'Rshunt', 'SCR', 'Triac',
          'Zener', 'LED', 'Diac', 'Fuse', 'FuseIEC', 'FuseIEEE', 'Battery', 'BatteryCell', 'BatteryDouble', 'SourceI', 'Breaker', 'Motor',
          'BjtNpn2', 'BjtPnp2', 'BjtPnp2c2', 'NMos2', 'PMos2', 'NFet2', 'PFet2', 'JFetN2', 'JFetP2'].includes(type)) && !label.items && label.rotate === undefined) {
          // Schemdraw's Element.label/_place_label for a single label:
          // the anchor is a point on the element's local bbox, `ofst` is added
          // in local coordinates, and the text alignment comes from the
          // rotated `rotalign` table. Text is then drawn upright at the
          // transformed point (rotation_global defaults to True).
          const extents = sideExtent(type, options);
          // dot()/idot() add a filled circle (Schemdraw's dotradius, 0.075
          // unit) to the bbox; it only widens elements thinner than the dot.
          const dotPad = ('dot' in options || 'idot' in options) ? 2.7 : 0;
          const above = Math.max('flip' in options ? extents[1] : extents[0], dotPad);
          const below = Math.max('flip' in options ? extents[0] : extents[1], dotPad);
          const dotR = 2.7;
          const bx1 = ('idot' in options ? -dotR : 0);
          const bx2 = length + ('dot' in options ? dotR : 0);
          const thetaDeg = arbitraryAngle ? direction : ({ right: 0, up: 90, left: 180, down: 270 })[direction];
          // Element._place_label() mirrors explicit alignment and an (x y)
          // offset when the element is flipped or reversed.
          const hinted = reflectLabelHints(label, options);
          const bottomDefault = ['Potentiometer', 'PotentiometerIEC', 'PotentiometerIEEE', 'LED', 'LED2', 'Photodiode',
            'BjtNpn2', 'BjtPnp2', 'BjtPnp2c2', 'NMos2', 'PMos2', 'NFet2', 'PFet2', 'JFetN2', 'JFetP2'].includes(type);
          let labelLoc = hinted.loc || (bottomDefault ? 'bottom' : type === 'Gap' ? 'center' : 'top');
          if (labelLoc === 'bot') labelLoc = 'bottom';
          if (thetaDeg > 90 && thetaDeg <= 270) {
            labelLoc = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[labelLoc] || labelLoc;
          }
          let ax, ay;
          if (labelLoc === 'top') { ax = (bx1 + bx2) / 2; ay = above; }
          else if (labelLoc === 'bottom') { ax = (bx1 + bx2) / 2; ay = -below; }
          else if (labelLoc === 'left') { ax = bx1; ay = (above - below) / 2; }
          else if (labelLoc === 'right') { ax = bx2; ay = (above - below) / 2; }
          else if (labelLoc === 'center') { ax = (bx1 + bx2) / 2; ay = (above - below) / 2; }
          else throw new Error(`Unsupported ${type} label loc: ${labelLoc}`);
          let ox = 0, oy = 0;
          const ofst = hinted.ofst == null ? (type === 'Gap' ? 0 : 0.1) : hinted.ofst;
          if (Array.isArray(ofst)) { ox = ofst[0] * 36; oy = ofst[1] * 36; }
          else {
            const o = ofst * 36;
            if (labelLoc === 'top') oy = o;
            else if (labelLoc === 'bottom') oy = -o;
            else if (labelLoc === 'left') ox = -o;
            else if (labelLoc === 'right') ox = o;
            else oy = o;
          }
          // Schemdraw adds the element's shift to the along-axis offset for
          // top/bottom labels (params['_shift_magnitude']).
          if (labelLoc === 'top' || labelLoc === 'bottom') ox += shiftOffset;
          const th = ((thetaDeg + (labelLoc === 'left' ? 90 : labelLoc === 'bottom' ? 180 : labelLoc === 'right' ? 270 : 0)) % 360 + 360) % 360;
          const rotalign = labelLoc === 'center' ? ['center', 'center'] : [
            ['center', 'bottom'], ['right', 'bottom'], ['right', 'center'], ['right', 'top'],
            ['center', 'top'], ['left', 'top'], ['left', 'center'], ['left', 'bottom']
          ][Math.round(th / 45) % 8];
          const halign = hinted.halign || rotalign[0];
          const valign = hinted.valign || rotalign[1];
          const localX = ax + ox, localY = -(ay + oy);
          const wx = x + dx * localX - dy * localY;
          const wy = y + dy * localX + dx * localY;
          const lines = String(label.text).split('\n');
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          const anchor = { left: 'start', center: 'middle', right: 'end' }[halign];
          const baseline = valign === 'center' ? 'central' : valign === 'top' ? 'hanging' : 'ideographic';
          const yAttr = valign === 'center' ? wy - (lines.length + 1) / 2 * size
            : valign === 'top' ? wy - size
              : wy - lines.length * size;
          const spans = lines.map(line => `<tspan x="${wx}" dy="${size}">${labelContent(line)}</tspan>`).join('');
          const visible = label.text.startsWith('$') && label.text.endsWith('$') ? label.text.replace(/[$_{}]/g, '') : label.text;
          const textW = Math.max(12, Array.from(visible).length * size * 0.71);
          bounds(wx - (anchor === 'start' ? 0 : anchor === 'end' ? textW : textW / 2), yAttr,
            wx + (anchor === 'end' ? 0 : anchor === 'start' ? textW : textW / 2), yAttr + (lines.length + 1) * size);
          elements.push(`<text x="${wx}" y="${yAttr}" text-anchor="${anchor}" dominant-baseline="${baseline}"${textFill} font-family="sans-serif" font-size="${size}">${spans}</text>`);
          continue;
        }
        let loc = label.loc || (['BjtNpn2', 'BjtPnp2', 'BjtPnp2c2', 'NMos2', 'PMos2', 'NFet2', 'PFet2', 'JFetN2', 'JFetP2'].includes(type)
          ? (arbitraryAngle ? 'top' : dy ? 'left' : ('flip' in options ? 'top' : 'bottom'))
          : ((['Potentiometer', 'PotentiometerIEC', 'PotentiometerIEEE', 'LED', 'LED2', 'Photodiode'].includes(type)) && !dy) ? 'bottom' : arbitraryAngle ? 'top' : dy ? 'left' : 'top');
        // The defaults above are spelled `bottom`; the 2-terminal placement
        // below uses `bot` for the side checks, so fold once here.
        if (loc === 'bottom') loc = 'bot';
        // Schemdraw keeps `top`/`bottom` on the same visual side: for an element
        // pointing up or down they are the long sides, not above/below.
        const verticalSide = Math.abs(dy) > Math.abs(dx);
        const origLoc = loc;
        if (verticalSide) {
          if (loc === 'top') loc = 'left';
          else if (loc === 'bot') loc = 'right';
        }
        // `rotate=True` turns the label with the element (schemdraw keeps it
        // upright by mirroring angles in the lower half).
        let rotation = 0;
        if (label.rotate === true) {
          const labelTheta = arbitraryAngle ? direction : ({ right: 0, up: 90, left: 180, down: -90 })[direction];
          rotation = ((labelTheta % 360) + 360) % 360;
          if (rotation > 90 && rotation < 270) rotation -= 180;
        } else if (typeof label.rotate === 'number') rotation = ((label.rotate % 360) + 360) % 360;
        const rotated = rotation !== 0;
        let lx = bodyCenterX, ly = bodyCenterY, anchor = 'middle';
        if (loc === 'top') {
          const offset = isSource ? 29 : ['NMos2', 'PMos2'].includes(type) ? 40 : 19;
          if (arbitraryAngle) {
            const angledOffset = isSource ? 22 : ['NMos2', 'PMos2'].includes(type) ? 30 : 12.6;
            lx += dy * angledOffset; ly -= dx * angledOffset;
          }
          else ly -= offset;
        }
        if (loc === 'bot') {
          if (arbitraryAngle) { lx -= dy * 19; ly += dx * 19 + 5; }
          else ly += ['NMos2', 'PMos2'].includes(type) ? 40 : 24;
        }
        // A rotated label is centred on its anchor; the side nudges below only
        // apply to horizontal text.
        // A source's side label clears its circle: schemdraw uses radius * 1.2.
        // For vertical elements the label anchor is the element bbox edge plus
        // the schematic label offset (lblofst = 0.1 unit), like _place_label.
        const extents = sideExtent(type, options);
        const dotPad = ('dot' in options || 'idot' in options) ? 2.7 : 0;
        const extAbove = Math.max('flip' in options ? extents[1] : extents[0], dotPad);
        const extBelow = Math.max('flip' in options ? extents[0] : extents[1], dotPad);
        const sideGap = dy
          ? (verticalSide ? (origLoc === 'bot' ? extBelow : extAbove) + 3.6 : (isSource ? 18 * zoom * 1.2 : 13))
          : 6;
        if (loc === 'left') { lx = Math.min(x, endX) - sideGap; ly += rotated || isSource || verticalSide ? 0 : 5; anchor = rotated ? 'middle' : 'end'; }
        if (loc === 'right') { lx = Math.max(x, endX) + sideGap; ly += rotated || isSource || verticalSide ? 0 : 5; anchor = rotated ? 'middle' : 'start'; }
        let vLines = null;
        if (verticalSide && !arbitraryAngle && !rotated) {
          // Schemdraw's SegmentText uses valign 'center' for side labels:
          // text y = anchor - (lines+1)/2·size with one tspan dy=size per line.
          vLines = label.text.split('\n');
        }
        // `ofst` is in element coordinates: x along the element, y perpendicular
        // (positive is the element's "up"). A single number moves away from the
        // side chosen by `loc`, as in schemdraw.
        if (label.ofst != null) {
          if (Array.isArray(label.ofst)) {
            const [ox, oy] = label.ofst;
            lx += (dx * ox + dy * oy) * 36;
            ly += (dy * ox - dx * oy) * 36;
          } else {
            const o = label.ofst * 36;
            if (loc === 'top') ly -= o;
            else if (loc === 'bot') ly += o;
            else if (loc === 'left') lx -= o;
            else if (loc === 'right') lx += o;
          }
        }
        if (rotated) {
          // A rotated label is centred on its anchor, so push it out by half
          // the text height to keep the glyphs clear of the element body.
          const half = labelSize * 0.5;
          const ox = lx - bodyCenterX, oy = ly - bodyCenterY;
          const len = Math.hypot(ox, oy);
          if (len > 0) { lx += ox / len * half; ly += oy / len * half; }
        }
        if (label.halign) anchor = { left: 'start', center: 'middle', right: 'end' }[label.halign];
        if (label.valign) {
          // The text baseline is set below; `bottom` is the SVG default.
        }
        const visible = label.text.startsWith('$') && label.text.endsWith('$') ? label.text.replace(/[$_{}]/g, '') : label.text;
        const width = Math.max(12, Array.from(visible).length * 10);
        bounds(lx - (anchor === 'start' ? 0 : anchor === 'end' ? width : width / 2), ly - 18,
          lx + (anchor === 'end' ? 0 : anchor === 'start' ? width : width / 2), ly + 8);
        const baseline = label.valign === 'top' ? ' dominant-baseline="hanging"'
          : label.valign === 'center' ? ' dominant-baseline="central"'
            : label.valign === 'bottom' ? ''
              : rotated || (isSource && (loc === 'left' || loc === 'right')) ? ' dominant-baseline="central"'
                : arbitraryAngle && loc === 'top' ? ' dominant-baseline="ideographic"' : '';
        const transform = rotation ? ` transform="rotate(${-rotation} ${lx} ${ly})"` : '';
        if (vLines) {
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          const yAttr = ly - (vLines.length + 1) / 2 * size;
          const spans = vLines.map(line => `<tspan x="${lx}" dy="${size}">${labelContent(line)}</tspan>`).join('');
          bounds(lx - width, yAttr, lx + width, yAttr + (vLines.length + 1) * size);
          elements.push(`<text x="${lx}" y="${yAttr}" text-anchor="${anchor}" dominant-baseline="central"${textFill} font-family="sans-serif" font-size="${size}">${spans}</text>`);
        } else {
          elements.push(`<text x="${lx}" y="${ly}" text-anchor="${anchor}"${baseline}${transform}${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(label.text)}</text>`);
        }
      }
      // Redraw white contact dots above all leads. Schemdraw draws these
      // circles with a higher zorder, so later wires do not show through.
      const switchContacts = !('contacts' in options) || options.contacts === 'True';
      const markerWorld = (lx, ly) => [x + dx * lx - dy * ly, y + dy * lx + dx * ly];
      const contactPoints = [];
      if (type === 'Switch' && switchContacts) {
        const c = length / 2 + shiftOffset;
        contactPoints.push([c - 13.68, 0], [c + 13.68, 0]);
      }
      if (type === 'SwitchSpdt') {
        const pts = twoTerminalLocalAnchors(type, length, shiftOffset, sy, options);
        // With contacts=False Schemdraw draws no contact circles at all, so the
        // a/b dots must be gated with the rest.
        if (switchContacts) contactPoints.push(pts.a, pts.b, pts.c);
      }
      if (type === 'SwitchDpst' || type === 'SwitchDpdt') {
        if (switchContacts) {
          const pts = twoTerminalLocalAnchors(type, length, shiftOffset, sy, options);
          for (const key of ['p1', 'p2', 't1', 't2', 't3', 't4']) if (pts[key]) contactPoints.push(pts[key]);
        }
      }
      if (type === 'FuseUS') contactPoints.push([33.84, 0], [74.16, 0]);
      // Several parts list the same contact through two anchor names (p2/t2,
      // or a second bank that shares a point); emit each marker once.
      const drawnContacts = new Set();
      for (const [contactX, contactY] of contactPoints) {
        const key = `${contactX.toFixed(3)},${contactY.toFixed(3)}`;
        if (drawnContacts.has(key)) continue;
        drawnContacts.add(key);
        const [wx, wy] = markerWorld(contactX, contactY);
        whiteMarker(wx, wy, 4.32, color);
      }
      if (name) {
        const anchors = { start: [startX, startY], end: [endX, endY], center: [centerX, centerY] };
        const local = (lx, ly) => [x + dx * lx - dy * ly, y + dy * lx + dx * ly];
        // Extra terminals come from twoTerminalLocalAnchors(), the same table
        // that drives `anchor=` placement and the contact dots, so a named
        // block cannot expose a terminal at a different point than the one the
        // renderer uses internally. start/end/center are already world points.
        const localAnchors = twoTerminalLocalAnchors(type, length, shiftOffset, sy, options, {
          tapH, zoom, batterySpan, coaxRadius, coaxLead,
          triaxLead, triaxR1, triaxR2, triaxOfsStart, triaxOfsEnd, bulk
        });
        for (const [key, [lx, ly]] of Object.entries(localAnchors)) {
          if (key === 'start' || key === 'end' || key === 'center') continue;
          anchors[key] = local(lx, ly);
        }
        names[name] = anchors;
        namedTypes[name] = type;
        namedDirs[name] = [dx, dy];
        namedBoxes[name] = { ...elemBox };
        namedReversed[name] = 'reverse' in options;
      }
      log(`${type}: ${arbitraryAngle ? 'theta=' + direction : direction}${labels.length ? ', labels: ' + labels.map(l => l.items ? l.items.join(', ') : l.text).join(', ') : ''}`);
      x = endX; y = endY;
      // Element.hold() keeps this element's placement point, but retains its
      // resulting drawing direction; unlike a hold block it is not a state pop.
      if ('hold' in options) { x = placementX; y = placementY; }
    }
    if (overlay.length) elements.push(...overlay);
    return { elements, names, namedBoxes, blockAnchors, x, y, direction, minX, minY, maxX, maxY, labelSize, unit, inchesPerUnit };
  }

  // Split only on braces outside quoted arguments and comment lines. In
  // particular, braces in math labels such as "$R_{in}$" are not block braces.
  function splitDocument(source) {
    if (typeof source !== 'string') throw new TypeError('source must be a string.');
    const circuits = [], subs = Object.create(null);
    let lines = null, depth = 0, layout = null, titles = null, scale = null, subName = null, subParams = [];
    for (const raw of source.split(/\r?\n/)) {
      const content = stripInlineComment(raw);
      const line = content.trim();
      if (!line) {
        if (lines) lines.push(content);
        continue;
      }
      if (depth === 0) {
        if (line.startsWith('@')) {
          const subdirective = /^@subcircuit\s+([A-Za-z_]\w*)\s*(?:\(([^)]*)\))?\s*\{$/.exec(line);
          if (subdirective) {
            if (Object.prototype.hasOwnProperty.call(subs, subdirective[1])) throw new Error(`Duplicate subcircuit: ${subdirective[1]}`);
            const params = (subdirective[2] || '').split(/[\s,]+/).filter(Boolean);
            for (const param of params) {
              if (!/^[A-Za-z_]\w*$/.test(param)) throw new Error(`Invalid subcircuit parameter: ${param}`);
              if (params.indexOf(param) !== params.lastIndexOf(param)) throw new Error(`Duplicate subcircuit parameter: ${param}`);
            }
            subName = subdirective[1];
            subParams = params;
            lines = ['circuit {'];
            depth = 1;
            continue;
          }
          if (/^@title(?:\s|$)/.test(line)) {
            if (titles !== null) throw new Error('@title may only be specified once.');
            titles = [];
            let rest = line.slice(6).trim();
            while (rest) {
              const match = /^"((?:[^"\\]|\\["\\])*)"(?:\s+|$)/.exec(rest);
              if (!match) throw new Error('@title values must be double-quoted strings separated by whitespace.');
              titles.push(match[1].replace(/\\(["\\])/g, '$1'));
              rest = rest.slice(match[0].length).trim();
            }
            if (!titles.length) throw new Error('@title requires at least one title.');
            continue;
          }
          if (/^@scale(?:\s|$)/.test(line)) {
            if (scale !== null) throw new Error('@scale may only be specified once.');
            const rest = line.slice(6).trim();
            if (!rest) throw new Error('Invalid @scale syntax: expected one scale factor.');
            const match = /^(\S+)(?:\s+|$)/.exec(rest);
            const value = match[1];
            const remaining = rest.slice(match[0].length).trim();
            if (remaining) throw new Error('Invalid @scale syntax: expected one scale factor.');
            if (!/^(?:\d+\.?\d*|\.\d+)$/.test(value)) throw new Error('@scale must be a positive decimal number.');
            const factor = Number(value);
            if (!Number.isFinite(factor) || factor <= 0) throw new Error('@scale must be a positive decimal number.');
            scale = factor;
            continue;
          }
          if (layout !== null) throw new Error('@layout may only be specified once.');
          const directive = /^@layout(?:\s+(.+))?$/.exec(line);
          if (!directive) throw new Error(`Unsupported directive: ${line}`);
          const settings = Object.create(null);
          for (const part of (directive[1] || '').split(/\s+/).filter(Boolean)) {
            const match = /^([A-Za-z]+)=(.+)$/.exec(part);
            if (!match || Object.prototype.hasOwnProperty.call(settings, match[1])) throw new Error(`Invalid @layout parameter: ${part}`);
            const key = match[1], raw = match[2];
            // valign picks how the circuits in a row line up when their
            // heights differ: top (default) or bottom/bot (title baselines).
            if (key === 'valign') {
              if (raw !== 'top' && raw !== 'bottom' && raw !== 'bot') throw new Error(`@layout valign must be top, bottom or bot: ${raw}`);
              settings.valign = raw === 'bot' ? 'bottom' : raw;
              continue;
            }
            if ((key !== 'rows' && key !== 'cols') || !/^\d+$/.test(raw)) throw new Error(`Invalid @layout parameter: ${part}`);
            const value = Number(raw);
            if (!Number.isSafeInteger(value) || value < 1) throw new Error('@layout rows and columns must be positive integers.');
            settings[key] = value;
          }
          if (!('rows' in settings) && !('cols' in settings)) throw new Error('@layout requires rows or cols.');
          layout = settings;
          continue;
        }
        if (!/^circuit\s*\{$/.test(line)) throw new Error(`Expected circuit or directive: ${line}`);
        lines = []; depth = 1; lines.push(content); continue;
      }
      lines.push(content);
      let quoted = false;
      let escaped = false;
      for (const char of content) {
        if (escaped) { escaped = false; continue; }
        if (char === '\\') escaped = true;
        else if (char === '"') quoted = !quoted;
        else if (!quoted && char === '{') depth++;
        else if (!quoted && char === '}') depth--;
        if (depth < 0) throw new Error('Unmatched closing brace.');
      }
      // An unclosed quote here means a component argument was broken across
      // lines: the rest of the argument is on the following line.
      if (quoted) throw new Error('Line break error. A quote is not closed on this line; labels cannot span lines.');
      if (depth === 0) {
        if (subName) { subs[subName] = { source: lines.join('\n'), params: subParams }; subName = null; subParams = []; }
        else circuits.push(lines.join('\n'));
        lines = null;
      }
    }
    if (depth !== 0) throw new Error('Missing closing brace for a block.');
    if (!circuits.length) throw new Error('Specify at least one circuit block.');
    return { circuits, layout, titles, scale, subs };
  }

  function viewBoxSize(svg) {
    const match = /\bviewBox="([^"]+)"/.exec(svg);
    if (!match) throw new Error('Cannot read the viewBox from the circuit SVG.');
    const box = match[1].split(/\s+/).map(Number);
    if (box.length !== 4 || box.some(n => !Number.isFinite(n)) || box[2] <= 0 || box[3] <= 0) throw new Error('Invalid circuit SVG viewBox.');
    return { width: box[2], height: box[3] };
  }

  const round3 = value => Number(value.toFixed(3));

  // Replace or insert attributes on the root <svg> tag. Replacing existing
  // width/height attributes keeps the markup valid when an SVG is composed
  // into a layout.
  function setSvgAttributes(svg, attributes) {
    const end = svg.indexOf('>');
    if (end < 0) return svg;
    let tag = svg.slice(0, end);
    for (const name of Object.keys(attributes)) {
      const value = attributes[name];
      const pattern = new RegExp(`\\s${name}="[^"]*"`);
      if (value === null) {
        tag = tag.replace(pattern, '');
      } else if (pattern.test(tag)) {
        tag = tag.replace(pattern, ` ${name}="${value}"`);
      } else {
        tag = tag.replace(/^<svg\b/, `<svg ${name}="${value}"`);
      }
    }
    return tag + svg.slice(end);
  }

  // Compose outside the circuit viewport; the original SVG and its geometry
  // are unchanged. Reserve width for the title and height below the circuit.
  function addTitle(svg, title) {
    if (!title) return svg;
    const { width: circuitWidth, height: circuitHeight } = viewBoxSize(svg);
    const width = round3(Math.max(circuitWidth, Array.from(title).length * 16 + 16));
    const height = round3(circuitHeight + 30);
    const x = round3((width - circuitWidth) / 2);
    const inner = setSvgAttributes(svg, {
      x: String(x), y: '0',
      width: String(circuitWidth), height: String(circuitHeight),
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Circuit diagram">${inner}<text x="${round3(width / 2)}" y="${round3(circuitHeight + 24)}" text-anchor="middle" font-family="sans-serif" font-size="14">${escapeText(title)}</text></svg>`;
  }

  // @scale scales the finished SVG as a whole. The viewBox stays unchanged, so
  // every circuit, title, and gap scales by the same factor. A missing @scale
  // is 1, which leaves the output unchanged.
  function applyScale(svg, scale) {
    if (!scale || scale === 1) return svg;
    const { width, height } = viewBoxSize(svg);
    // A single circuit already carries its size in points. A composed SVG
    // (title or multiple circuits) uses unitless px for its children, so the
    // scaled root stays unitless as well.
    const root = /^<svg\b[^>]*>/.exec(svg);
    const unit = root && /\swidth="[^"]*pt"/.test(root[0]) ? 'pt' : '';
    return setSvgAttributes(svg, {
      width: `${round3(width * scale)}${unit}`,
      height: `${round3(height * scale)}${unit}`,
    });
  }

  function render(source, log = () => {}) {
    const { circuits, layout, titles, scale, subs } = splitDocument(source);
    let rows, cols;
    if (layout === null) {
      rows = circuits.length; cols = 1;
    } else {
      rows = layout.rows;
      cols = layout.cols;
      if (rows === undefined) rows = Math.ceil(circuits.length / cols);
      if (cols === undefined) cols = Math.ceil(circuits.length / rows);
    }
    // Avoid multiplying huge user-supplied integers unless the product matters.
    const count = rows >= Math.ceil(circuits.length / cols) ? circuits.length : rows * cols;
    const selected = circuits.slice(0, count);
    // Preserve the pre-layout output exactly for a single untitled circuit.
    if (selected.length === 1) {
      return applyScale(addTitle(renderCircuit(selected[0], log, subs), titles && titles[0]), scale);
    }
    const children = selected.map((block, i) => {
      const circuitSvg = renderCircuit(block, log, subs);
      const body = viewBoxSize(circuitSvg);
      const svg = addTitle(circuitSvg, titles && titles[i]);
      return { svg, ...viewBoxSize(svg), bodyHeight: body.height };
    });
    const usedCols = Math.min(cols, children.length);
    const usedRows = Math.ceil(children.length / usedCols);
    const widths = Array(usedCols).fill(0), heights = Array(usedRows).fill(0);
    const bodyHeights = Array(usedRows).fill(0);
    children.forEach((child, i) => {
      const row = Math.floor(i / usedCols);
      widths[i % usedCols] = Math.max(widths[i % usedCols], child.width);
      heights[row] = Math.max(heights[row], child.height);
      bodyHeights[row] = Math.max(bodyHeights[row], child.bodyHeight);
    });
    // valign=bottom lines up the circuit bodies (not the title bands) along the
    // bottom of each row, so titles with the same 24px offset share a baseline.
    const alignBottom = layout !== null && layout.valign === 'bottom';
    if (alignBottom) {
      // A shorter circuit moves down by the row's body-height difference, so its
      // title band may extend below the tallest child's own height.
      children.forEach((child, i) => {
        const row = Math.floor(i / usedCols);
        heights[row] = Math.max(heights[row], child.height + bodyHeights[row] - child.bodyHeight);
      });
    }
    const gap = 24;
    const offsets = lengths => {
      let total = 0;
      const positions = lengths.map(length => { const start = total; total += length + gap; return start; });
      return { positions, total: total - gap };
    };
    const horizontal = offsets(widths), vertical = offsets(heights);
    const content = children.map((child, i) => {
      const row = Math.floor(i / usedCols);
      const x = horizontal.positions[i % usedCols];
      const y = vertical.positions[row] + (alignBottom ? bodyHeights[row] - child.bodyHeight : 0);
      return setSvgAttributes(child.svg, {
        x: String(x), y: String(y),
        width: String(child.width), height: String(child.height),
      });
    }).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${round3(horizontal.total)}" height="${round3(vertical.total)}" viewBox="0 0 ${horizontal.total} ${vertical.total}" role="img" aria-label="Circuit diagram">${content}</svg>`;
    return applyScale(svg, scale);
  }

  root.Fleming = Object.freeze({ render, referenceImages });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Fleming;
})(typeof globalThis !== 'undefined' ? globalThis : this);
