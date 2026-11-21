# Schemdraw Circuit Gallery to Fleming Sample Set

This note pairs each sample in the [Schemdraw Circuit Gallery](https://schemdraw.readthedocs.io/en/stable/gallery/index.html) with the corresponding Fleming notation.

---

## Analog Circuits

Source: <https://schemdraw.readthedocs.io/en/stable/gallery/analog.html>

### A-1. Discharging capacitor

```python
with schemdraw.Drawing() as d:
    V1 = elm.SourceV().label('5V')
    elm.Line().right(d.unit*.75)
    S1 = elm.SwitchSpdt2(action='close').up().anchor('b').label('$t=0$', loc='rgt')
    elm.Line().right(d.unit*.75).at(S1.c)
    elm.Resistor().down().label(r'$100\Omega$').label(['+','$v_o$','-'], loc='bot')
    elm.Line().to(V1.start)
    elm.Capacitor().at(S1.a).toy(V1.start).label(r'1$\mu$F').dot()
```

```fleming
circuit {
  V1 {
    SourceV: label="5V"
  }
  Line: right="d.unit*.75"
  S1 {
    SwitchSpdt2: up anchor="b" action="close" label="'$t=0$' loc='rgt'"
  }
  Line: right="d.unit*.75" at="S1.c"
  Resistor: down label="'$100\Omega$'" label="['+' '$v_o$' '-'] loc='bot'"
  Line: to="V1.start"
  Capacitor: at="S1.a" toy="V1.start" label="'1$\mu$F'" dot
}
```

> In fleming, the `=` in `$t=0$` is rendered as-is; as in schemdraw, no extra spacing is added around the operator.

### A-2. Capacitor Network

```python
with schemdraw.Drawing() as d:
    d.config(fontsize=12)
    C1 = elm.Capacitor().label('8nF').idot().label('a', 'left')
    C2 = elm.Capacitor().label('18nF')
    C3 = elm.Capacitor().down().label('8nF', loc='bottom')
    C4 = elm.Capacitor().left().label('32nF')
    C5 = elm.Capacitor().label('40nF', loc='bottom').dot().label('b', 'left')
    C6 = elm.Capacitor().endpoints(C1.end, C5.start).label('2.8nF')
    C7 = (elm.Capacitor().endpoints(C2.end, C5.start)
              .label('5.6nF', loc='center', ofst=(-.3, -.1), halign='right', valign='bottom'))
```

```fleming
circuit {
  config: fontsize="12"
  C1 {
    Capacitor: label="8nF" idot label="'a' loc='left'"
  }
  C2 {
    Capacitor: label="18nF"
  }
  C3 {
    Capacitor: down label="'8nF' loc='bottom'"
  }
  C4 {
    Capacitor: left label="32nF"
  }
  C5 {
    Capacitor: label="'40nF' loc='bottom'" dot label="'b' loc='left'"
  }
  C6 {
    Capacitor: endpoints="C1.end C5.start" label="2.8nF"
  }
  C7 {
    Capacitor: endpoints="C2.end C5.start" label="'5.6nF' loc='center' ofst=(-.3 -.1) halign='right' valign='bottom'"
  }
}
```

### A-3. ECE201-Style Circuit

```python
with schemdraw.Drawing() as d:
    d.config(unit=2)  # unit=2 makes elements have shorter than normal leads
    with d.hold():
        R1 = elm.Resistor().down().label('20Ω')
        V1 = elm.SourceV().down().reverse().label('120V')
        elm.Line().right(3).dot()
    elm.Line().right(3).dot()
    elm.SourceV().down().reverse().label('60V')
    elm.Resistor().label('5Ω').dot()
    elm.Line().right(3).dot()
    elm.SourceI().up().label('36A')
    elm.Resistor().label('10Ω').dot()
    elm.Line().left(3).hold()
    elm.Line().right(3).dot()
    R6 = elm.Resistor().toy(V1.end).label('6Ω').dot()
    elm.Line().left(3).hold()
    elm.Resistor().right().at(R6.start).label('1.6Ω').dot(open=True).label('a', 'right')
    elm.Line().right().at(R6.end).dot(open=True).label('b', 'right')
```

```fleming
circuit {
  config: unit="2"
  hold {
    R1 {
      Resistor: down label="20Ω"
    }
    V1 {
      SourceV: down reverse label="120V"
    }
    Line: right="3" dot
  }
  Line: right="3" dot
  SourceV: down reverse label="60V"
  Resistor: label="5Ω" dot
  Line: right="3" dot
  SourceI: up label="36A"
  Resistor: label="10Ω" dot
  Line: left="3" hold
  Line: right="3" dot
  R6 {
    Resistor: toy="V1.end" label="6Ω" dot
  }
  Line: left="3" hold
  Resistor: right at="R6.start" label="1.6Ω" dot="open" label="'a' loc='right'"
  Line: right at="R6.end" dot="open" label="'b' loc='right'"
}
```

### A-4. Loop Currents

```python
with schemdraw.Drawing() as d:
    d.config(unit=5)
    V1 = elm.SourceV().label('20V')
    R1 = elm.Resistor().right().label('400Ω').dot()
    R2 = elm.Resistor().down().label('100Ω', loc='bot', rotate=True).dot().hold()
    L1 = elm.Line().right()
    I1 = elm.SourceI().down().label('1A', loc='bot')
    L2 = elm.Line().tox(V1.start)
    elm.LoopCurrent([R1,R2,L2,V1], pad=1.25).label('$I_1$')
    elm.LoopCurrent([R1,I1,L2,R2], pad=1.25).label('$I_2$')    # Use R1 as top element for both so they get the same height
```

```fleming
circuit {
  config: unit="5"
  V1 {
    SourceV: label="'20V'"
  }
  R1 {
    Resistor: right label="'400Ω'" dot
  }
  R2 {
    Resistor: down label="'100Ω' loc='bot' rotate=True" dot hold
  }
  L1 {
    Line: right
  }
  I1 {
    SourceI: down label="'1A' loc='bot'"
  }
  L2 {
    Line: tox="V1.start"
  }
  LoopCurrent: elms=[R1 R2 L2 V1] pad="1.25" label="'$I_1$'"
  LoopCurrent: elms=[R1 I1 L2 R2] pad="1.25" label="'$I_2$'"
}
```

### A-5. AC Loop Analysis

```python
with schemdraw.Drawing() as d:
    I1 = elm.SourceI().label('5∠0° A').dot()
    with d.hold():
        elm.Capacitor().right().label('-j3Ω').dot()
        elm.Inductor().down().label('j2Ω').dot().hold()
        elm.Resistor().right().label('5Ω').dot()
        V1 = elm.SourceV().down().reverse().label('5∠-90° V', loc='bot')
        elm.Line().tox(I1.start)
    elm.Line().up(d.unit*.8)
    L1 = elm.Inductor().tox(V1.start).label('j3Ω')
    elm.Line().down(d.unit*.8)
    elm.CurrentLabel(top=False, ofst=.3).at(L1).label('$i_g$')
```

```fleming
circuit {
  I1 {
    SourceI: label="5∠0° A" dot
  }
  hold {
    Capacitor: right label="-j3Ω" dot
    Inductor: down label="j2Ω" dot hold
    Resistor: right label="5Ω" dot
    V1 {
      SourceV: down reverse label="'5∠-90° V' loc='bot'"
    }
    Line: tox="I1.start"
  }
  Line: up="d.unit*.8"
  L1 {
    Inductor: tox="V1.start" label="j3Ω"
  }
  Line: down="d.unit*.8"
  CurrentLabel: top=False ofst=".3" at="L1" label="'$i_g$'"
}
```

### A-6. Infinite Transmission Line

```python
with schemdraw.Drawing(show=False) as d1:
    elm.Resistor()
    with d1.hold():
        elm.Capacitor().down()
        elm.Line().left()

with schemdraw.Drawing() as d2:
    for i in range(3):
        elm.ElementDrawing(d1)

    with d2.hold():
        elm.Line().length(d2.unit/6)
        elm.DotDotDot()
        elm.ElementDrawing(d1)
    d2.move(dy=-d2.unit)
    elm.Line().right(d2.unit/6)
    elm.DotDotDot()
```

```fleming
@subcircuit rc {
  Resistor:
  hold {
    Capacitor: down
    Line: left
  }
}

circuit {
  rc:
  rc:
  rc:
  hold {
    Line: right="0.5"
    DotDotDot:
    rc:
  }
  move: dy="-3"
  Line: right="0.5"
  DotDotDot:
}
```

### A-7. Power supply

```python
with schemdraw.Drawing() as d:
    d.config(inches_per_unit=.5, unit=3)
    D = elm.Rectifier()
    elm.Line().left(d.unit*1.5).at(D.N).dot(open=True).idot()
    elm.Line().left(d.unit*1.5).at(D.S).dot(open=True).idot()
    G = elm.Gap().toy(D.N).label(['–', 'AC IN', '+'])

    top = elm.Line().right(d.unit*3).at(D.E).idot()
    Q2 = elm.BjtNpn(circle=True).up().anchor('collector').label('Q2\n2n3055')
    elm.Line().down(d.unit/2).at(Q2.base)
    Q2b = elm.Dot()
    elm.Line().left(d.unit/3)
    Q1 = elm.BjtNpn(circle=True).up().anchor('emitter').label('Q1\n    2n3054')
    elm.Line().at(Q1.collector).toy(top.center).dot()

    elm.Line().down(d.unit/2).at(Q1.base).dot()
    elm.Zener().down().reverse().label('D2\n500mA', loc='bot').dot()
    G = elm.Ground()
    elm.Line().left().dot()
    elm.Capacitor(polar=True).up().reverse().label('C2\n100$\\mu$F\n50V', loc='bot').dot()
    elm.Line().right().hold()
    elm.Resistor().toy(top.end).label('R1\n2.2K\n50V', loc='bot').dot()

    d.move(dx=-d.unit, dy=0)
    elm.Capacitor(polar=True).toy(G.start).flip().label('C1\n 1000$\\mu$F\n50V').dot().idot()
    elm.Line().at(G.start).tox(D.W)
    elm.Line().toy(D.W).dot()

    elm.Resistor().right().at(Q2b.center).label('R2').label('56$\\Omega$ 1W', loc='bot').dot()
    with d.hold():
        elm.Line().toy(top.start).dot()
        elm.Line().tox(Q2.emitter)
    elm.Capacitor(polar=True).toy(G.start).label('C3\n470$\\mu$F\n50V', loc='bot').dot()
    elm.Line().tox(G.start).hold()
    elm.Line().right().dot()
    elm.Resistor().toy(top.center).label('R3\n10K\n1W', loc='bot').dot()
    elm.Line().left().hold()
    elm.Line().right()
    elm.Dot(open=True)
    elm.Gap().toy(G.start).label(['+', '$V_{out}$', '–'])
    elm.Dot(open=True)
    elm.Line().left()
```

```fleming
circuit {
  config: inches_per_unit="0.5" unit="3"
  D {
    Rectifier:
  }
  Line: left="d.unit*1.5" at="D.N" dot="open" idot
  Line: left="d.unit*1.5" at="D.S" dot="open" idot
  ACIN {
    Gap: toy="D.N" label="['–' 'AC IN' '+']"
  }
  top {
    Line: right="d.unit*3" at="D.E" idot
  }
  Q2 {
    BjtNpn: circle=True up anchor="collector" label="'Q2\n2n3055' loc='top'"
  }
  Line: down="d.unit/2" at="Q2.base"
  Q2b {
    Dot:
  }
  Line: left="d.unit/3"
  Q1 {
    BjtNpn: circle=True up anchor="emitter" label="'Q1\n    2n3054' loc='top'"
  }
  Line: at="Q1.collector" toy="top.center" dot
  Line: down="d.unit/2" at="Q1.base" dot
  Zener: down reverse label="'D2\n500mA' loc='bot'" dot
  GND {
    Ground:
  }
  Line: left dot
  Capacitor: polar=True up reverse label="'C2\n100$\mu$F\n50V' loc='bot'" dot
  Line: right hold
  Resistor: toy="top.end" label="'R1\n2.2K\n50V' loc='bot'" dot
  move: dx="-d.unit" dy="0"
  Capacitor: polar=True toy="GND.start" flip label="'C1\n 1000$\mu$F\n50V'" dot idot
  Line: at="GND.start" tox="D.W"
  Line: toy="D.W" dot
  Resistor: right at="Q2b.center" label="R2" label="'56$\Omega$ 1W' loc='bot'" dot
  hold {
    Line: toy="top.start" dot
    Line: tox="Q2.emitter"
  }
  Capacitor: polar=True toy="GND.start" label="'C3\n470$\mu$F\n50V' loc='bot'" dot
  Line: tox="GND.start" hold
  Line: right dot
  Resistor: toy="top.center" label="'R3\n10K\n1W' loc='bot'" dot
  Line: left hold
  Line: right
  Dot: open=True
  Gap: toy="GND.start" label="['+' '$V_{out}$' '–']"
  Dot: open=True
  Line: left
}
```

> schemdraw reuses `G` for both the Gap and the Ground, so the fleming version uses `ACIN` for the Gap and `GND` for the Ground.
>
> Two-line labels such as Q1 and Q2 are split into lines only when the text is wrapped in single quotes, as in `label="'...\n...' loc='top'"`; `loc='top'` centers the label above the transistor as in the original. Without the single quotes, `\n` is displayed literally.

### A-8. 5-transistor Operational Transconductance Amplifier (OTA)

```python
with schemdraw.Drawing() as d:
    # tail transistor
    Q1 = elm.AnalogNFet().anchor('source').theta(0).reverse()
    elm.Line().down(0.5)
    ground = d.here
    elm.Ground()

    # input pair
    elm.Line().left(1).at(Q1.drain)
    Q2 = elm.AnalogNFet().anchor('source').theta(0).reverse()

    elm.Dot().at(Q1.drain)
    elm.Line().right(1)
    Q3 = elm.AnalogNFet().anchor('source').theta(0)

    # current mirror
    Q4 = elm.AnalogPFet().anchor('drain').at(Q2.drain).theta(0)
    Q5 = elm.AnalogPFet().anchor('drain').at(Q3.drain).theta(0).reverse()

    elm.Line().right().at(Q4.gate).to(Q5.gate)

    elm.Dot().at(0.5*(Q4.gate + Q5.gate))
    elm.Line().down().toy(Q4.drain)
    elm.Line().left().tox(Q4.drain)
    elm.Dot()

    # vcc connection
    elm.Line().right().at(Q4.source).to(Q5.source)
    elm.Dot().at(0.5*(Q4.source + Q5.source))
    elm.Vdd()

    # bias source
    elm.Line().left(0.25).at(Q1.gate)
    elm.SourceV().down().toy(ground).reverse().scale(0.5).label("Bias")
    elm.Ground()

    # signal labels
    elm.Tag().at(Q2.gate).label("In+").left()
    elm.Tag().at(Q3.gate).label("In−").right()
    elm.Dot().at(Q3.drain)
    elm.Line().right().tox(Q3.gate)
    elm.Tag().right().label("Out").reverse()

    # bias currents
    elm.CurrentLabel(length=1.25, ofst=0.25).at(Q1).label("20µA")
    elm.CurrentLabel(length=1.25, ofst=0.25).at(Q4).label("10µA")
    elm.CurrentLabel(length=1.25, ofst=0.25).at(Q5).label("10µA")
```

```fleming
circuit {
  Q1 {
    AnalogNFet: anchor="source" theta="0" reverse
  }
  Line: down="0.5"
  gnd {
    Ground:
  }
  Line: left="1" at="Q1.drain"
  Q2 {
    AnalogNFet: anchor="source" theta="0" reverse
  }
  Dot: at="Q1.drain"
  Line: right="1"
  Q3 {
    AnalogNFet: anchor="source" theta="0"
  }
  Q4 {
    AnalogPFet: anchor="drain" at="Q2.drain" theta="0"
  }
  Q5 {
    AnalogPFet: anchor="drain" at="Q3.drain" theta="0" reverse
  }
  GATE {
    Line: right at="Q4.gate" to="Q5.gate"
  }
  Dot: at="GATE.center"
  Line: down toy="Q4.drain"
  Line: left tox="Q4.drain"
  Dot:
  VCC {
    Line: right at="Q4.source" to="Q5.source"
  }
  Dot: at="VCC.center"
  Vdd:
  Line: left="0.25" at="Q1.gate"
  SourceV: down toy="gnd.start" reverse scale="0.5" label="Bias"
  Ground:
  Tag: at="Q2.gate" label="In+" left
  Tag: at="Q3.gate" label="In−" right
  Dot: at="Q3.drain"
  Line: right tox="Q3.gate"
  Tag: right label="Out" reverse
  CurrentLabel: length="1.25" ofst="0.25" at="Q1" label="20µA"
  CurrentLabel: length="1.25" ofst="0.25" at="Q4" label="10µA"
  CurrentLabel: length="1.25" ofst="0.25" at="Q5" label="10µA"
}
```

> fleming's numeric coordinate expressions cannot compute a midpoint such as `0.5*(Q4.gate + Q5.gate)`, so the Line connecting the two terminals is named and its `center` is used as the Dot position.

### A-9. Quadruple loop negative feedback amplifier

```python
with schemdraw.Drawing() as d:
    # place twoports
    N1 = elm.Nullor().anchor('center')
    T1 = elm.TransimpedanceTransactor(reverse_output=True).reverse().flip().anchor('center').at([0,-3]).label("B")
    T2 = elm.CurrentTransactor().reverse().flip().anchor('center').at([0,-6]).label("D")
    T3 = elm.VoltageTransactor().reverse().anchor('center').at([0,-9]).label("A")
    T4 = elm.TransadmittanceTransactor(reverse_output=True).reverse().anchor('center').at([0,-12]).label("C")

    ## make connections
    # right side
    elm.Line().at(N1.out_n).to(T1.in_n)
    elm.Line().at(T1.in_p).to(T2.in_n)
    elm.Line().at(T3.in_n).to(T4.in_n)

    elm.Line().right(1).at(N1.out_p)
    pre_out = d.here
    outline = elm.Line().right(1).dot(open=True)
    out = d.here
    elm.Gap().down().label(('+','$V_o$','–')).toy(N1.out_n)
    elm.Line().idot(open=True).down().toy(T4.in_n)
    elm.Line().left().to(T4.in_n)
    elm.Dot()
    elm.CurrentLabelInline(direction='in', ofst=-0.15).at(outline).label('$I_o$')

    elm.Line().at(T2.in_p).right().tox(out)
    elm.Dot()

    elm.Line().right().at(T4.in_p).tox(pre_out)
    elm.Line().up().toy(pre_out)
    elm.Dot()

    elm.Line().right().at(T3.in_p).tox(pre_out)
    elm.Dot()

    # left side
    elm.Line().down().at(N1.in_n).to(T1.out_n)

    elm.Line().up().at(T3.out_p).to(T1.out_p)

    elm.Line().left().at(N1.in_p).length(1)
    pre_in = d.here
    inline = elm.Line().length(1).dot(open=True).left()
    in_node = d.here
    elm.Gap().down().label(('+','$V_i$','–')).toy(N1.in_n)
    elm.Line().idot(open=True).down().toy(T4.out_n)
    elm.Line().right().to(T4.out_n)
    elm.CurrentLabelInline(direction='out', ofst=-0.15).at(inline).label('$I_i$')

    elm.Line().left().at(T2.out_p).tox(in_node)
    elm.Dot()
    elm.Line().left().at(T3.out_n).tox(in_node)
    elm.Dot()

    elm.Line().left().at(T4.out_p).tox(pre_in)
    elm.Line().up().toy(pre_in)
    elm.Dot()

    elm.Line().left().at(T2.out_n).tox(pre_in)
    elm.Dot()
```

```fleming
circuit {
  N1 {
    Nullor: anchor="center"
  }
  T1 {
    TransimpedanceTransactor: reverse_output=True reverse flip anchor="center" at="(0 -3)" label="B"
  }
  T2 {
    CurrentTransactor: reverse flip anchor="center" at="(0 -6)" label="D"
  }
  T3 {
    VoltageTransactor: reverse anchor="center" at="(0 -9)" label="A"
  }
  T4 {
    TransadmittanceTransactor: reverse_output=True reverse anchor="center" at="(0 -12)" label="C"
  }
  Line: at="N1.out_n" to="T1.in_n"
  Line: at="T1.in_p" to="T2.in_n"
  Line: at="T3.in_n" to="T4.in_n"
  Line: right="1" at="N1.out_p"
  anchor: name="pre_out"
  outline {
    Line: right="1" dot="open"
  }
  anchor: name="out"
  Gap: down label="['+' '$V_o$' '–']" toy="N1.out_n"
  Line: idot="open" toy="T4.in_n"
  Line: to="T4.in_n"
  Dot:
  CurrentLabelInline: at="outline" direction="in" ofst="-0.15" label="'$I_o$'"
  Line: right at="T2.in_p" tox="out.center"
  Dot:
  Line: right at="T4.in_p" tox="pre_out.center"
  Line: up toy="pre_out.center"
  Dot:
  Line: right at="T3.in_p" tox="pre_out.center"
  Dot:
  Line: down at="N1.in_n" to="T1.out_n"
  Line: up at="T3.out_p" to="T1.out_p"
  Line: left="1" at="N1.in_p"
  anchor: name="pre_in"
  inline {
    Line: length="1" dot="open" left
  }
  anchor: name="in_node"
  Gap: down label="['+' '$V_i$' '–']" toy="N1.in_n"
  Line: idot="open" toy="T4.out_n"
  Line: right to="T4.out_n"
  CurrentLabelInline: at="inline" direction="out" ofst="-0.15" label="'$I_i$'"
  Line: left at="T2.out_p" tox="in_node.center"
  Dot:
  Line: left at="T3.out_n" tox="in_node.center"
  Dot:
  Line: left at="T4.out_p" tox="pre_in.center"
  Line: up toy="pre_in.center"
  Dot:
  Line: left at="T2.out_n" tox="pre_in.center"
  Dot:
}
```

> Raw points captured with `d.here` (`pre_out`, `out`, `pre_in`, `in_node`) are recorded with fleming's `anchor: name="..."` and referenced as `name.center`.

### A-10. Vacuum Tube Volt Meters (1st figure)

```python
with schemdraw.Drawing() as d:
    d.config(fontsize=11)
    q = elm.Triode()
    top = elm.Line().up().at(q.anode).length(.5)
    elm.Line().left().at(q.grid).length(2).dot(open=True).label('$V_{in}$', 'left')
    elm.Line().down().at(q.cathode).length(1.3).dot()
    R1 = elm.Resistor().label('R1').length(2).dot()
    elm.Ground()
    elm.Line().right().dot()
    pv = elm.Battery().reverse().label('Plate V', 'bottom').dot()
    elm.Battery().reverse().label('Bal. V', 'bottom')
    elm.ResistorVar().up().flip().label('Zero\nAdj.', 'bottom')
    elm.Resistor().up().label('R2', 'bottom').toy(top.end)
    elm.Line().tox(pv.end).dot()
    elm.MeterArrow().toy(pv.end).reverse().label('DC μA\nMeter', 'bottom').label('+', 'iend', ofst=(.2, -.3)).label('−', 'istart', ofst=(-.15, -.3)).hold()
    elm.Line().tox(pv.start).dot()
    elm.Line().tox(q.anode).hold()
    elm.Capacitor().down().label('C1').toy(R1.start).dot()
    elm.Line().tox(q.cathode).hold()
    elm.Capacitor().toy(pv.start).label('C2')
```

```fleming
circuit {
  config: fontsize="11"
  q {
    Triode:
  }
  top {
    Line: up=".5" at="q.anode"
  }
  Line: left="2" at="q.grid" dot="open" label="'$V_{in}$' loc='left'"
  Line: down="1.3" at="q.cathode" dot
  R1 {
    Resistor: label="R1" length="2" dot
  }
  Ground:
  Line: right dot
  pv {
    Battery: reverse label="'Plate V' loc='bottom'" dot
  }
  Battery: reverse label="'Bal. V' loc='bottom'"
  ResistorVar: up flip label="'Zero\nAdj.' loc='bottom'"
  Resistor: up label="'R2' loc='bottom'" toy="top.end"
  Line: tox="pv.end" dot
  MeterArrow: toy="pv.end" reverse label="'DC μA\nMeter' loc='bottom'" label="'+' loc='iend' ofst=(.2 -.3)" label="'−' loc='istart' ofst=(-.15 -.3)" hold
  Line: tox="pv.start" dot
  Line: tox="q.anode" hold
  Capacitor: down label="C1" toy="R1.start" dot
  Line: tox="q.cathode" hold
  Capacitor: toy="pv.start" label="C2"
}
```

### A-11. Vacuum Tube Volt Meters (2nd figure)

```python
with schemdraw.Drawing() as d:
    v3 = elm.DualVacuumTube(grids_left=0, grids_right=0, heater=False).label('V3')
    elm.Line().at(v3.cathodeB).down(1.25).dot().label('D2', 'left')
    elm.Line().right(2.5)
    R3 = elm.Resistor().up().label('R3').dot()
    elm.Wire('-|').to(v3.anodeB)
    elm.Line().at(v3.cathodeA).down(1.25).dot().label('D1', 'left')
    elm.Line().tox(v3.cathodeB).hold()
    elm.Line().left(1.5).dot()
    elm.Line().left(1.5).dot(open=True).hold()
    R1 = elm.Resistor().up().label('R1', 'bottom').dot()
    elm.Capacitor().left(1.5).label('C1').dot(open=True)
    elm.Gap().toy(R1.start).label('Input')
    elm.Wire(shape='-|').at(R1.end).to(v3.anodeA).hold()
    v1 = elm.Triode().theta(-45).at((6.5, 3)).label('V1', 'NE')
    elm.Line().theta(135).at(v1.grid).length(.75)
    elm.Line().left(1).dot()
    with d.hold():
        elm.Capacitor().down(1).label('C2')
        elm.Ground(lead=False)
    R2 = elm.Resistor().tox(R1.end).shift(.3).label('R2')
    elm.Line().toy(R1.end)
    d1 = elm.Line().at(v1.cathode_R).theta(-135).length(1.5).dot()
    elm.Line().at(v1.anode).theta(45).length(.75)
    R4 = elm.Potentiometer().right(2).label('R4')
    elm.Line().theta(-45).length(.75)
    v2 = elm.Triode().theta(45).anchor('anode').label('V2', 'NW')
    elm.Line().at(v2.grid_R).theta(45).length(.75)
    elm.Wire('n', k=2).to(R3.end)
    elm.Line().at(v2.cathode).theta(-45).length(1.5).dot()
    R7 = elm.Resistor().shift(.5).left().label('R7', 'bottom')
    elm.MeterArrow().shift(-.3).reverse().tox(d1.end)
    elm.Resistor().theta(-45).label('R5', 'bottom').tox(R4.tap).dot()
    elm.Resistor().to(R7.start).label('R6', 'bottom').hold()
    elm.Line().right(5)
    bat = elm.BatteryDouble().reverse().up().toy(R4.tap)
    elm.Line().tox(R4.tap)
    elm.Line(arrow='o-').at(bat.tap).left(.6)
    elm.Ground()
```

```fleming
circuit {
  v3 {
    DualVacuumTube: grids_left="0" grids_right="0" heater=False label="V3"
  }
  Line: at="v3.cathodeB" down="1.25" dot label="'D2' loc='left'"
  Line: right="2.5"
  R3 {
    Resistor: up label="R3" dot
  }
  Wire: shape="-|" to="v3.anodeB"
  Line: at="v3.cathodeA" down="1.25" dot label="'D1' loc='left'"
  Line: tox="v3.cathodeB" hold
  Line: left="1.5" dot
  Line: left="1.5" dot="open" hold
  R1 {
    Resistor: up label="'R1' loc='bottom'" dot
  }
  Capacitor: left="1.5" label="C1" dot="open"
  Gap: toy="R1.start" label="Input"
  Wire: shape="-|" at="R1.end" to="v3.anodeA" hold
  v1 {
    Triode: theta="-45" at="(6.5 3)" label="'V1' loc='NE'"
  }
  Line: theta="135" at="v1.grid" length=".75"
  Line: left="1" dot
  hold {
    Capacitor: down="1" label="C2"
    Ground: lead=False
  }
  R2 {
    Resistor: tox="R1.end" shift=".3" label="R2"
  }
  Line: toy="R1.end"
  d1 {
    Line: at="v1.cathode_R" theta="-135" length="1.5" dot
  }
  Line: at="v1.anode" theta="45" length=".75"
  R4 {
    Potentiometer: right="2" label="R4"
  }
  Line: theta="-45" length=".75"
  v2 {
    Triode: theta="45" anchor="anode" label="'V2' loc='NW'"
  }
  Line: at="v2.grid_R" theta="45" length=".75"
  Wire: shape="n" k="2" to="R3.end"
  Line: at="v2.cathode" theta="-45" length="1.5" dot
  R7 {
    Resistor: shift=".5" left label="'R7' loc='bottom'"
  }
  MeterArrow: shift="-0.3" reverse tox="d1.end"
  Resistor: theta="-45" label="'R5' loc='bottom'" tox="R4.tap" dot
  Resistor: to="R7.start" label="'R6' loc='bottom'" hold
  Line: right="5"
  bat {
    BatteryDouble: reverse up toy="R4.tap"
  }
  Line: tox="R4.tap"
  Line: at="bat.tap" left=".6" arrow="o-"
  Ground:
}
```

---

## Opamp Circuits

Source: <https://schemdraw.readthedocs.io/en/stable/gallery/opamp.html>

### O-1. Inverting Opamp

```python
with schemdraw.Drawing() as d:
    op = elm.Opamp(leads=True)
    elm.Line().down(d.unit/4).at(op.in2)
    elm.Ground(lead=False)
    Rin = elm.Resistor().at(op.in1).left().idot().label('$R_{in}$', loc='bot').label('$v_{in}$', loc='left')
    elm.Line().up(d.unit/2).at(op.in1)
    elm.Resistor().tox(op.out).label('$R_f$')
    elm.Line().toy(op.out).dot()
    elm.Line().right(d.unit/4).at(op.out).label('$v_{o}$', loc='right')
```

```fleming
circuit {
  op {
    Opamp: leads=True
  }
  Line: down="d.unit/4" at="op.in2"
  Ground: lead=False
  Rin {
    Resistor: at="op.in1" left idot label="'$R_{in}$' loc='bot'" label="'$v_{in}$' loc='left'"
  }
  Line: up="d.unit/2" at="op.in1"
  Resistor: tox="op.out" label="'$R_f$'"
  Line: toy="op.out" dot
  Line: right="d.unit/4" at="op.out" label="'$v_{o}$' loc='right'"
}
```

### O-2. Non-inverting Opamp

```python
with schemdraw.Drawing() as d:
    op = elm.Opamp(leads=True)
    out = elm.Line().at(op.out).length(.75)
    elm.Line().up().at(op.in1).length(1.5).dot()
    with d.hold():
        elm.Resistor().left().label('$R_1$')
        elm.Ground()
    elm.Resistor().tox(op.out).label('$R_f$')
    elm.Line().toy(op.out).dot()
    elm.Resistor().left().at(op.in2).idot().label('$R_2$')
    elm.SourceV().down().reverse().label('$v_{in}$')
    elm.Line().right().dot()
    elm.Resistor().up().label('$R_3$').hold()
    elm.Line().tox(out.end)
    elm.Gap().toy(op.out).label(['–','$v_o$','+'])
```

```fleming
circuit {
  op {
    Opamp: leads=True
  }
  out {
    Line: at="op.out" length=".75"
  }
  Line: up at="op.in1" length="1.5" dot
  hold {
    Resistor: left label="'$R_1$'"
    Ground:
  }
  Resistor: tox="op.out" label="'$R_f$'"
  Line: toy="op.out" dot
  Resistor: left at="op.in2" idot label="'$R_2$'"
  SourceV: down reverse label="'$v_{in}$'"
  Line: right dot
  Resistor: up label="'$R_3$'" hold
  Line: tox="out.end"
  Gap: toy="op.out" label="['–' '$v_o$' '+']"
}
```

### O-3. Multi-stage amplifier

```python
with schemdraw.Drawing() as d:
    elm.Ground(lead=False)
    elm.SourceV().label('500mV')
    elm.Resistor().right().label(r'20k$\Omega$').dot()
    O1 = elm.Opamp(leads=True).anchor('in1')
    elm.Ground().at(O1.in2)
    elm.Line().up(2).at(O1.in1)
    elm.Resistor().tox(O1.out).label(r'100k$\Omega$')
    elm.Line().toy(O1.out).dot()
    elm.Line().right(5).at(O1.out)
    O2 = elm.Opamp(leads=True).anchor('in2')
    elm.Resistor().left().at(O2.in1).idot().label(r'30k$\Omega$')
    elm.Ground()
    elm.Line().up(1.5).at(O2.in1)
    elm.Resistor().tox(O2.out).label(r'90k$\Omega$')
    elm.Line().toy(O2.out).dot()
    elm.Line().right(1).at(O2.out).label('$v_{out}$', loc='rgt')
```

```fleming
circuit {
  Ground: lead=False
  SourceV: label="500mV"
  Resistor: right label="'20k$\Omega$'" dot
  O1 {
    Opamp: leads=True anchor="in1"
  }
  Ground: at="O1.in2"
  Line: up="2" at="O1.in1"
  Resistor: tox="O1.out" label="'100k$\Omega$'"
  Line: toy="O1.out" dot
  Line: right="5" at="O1.out"
  O2 {
    Opamp: leads=True anchor="in2"
  }
  Resistor: left at="O2.in1" idot label="'30k$\Omega$'"
  Ground:
  Line: up="1.5" at="O2.in1"
  Resistor: tox="O2.out" label="'90k$\Omega$'"
  Line: toy="O2.out" dot
  Line: right="1" at="O2.out" label="'$v_{out}$' loc='rgt'"
}
```

### O-4. Opamp pin labeling

```python
with schemdraw.Drawing() as d:
    d.config(fontsize=12)
    op = (elm.Opamp()
        .label('741', loc='center', ofst=0)
        .label('1', 'n1')
        .label('5', 'n1a')
        .label('4', 'vs')
        .label('7', 'vd')
        .label('2', 'in1')
        .label('3', 'in2')
        .label('6', 'out')
    )
    elm.Line().left(.5).at(op.in1)
    elm.Line().down(d.unit/2)
    elm.Ground(lead=False)
    elm.Line().left(.5).at(op.in2)
    elm.Line().right(.5).at(op.out).label('$V_o$', 'right')
    elm.Line().up(1).at(op.vd).label('$+V_s$', 'right')
    trim = elm.Potentiometer().down().at(op.n1).flip().scale(0.7)
    elm.Line().tox(op.n1a)
    elm.Line().up().to(op.n1a)
    elm.Line().at(trim.tap).tox(op.vs).dot()
    with d.hold():
        elm.Line().down(d.unit/3)
        elm.Ground()
    elm.Line().toy(op.vs)
```

```fleming
circuit {
  config: fontsize="12"
  op {
    Opamp: label="'741' loc='center' ofst=0" label="'1' loc='n1'" label="'5' loc='n1a'" label="'4' loc='vs'" label="'7' loc='vd'" label="'2' loc='in1'" label="'3' loc='in2'" label="'6' loc='out'"
  }
  Line: left=".5" at="op.in1"
  Line: down="d.unit/2"
  Ground: lead=False
  Line: left=".5" at="op.in2"
  Line: right=".5" at="op.out" label="'$V_o$' loc='right'"
  Line: up="1" at="op.vd" label="'$+V_s$' loc='right'"
  trim {
    Potentiometer: down at="op.n1" flip scale="0.7"
  }
  Line: tox="op.n1a"
  Line: to="op.n1a"
  Line: at="trim.tap" tox="op.vs" dot
  hold {
    Line: down="d.unit/3"
    Ground:
  }
  Line: toy="op.vs"
}
```

> In `elm.Line().up().to(op.n1a)`, `to` determines the direction, so the fleming version uses `Line: to="op.n1a"`.

### O-5. Triaxial Cable Driver

```python
with schemdraw.Drawing() as d:
    d.config(fontsize=10)
    elm.Line().length(d.unit/5).label('V', 'left')
    smu = (elm.Opamp(sign=False).anchor('in2')
              .label('SMU', 'center', ofst=[-.4, 0], halign='center', valign='center'))
    elm.Line().at(smu.out).length(.3)
    with d.hold():
        elm.Line().length(d.unit/4)
        triax = elm.Triax(length=5, shieldofststart=.75)
    elm.Resistor().up().scale(0.6).idot()
    elm.Line().left().dot()
    elm.Wire('|-').to(smu.in1).hold()
    elm.Wire('|-').delta(d.unit/5, d.unit/5)
    buf = (elm.Opamp(sign=False).anchor('in2').scale(0.6)
              .label('BUF', 'center', ofst=(-.4, 0), halign='center', valign='center'))
    elm.Line().left(d.unit/5).at(buf.in1)
    elm.Wire('n').to(buf.out, dx=.5).dot()
    elm.Wire('-|').at(buf.out).to(triax.guardstart_top)
    elm.GroundChassis().at(triax.shieldcenter)
```

```fleming
circuit {
  config: fontsize="10"
  Line: length="d.unit/5" label="'V' loc='left'"
  smu {
    Opamp: sign=False anchor="in2" label="'SMU' loc='center' ofst=(-.4 0) halign='center' valign='center'"
  }
  Line: at="smu.out" length=".3"
  hold {
    Line: length="d.unit/4"
    triax {
      Triax: length="5" shieldofststart=".75"
    }
  }
  Resistor: up scale="0.6" idot
  Line: left dot
  Wire: shape="|-" to="smu.in1" hold
  Wire: shape="|-" delta="(d.unit/5 d.unit/5)"
  buf {
    Opamp: sign=False anchor="in2" scale="0.6" label="'BUF' loc='center' ofst=(-.4 0) halign='center' valign='center'"
  }
  Line: left="d.unit/5" at="buf.in1"
  Wire: shape="n" to="buf.out" dx=".5" dot
  Wire: shape="-|" at="buf.out" to="triax.guardstart_top"
  GroundChassis: at="triax.shieldcenter"
}
```

---

## Digital Logic

Source: <https://schemdraw.readthedocs.io/en/stable/gallery/logicgate.html>

### L-1. Half Adder

```python
with schemdraw.Drawing() as d:
    d.config(unit=0.5)
    S = logic.Xor().label('S', 'right')
    logic.Line().left(d.unit*2).at(S.in1).idot().label('A', 'left')
    B = logic.Line().left().at(S.in2).dot()
    logic.Line().left().label('B', 'left')
    logic.Line().down(d.unit*3).at(S.in1)
    C = logic.And().right().anchor('in1').label('C', 'right')
    logic.Wire('|-').at(B.end).to(C.in2)
```

```fleming
circuit {
  config: unit="0.5"
  S {
    Xor: label="'S' loc='right'"
  }
  Line: left="d.unit*2" at="S.in1" idot label="'A' loc='left'"
  B {
    Line: left at="S.in2" dot
  }
  Line: left label="'B' loc='left'"
  Line: down="d.unit*3" at="S.in1"
  C {
    And: right anchor="in1" label="'C' loc='right'"
  }
  Wire: shape="|-" at="B.end" to="C.in2"
}
```

### L-2. Full Adder

```python
with schemdraw.Drawing() as d:
    d.config(unit=0.5)
    X1 = logic.Xor()
    A = logic.Line().left(d.unit*2).at(X1.in1).idot().label('A', 'left')
    B = logic.Line().left().at(X1.in2).dot()
    logic.Line().left().label('B', 'left')
    logic.Line().right().at(X1.out).idot()
    X2 = logic.Xor().anchor('in1')
    C = logic.Line().down(d.unit*2).at(X2.in2)
    with d.hold():
        logic.Dot().at(C.center)
        logic.Line().tox(A.end).label('C$_{in}$', 'left')
    A1 = logic.And().right().anchor('in1')
    logic.Wire('-|').at(A1.in2).to(X1.out)
    d.move_from(A1.in2, dy=-d.unit*2)
    A2 = logic.And().right().anchor('in1')
    logic.Wire('-|').at(A2.in1).to(A.start)
    logic.Wire('-|').at(A2.in2).to(B.end)
    d.move_from(A1.out, dy=-(A1.out.y-A2.out.y)/2)
    O1 = logic.Or().right().label('C$_{out}$', 'right')
    logic.Line().at(A1.out).toy(O1.in1)
    logic.Line().at(A2.out).toy(O1.in2)
    logic.Line().at(X2.out).tox(O1.out).label('S', 'right')
```

```fleming
circuit {
  config: unit="0.5"
  X1 {
    Xor:
  }
  A {
    Line: left="d.unit*2" at="X1.in1" idot label="'A' loc='left'"
  }
  B {
    Line: left at="X1.in2" dot
  }
  Line: left label="'B' loc='left'"
  Line: right at="X1.out" idot
  X2 {
    Xor: anchor="in1"
  }
  C {
    Line: down="d.unit*2" at="X2.in2"
  }
  hold {
    Dot: at="C.center"
    Line: tox="A.end" label="'C$_{in}$' loc='left'"
  }
  A1 {
    And: right anchor="in1"
  }
  Wire: shape="-|" at="A1.in2" to="X1.out"
  move_from: at="A1.in2" dy="-d.unit*2"
  A2 {
    And: right anchor="in1"
  }
  Wire: shape="-|" at="A2.in1" to="A.start"
  Wire: shape="-|" at="A2.in2" to="B.end"
  move_from: at="A1.out" dy="-(A1.out.y-A2.out.y)/2"
  O1 {
    Or: right label="'C$_{out}$' loc='right'"
  }
  Line: at="A1.out" toy="O1.in1"
  Line: at="A2.out" toy="O1.in2"
  Line: at="X2.out" tox="O1.out" label="'S' loc='right'"
}
```

### L-3. J-K Flip Flop

```python
with schemdraw.Drawing() as d:
    # Two front gates (SR latch)
    G1 = logic.Nand(leadout=.75).anchor('in1')
    logic.Line().length(d.unit/2).label('Q', 'right')
    d.move_from(G1.in1, dy=-2.5)
    G2 = logic.Nand(leadout=.75).anchor('in1')
    logic.Line().length(d.unit/2).label(r'$\overline{Q}$', 'right')
    logic.Wire('N', k=.5).at(G2.in1).to(G1.out).dot()
    logic.Wire('N', k=.5).at(G1.in2).to(G2.out).dot()

    # Two back gates
    logic.Line().left(d.unit/6).at(G1.in1)
    J = logic.Nand(inputs=3).anchor('out').right()
    logic.Wire('n', k=.5).at(J.in1).to(G2.out, dx=1).dot()
    logic.Line().left(d.unit/4).at(J.in2).label('J', 'left')
    logic.Line().left(d.unit/6).at(G2.in2)
    K = logic.Nand(inputs=3).right().anchor('out')
    logic.Wire('n', k=-.5).at(K.in3).to(G1.out, dx=.5).dot()
    logic.Line().left(d.unit/4).at(K.in2).label('K', 'left')
    C = logic.Line().at(J.in3).toy(K.in1)
    logic.Dot().at(C.center)
    logic.Line().left(d.unit/4).label('CLK', 'left')
```

```fleming
circuit {
  G1 {
    Nand: leadout=".75" anchor="in1"
  }
  Line: length="d.unit/2" label="'Q' loc='right'"
  move_from: at="G1.in1" dy="-2.5"
  G2 {
    Nand: leadout=".75" anchor="in1"
  }
  Line: length="d.unit/2" label="'$\overline{Q}$' loc='right'"
  Wire: shape="N" k=".5" at="G2.in1" to="G1.out" dot
  Wire: shape="N" k=".5" at="G1.in2" to="G2.out" dot
  Line: left="d.unit/6" at="G1.in1"
  J {
    Nand: inputs="3" anchor="out" right
  }
  Wire: shape="n" k=".5" at="J.in1" to="G2.out" dx="1" dot
  Line: left="d.unit/4" at="J.in2" label="'J' loc='left'"
  Line: left="d.unit/6" at="G2.in2"
  K {
    Nand: inputs="3" right anchor="out"
  }
  Wire: shape="n" k="-.5" at="K.in3" to="G1.out" dx=".5" dot
  Line: left="d.unit/4" at="K.in2" label="'K' loc='left'"
  C {
    Line: at="J.in3" toy="K.in1"
  }
  Dot: at="C.center"
  Line: left="d.unit/4" label="'CLK' loc='left'"
}
```

### L-4. S-R Latch (Gates)

```python
with schemdraw.Drawing() as d:
    g1 = logic.Nor()
    d.move_from(g1.in1, dy=-2.5)
    g2 = logic.Nor().anchor('in1')
    g1out = logic.Line().right(.25).at(g1.out)
    logic.Wire('N', k=.5).at(g2.in1).to(g1out.end).dot()
    g2out = logic.Line().right(.25).at(g2.out)
    logic.Wire('N', k=.5).at(g1.in2).to(g2out.end).dot()
    logic.Line().at(g1.in1).left(.5).label('R', 'left')
    logic.Line().at(g2.in2).left(.5).label('S', 'left')
    logic.Line().at(g1.out).right(.75).label('Q', 'right')
    logic.Line().at(g2.out).right(.75).label(r'$\overline{Q}$', 'right')
```

```fleming
circuit {
  g1 {
    Nor:
  }
  move_from: at="g1.in1" dy="-2.5"
  g2 {
    Nor: anchor="in1"
  }
  g1out {
    Line: right=".25" at="g1.out"
  }
  Wire: shape="N" k=".5" at="g2.in1" to="g1out.end" dot
  g2out {
    Line: right=".25" at="g2.out"
  }
  Wire: shape="N" k=".5" at="g1.in2" to="g2out.end" dot
  Line: at="g1.in1" left=".5" label="'R' loc='left'"
  Line: at="g2.in2" left=".5" label="'S' loc='left'"
  Line: at="g1.out" right=".75" label="'Q' loc='right'"
  Line: at="g2.out" right=".75" label="'$\overline{Q}$' loc='right'"
}
```

---

## Solid State

Source: <https://schemdraw.readthedocs.io/en/stable/gallery/solidstate.html>

### S-1. S-R Latch (Transistors)

```python
with schemdraw.Drawing() as d:
    Q1 = elm.BjtNpn(circle=True).reverse().label('Q1', 'left')
    Q2 = elm.BjtNpn(circle=True).at((d.unit*2, 0)).label('Q2')
    elm.Line().up(d.unit/2).at(Q1.collector)

    R1 = elm.Resistor().up().label('R1').hold()
    elm.Dot().label('V1', 'left')
    elm.Resistor().right(d.unit*.75).label('R3', 'bottom').dot()
    elm.Line().up(d.unit/8).dot(open=True).label('Set', 'right').hold()
    elm.Line().to(Q2.base)

    elm.Line().up(d.unit/2).at(Q2.collector)
    elm.Dot().label('V2', 'right')
    R2 = elm.Resistor().up().label('R2', 'bottom').hold()
    elm.Resistor().left(d.unit*.75).label('R4', 'bottom').dot()
    elm.Line().up(d.unit/8).dot(open=True).label('Reset', 'right').hold()
    elm.Line().to(Q1.base)

    elm.Line().down(d.unit/4).at(Q1.emitter)
    BOT = elm.Line().tox(Q2.emitter)
    elm.Line().to(Q2.emitter)
    elm.Dot().at(BOT.center)
    elm.Ground().at(BOT.center)

    TOP = elm.Line().endpoints(R1.end, R2.end)
    elm.Dot().at(TOP.center)
    elm.Vdd().at(TOP.center).label('+Vcc')
```

```fleming
circuit {
  Q1 {
    BjtNpn: circle=True reverse label="'Q1' loc='left'"
  }
  Q2 {
    BjtNpn: circle=True at="(d.unit*2 0)" label="Q2"
  }
  Line: up="d.unit/2" at="Q1.collector"
  R1 {
    Resistor: up label="R1" hold
  }
  Dot: label="'V1' loc='left'"
  Resistor: right="d.unit*.75" label="'R3' loc='bottom'" dot
  Line: up="d.unit/8" dot="open" label="'Set' loc='right'" hold
  Line: to="Q2.base"
  Line: up="d.unit/2" at="Q2.collector"
  Dot: label="'V2' loc='right'"
  R2 {
    Resistor: up label="'R2' loc='bottom'" hold
  }
  Resistor: left="d.unit*.75" label="'R4' loc='bottom'" dot
  Line: up="d.unit/8" dot="open" label="'Reset' loc='right'" hold
  Line: to="Q1.base"
  Line: down="d.unit/4" at="Q1.emitter"
  BOT {
    Line: tox="Q2.emitter"
  }
  Line: to="Q2.emitter"
  Dot: at="BOT.center"
  Ground: at="BOT.center"
  TOP {
    Line: endpoints="R1.end R2.end"
  }
  Dot: at="TOP.center"
  Vdd: at="TOP.center" label="+Vcc"
}
```

### S-2. 741 Opamp Internal Schematic

```python
with schemdraw.Drawing() as d:
    d.config(fontsize=12, unit=2.5)
    Q1 = elm.BjtNpn().label('Q1').label('+IN', 'left')
    Q3 = elm.BjtPnp().left().at(Q1.emitter).anchor('emitter').flip().label('Q3', 'left')
    elm.Line().down().at(Q3.collector).dot()
    with d.hold():
        elm.Line().right(d.unit/4)
        Q7 = elm.BjtNpn().anchor('base').label('Q7')
    elm.Line().down(d.unit*1.25)
    Q5 = elm.BjtNpn().left().flip().anchor('collector').label('Q5', 'left')
    elm.Line().left(d.unit/2).at(Q5.emitter).label('OFST\nNULL', 'left').flip()
    elm.Resistor().down().at(Q5.emitter).label('R1\n1K')
    elm.Line().right(d.unit*.75).dot()
    R3 = elm.Resistor().up().label('R3\n50K')
    elm.Line().toy(Q5.base).dot()
    with d.hold():
        elm.Line().left().to(Q5.base)
        elm.Line().at(Q7.emitter).toy(Q5.base).dot()
    elm.Line().right(d.unit/4)
    Q6 = elm.BjtNpn().anchor('base').label('Q6')
    elm.Line().at(Q6.emitter).length(d.unit/3).label('\nOFST\nNULL', 'right').hold()
    elm.Resistor().down().at(Q6.emitter).label('R2\n1K').dot()

    elm.Line().at(Q6.collector).toy(Q3.collector)
    Q4 = elm.BjtPnp().right().anchor('collector').label('Q4')
    elm.Line().at(Q4.base).tox(Q3.base)
    elm.Line().at(Q4.emitter).toy(Q1.emitter)
    Q2 = elm.BjtNpn().left().flip().anchor('emitter').label('Q2', 'left').label('$-$IN', 'right')
    elm.Line().up(d.unit/3).at(Q2.collector).dot()
    Q8 = elm.BjtPnp().left().flip().anchor('base').label('Q8', 'left')
    elm.Line().at(Q8.collector).toy(Q2.collector).dot()
    elm.Line().at(Q2.collector).tox(Q1.collector)
    elm.Line().up(d.unit/4).at(Q8.emitter)
    top = elm.Line().tox(Q7.collector)
    elm.Line().toy(Q7.collector)

    elm.Line().right(d.unit*2).at(top.start)
    elm.Line().down(d.unit/4)
    Q9 = elm.BjtPnp().right().anchor('emitter').label('Q9', ofst=-.1)
    elm.Line().at(Q9.base).tox(Q8.base)
    elm.Dot().at(Q4.base)
    elm.Line().down(d.unit/2).at(Q4.base)
    elm.Line().tox(Q9.collector).dot()
    elm.Line().at(Q9.collector).toy(Q6.collector)
    Q10 = elm.BjtNpn().left().flip().anchor('collector').label('Q10', 'left')
    elm.Resistor().at(Q10.emitter).toy(R3.start).label('R4\n5K').dot()

    Q11 = elm.BjtNpn().right().at(Q10.base).anchor('base').label('Q11')
    elm.Dot().at(Q11.base)
    elm.Line().up(d.unit/2)
    elm.Line().tox(Q11.collector).dot()
    elm.Line().at(Q11.emitter).toy(R3.start).dot()
    elm.Line().up(d.unit*2).at(Q11.collector)
    elm.Resistor().toy(Q9.collector).label('R5\n39K')
    Q12 = elm.BjtPnp().left().flip().anchor('collector').label('Q12', 'left', ofst=-.1)
    elm.Line().up(d.unit/4).at(Q12.emitter).dot()
    elm.Line().tox(Q9.emitter).dot()
    elm.Line().right(d.unit/4).at(Q12.base).dot()
    elm.Wire('|-').to(Q12.collector).dot().hold()
    elm.Line().right(d.unit*1.5)
    Q13 = elm.BjtPnp().anchor('base').label('Q13')
    elm.Line().up(d.unit/4).dot()
    elm.Line().tox(Q12.emitter)
    K = elm.Line().down(d.unit/5).at(Q13.collector).dot()
    elm.Line().down()
    Q16 = elm.BjtNpn().right().anchor('collector').label('Q16', ofst=-.1)
    elm.Line().left(d.unit/3).at(Q16.base).dot()
    R7 = elm.Resistor().up().toy(K.end).label('R7\n4.5K').dot()
    elm.Line().tox(Q13.collector).hold()
    R8 = elm.Resistor().down().at(R7.start).label('R8\n7.5K').dot()
    elm.Line().tox(Q16.emitter)
    J = elm.Dot()
    elm.Line().toy(Q16.emitter)
    Q15 = elm.BjtNpn().right().at(R8.end).anchor('collector').label('Q15')
    elm.Line().left(d.unit/2).at(Q15.base).dot()
    C1 = elm.Capacitor().toy(R7.end).label('C1\n30pF')
    elm.Line().tox(Q13.collector)
    elm.Line().at(C1.start).tox(Q6.collector).dot()
    elm.Line().down(d.unit/2).at(J.center)
    Q19 = elm.BjtNpn().right().anchor('collector').label('Q19')
    elm.Line().at(Q19.base).tox(Q15.emitter).dot()
    elm.Line().toy(Q15.emitter).hold()
    elm.Line().down(d.unit/4).at(Q19.emitter).dot()
    elm.Line().left()
    Q22 = elm.BjtNpn().left().anchor('base').flip().label('Q22', 'left')
    elm.Line().at(Q22.collector).toy(Q15.base).dot()
    elm.Line().at(Q22.emitter).toy(R3.start).dot()
    elm.Line().tox(R3.start).hold()
    elm.Line().tox(Q15.emitter).dot()
    with d.hold():
        elm.Resistor().up().label('R12\n50K')
        elm.Line().toy(Q19.base)
    elm.Line().tox(Q19.emitter).dot()
    R11 = elm.Resistor().up().label('R11\n50')
    elm.Line().toy(Q19.emitter)

    elm.Line().up(d.unit/4).at(Q13.emitter)
    elm.Line().right(d.unit*1.5).dot()
    elm.Line().length(d.unit/4).label('V+', 'right').hold()
    elm.Line().down(d.unit*.75)
    Q14 = elm.BjtNpn().right().anchor('collector').label('Q14')
    elm.Line().left(d.unit/2).at(Q14.base)
    with d.hold():
        elm.Line().down(d.unit/2).idot()
        Q17 = elm.BjtNpn().left().anchor('collector').flip().label('Q17', 'left', ofst=-.1)
        elm.Line().at(Q17.base).tox(Q14.emitter).dot()
        J = elm.Line().toy(Q14.emitter)
    elm.Line().tox(Q13.collector).dot()
    elm.Resistor().down().at(J.start).label('R9\n25').dot()
    elm.Wire('-|').to(Q17.emitter).hold()
    elm.Line().down(d.unit/4).dot()
    elm.Line().right(d.unit/4).label('OUT', 'right').hold()
    elm.Resistor().down().label('R10\n50')
    Q20 = elm.BjtPnp().right().anchor('emitter').label('Q20')
    elm.Wire('c', k=-1).at(Q20.base).to(Q15.collector)
    elm.Line().at(Q20.collector).toy(R3.start).dot()
    elm.Line().right(d.unit/4).label('V-', 'right').hold()
    elm.Line().tox(R11.start)
```

```fleming
circuit {
  config: fontsize="12" unit="2.5"
  Q1 {
    BjtNpn: label="Q1" label="'+IN' loc='left'"
  }
  Q3 {
    BjtPnp: left at="Q1.emitter" anchor="emitter" flip label="'Q3' loc='left'"
  }
  Line: down at="Q3.collector" dot
  hold {
    Line: right="d.unit/4"
    Q7 {
      BjtNpn: anchor="base" label="Q7"
    }
  }
  Line: down="d.unit*1.25"
  Q5 {
    BjtNpn: left flip anchor="collector" label="'Q5' loc='left'"
  }
  Line: left="d.unit/2" at="Q5.emitter" label="'OFST\nNULL' loc='left'" flip
  Resistor: down at="Q5.emitter" label="'R1\n1K'"
  Line: right="d.unit*.75" dot
  R3 {
    Resistor: up label="'R3\n50K'"
  }
  Line: toy="Q5.base" dot
  hold {
    Line: to="Q5.base"
    Line: at="Q7.emitter" toy="Q5.base" dot
  }
  Line: right="d.unit/4"
  Q6 {
    BjtNpn: anchor="base" label="Q6"
  }
  Line: at="Q6.emitter" length="d.unit/3" label="'\nOFST\nNULL' loc='right'" hold
  Resistor: down at="Q6.emitter" label="'R2\n1K'" dot
  Line: at="Q6.collector" toy="Q3.collector"
  Q4 {
    BjtPnp: right anchor="collector" label="Q4"
  }
  Line: at="Q4.base" tox="Q3.base"
  Line: at="Q4.emitter" toy="Q1.emitter"
  Q2 {
    BjtNpn: left flip anchor="emitter" label="'Q2' loc='left'" label="'$-$IN' loc='right'"
  }
  Line: up="d.unit/3" at="Q2.collector" dot
  Q8 {
    BjtPnp: left flip anchor="base" label="'Q8' loc='left'"
  }
  Line: at="Q8.collector" toy="Q2.collector" dot
  Line: at="Q2.collector" tox="Q1.collector"
  Line: up="d.unit/4" at="Q8.emitter"
  top {
    Line: tox="Q7.collector"
  }
  Line: toy="Q7.collector"
  Line: right="d.unit*2" at="top.start"
  Line: down="d.unit/4"
  Q9 {
    BjtPnp: right anchor="emitter" label="'Q9' ofst=-.1"
  }
  Line: at="Q9.base" tox="Q8.base"
  Dot: at="Q4.base"
  Line: down="d.unit/2" at="Q4.base"
  Line: tox="Q9.collector" dot
  Line: at="Q9.collector" toy="Q6.collector"
  Q10 {
    BjtNpn: left flip anchor="collector" label="'Q10' loc='left'"
  }
  Resistor: at="Q10.emitter" toy="R3.start" label="'R4\n5K'" dot
  Q11 {
    BjtNpn: right at="Q10.base" anchor="base" label="Q11"
  }
  Dot: at="Q11.base"
  Line: up="d.unit/2"
  Line: tox="Q11.collector" dot
  Line: at="Q11.emitter" toy="R3.start" dot
  Line: up="d.unit*2" at="Q11.collector"
  Resistor: toy="Q9.collector" label="'R5\n39K'"
  Q12 {
    BjtPnp: left flip anchor="collector" label="'Q12' loc='left' ofst=-.1"
  }
  Line: up="d.unit/4" at="Q12.emitter" dot
  Line: tox="Q9.emitter" dot
  Line: right="d.unit/4" at="Q12.base" dot
  Wire: shape="|-" to="Q12.collector" dot hold
  Line: right="d.unit*1.5"
  Q13 {
    BjtPnp: anchor="base" label="Q13"
  }
  Line: up="d.unit/4" dot
  Line: tox="Q12.emitter"
  K {
    Line: down="d.unit/5" at="Q13.collector" dot
  }
  Line: down
  Q16 {
    BjtNpn: right anchor="collector" label="'Q16' ofst=-.1"
  }
  Line: left="d.unit/3" at="Q16.base" dot
  R7 {
    Resistor: up toy="K.end" label="'R7\n4.5K'" dot
  }
  Line: tox="Q13.collector" hold
  R8 {
    Resistor: down at="R7.start" label="'R8\n7.5K'" dot
  }
  Line: tox="Q16.emitter"
  J {
    Dot:
  }
  Line: toy="Q16.emitter"
  Q15 {
    BjtNpn: right at="R8.end" anchor="collector" label="Q15"
  }
  Line: left="d.unit/2" at="Q15.base" dot
  C1 {
    Capacitor: toy="R7.end" label="'C1\n30pF'"
  }
  Line: tox="Q13.collector"
  Line: at="C1.start" tox="Q6.collector" dot
  Line: down="d.unit/2" at="J.center"
  Q19 {
    BjtNpn: right anchor="collector" label="Q19"
  }
  Line: at="Q19.base" tox="Q15.emitter" dot
  Line: toy="Q15.emitter" hold
  Line: down="d.unit/4" at="Q19.emitter" dot
  Line: left
  Q22 {
    BjtNpn: left anchor="base" flip label="'Q22' loc='left'"
  }
  Line: at="Q22.collector" toy="Q15.base" dot
  Line: at="Q22.emitter" toy="R3.start" dot
  Line: tox="R3.start" hold
  Line: tox="Q15.emitter" dot
  hold {
    Resistor: up label="'R12\n50K'"
    Line: toy="Q19.base"
  }
  Line: tox="Q19.emitter" dot
  R11 {
    Resistor: up label="'R11\n50'"
  }
  Line: toy="Q19.emitter"
  Line: up="d.unit/4" at="Q13.emitter"
  Line: right="d.unit*1.5" dot
  Line: length="d.unit/4" label="'V+' loc='right'" hold
  Line: down="d.unit*.75"
  Q14 {
    BjtNpn: right anchor="collector" label="Q14"
  }
  Line: left="d.unit/2" at="Q14.base"
  hold {
    Line: down="d.unit/2" idot
    Q17 {
      BjtNpn: left anchor="collector" flip label="'Q17' loc='left' ofst=-.1"
    }
    Line: at="Q17.base" tox="Q14.emitter" dot
    JL {
      Line: toy="Q14.emitter"
    }
  }
  Line: tox="Q13.collector" dot
  Resistor: down at="JL.start" label="'R9\n25'" dot
  Wire: shape="-|" to="Q17.emitter" hold
  Line: down="d.unit/4" dot
  Line: right="d.unit/4" label="'OUT' loc='right'" hold
  Resistor: down label="'R10\n50'"
  Q20 {
    BjtPnp: right anchor="emitter" label="Q20"
  }
  Wire: shape="c" k="-1" at="Q20.base" to="Q15.collector"
  Line: at="Q20.collector" toy="R3.start" dot
  Line: right="d.unit/4" label="'V-' loc='right'" hold
  Line: tox="R11.start"
}
```

> schemdraw reuses `J` for both a Dot and a Line, so the second Line is named `JL` in the fleming version.

---

## Integrated Circuits

Source: <https://schemdraw.readthedocs.io/en/stable/gallery/ic.html>

### I-1. 555 LED Blinker Circuit

```python
with schemdraw.Drawing() as d:
    d.config(fontsize=12)
    T = (elm.Ic()
         .side('L', spacing=1.5, pad=1.5, leadlen=1)
         .side('R', spacing=2)
         .side('T', pad=1.5, spacing=1)
         .pin(name='TRG', side='left', pin='2')
         .pin(name='THR', side='left', pin='6')
         .pin(name='DIS', side='left', pin='7')
         .pin(name='CTL', side='right', pin='5')
         .pin(name='OUT', side='right', pin='3')
         .pin(name='RST', side='top', pin='4')
         .pin(name='Vcc', side='top', pin='8')
         .pin(name='GND', side='bot', pin='1')
         .label('555'))
    BOT = elm.Ground().at(T.GND)
    elm.Dot()
    elm.Resistor().endpoints(T.DIS, T.THR).label('Rb').idot()
    elm.Resistor().up().at(T.DIS).label('Ra').label('+Vcc', 'right')
    elm.Line().endpoints(T.THR, T.TRG)
    elm.Capacitor().at(T.TRG).toy(BOT.start).label('C')
    elm.Line().tox(BOT.start)
    elm.Capacitor().at(T.CTL).toy(BOT.start).label(r'.01$\mu$F', 'bottom').dot()
    elm.Dot().at(T.DIS)
    elm.Dot().at(T.THR)
    elm.Dot().at(T.TRG)
    elm.Line().endpoints(T.RST,T.Vcc).dot()
    elm.Line().up(d.unit/4).label('+Vcc', 'right')
    elm.Resistor().right().at(T.OUT).label('330')
    elm.LED().flip().toy(BOT.start)
    elm.Line().tox(BOT.start)
```

```fleming
circuit {
  config: fontsize="12"
  T {
    Ic: side="L spacing=1.5 pad=1.5 leadlen=1" side="R spacing=2" side="T pad=1.5 spacing=1" pin="L TRG 2" pin="L THR 6" pin="L DIS 7" pin="R CTL 5" pin="R OUT 3" pin="T RST 4" pin="T Vcc 8" pin="B GND 1" label="555"
  }
  BOT {
    Ground: at="T.GND"
  }
  Dot: at="T.GND"
  Resistor: endpoints="T.DIS T.THR" label="Rb" idot
  Resistor: up at="T.DIS" label="Ra" label="'+Vcc' loc='right'"
  Line: endpoints="T.THR T.TRG"
  Capacitor: at="T.TRG" toy="BOT.start" label="C"
  Line: tox="BOT.start"
  Capacitor: at="T.CTL" toy="BOT.start" label="'.01$\mu$F' loc='bot'" dot
  Dot: at="T.DIS"
  Dot: at="T.THR"
  Dot: at="T.TRG"
  Line: endpoints="T.RST T.Vcc" dot
  Line: up="d.unit/4" label="'+Vcc' loc='right'"
  Resistor: right at="T.OUT" label="330"
  LED: flip toy="BOT.start"
  Line: tox="BOT.start"
}
```

### I-2. Seven-Segment Display Counter

```python
with schemdraw.Drawing() as d:
    d.config(fontsize=12)
    IC555 = elm.Ic555(size=(5,8))
    gnd = elm.Ground().at(IC555.GND)
    elm.Dot()
    elm.Resistor().endpoints(IC555.DIS, IC555.THR).label('100 kΩ')
    elm.Resistor().up().at(IC555.DIS).label('1 kΩ').label('+Vcc', 'right')
    elm.Line().endpoints(IC555.THR, IC555.TRG)
    elm.Capacitor(polar=True).at(IC555.TRG).toy(gnd.start).label('10 μF')
    elm.Line().tox(gnd.start)
    elm.Capacitor().at(IC555.CTL).toy(gnd.start).label('.01 μF', 'bottom')
    elm.Line().tox(gnd.start)

    elm.Dot().at(IC555.DIS)
    elm.Dot().at(IC555.THR)
    elm.Dot().at(IC555.TRG)
    elm.Line().endpoints(IC555.RST,IC555.Vcc).dot()
    elm.Line().up(d.unit/4).label('+Vcc', 'right')
    d.move_from(IC555.OUT, dx=5, dy=-1)

    IC4026 = (elm.Ic()
              .pin('L', 'CLK', pin='1')
              .pin('L', 'INH', pin='2') # Inhibit
              .pin('L', 'RST', pin='15')
              .pin('L', 'DEI', pin='3') # Display Enable In
              .pin('B', 'Vss', pin='8')
              .pin('T', 'Vdd', pin='16')
              .pin('B', 'UCS', pin='14') # Ungated C Segment
              .pin('B', 'DEO', pin='4')  # Display Enable Out
              .pin('B', 'Co', pin='4')   # Carry out
              .pin('R', 'g', pin='7')
              .pin('R', 'f', pin='6')
              .pin('R', 'e', pin='11')
              .pin('R', 'd', pin='9')
              .pin('R', 'c', pin='13')
              .pin('R', 'b', pin='12')
              .pin('R', 'a', pin='10')
              .side('B', spacing=1, pad=.75, leadlen=.75)
              .side('L', spacing=1, pad=1.5, leadlen=.6)
              .label('4026').right().anchor('center'))
    elm.Wire('c').at(IC555.OUT).to(IC4026.CLK)
    elm.Line().endpoints(IC4026.INH, IC4026.RST).dot()
    elm.Line().left(d.unit/4)
    elm.Ground()
    elm.Wire('|-').at(IC4026.DEI).to(IC4026.Vdd).dot()
    elm.Line().up(d.unit/4).label('+Vcc', 'right')
    elm.Line().at(IC4026.Vss).tox(IC4026.UCS).dot()
    elm.Ground()
    elm.Line().tox(IC4026.DEO).dot()
    elm.Line().tox(IC4026.Co)

    elm.Resistor().right().at(IC4026.a)
    disp = elm.SevenSegment(cathode=True).anchor('a')
    elm.Resistor().at(IC4026.b)
    elm.Resistor().at(IC4026.c)
    elm.Resistor().at(IC4026.d)
    elm.Resistor().at(IC4026.e)
    elm.Resistor().at(IC4026.f)
    elm.Resistor().at(IC4026.g).label('7 x 330', loc='bottom')
    elm.Ground(lead=False).at(disp.cathode)
```

```fleming
circuit {
  config: fontsize="12"
  IC555 {
    Ic555: size="(5 8)"
  }
  gnd {
    Ground: at="IC555.GND"
  }
  Dot: at="IC555.GND"
  Resistor: endpoints="IC555.DIS IC555.THR" label="100 kΩ"
  Resistor: up at="IC555.DIS" label="1 kΩ" label="'+Vcc' loc='right'"
  Line: endpoints="IC555.THR IC555.TRG"
  Capacitor: polar=True at="IC555.TRG" toy="gnd.start" label="10 μF"
  Line: tox="gnd.start"
  Capacitor: at="IC555.CTL" toy="gnd.start" label="'.01 μF' loc='bot'"
  Line: tox="gnd.start"
  Dot: at="IC555.DIS"
  Dot: at="IC555.THR"
  Dot: at="IC555.TRG"
  Line: endpoints="IC555.RST IC555.Vcc" dot
  Line: up="d.unit/4" label="'+Vcc' loc='right'"
  move_from: at="IC555.OUT" dx="5" dy="-1"
  IC4026 {
    Ic: pin="L CLK 1" pin="L INH 2" pin="L RST 15" pin="L DEI 3" pin="B Vss 8" pin="T Vdd 16" pin="B UCS 14" pin="B DEO 4" pin="B Co 4" pin="R g 7" pin="R f 6" pin="R e 11" pin="R d 9" pin="R c 13" pin="R b 12" pin="R a 10" side="B spacing=1 pad=.75 leadlen=.75" side="L spacing=1 pad=1.5 leadlen=.6" label="4026" right anchor="center"
  }
  Wire: shape="c" at="IC555.OUT" to="IC4026.CLK"
  Line: endpoints="IC4026.INH IC4026.RST" dot
  Line: left="d.unit/4"
  Ground:
  Wire: shape="|-" at="IC4026.DEI" to="IC4026.Vdd" dot
  Line: up="d.unit/4" label="'+Vcc' loc='right'"
  Line: at="IC4026.Vss" tox="IC4026.UCS" dot
  Ground:
  Line: tox="IC4026.DEO" dot
  Line: tox="IC4026.Co"
  Resistor: right at="IC4026.a"
  disp {
    SevenSegment: cathode=True anchor="a"
  }
  Resistor: at="IC4026.b"
  Resistor: at="IC4026.c"
  Resistor: at="IC4026.d"
  Resistor: at="IC4026.e"
  Resistor: at="IC4026.f"
  Resistor: at="IC4026.g" label="'7 x 330' loc='bot'"
  Ground: lead=False at="disp.cathode"
}
```

### I-3. Arduino Board

```python
class Atmega328(elm.Ic):
    def __init__(self, *args, **kwargs):
        pins=[elm.IcPin(name='PD0', pin='2', side='r', slot='1/22'),
              elm.IcPin(name='PD1', pin='3', side='r', slot='2/22'),
              elm.IcPin(name='PD2', pin='4', side='r', slot='3/22'),
              elm.IcPin(name='PD3', pin='5', side='r', slot='4/22'),
              elm.IcPin(name='PD4', pin='6', side='r', slot='5/22'),
              elm.IcPin(name='PD5', pin='11', side='r', slot='6/22'),
              elm.IcPin(name='PD6', pin='12', side='r', slot='7/22'),
              elm.IcPin(name='PD7', pin='13', side='r', slot='8/22'),
              elm.IcPin(name='PC0', pin='23', side='r', slot='10/22'),
              elm.IcPin(name='PC1', pin='24', side='r', slot='11/22'),
              elm.IcPin(name='PC2', pin='25', side='r', slot='12/22'),
              elm.IcPin(name='PC3', pin='26', side='r', slot='13/22'),
              elm.IcPin(name='PC4', pin='27', side='r', slot='14/22'),
              elm.IcPin(name='PC5', pin='28', side='r', slot='15/22'),
              elm.IcPin(name='PB0', pin='14', side='r', slot='17/22'),
              elm.IcPin(name='PB1', pin='15', side='r', slot='18/22'),
              elm.IcPin(name='PB2', pin='16', side='r', slot='19/22'),
              elm.IcPin(name='PB3', pin='17', side='r', slot='20/22'),
              elm.IcPin(name='PB4', pin='18', side='r', slot='21/22'),
              elm.IcPin(name='PB5', pin='19', side='r', slot='22/22'),

              elm.IcPin(name='RESET', side='l', slot='22/22', invert=True, pin='1'),
              elm.IcPin(name='XTAL2', side='l', slot='19/22', pin='10'),
              elm.IcPin(name='XTAL1', side='l', slot='17/22', pin='9'),
              elm.IcPin(name='AREF', side='l', slot='15/22', pin='21'),
              elm.IcPin(name='AVCC', side='l', slot='14/22', pin='20'),
              elm.IcPin(name='AGND', side='l', slot='13/22', pin='22'),
              elm.IcPin(name='VCC', side='l', slot='11/22', pin='7'),
              elm.IcPin(name='GND', side='l', slot='10/22', pin='8')]
        super().__init__(pins=pins, size=(5, 15), pinspacing=0.6, plblofst=.05, botlabel='ATMEGA328', **kwargs)


with schemdraw.Drawing() as d:
    d.config(fontsize=11, inches_per_unit=.4)
    Q1 = Atmega328()
    JP4 = (elm.Header(rows=10, shownumber=True,
                      pinsright=['D8', 'D9', 'D10', 'D11', 'D12', 'D13', '', '', '', ''],
                      pinalignright='center')
                .flip().at(Q1.PB5, dx=4, dy=1).anchor('pin6').label('JP4', fontsize=10))

    JP3 = (elm.Header(rows=6, shownumber=True, pinsright=['A0', 'A1', 'A2', 'A3', 'A4', 'A5'], pinalignright='center')
                        .flip().at(Q1.PC5, dx=4).anchor('pin6').label('JP3', fontsize=10))

    JP2 = (elm.Header(rows=8, shownumber=True, pinsright=['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
                      pinalignright='center')).at(Q1.PD7, dx=3).flip().anchor('pin8').label('JP2', fontsize=10)

    elm.OrthoLines(n=6).at(Q1.PB5).to(JP4.pin6)
    elm.OrthoLines(n=6).at(Q1.PC5).to(JP3.pin6)
    elm.OrthoLines(n=8).at(Q1.PD7).to(JP2.pin8)

    elm.Line().left(.9).at(JP4.pin7).label('GND', 'left')
    elm.Line().left(.9).at(JP4.pin8).label('AREF', 'left')
    elm.Line().left(.9).at(JP4.pin9).label('AD4/SDA', 'left')
    elm.Line().left(.9).at(JP4.pin10).label('AD5/SCL', 'left')

    JP1 = (elm.Header(rows=6, shownumber=True, pinsright=['VCC', 'RXD', 'TXD', 'DTR', 'RTS', 'GND'],
                      pinalignright='center').right().at(Q1.PD0, dx=4, dy=-2).anchor('pin1'))
    elm.Line().left(d.unit/2).at(JP1.pin1)
    elm.Vdd().label('+5V')
    elm.Line().left().at(JP1.pin2)
    elm.Line().toy(Q1.PD0).dot()
    elm.Line().left(d.unit+.6).at(JP1.pin3)
    elm.Line().toy(Q1.PD1).dot()
    elm.Line().left(d.unit/2).at(JP1.pin6)
    elm.Ground()

    elm.Line().left(d.unit*2).at(Q1.XTAL2).dot()
    with d.hold():
        elm.Capacitor().left(d.unit/2).scale(.75)
        elm.Line().toy(Q1.XTAL1).dot()
        elm.Ground()
        elm.Capacitor().right(d.unit/2).scale(.75).dot()
    elm.Crystal().toy(Q1.XTAL1).label('16MHz', 'bottom')
    elm.Line().tox(Q1.XTAL1)

    elm.Line().left(d.unit/3).at(Q1.AREF).label('AREF', 'left')
    elm.Line().left(1.5*d.unit).at(Q1.AVCC)
    elm.Vdd().label('+5V')
    elm.Line().toy(Q1.VCC).dot().idot()
    elm.Line().tox(Q1.VCC).hold()
    elm.Capacitor().down().label('100n')
    GND = elm.Ground()

    elm.Line().left().at(Q1.AGND)
    elm.Line().toy(Q1.GND).dot()
    elm.Line().tox(Q1.GND).hold()
    elm.Wire('|-').to(GND.center).dot()

    elm.Line().left().at(Q1.RESET).dot()
    with d.hold():
        elm.RBox().up().label('10K')
        elm.Vdd().label('+5V')
    elm.Line().left().dot()
    with d.hold():
        RST = elm.Button().up().label('Reset')
        elm.Line().left(d.unit/2)
        elm.Ground()

    elm.Capacitor().left().at(JP1.pin4).label('100n', 'bottom')
    elm.Wire('c', k=-16).to(RST.start)
```

```fleming
circuit {
  config: fontsize="11" inches_per_unit="0.4"
  Q1 {
    Ic: size="(5 15)" pinspacing="0.6" plblofst="0.05" botlabel="ATMEGA328",
        pin="R PD0 2 slot=1/22",
        pin="R PD1 3 slot=2/22",
        pin="R PD2 4 slot=3/22",
        pin="R PD3 5 slot=4/22",
        pin="R PD4 6 slot=5/22",
        pin="R PD5 11 slot=6/22",
        pin="R PD6 12 slot=7/22",
        pin="R PD7 13 slot=8/22",
        pin="R PC0 23 slot=10/22",
        pin="R PC1 24 slot=11/22",
        pin="R PC2 25 slot=12/22",
        pin="R PC3 26 slot=13/22",
        pin="R PC4 27 slot=14/22",
        pin="R PC5 28 slot=15/22",
        pin="R PB0 14 slot=17/22",
        pin="R PB1 15 slot=18/22",
        pin="R PB2 16 slot=19/22",
        pin="R PB3 17 slot=20/22",
        pin="R PB4 18 slot=21/22",
        pin="R PB5 19 slot=22/22",
        pin="L RESET 1 slot=22/22 invert",
        pin="L XTAL2 10 slot=19/22",
        pin="L XTAL1 9 slot=17/22",
        pin="L AREF 21 slot=15/22",
        pin="L AVCC 20 slot=14/22",
        pin="L AGND 22 slot=13/22",
        pin="L VCC 7 slot=11/22",
        pin="L GND 8 slot=10/22",
  }
  JP4 {
    Header: rows="10" shownumber=True pinsright="['D8' 'D9' 'D10' 'D11' 'D12' 'D13' '' '' '' '']" pinalignright="center" flip at="Q1.PB5" dx="4" dy="1" anchor="pin6" label="'JP4' fontsize=10"
  }
  JP3 {
    Header: rows="6" shownumber=True pinsright="['A0' 'A1' 'A2' 'A3' 'A4' 'A5']" pinalignright="center" flip at="Q1.PC5" dx="4" anchor="pin6" label="'JP3' fontsize=10"
  }
  JP2 {
    Header: rows="8" shownumber=True pinsright="['D0' 'D1' 'D2' 'D3' 'D4' 'D5' 'D6' 'D7']" pinalignright="center" flip at="Q1.PD7" dx="3" anchor="pin8" label="'JP2' fontsize=10"
  }
  OrthoLines: n="6" at="Q1.PB5" to="JP4.pin6"
  OrthoLines: n="6" at="Q1.PC5" to="JP3.pin6"
  OrthoLines: n="8" at="Q1.PD7" to="JP2.pin8"
  Line: left=".9" at="JP4.pin7" label="'GND' loc='left'"
  Line: left=".9" at="JP4.pin8" label="'AREF' loc='left'"
  Line: left=".9" at="JP4.pin9" label="'AD4/SDA' loc='left'"
  Line: left=".9" at="JP4.pin10" label="'AD5/SCL' loc='left'"
  JP1 {
    Header: rows="6" shownumber=True pinsright="['VCC' 'RXD' 'TXD' 'DTR' 'RTS' 'GND']" pinalignright="center" right at="Q1.PD0" dx="4" dy="-2" anchor="pin1"
  }
  Line: left="d.unit/2" at="JP1.pin1"
  Vdd: label="'+5V'"
  Line: left at="JP1.pin2"
  Line: toy="Q1.PD0" dot
  Line: left="d.unit+.6" at="JP1.pin3"
  Line: toy="Q1.PD1" dot
  Line: left="d.unit/2" at="JP1.pin6"
  Ground:
  Line: left="d.unit*2" at="Q1.XTAL2" dot
  hold {
    Capacitor: left="d.unit/2" scale=".75"
    Line: toy="Q1.XTAL1" dot
    Ground:
    Capacitor: right="d.unit/2" scale=".75" dot
  }
  Crystal: toy="Q1.XTAL1" label="'16MHz' loc='bot'"
  Line: tox="Q1.XTAL1"
  Line: left="d.unit/3" at="Q1.AREF" label="'AREF' loc='left'"
  Line: left="1.5*d.unit" at="Q1.AVCC"
  Vdd: label="'+5V'"
  Line: toy="Q1.VCC" dot idot
  Line: tox="Q1.VCC" hold
  Capacitor: down label="'100n'"
  GND {
    Ground:
  }
  Line: left at="Q1.AGND"
  Line: toy="Q1.GND" dot
  Line: tox="Q1.GND" hold
  Wire: shape="|-" to="GND.center" dot
  Line: left at="Q1.RESET" dot
  hold {
    RBox: up label="'10K'"
    Vdd: label="'+5V'"
  }
  Line: left dot
  hold {
    RST {
      Button: up label="'Reset'"
    }
    Line: left="d.unit/2"
    Ground:
  }
  Capacitor: left at="JP1.pin4" label="'100n' loc='bot'"
  Wire: shape="c" k="-16" to="RST.start"
}
```

### I-4. 741 Opamp, DIP Layout

```python
with schemdraw.Drawing() as d:
    Q = (elm.IcDIP(pins=8)
                 .label('Offset Null', loc='p1', fontsize=10)
                 .label('Inverting Input', loc='p2', fontsize=10)
                 .label('Non-inverting Input', loc='p3', fontsize=10)
                 .label('V-', loc='p4', fontsize=10)
                 .label('Offset Null', loc='p5', fontsize=10)
                 .label('Output', loc='p6', fontsize=10)
                 .label('V+', loc='p7', fontsize=10)
                 .label('NC', loc='p8', fontsize=10))
    elm.Line().at(Q.p2_in).length(d.unit/5)
    op = elm.Opamp().anchor('in1').scale(.8)
    elm.Line().at(Q.p3_in).length(d.unit/5)
    elm.Wire('c', k=.3).at(op.out).to(Q.p6_in)
    elm.Wire('-|').at(Q.p4_in).to(op.n1)
    elm.Wire('-|').at(Q.p7_in).to(op.n2)
```

```fleming
circuit {
  Q {
    IcDIP: pins="8",
     label="'Offset Null' loc='p1' fontsize=10",
     label="'Inverting Input' loc='p2' fontsize=10",
     label="'Non-inverting Input' loc='p3' fontsize=10",
     label="'V-' loc='p4' fontsize=10",
     label="'Offset Null' loc='p5' fontsize=10",
     label="'Output' loc='p6' fontsize=10",
     label="'V+' loc='p7' fontsize=10",
     label="'NC' loc='p8' fontsize=10",
  }
  Line: at="Q.p2_in" length="d.unit/5"
  op {
    Opamp: anchor="in1" scale=".8"
  }
  Line: at="Q.p3_in" length="d.unit/5"
  Wire: shape="c" k=".3" at="op.out" to="Q.p6_in"
  Wire: shape="-|" at="Q.p4_in" to="op.n1"
  Wire: shape="-|" at="Q.p7_in" to="op.n2"
}
```

---

## Signal Processing

Source: <https://schemdraw.readthedocs.io/en/stable/gallery/signalproc.html>

### P-1. Various Networks (1st figure: delay and integrator feedback)

```python
with schemdraw.Drawing() as d:
    dsp.Line().length(d.unit/3).label('in')
    inpt = dsp.Dot()
    dsp.Arrow().length(d.unit/3)
    delay = dsp.Box(w=2, h=2).anchor('W').label('Delay\nT')
    dsp.Arrow().right(d.unit/2).at(delay.E)
    sm = dsp.SumSigma()
    dsp.Arrow().at(sm.E).length(d.unit/2)
    intg = dsp.Box(w=2, h=2).anchor('W').label(r'$\int$')
    dsp.Arrow().right(d.unit/2).at(intg.E).label('out', loc='right')
    dsp.Line().down(d.unit/2).at(inpt.center)
    dsp.Line().tox(sm.S)
    dsp.Arrow().toy(sm.S).label('+', loc='bot')
```

```fleming
circuit {
  Line: right="d.unit/3" label="in"
  inpt {
    Dot:
  }
  Arrow: right="d.unit/3"
  delay {
    Box: w="2" h="2" anchor="W" label="'Delay\nT'"
  }
  Arrow: right="d.unit/2" at="delay.E"
  sm {
    SumSigma:
  }
  Arrow: at="sm.E" length="d.unit/2"
  intg {
    Box: w="2" h="2" anchor="W" label="'$\int$'"
  }
  Arrow: right="d.unit/2" at="intg.E" label="'out' loc='right'"
  Line: down="d.unit/2" at="inpt.center"
  Line: tox="sm.S"
  Arrow: toy="sm.S" label="'+' loc='bot'"
}
```

### P-2. Various Networks (2nd figure: parallel feedback coupling)

```python
with schemdraw.Drawing() as d:
    d.config(fontsize=14)
    dsp.Line().length(d.unit/2).label('F(s)').dot()
    with d.hold():
        dsp.Line().up(d.unit/2)
        dsp.Arrow().right(d.unit/2)
        h1 = dsp.Box(w=2, h=2).anchor('W').label('$H_1(s)$')
    dsp.Line().down(d.unit/2)
    dsp.Arrow().right(d.unit/2)
    h2 = dsp.Box(w=2, h=2).anchor('W').label('$H_2(s)$')
    sm = dsp.SumSigma().right().at((h1.E[0] + d.unit/2, 0)).anchor('center')
    dsp.Line().at(h1.E).tox(sm.N)
    dsp.Arrow().toy(sm.N)
    dsp.Line().at(h2.E).tox(sm.S)
    dsp.Arrow().toy(sm.S)
    dsp.Arrow().right(d.unit/3).at(sm.E).label('Y(s)', 'right')
```

```fleming
circuit {
  config: fontsize="14"
  Line: length="d.unit/2" label="F(s)" dot
  hold {
    Line: up="d.unit/2"
    Arrow: right="d.unit/2"
    h1 {
      Box: w="2" h="2" anchor="W" label="'$H_1(s)$'"
    }
  }
  Line: down="d.unit/2"
  Arrow: right="d.unit/2"
  h2 {
    Box: w="2" h="2" anchor="W" label="'$H_2(s)$'"
  }
  sm {
    SumSigma: right at="(h1.E.x+d.unit/2 0)" anchor="center"
  }
  Line: at="h1.E" tox="sm.N"
  Arrow: toy="sm.N"
  Line: at="h2.E" tox="sm.S"
  Arrow: toy="sm.S"
  Arrow: right="d.unit/3" at="sm.E" label="'Y(s)' loc='right'"
}
```

### P-3. Superheterodyne Receiver

```python
with schemdraw.Drawing() as d:
    d.config(fontsize=12)
    dsp.Antenna()
    dsp.Line().right(d.unit/4)
    dsp.Filter(response='bp').fill('thistle').anchor('W').label('RF filter\n#1', 'bottom', ofst=.2)
    dsp.Line().length(d.unit/4)
    dsp.Amp().fill('lightblue').label('LNA')
    dsp.Line().length(d.unit/4)
    dsp.Filter(response='bp').anchor('W').fill('thistle').label('RF filter\n#2', 'bottom', ofst=.2)
    dsp.Line().length(d.unit/3)
    mix = dsp.Mixer().fill('navajowhite').label('Mixer')
    dsp.Line().at(mix.S).down(d.unit/3)
    dsp.Oscillator().right().anchor('N').fill('navajowhite').label('Local\nOscillator', 'right', ofst=.2)
    dsp.Line().at(mix.E).right(d.unit/3)
    dsp.Filter(response='bp').anchor('W').fill('thistle').label('IF filter', 'bottom', ofst=.2)
    dsp.Line().right(d.unit/4)
    dsp.Amp().fill('lightblue').label('IF\namplifier')
    dsp.Line().length(d.unit/4)
    dsp.Demod().anchor('W').fill('navajowhite').label('Demodulator', 'bottom', ofst=.2)
    dsp.Arrow().right(d.unit/3)
```

```fleming
circuit {
  config: fontsize="12"
  Antenna:
  Line: right="d.unit/4"
  Filter: response="bp" fill="thistle" anchor="W" label="'RF filter\n#1' loc='bottom' ofst=.2"
  Line: length="d.unit/4"
  Amp: fill="lightblue" label="LNA"
  Line: length="d.unit/4"
  Filter: response="bp" anchor="W" fill="thistle" label="'RF filter\n#2' loc='bottom' ofst=.2"
  Line: length="d.unit/3"
  mix {
    Mixer: fill="navajowhite" label="Mixer"
  }
  Line: at="mix.S" down="d.unit/3"
  Oscillator: right anchor="N" fill="navajowhite" label="'Local\nOscillator' loc='right' ofst=.2"
  Line: at="mix.E" right="d.unit/3"
  Filter: response="bp" anchor="W" fill="thistle" label="'IF filter' loc='bottom' ofst=.2"
  Line: right="d.unit/4"
  Amp: fill="lightblue" label="'IF\namplifier'"
  Line: length="d.unit/4"
  Demod: anchor="W" fill="navajowhite" label="'Demodulator' loc='bottom' ofst=.2"
  Arrow: right="d.unit/3"
}
```

### P-4. Direct Conversion Receiver

```python
with schemdraw.Drawing() as d:
    dsp.Antenna()
    dsp.Arrow().right(d.unit/2).label('$f_{RF}$', 'bot')
    dsp.Amp().label('LNA')
    dsp.Line().right(d.unit/5).dot()
    with d.hold():
        dsp.Line().length(d.unit/4)
        mix1 = dsp.Mixer().label('Mixer', ofst=0)
        dsp.Arrow().length(d.unit/2)
        lpf1 = dsp.Filter(response='lp').label('LPF', 'bot', ofst=.2)
        dsp.Line().length(d.unit/6)
        adc1 = dsp.Adc().label('ADC')
        dsp.Arrow().length(d.unit/3)
        dsp1 = dsp.Ic(pins=[dsp.IcPin(side='L'), dsp.IcPin(side='L'), dsp.IcPin(side='R')],
                    size=(2.75, 5), leadlen=0).anchor('inL2').label('DSP')
        dsp.Arrow().at(dsp1.inR1).length(d.unit/3)

    dsp.Line().toy(dsp1.inL1)
    dsp.Arrow().tox(mix1.W)
    mix2 = dsp.Mixer().label('Mixer', ofst=0)
    dsp.Arrow().tox(lpf1.W)
    dsp.Filter(response='lp').label('LPF', 'bot', ofst=.2)
    dsp.Line().tox(adc1.W)
    dsp.Adc().label('ADC')
    dsp.Arrow().to(dsp1.inL1)

    dsp.Arrow().down(d.unit/6).reverse().at(mix1.S)
    dsp.Line().left(d.unit*1.25)
    dsp.Line().down(d.unit*.75)
    flo = dsp.Dot().label('$f_{LO}$', 'left')
    with d.hold():
        dsp.Line().down(d.unit/5)
        dsp.Oscillator().right().anchor('N').label('LO', 'left', ofst=.15)
    dsp.Arrow().down(d.unit/4).reverse().at(mix2.S)
    b1 = dsp.Square().right().label('90°').anchor('N')
    dsp.Arrow().left(d.unit/4).reverse().at(b1.W)
    dsp.Wire('c', k=-1).to(flo.center)
```

```fleming
circuit {
  Antenna:
  Arrow: right="d.unit/2" label="'$f_{RF}$' loc='bot'"
  Amp: label="LNA"
  Line: right="d.unit/5" dot
  hold {
    Line: length="d.unit/4"
    mix1 {
      Mixer: label="'Mixer' ofst=0"
    }
    Arrow: length="d.unit/2"
    lpf1 {
      Filter: response="lp" label="'LPF' loc='bot' ofst=.2"
    }
    Line: length="d.unit/6"
    adc1 {
      Adc: label="ADC"
    }
    Arrow: length="d.unit/3"
    dsp1 {
      Ic: size="(2.75 5)" pin="L - -" pin="L - -" pin="R - -" side="L leadlen=0" side="R leadlen=0" anchor="inL2" label="DSP"
    }
    Arrow: at="dsp1.inR1" length="d.unit/3"
  }
  Line: toy="dsp1.inL1"
  Arrow: tox="mix1.W"
  mix2 {
    Mixer: label="'Mixer' ofst=0"
  }
  Arrow: tox="lpf1.W"
  Filter: response="lp" label="'LPF' loc='bot' ofst=.2"
  Line: tox="adc1.W"
  Adc: label="ADC"
  Arrow: to="dsp1.inL1"
  Arrow: down="d.unit/6" reverse at="mix1.S"
  Line: left="d.unit*1.25"
  Line: down="d.unit*.75"
  flo {
    Dot: label="'$f_{LO}$' loc='left'"
  }
  hold {
    Line: down="d.unit/5"
    Oscillator: right anchor="N" label="'LO' loc='left' ofst=.15"
  }
  Arrow: down="d.unit/4" reverse at="mix2.S"
  b1 {
    Square: right label="90°" anchor="N"
  }
  Arrow: left="d.unit/4" reverse at="b1.W"
  Wire: shape="c" k="-1" to="flo.center"
}
```

### P-5. Digital Filter

```python
with schemdraw.Drawing() as d:
    d.config(unit=1, fontsize=14)
    dsp.Line().length(d.unit*2).label('x[n]', 'left').dot()

    with d.hold():
        dsp.Line().right()
        dsp.Amp().label('$b_0$', 'bottom')
        dsp.Arrow()
        s0 = dsp.Sum().anchor('W')

    dsp.Arrow().down()
    z1 = dsp.Square(label='$z^{-1}$')
    dsp.Line().length(d.unit/2).dot()

    with d.hold():
        dsp.Line().right()
        dsp.Amp().label('$b_1$', 'bottom')
        dsp.Arrow()
        s1 = dsp.Sum().anchor('W')

    dsp.Arrow().down(d.unit*.75)
    dsp.Square().label('$z^{-1}$')
    dsp.Line().length(d.unit*.75)
    dsp.Line().right()
    dsp.Amp().label('$b_2$', 'bottom')
    dsp.Arrow()
    s2 = dsp.Sum().anchor('W')

    dsp.Arrow().at(s2.N).toy(s1.S)
    dsp.Arrow().at(s1.N).toy(s0.S)

    dsp.Line().right(d.unit*2.75).at(s0.E).dot()
    dsp.Arrow().right().label('y[n]', 'right').hold()
    dsp.Arrow().down()
    dsp.Square().label('$z^{-1}$')
    dsp.Line().length(d.unit/2).dot()
    with d.hold():
        dsp.Line().left()
        a1 = dsp.Amp().label('$-a_1$', 'bottom')
        dsp.Arrow().at(a1.out).tox(s1.E)

    dsp.Arrow().down(d.unit*.75)
    dsp.Square().label('$z^{-1}$')
    dsp.Line().length(d.unit*.75)
    dsp.Line().left()
    a2 = dsp.Amp().label('$-a_2$', 'bottom')
    dsp.Arrow().at(a2.out).tox(s2.E)
```

```fleming
circuit {
  config: unit="1" fontsize="14"
  Line: length="d.unit*2" label="'x[n]' loc='left'" dot
  hold {
    Line: right
    Amp: label="'$b_0$' loc='bottom'"
    Arrow: right
    s0 {
      Sum: anchor="W"
    }
  }
  Arrow: down
  Square: label="'$z^{-1}$'"
  Line: length="d.unit/2" dot
  hold {
    Line: right
    Amp: label="'$b_1$' loc='bottom'"
    Arrow: right
    s1 {
      Sum: anchor="W"
    }
  }
  Arrow: down="d.unit*.75"
  Square: label="'$z^{-1}$'"
  Line: length="d.unit*.75"
  Line: right
  Amp: label="'$b_2$' loc='bottom'"
  Arrow: right
  s2 {
    Sum: anchor="W"
  }
  Arrow: at="s2.N" toy="s1.S"
  Arrow: at="s1.N" toy="s0.S"
  Line: right="d.unit*2.75" at="s0.E" dot
  hold {
    Arrow: right label="'y[n]' loc='right'"
  }
  Arrow: down
  Square: label="'$z^{-1}$'"
  Line: length="d.unit/2" dot
  hold {
    Line: left
    a1 {
      Amp: label="'$-a_1$' loc='bottom'"
    }
    Arrow: at="a1.out" tox="s1.E"
  }
  Arrow: down="d.unit*.75"
  Square: label="'$z^{-1}$'"
  Line: length="d.unit*.75"
  Line: left
  a2 {
    Amp: label="'$-a_2$' loc='bottom'"
  }
  Arrow: at="a2.out" tox="s2.E"
}
```




