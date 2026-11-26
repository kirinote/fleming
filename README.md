# Fleming

A lightweight notation for drawing circuit diagrams using nothing but Markdown code fences, plus a JavaScript renderer that converts the notation to SVG. The notation, shapes, and terminals follow the design of schemdraw 0.23. The renderer is self-contained in `fleming.js` and requires no external libraries.

This README is a reference for the notation and components. It does not cover how to build individual circuits or include circuit examples.

fleming.js is under development. Not every combination of components and arguments is guaranteed to work. Unsupported components, arguments, and syntax are generally reported as errors rather than silently ignored.

**Main features**

- Circuit diagrams can be written entirely inside a Markdown code fence with the language tag `fleming`.
- Components are connected in a chain, one component per line, with direction, length, labels, and terminal references.
- Multiple circuits can be written in one fence; `@layout`, `@title`, and `@scale` control placement, titles, and display scale.
- `@subcircuit` lets you package and reuse parts of a drawing.
- The renderer is a single file, `fleming.js`, with no external dependencies.

---

## Contents

- [1. Usage](#1-usage)
- [2. Basic syntax](#2-basic-syntax)
- [3. Writing arguments and values](#3-writing-arguments-and-values)
- [4. @ Directives](#4--directives)
- [5. Common arguments](#5-common-arguments)
- [6. Component reference](#6-component-reference)
- [7. Implementation limits](#7-implementation-limits)

---

## 1. Usage

### 1.1 Using it on a web page

Load `fleming.js` and pass a fleming source string to `Fleming.render()`. The return value is an SVG string. Pass the contents of the code fence (the `circuit` blocks and `@` directives), without the fence markers themselves.

`fleming.js` is a single classic script. It can be loaded directly from a local HTML file opened with `file://`; no local HTTP server, bundler, or ES module setup is required. All drawing data is contained in the file itself, so no other resources are fetched.

```html
<script src="fleming.js"></script>
```

```js
const svg = Fleming.render(source);
```

The second argument is an optional callback that receives log messages.

```js
const svg = Fleming.render(source, message => console.log(message));
```

### 1.2 Using it from Markdown

Set the language tag of a Markdown code fence to `fleming`. The renderer detects the fence and converts its contents to SVG.

A single code fence can contain multiple `circuit { ... }` blocks. Each block is drawn as an independent circuit; wiring is not connected across blocks.

### 1.3 Public API

| API | Description                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `Fleming.render(source, log)` | Converts Fleming notation to an SVG string. `log` is an optional log callback |
| `Fleming.referenceImages` | An object containing development reference SVGs. Empty in the release build   |

The only output format is currently SVG. There is no direct PNG or PDF output.

---

## 2. Basic syntax

### 2.1 circuit blocks

Circuits are written inside `circuit { ... }` blocks. Write one component per logical line using the form `component-type: direction arguments...`.

```text
circuit {
    component-type: direction arguments...
    component-type: direction arguments...
}
```

- The first token on a line is the component type; everything after `:` is the direction and arguments.
- Directions are `up`, `down`, `left`, and `right`. If a direction is omitted, the previous drawing direction is normally inherited (the exact behavior depends on the component).
- Arguments are separated by whitespace. Use `key=value`, such as `label="..."`.
- Flags that take no value (`hold`, `flip`, `reverse`, `dot`, `idot`, and so on) are written as the key alone.
- Blank lines and comment lines are ignored.
- Write `circuit {` and `}` on their own lines.

### 2.2 Named blocks

Wrap a component in a named block to give it a name. A named block contains exactly one component.

```text
name {
    component-type: direction arguments...
}
```

Terminals of the named component can be referenced from later lines as `name.terminal`. Defining the same name twice in one circuit is an error. Named blocks cannot be nested.

### 2.3 hold blocks

`hold { ... }` saves the drawing position and direction at the start of the block and restores them at the end. Components drawn inside the block remain. Blocks can be nested.

The `hold` flag on an individual component returns the drawing position to its position before the component was placed. For two-terminal components the cursor stays at the placement point and inherits the component's direction; for multi-terminal components such as transistors, logic gates, and op-amps, both the position and direction are restored.

### 2.4 Comments

Everything from `#` to the end of the line is a comment. Comments can appear on their own lines and at the end of component, named-block, `hold`, and `@` directive lines.

- A `#` inside a double-quoted argument value is not a comment. In `color="#0000ff"` and `label="'RF filter\n#1'"`, the `#` is part of the value.
- A hexadecimal color written immediately after `=`, such as `color=#0000ff`, is also not a comment.
- Comments are line-based and do not continue onto the next line.

### 2.5 Line continuation

For a component with many arguments, add a top-level comma at the end of the line to continue on the next line. The first line must contain at least one argument.

```text
component-type: direction arg1=value1,
                arg2=value2,
                arg3=value3
```

- Continuation lines may be indented or not.
- Blank lines, comment lines, and end-of-line comments may appear while a continuation is open.
- The comma after the final argument may be omitted. A trailing comma is allowed only immediately before `}`.
- Commas can also separate arguments on the same line.
- Commas are treated as separators only outside quotes, escapes, `[...]`, and `(...)`. The commas in `label="1,000Ω"` and `ofst=(1 2)` are not separators.
- A leading comma, consecutive commas, or a comma with no argument such as `component-type:,` is an error.
- It is an error if the line after a comma starts a new component, named block, `hold`, or `@` directive.

### 2.6 Keywords and quotation

Values that have syntactic meaning (keywords) are written exactly one way, without quotes.

| Target | Correct | Invalid |
|---|---|---|
| Boolean arguments | `leads=True`, `polar=True` | `leads="True"`, `polar="True"` |
| Value-less flags | `flip`, `dot` | `flip=True`, `dot="True"` |
| `loc` inside a label | `label="'$v_o$' loc=bot"` | `label="'$v_o$' loc="bot""` |
| `halign` inside a label | `label="'$v_o$' halign=right"` | `label="'$v_o$' halign="right""` |
| `valign` inside a label | `label="'$v_o$' valign=bottom"` | `label="'$v_o$' valign="bottom""` |

- Arguments that take a string value, such as `label="text"` or `label="name"`, are enclosed in double quotes.
- Inside a `label` value, single-quoted forms such as `loc='bot'`, `halign='right'`, and `valign='bottom'` are also accepted. `loc=bot` and `loc='bot'` mean the same thing.
- `leads="True"` is an error. Write `leads=True`.
- A newline before a quote is closed is an error. Labels cannot span lines.
- `;` (semicolon) is not part of the fleming grammar and produces a syntax error.

### 2.7 Logical lines and physical lines

fleming parses logical lines. Physical lines are joined only while a top-level comma at the end of a line is present. Write `circuit {`, named blocks, `hold {`, and closing braces on separate lines.

---

## 3. Writing arguments and values

### 3.1 Directions and angles

The direction keywords are `up`, `down`, `left`, and `right`. To give a direction a length, write `right="2"`.

`theta` is specified in degrees. Right is 0 degrees and counterclockwise is positive. A following component without a direction normally inherits that angle.

- If `theta` and a direction keyword are combined, the direction keyword takes precedence.
- If `theta` and `to` are combined, `theta` determines the orientation and the distance to `to` determines the length. If `endpoints` is also present, `endpoints` takes precedence.
- `theta` can be combined with `tox` and `toy`. `theta` is used for orientation and length calculation.
- If a direction keyword is combined with `tox` or `toy`, the direction keyword determines the orientation and `tox`/`toy` determine the length.

### 3.2 Lengths and drawing units

Length values are interpreted in schemdraw drawing units. One drawing unit corresponds to 36 SVG user units (px). The default `unit=3` is 108px, the default font size of 14 is 14px, and the default line width is 2px.

- `length="0.75"` and `length=".75"` both mean 0.75.
- `length` is the terminal-to-terminal length itself, not a multiplier of `unit`.
- Length expressions such as `d.unit`, `d.unit/4`, `d.unit/2*3`, `1.5*d.unit`, and `d.unit+.6` are supported. Arbitrary code is never executed; expressions are parsed safely.
- `d.unit` is the value of `unit` at that point.
- An explicit `length` shorter than the component body is an error (except for `Gap`). When the length is determined by a target point through `to`, `tox`, `toy`, or `endpoints`, a short distance is not an error; the body is shrunk to fit.
- `length` can be combined with `endpoints`, `to`, `tox`, and `toy`. When a target point is specified, the actual length is the distance to that point and `length` is overridden.

### 3.3 Numeric coordinates

`at="(x y)"` is an absolute coordinate in drawing units. Positive x is right and positive y is up. Separate the coordinates with whitespace, not a comma (comma-separated coordinates are also accepted).

Expressions such as `at="(d.unit*2 0)"` and `at="(A1.out.x 0)"` are supported. Numeric coordinates can be used with `at`, `to`, `tox`, `toy`, and `endpoints`. `endpoints` can mix named terminals and numeric coordinates.

### 3.4 Labels

Attach a label to a component with `label="..."`. A component can have multiple `label` arguments.

```text
label="text"
label="'text' loc=bot ofst=0.1 fontsize=12"
label="['–' '$v_o$' '+']"
```

- The outer double quotes enclose the whole argument; the inner single quotes delimit the label text.
- `loc` is the label position. Besides `top`, `bot`, `left`, `right`, and `center`, some components accept terminal names.
- `ofst` is an offset from the component edge. Specify a number such as `ofst=1`, or a pair such as `ofst=(x y)`.
- `halign` is `left`, `center`, or `right`; `valign` is `top`, `center`, or `bottom` (`bot` is also accepted).
- `rotate=True` rotates the label with the component angle. `rotate=angle` specifies the angle directly.
- `fontsize` is the label font size. `color` is the label color.
- Passing a list such as `label="['–' '$v_o$' '+']"` places the whitespace-separated items at equal intervals along the component axis. List labels also accept `loc`, `ofst`, and `halign`.
- `\n` inside a label string is treated as a line break.
- Text inside `$...$` is rendered as math and can be mixed with ordinary text.

### 3.5 Math labels

Only the `$...$` portions are treated as math. They can be mixed with ordinary text, as in `30k$\Omega$`.

- Greek letters: `\Omega`, `\mu`, and so on
- Symbols: `\pm`, `\times`, `\le`, `\infty`, `\int`, `\sum`, `\prod`, `\partial`, and so on
- Superscript `^`, subscript `_`, and overline `\overline{q}`
- Parentheses such as `$H_1(s)$`, and signed superscripts/subscripts such as `$z^{-1}$`
- Purely numeric super/subscripts (`b_0`, `H_{12}`) are rendered with Unicode subscript and superscript digits
- Unsupported commands produce an error

### 3.6 Colors

Specify a CSS color name such as `color="red"`, or a hexadecimal color in `#RGB`, `#RGBA`, `#RRGGBB`, or `#RRGGBBAA` form. The color applies to the component's lines, connection dots, and labels. The default is black. Formats accepted by schemdraw such as `rgb()` and `hsl()` are not all supported.

### 3.7 Booleans and flags

Boolean values are written as `True` or `False` without quotes.

- `True` / `False`: `leads`, `lead`, `polar`, `core`, `circle`, `diode`, `bulk`, `sign`, `open`, `contacts`, `nc`, `link`, `notch`, `number`, `shownumber`, and so on
- Flags with no value: `hold`, `flip`, `reverse`, `dot`, `idot`
- `dot="open"` and `idot="open"` draw hollow circles.

---

## 4. @ Directives

A line starting with `@` is a directive. Directives go outside `circuit { ... }` blocks: before the first block, between blocks, or after the last block. They cannot be placed inside a `circuit { ... }` block. `@layout`, `@title`, and `@scale` may each be specified only once. `@subcircuit` may be defined multiple times with different names, but defining the same name twice is an error.

The currently available directives are `@layout`, `@title`, `@scale`, and `@subcircuit`. Any other line beginning with `@` is an error.

### 4.1 @layout

Arranges multiple `circuit { ... }` blocks in a grid.

```text
@layout rows=rows cols=cols valign=top|bottom|bot
```

| Parameter | Description |
|---|---|
| `rows` | Number of rows (positive integer) |
| `cols` | Number of columns (positive integer) |
| `valign` | Vertical alignment within a row. `top` (default) aligns cell tops; `bottom` (`bot` is also accepted) aligns the bottom of the circuit body |

- If `@layout` is omitted, all circuits are placed in a single column.
- At least one of `rows` and `cols` is required.
- If only one of `rows` and `cols` is specified, the other is calculated so that all circuits fit.
- If both are specified and the number of circuits exceeds `rows × cols`, circuits that do not fit are silently dropped in input order. Dropped circuits and their corresponding `@title` entries are not displayed.
- Circuits are placed left to right and top to bottom in input order.
- With `valign=bottom` (or `valign=bot`), each circuit in a row is shifted down so that the bottom of the circuit body, excluding the title band, is aligned.
- Any `valign` value other than `top`, `bottom`, or `bot` is an error.

### 4.2 @title

Adds a title to each `circuit` block, matched in input order. Titles are displayed below their circuit diagrams.

```text
@title "title 1" "title 2" ...
```

- List double-quoted strings separated by whitespace. At least one string is required.
- If there are fewer titles than circuits, the remaining circuits have no title. Extra titles are ignored.
- A circuit corresponding to the empty string `""` has no title.
- Double quotes and backslashes inside a title string are written as `\"` and `\\`.
- Each circuit is rendered to SVG independently, the title is placed below it, and then `@layout` arranges the results. Component and terminal positions inside the circuit are unchanged.

### 4.3 @scale

Sets the display scale of the completed SVG image.

```text
@scale factor
```

- The value is a decimal number greater than `0`. `1.0` is the default scale (1×); `0.5` makes the image half size in both dimensions.
- `0`, negative numbers, and non-numeric values (including exponent notation and hexadecimal) are errors. The value cannot be enclosed in double quotes.
- It may be specified once, outside `circuit { ... }` blocks.
- Only the `width` and `height` of the completed SVG root element are changed. `viewBox`, circuit coordinates, terminals, and label positions are not changed. The entire image is scaled uniformly as vectors.
- It is applied after composition by `@layout` and `@title`, so the visual balance between circuits does not change.
- `@scale` scales the entire image. It is distinct from `scale=`, which scales only a component body.

### 4.4 @subcircuit

Corresponds to `elm.ElementDrawing(d1)` in schemdraw, which reuses a `Drawing` as a component. Define a subcircuit with `@subcircuit name { ... }` and call it using the name as a component type.

```text
@subcircuit name {
    ...
}
```

Call it by writing the subcircuit name as the component type, as in `name:`. It can also be used inside a named block (`S { name: }`).

- Definitions go outside `circuit { ... }`. Multiple definitions are allowed and their order does not matter. Defining the same name twice is an error.
- A call accepts `at`, `anchor`, and `theta`. If `at` is omitted, the subcircuit is placed at the current drawing position.
- After drawing, the final drawing position of the subcircuit becomes the next drawing position, and the drawing direction resets to right.
- The inside of a subcircuit is drawn in its own coordinate system and uses the subcircuit's own defaults for `unit` and `fontsize` (3 and 14). A `config:` inside affects only that subcircuit.
- A point named with `anchor: name="..."` inside a subcircuit can be referenced from the caller as `S.name`.
- A named component inside a subcircuit can also be referenced from the caller as a single point, such as `S.R`. If it collides with an `anchor:` name, `anchor:` takes precedence.
- A subcircuit can call another subcircuit. Circular references produce an error.
- The caller cannot specify `color`, direction keywords, `length`, or labels.

#### Subcircuit parameters

Writing `@subcircuit name(params...) { ... }` substitutes `${param}` in the body with the values supplied by the caller.

- Arguments are substituted as strings. They can be used inside quotes, such as `label="'${r}'"`.
- Omitting a declared argument at the call site is an error. Passing an undeclared argument is also an error.
- Any unresolved `${...}` left in the body is an error.
- Argument values cannot contain whitespace. Put whitespace-containing strings inside quotes in the body instead.

### 4.5 Recording positions (anchor:)

`anchor: name="..."` records the current drawing position under a name. The position and direction are unchanged. This corresponds to `d.set_anchor(name)` in schemdraw.

- Within the same block, reference it as `name.center`. `start`, `end`, `center`, and `xy` all refer to the same point.
- From a subcircuit instance, reference it as `S.name`.
- Defining the same name twice is an error. Names must begin with a letter or underscore.

---

## 5. Common arguments

The following arguments are shared by many components. Availability depends on the component; also check the component's section.

| Argument | Form | Description |
|---|---|---|
| Direction | `up`, `down`, `left`, `right` | Component orientation. A length can be added, as in `right="2"` |
| `theta` | `theta="-45"` | Angle in degrees. Right is 0, counterclockwise is positive |
| `length` | `length="0.75"` | Terminal-to-terminal length in drawing units. Expressions such as `d.unit/2` are allowed |
| `at` | `at="R1.out"`, `at="(x y)"` | Placement reference point: a named terminal or numeric coordinate |
| `to` | `to="R1.start"` | Connect from the current position to the specified terminal |
| `tox` | `tox="C1.start"` | Place horizontally up to the x coordinate of the specified terminal |
| `toy` | `toy="C1.start"` | Place vertically up to the y coordinate of the specified terminal |
| `endpoints` | `endpoints="Q.end R.start"` | Specify start and end terminals separated by whitespace |
| `anchor` | `anchor="in1"` | Choose which component terminal is the placement reference |
| `drop` | `drop="emitter"` | Move the drawing position to the specified terminal after placement |
| `hold` | `hold` | Return to the position and direction before placement (individual component). Distinct from a `hold { ... }` block |
| `flip` | `flip` | Flip the component vertically about its axis |
| `reverse` | `reverse` | Reverse the component along its axis |
| `color` | `color="red"` | Component drawing color |
| `fill` | `fill=True`, `fill="red"` | Shape fill. Applies only to closed shapes |
| `dot` | `dot`, `dot="open"` | Draw a connection dot at the end. `open` draws it hollow |
| `idot` | `idot`, `idot="open"` | Draw a connection dot at the start. `open` draws it hollow |
| `scale` | `scale="0.5"` | Scale the component body. Supported by some components only |
| `shift` | `shift="-0.4"` | Shift the body of a two-terminal component along its axis |
| `label` | `label="..."` | Label. May be specified multiple times |

### 5.1 Placement and connection

- `at` sets the placement reference point. When combined with `anchor`, the specified terminal is aligned to the `at` position.
- `to`, `tox`, `toy`, and `endpoints` use existing terminals as targets and calculate the component's direction and length.
- `to`, `tox`, `toy`, and `endpoints` can be combined with `at` and `anchor`. `at` determines the placement position, while target specifications determine direction and length. When multiple targets are specified, schemdraw's precedence applies: `endpoints` → `to` → `tox` → `toy`; the remaining targets are ignored. `length` can also be combined, and the distance to the target takes precedence.
- `to` currently works with supported two-terminal components and accepts references to terminals of previously defined named components or `(x y)` numeric coordinates. Identical start and end points, or a connection shorter than the component body, produce an error.
- `tox` and `toy` can be combined with direction keywords or `theta`. The target may be a named terminal, an `(x y)` numeric coordinate, or a bare numeric coordinate for `tox`/`toy`.
- `anchor` can be combined with `to`, `tox`, `toy`, and `endpoints`; the element is shifted so that the named anchor is aligned with the placement point after the target determines direction and length.
- `drop` moves the drawing position to a specified terminal after placement, for transistors and IC-like components. The default terminal depends on the component.

### 5.2 The hold flag on individual components

- For a two-terminal component, `hold` keeps the drawing position at the component's placement point and inherits the component's drawing direction. If `at` is present, the specified position is the placement point.
- For multi-terminal components such as transistors, logic gates, and `Opamp`, `hold` restores the drawing position and direction from before placement, as in schemdraw's `Element.hold()`.
- If `hold` and `drop` are combined on a transistor, `hold` takes precedence, and the post-placement position becomes the restored position.

### 5.3 Statements that move the drawing position

| Statement | Description |
|---|---|
| `move: dx="..." dy="..."` | Move the current drawing position relatively. Draws nothing and does not change direction. Positive `dx` is right and positive `dy` is up. Omitted coordinates are 0 |
| `move_from: at="..." dx="..." dy="..."` | Move by `dx`/`dy` from the existing terminal given by `at`. The drawing direction is unchanged |
| `print: value="d.here"` | Write the current drawing position to the processing log. Position and direction are unchanged |
| `config: unit="..." fontsize="..."` | Change defaults for subsequent components |
| `anchor: name="..."` | Record the current drawing position under a name |

- `dx` and `dy` in `move` and `move_from` accept numbers, `d.unit`, named component terminal coordinates (such as `A1.out.y`), `+ - * /`, and parentheses. Arbitrary code is not evaluated.
- `move` cannot be given a component name.
- `print` is a fleming-specific debugging statement. Arbitrary Python expressions are not evaluated.

### 5.4 config

Writing `config:` inside a `circuit { ... }` block changes defaults for subsequent components.

```text
config: unit="2" fontsize="12"
```

| Argument | Description |
|---|---|
| `unit` | Default terminal-to-terminal length for subsequent two-terminal components, in drawing units. Default is 3. The body is not scaled; lead lengths are adjusted |
| `fontsize` | Default font size for subsequent labels. Default is 14. A per-label `fontsize` takes precedence |
| `inches_per_unit` | Accepted, but does not affect SVG size |

- Changes apply to subsequent components and do not alter already placed components or the drawing position.
- Settings are independent per circuit and are not inherited by another `circuit`.
- `hold` restores position and direction but does not restore `unit` or `fontsize` settings.
- Multiple settings can be written on one line separated by whitespace. Writing the same setting twice is an error.
- Values must be finite positive numbers. Invalid values and unsupported settings produce errors.
- `fontsize` affects text added with `label=`. Fixed text sizes built into component shapes, such as pin numbers, seven-segment labels, and meter scales, are unchanged.

---

## 6. Component reference

Type names correspond to schemdraw class names and are case-sensitive. Any type name not listed here is an error. Terminals can be referenced as `name.terminal`.

### 6.1 Two-terminal components

The following components accept, in addition to the extra arguments in the table, a direction (optionally with a length), `theta`, `length`, `at`, `to`, `tox`, `toy`, `endpoints`, `anchor`, `color`, `label`, `dot`, `idot`, `shift`, and `hold`. Some arguments apply only to a subset, especially wiring components such as `Wire` and `Line`, and components with their own restrictions. `scale`, `flip`, and `reverse` also vary by component.

| Type | Extra arguments | Terminals / notes |
|---|---|---|
| `Resistor` | — | `start`, `end`, `center`. IEEE / US style |
| `ResistorIEEE` | — | IEEE / US style |
| `ResistorIEC` | — | IEC / European style (box) |
| `ResistorVar` | — | Variable resistor (arrow) |
| `ResistorVarIEC` | — | Variable resistor (IEC box) |
| `ResistorVarIEEE` | — | Variable resistor (IEEE style) |
| `RBox` | — | Box resistor |
| `Thermistor` | — | Thermistor |
| `Photoresistor` | — | Photoresistor (IEEE style) |
| `PhotoresistorBox` | — | Photoresistor (IEC box) |
| `PhotoresistorIEC` | — | Photoresistor (IEC box) |
| `PhotoresistorIEEE` | — | Photoresistor (IEEE style) |
| `Memristor` | — | Memristor |
| `Memristor2` | — | Memristor (square-wave shape) |
| `CPE` | — | Constant phase element |
| `Nullator` | — | Nullator (ellipse) |
| `Norator` | — | Norator (two touching circles) |
| `Capacitor` | `polar=True` | Capacitor. `polar` shows the polarity mark (+) |
| `Capacitor2` | `polar=True` | Curved-plate capacitor |
| `CapacitorVar` | — | Variable capacitor |
| `CapacitorTrim` | — | Trimmer capacitor |
| `Inductor` | `core=True` | Inductor. `core` adds a core line |
| `Inductor2` | `loops=count`, `core=count` | Cycloid inductor. `loops` is the loop count (default 4), `core` is the number of core lines (default 0) |
| `Diode` | `fill=True`, `fill="color"` | Diode. `fill` fills the triangle |
| `DiodeTunnel` | — | Tunnel diode |
| `DiodeTVS` | — | TVS diode |
| `DiodeShockley` | — | Shockley diode |
| `Josephson` | `box=True` | Josephson junction. `box` draws a square around the X |
| `Zener` | — | Zener diode |
| `LED` | `fill=True`, `fill="color"` | Light-emitting diode |
| `LED2` | — | LED with curved emission arrows |
| `Photodiode` | — | Photodiode |
| `Schottky` | — | Schottky diode |
| `Varactor` | — | Varactor diode |
| `Diac` | — | Diac |
| `Fuse` | — | Fuse (IEEE style) |
| `FuseIEC` | — | Fuse (IEC box) |
| `FuseIEEE` | — | Fuse (IEEE box) |
| `FuseUS` | — | Fuse (US style) |
| `Lamp` | — | Lamp (filament) |
| `Lamp2` | — | Lamp (circle with X) |
| `Neon` | — | Neon lamp |
| `Solar` | — | Solar cell |
| `SparkGap` | — | Spark gap |
| `Motor` | — | Motor |
| `Crystal` | — | Crystal |
| `Battery` | — | Battery. The longer plate is positive; by default it is on the start side |
| `BatteryCell` | — | Single-cell battery |
| `BatteryDouble` | — | Double-stack battery. The central `tap` terminal can be referenced |
| `Source` | — | Generic source with no internal symbol |
| `SourceV` | — | DC voltage source |
| `SourceI` | — | DC current source |
| `SourceSin` | — | Sinusoidal AC source |
| `SourcePulse` | — | Pulse source |
| `SourceSquare` | — | Square-wave source |
| `SourceTriangle` | — | Triangle-wave source |
| `SourceRamp` | — | Ramp source |
| `SourceControlled` | — | Controlled source (diamond) |
| `SourceControlledV` | — | Controlled voltage source |
| `SourceControlledI` | — | Controlled current source |
| `MeterV` | — | Voltmeter |
| `MeterA` | — | Ammeter (A) |
| `MeterI` | — | Ammeter (I) |
| `MeterOhm` | — | Ohmmeter |
| `MeterArrow` | — | Indicator meter. Has `istart` and `iend` terminals |
| `CurrentMirror` | — | Current mirror. Has a `common` terminal |
| `VoltageMirror` | — | Voltage mirror. Has a `common` terminal |
| `Potentiometer` | `tap_length=length` | Potentiometer with tap. Has a `tap` terminal |
| `PotentiometerIEC` | `tap_length=length` | Potentiometer (IEC box). Has a `tap` terminal |
| `PotentiometerIEEE` | `tap_length=length` | Potentiometer (IEEE style). Has a `tap` terminal |
| `Rshunt` | — | Shunt resistor. Has `v1` and `v2` terminals |
| `SCR` | — | Thyristor. Has a `gate` terminal |
| `Triac` | — | Triac. Has a `gate` terminal |
| `Switch` | `contacts=True/False`, `nc=True/False`, `action="open"/"close"` | Switch |
| `SwitchSpdt` | `contacts=True/False`, `action="open"/"close"` | SPDT switch. `a`, `b`, `c` terminals |
| `SwitchDpst` | `contacts=True/False`, `link=True/False` | DPST switch. `p1`, `p2`, `t1`, `t2` terminals |
| `SwitchDpdt` | `contacts=True/False`, `link=True/False` | DPDT switch. `p1`, `p2`, `t1`–`t4` terminals |
| `SwitchReed` | — | Reed switch |
| `Button` | `contacts=True/False`, `nc=True/False` | Push button |
| `Breaker` | `dots=True/False` | Circuit breaker. `dots` controls the terminal circles at both ends |
| `Line` | `arrow=arrow-type` | Wire. `->`, `<-`, `<->`, `\|->`, `\|-o`, `o-`, `-o`, `o-o` |
| `Wire` | `shape`, `k`, `arrow`, `delta`, `dx`, `dy` | Wire with an explicit shape. `shape` is `-`, `\|-`, `-\|`, `c`, `n`, `N`, or `z` |
| `BusLine` | `lw=width` | Bus line (thick). Default width is 4 |
| `DataBusLine` | — | Bus line with a slash mark |
| `Coax` | `radius`, `leadlen` | Coaxial cable. `length` can also be specified |
| `Triax` | `leadlen`, `radiusinner`, `radiusouter`, `shieldofststart`, `shieldofstend` | Triaxial cable. `length` can also be specified |
| `Gap` | — | Terminal-to-terminal gap |

#### Flipping two-terminal components

`flip` mirrors the shape vertically about the component axis; `reverse` mirrors it along the axis. Terminal positions and the positions of subsequent components do not change.

- `flip` and `reverse` are available on many two-terminal components.
- `reverse` is available on `SourceV`, `SourceI`, batteries, `Zener`, `Potentiometer` family, `Rshunt`, `SCR`, `Triac`, and others.
- `reverse` is also available on `LED`, `Diac`, `Motor`, and `Fuse`; the LED arrows, Diac triangle, and body shapes mirror about the body center.
- For two-terminal components, `reverse` mirrors the shape and leads about the body center. Even when the length is changed with `toy` or `length`, the plates and shape stay attached to the leads.
- Terminals away from the body center, such as `BatteryDouble`'s `tap`, also move to their mirrored positions.

### 6.2 Two-terminal-style components

These are special components placed like two-terminal parts. In addition to `start`, `end`, and `center`, the terminals in the table can be referenced.

Two-terminal-style BJTs, MOSFETs, and FETs accept `length`, `shift`, `theta`, `to`, `tox`, `toy`, `endpoints`, `color`, `dot`, `idot`, `hold`, `label`, `flip`, `reverse`, and `anchor`. `drop` is not supported (`SwitchSpdt2` also supports `anchor`).

| Type | Extra arguments | Terminals / notes |
|---|---|---|
| `SwitchSpdt2` | `contacts=True/False`, `action="open"/"close"` | SPDT switch with throws above and below. `a`, `b`, `c` terminals. Standalone symbol with no leads. `length`, `shift`, `to`, `tox`, `toy`, and `endpoints` are errors |
| `BjtNpn2` | — | `collector`, `emitter`, `base`. Two-terminal-style NPN |
| `BjtPnp2` | — | `collector`, `emitter`, `base`. Two-terminal-style PNP |
| `BjtPnp2c2` | — | `collector`, `emitter`, `base`, `C2`. Two-terminal-style PNP with two collectors |
| `NMos2` | `circle=True/False`, `diode=True/False` | `drain`, `source`, `gate`, `D`, `S`. Two-terminal-style N-channel MOSFET |
| `PMos2` | `circle=True/False`, `diode=True/False` | `drain`, `source`, `gate`, `D`, `S`. Two-terminal-style P-channel MOSFET |
| `NFet2` | `bulk=True/False` | `drain`, `source`, `gate`, `bulk`, `D`, `S`. Two-terminal-style N-channel FET |
| `PFet2` | `bulk=True/False` | `drain`, `source`, `gate`, `bulk`, `D`, `S`. Two-terminal-style P-channel FET |
| `JFetN2` | `circle=True/False` | `drain`, `source`, `gate`, `D`, `S`. Two-terminal-style N-channel JFET |
| `JFetP2` | `circle=True/False` | `drain`, `source`, `gate`, `D`, `S`. Two-terminal-style P-channel JFET |

### 6.3 Transistors

The following components accept direction, `theta`, `at`, `anchor`, `drop`, `color`, `label`, `flip`, `reverse`, and `hold`. Label `loc` can be a terminal name (`base`, `collector`, `emitter`, `drain`, `source`, `gate`, `center`, and so on) or `top`, `bot`, `left`, or `right`.

| Type | Extra arguments | Terminals / notes |
|---|---|---|
| `Bjt` | `circle=True/False` | `base`, `collector`, `emitter`, `center`. No polarity |
| `JFet` | `circle=True/False` | `drain`, `source`, `gate`, `center`. No polarity |
| `Hemt` | `split=True/False`, `source_arrow=True/">"/False` | `source`, `drain`, `gate`, `center`. Default drop is `source` |
| `BjtNpn` | `circle=True/False` | `base`, `collector`, `emitter`, `center` |
| `BjtPnp` | `circle=True/False` | `base`, `collector`, `emitter`, `center` |
| `BjtPnp2c` | `circle=True/False` | `base`, `collector`, `emitter`, `C2`, `center`. PNP with two collectors |
| `NpnSchottky` | `circle=True/False` | `base`, `collector`, `emitter`, `center`. With Schottky clamp |
| `PnpSchottky` | `circle=True/False` | `base`, `collector`, `emitter`, `center`. With Schottky clamp |
| `IgbtN` | — | `base`, `collector`, `emitter`, `center` |
| `IgbtP` | — | `base`, `collector`, `emitter`, `center` |
| `NpnPhoto` | — | `base`, `collector`, `emitter`, `center` |
| `PnpPhoto` | — | `base`, `collector`, `emitter`, `center` |
| `JFetN` | `circle=True/False` | `drain`, `source`, `gate`, `center` |
| `JFetP` | `circle=True/False` | `drain`, `source`, `gate`, `center` |
| `NFet` | `bulk=True/False` | `drain`, `source`, `gate`, `center` |
| `PFet` | `bulk=True/False` | `drain`, `source`, `gate`, `center` |
| `NMos` | `circle=True/False`, `diode=True/False` | `drain`, `source`, `gate`, `center` |
| `PMos` | `circle=True/False`, `diode=True/False` | `drain`, `source`, `gate`, `center` |
| `AnalogNFet` | `bulk=True/False`, `offset_gate=True/False`, `source_arrow=True/False` | `source`, `drain`, `gate`, `center`, `bulk` (when `bulk=True`) |
| `AnalogPFet` | `bulk=True/False`, `offset_gate=True/False`, `source_arrow=True/False` | `source`, `drain`, `gate`, `center`, `bulk` (when `bulk=True`) |
| `AnalogBiasedFet` | `bulk=True/False`, `offset_gate=True/False`, `source_arrow=True/False` | `source`, `drain`, `gate`, `center`, `bulk` (when `bulk=True`) |

Default ending terminals (drop) are `collector` for NPN, `emitter` for PNP, `gate` for JFET, `source` for NFet, `drain` for PFet, `source` for NMos, and `drain` for PMos. For `BjtNpn2`, `NMos2`, `NFet2`, and `JFetN2` families, see [6.2](#62-two-terminal-style-components).

### 6.4 Op-amp

| Type | Arguments | Terminals |
|---|---|---|
| `Opamp` | direction, `theta`, `leads=True/False`, `sign=True/False`, `anchor`, `at`, `hold`, `scale`, `flip`, `reverse`, `color` | `in1`, `in2`, `out`, `vd`, `vs`, `n1`, `n2`, `n1a`, `n2a`, `center` |

- `leads=True` draws leads; omitting it draws no leads.
- `sign=False` omits the `+` and `−` marks on the inputs. The default is `sign=True`.
- `anchor` can use terminals such as `in1`, `in2`, `out`, `center`, `vd`, and `vs` as the placement reference.
- Multiple `label` arguments are allowed, with `loc` set to a terminal name or `center`. Pin-name labels default to font size 9.
- Direction keywords and `theta` rotate the symbol. `length`, `to`, `tox`, `toy`, `dot`, `idot`, and `shift` are not supported.

### 6.5 Ground and power symbols

| Type | Arguments | Terminals / notes |
|---|---|---|
| `Ground` | `lead=True/False` | Ground. Single terminal (`start`, `center`, `end`, and `xy` are the same point) |
| `GroundSignal` | — | Signal ground |
| `GroundChassis` | — | Chassis ground |
| `Vdd` | — | Vdd power terminal |
| `Vss` | — | Vss power terminal |
| `NoConnect` | — | No-connect mark |

- The symbol is placed at the current drawing position; the position and direction do not change.
- Terminals are `start`, `center`, `end`, and `xy` (all the same point).
- Supports `at`, `color`, `hold`, `theta`, `flip`, `reverse`, and `label`.
- `Ground`'s `lead` is available only on `Ground`.
- The default label position is below for `Vss` and `NoConnect`, and above for the others. Use `loc=top` or `loc=bot` to change it.

### 6.6 Logic gates

The following components accept `at`, `anchor`, `drop`, direction, `theta`, `color`, `hold`, `flip`, `reverse`, and `label`. Label `loc` can be `top`, `bot`, `left`, `right`, or a terminal name exposed by the component.

| Type | Extra arguments | Terminals / notes |
|---|---|---|
| `And` | `inputs=2–16`, `inputnots=[...]`, `leadin`, `leadout` | `in1`–`inN`, `out`, `end`, `xy` |
| `Nand` | Same | Same. Inverted output bubble |
| `Or` | Same | Same |
| `Nor` | Same | Same. Inverted output bubble |
| `Xor` | Same | Same |
| `Xnor` | Same | Same. Inverted output bubble |
| `SchmittAnd` | `inputs`, `inputnots`, `leadin`, `leadout` | Same |
| `SchmittNand` | Same | Same. Inverted output bubble |
| `Buf` | — | `in1`, `out`, `start`, `end`, `center`, `xy` |
| `Not` | — | Same. Inverted output bubble |
| `NotNot` | — | Same. Double inverter |
| `Schmitt` | — | Same. Schmitt trigger |
| `SchmittNot` | — | Same. Schmitt trigger with inverted output |
| `Tgate` | — | `in1`, `out`, `c`, `cbar`, `start`, `end`, `center`, `xy` |
| `Tristate` | `outputnot=True/False`, `controlnot=True/False` | `in1`, `out`, `c`, `start`, `end`, `center`, `xy` |

- For multi-input gates, `inputs` ranges from 2 to 16 and defaults to 2. `inputnots=[1 3]` uses 1-based input numbers separated by whitespace or commas.
- `leadin` and `leadout` are input and output lead lengths in drawing units. The default is 0.35.
- Default drop is `out` for the `And` family and `end` for `Buf`, `Tgate`, and `Tristate`.
- `shift`, `length`, `to`, `tox`, `toy`, and `endpoints` are not supported.

### 6.7 Signal-processing blocks (dsp)

Corresponds to the signal-processing elements in `schemdraw.dsp`. There are no import statements, so write `dsp.Box` as `Box`, `dsp.SumSigma` as `SumSigma`, and so on, without the module name.

All elements accept `at`, `anchor`, `drop`, `theta`, `color`, `fill`, `hold`, `flip`, `reverse`, and `label`. `length` cannot be specified. Each element is a standalone symbol without the leads of a two-terminal component. After placement, the drawing position moves to the element's default drop.

| Type | Extra arguments | Terminals / notes |
|---|---|---|
| `Box` | `w`, `h`, `minsize`, `pad` | Block-diagram box. If `w`/`h` are omitted, `minsize` (default 3×2) is used |
| `Square` | — | Square processing block |
| `Circle` | `radius` | Circular block. Default radius is 0.5 |
| `Sum` | `radius` | Summing junction (+) |
| `SumSigma` | `radius` | Summing junction (Σ) |
| `Mixer` | `radius`, `N`, `E`, `S`, `W`, `fontsize` | Mixer. Text can be placed on each side |
| `Amp` | — | Amplifier (triangle). `input` and `out` terminals |
| `VGA` | `tuneup=True/False` | Variable-gain amplifier. `input`, `out`, `tune` terminals |
| `OscillatorBox` | — | Oscillator (box) |
| `Oscillator` | `radius` | Oscillator (circle) |
| `Filter` | `response="lp"/"bp"/"hp"/"notch"` | Filter |
| `Adc` | — | A/D converter. `input`, `out`, `E`, `W` terminals |
| `Dac` | — | D/A converter. `input`, `out`, `E`, `W` terminals |
| `Demod` | — | Demodulator |
| `Circulator` | `radius` | Circulator |
| `Isolator` | — | Isolator |
| `dsp_Speaker` | — | Single-terminal speaker. The `dsp_` prefix avoids the collision with `Speaker` (two-terminal) |

- If `Box` is used without `anchor`, the terminal closest to the current drawing direction is used as the placement reference (rightward uses `W`, upward uses `S`), and the drawing position moves to the opposite terminal.
- Circular elements (`Circle`, `Sum`, `SumSigma`, `Mixer`, `Oscillator`, `Circulator`) expose `N`, `S`, `E`, `W`, `NW`, `NE`, `SW`, `SE`, and `center`.
- Default label positions are center for `Box`, `Square`, `Circle`, `Sum`, `SumSigma`, `Adc`, and `Dac`; above for `Amp` and `VGA`; and above for `Mixer` (0.2 units outside).

### 6.8 ICs and digital components

| Type | Arguments | Terminals / notes |
|---|---|---|
| `Ic` | `size="(width height)"`, `pin="side name number"`, `side="side parameters..."`, `pinspacing`, `plblofst`, `botlabel` | IC with arbitrary pin placement. Position names such as `inL1`, `inR1`, `inT1`, `inB1`, pin names, `pinN`, and `center` |
| `Multiplexer` | `size` (required), `slant`, `demux=True/False`, `pinspacing`, `pin` | IC with a slanted edge. Position names such as `inL1`, pin names, `pinN`, and `center` |
| `IcDIP` | `pins`, `width`, `pinw`, `spacing`, `notch=True/False`, `number=True/False`, `pfontsize` | `p1`–`pN`, `p1_in`–`pN_in` |
| `Ic555` | `size="(width height)"` | `TRG`, `THR`, `DIS`, `CTL`, `OUT`, `RST`, `Vcc`, `GND` |
| `VoltageRegulator` | `size="(width height)"` | `in`, `out`, `gnd` |
| `DFlipFlop` | `size="(width height)"`, `preclr=True/False`, `preclrinvert` | `D`, `CLK`, `Q`, `Qbar`. `preclr` adds `PRE` and `CLR` |
| `JKFlipFlop` | `size="(width height)"`, `preclr=True/False`, `preclrinvert` | `J`, `K`, `CLK`, `Q`, `Qbar`. `preclr` adds `PRE` and `CLR` |
| `SevenSegment` | `digit="0"–"9"/"a"–"f"`, `decimal=True/False`, `anode=True/False`, `cathode=True/False`, `segcolor`, `tilt`, `labelsegments=True/False` | `a`–`g`, `dp`, `anode`, `cathode`, `inL1`, and so on |
| `Header` | `rows`, `cols`, `pinspacing`, `edge`, `style`, `numbering`, `shownumber=True/False`, `pinfill`, `pinsleft`, `pinsright`, `pinalignleft`, `pinalignright`, `pinfontsizeleft`, `pinfontsizeright`, `flip` | Pin header. `pin1`–`pinN` |
| `Transformer` | `t1`, `t2`, `core=True/False`, `align="center"/"bottom"/"top"`, `loop=False` | `p1`, `p2`, `s1`, `s2`, `tapP*`, `tapS*` |
| `DE9` | `pinspacing`, `edge`, `number=True/False`, `pinfill` | D-sub 9-pin. `pin1`–`pin9` |
| `DA15` | Same | D-sub 15-pin. `pin1`–`pin15` |
| `DB25` | Same | D-sub 25-pin. `pin1`–`pin25` |
| `DC37` | Same | D-sub 37-pin. `pin1`–`pin37` |
| `DD50` | Same | D-sub 50-pin. `pin1`–`pin50` |

#### Ic pin specification

Use `pin="side name number"` and repeat the argument as needed.

- `Ic`, `Multiplexer`, `IcDIP`, `Ic555`, `VoltageRegulator`, `DFlipFlop`, and `JKFlipFlop` accept `at`, `anchor`, `drop`, `theta`, `color`, `label`, `flip`, and `reverse`.
- `Header` and `Transformer` also accept `at`, `anchor`, `drop`, `theta`, `color`, `flip`, and `reverse` (`Transformer` does not support labels).
- Sides are `L`, `R`, `T`, and `B`. Words such as `left` are also accepted.
- The name becomes the inside label and terminal name; the number becomes the outside label and the `pinN` terminal. The name and number can be omitted with `-`.
- Adding `slot=X/Y` places the pin at the X-th of Y equal divisions along the side. Empty slots are left empty.
- Adding `invert` draws an inversion bubble.
- The same pin number can be assigned to multiple pins. The `pinN` terminal refers to the position of the last pin with that number.

`side="side parameters..."` sets per-side values for `spacing`, `pad`, `leadlen`, `label_ofst`, `label_size`, `pinlabel_ofst`, and `pinlabel_size`. If `size` is omitted, the box size is calculated from the pin count, `spacing`, `pad`, and pin-name widths.

#### Fixed-pin ICs

- `Ic555` has 8 pins and shows pin numbers and names. It shows `555` in the center by default.
- `VoltageRegulator` has three terminals: `in`, `out`, and `gnd`.
- `DFlipFlop` and `JKFlipFlop` add `PRE` and `CLR` terminals (with inversion bubbles) when `preclr=True`. `preclrinvert` is used together with `preclr=True`.
- `SevenSegment`'s `digit` is one character from `0`–`9` or `a`–`f`. Unlit segments are shown only as gray outlines. `decimal=True` adds a decimal point and the `dp` terminal. `segcolor` defaults to `red`; `tilt` defaults to 10.
- `Header`'s `style` is `round`, `square`, or `screw`; `numbering` is `lr`, `ud`, or `ccw`. `rows` and `cols` range from 1 to 100.
- `IcDIP`'s `pins` is an even number from 2 to 100. `Header`'s `pinsleft` and `pinsright` take lists such as `['A' 'B']`.
- `Transformer`'s `t1` and `t2` are integers from 1 to 100. Only `loop=False` is accepted; `loop=True` is not supported.
- `Multiplexer`'s `size` is required, and `slant` defaults to 25 degrees. `demux=True` makes the right side longer.

### 6.9 Switches and relays

| Type | Arguments | Terminals / notes |
|---|---|---|
| `SwitchRotary` | `n`, `dtheta`, `theta0`, `radius`, `arrowlen`, `arrowcontact` | Rotary switch. Shaft `P` and contacts `T1`–`Tn`. Standalone symbol that does not advance the drawing position |
| `SwitchDIP` | `n`, `pattern=[...]`, `switchcolor`, `swidth`, `spacing` | DIP switch. Lower contacts `a1`–`an`, upper contacts `b1`–`bn`. Standalone symbol |
| `Relay` | `switch="spst"/"spdt"/"dpst"/"dpdt"`, `core=True/False`, `link=True/False`, `box=True/False`, `boxfill`, `swreverse=True/False`, `swflip=True/False`, `cycl=True/False` | `in1`, `in2`, `center`, plus switch terminals determined by `switch` |
| `Optocoupler` | `box=True/False`, `boxfill`, `boxpad`, `base=True/False` | `anode`, `cathode`, `collector`, `emitter`, and `base` when `base=True` |

- `SwitchRotary`'s `n` is the number of contacts (default 4), `dtheta` is the angular spacing (default `min(35, 360/(n+1))` degrees), and `arrowcontact` is the 0-based index of the contact the arrow points to (default 0).
- `SwitchDIP`'s `n` is the number of switches (default 3), and `pattern=[True False ...]` sets each switch up/down. The number of elements must equal `n`.
- `Relay` switch terminals are `a`, `b` for `spst`; `a`, `b`, `c` for `spdt`; `t1`, `t2`, `p1`, `p2` for `dpst`; and `t1`–`t4`, `p1`, `p2` for `dpdt`. The default `switch` is `spst`.
- `Relay` and `Optocoupler` accept `at`, `anchor`, `theta`, `color`, `label`, `flip`, and `reverse`.
- `Relay`'s `boxpad` supports only the default value 0.25. Changing `unit` is not supported.

### 6.10 Connectors, cables, and wiring

| Type | Arguments | Terminals / notes |
|---|---|---|
| `CoaxConnect` | `radius`, `radiusinner`, `fillinner` | Coaxial connector. `center`, `N`, `S`, `E`, `W` |
| `Plug` | — | Male connector. `start`, `end` |
| `Jack` | — | Female connector. `start`, `end` |
| `Terminal` | `r`, `open=True/False` | Terminal. `start`, `center`, `end` |
| `Jumper` | `pinspacing` | Jumper. `center` |
| `AudioJack` | `ring=True/False`, `switch=True/False`, `ringswitch=True/False`, `dots=True/False`, `open=True/False`, `radius` | `tip`, `sleeve`, and as needed `ring`, `tipswitch`, `ringswitch` |
| `Speaker` | — | Two-terminal speaker. `in1`, `in2` |
| `Mic` | — | Microphone. `in1`, `in2` |
| `Antenna` | — | Antenna. `start`, `center`, `end` (all at the origin) |
| `AntennaLoop` | — | Loop antenna (diamond). `start`, `end` |
| `AntennaLoop2` | — | Loop antenna (rectangular). `start`, `end` |
| `BusConnect` | `n`, `slant_up=True/False`, `dy`, `l`, `lwbus` | Bus branch. `pin1`–`pinN`, `start`, `end`, `xy` |
| `OrthoLines` | `n`, `dy`, `xstart` | Orthogonal multi-wire bundle. No terminals. Use `at` and `to` for start and end |
| `Rectifier` | `fill=True`, `fill="color"` | Diode bridge. `N`, `S`, `E`, `W` |
| `LoopCurrent` | `elms=[...]`, `pad`, `direction="cw"/"ccw"`, `theta1`, `theta2` | Elliptical loop-current arrow. `center` |
| `CurrentLabel` | `top=True/False`, `ofst`, `length`, `headlength`, `headwidth` | Current arrow along a component. Specify the component name in `at` |
| `CurrentLabelInline` | `direction="in"/"out"`, `start=True/False`, `ofst`, `headlength`, `headwidth` | Inline current arrow on a wire. Specify the component name in `at` |

- `OrthoLines`'s `n` is the number of wires (1–100), `dy` is the spacing (default 0.6), and `xstart` is the position of the first vertical segment (0–1).
- `BusConnect`'s `n` is the number of branches (1–100, default 1), `dy` is the branch spacing, `l` is the branch length, and `lwbus` is the bus line width. Because `up` conflicts with the direction keyword, use `slant_up` to set the slant direction.
- `CoaxConnect`, `Plug`, `Jack`, `Terminal`, and `Jumper` accept `at`, `anchor`, `theta`, `color`, and `label`.
- `AudioJack`, `Speaker`, `Mic`, and the `Antenna` family accept `at`, `color`, `theta`, `flip`, `reverse`, `hold`, and `label`. Direction keywords are treated as `theta`. `length` is an error.
- `Rectifier` accepts `at`, `anchor`, `theta`, `color`, `fill`, `flip`, and `reverse`. It does not follow changes to `unit`.
- `LoopCurrent`'s `elms=[top right bottom left]` lists the four named components enclosing the loop. `pad` defaults to 0.2 drawing units, `theta1` to 35, and `theta2` to -35.
- `CurrentLabel`'s `top` defaults to `True` (above the component). `ofst` is the distance from the component's outer edge to the arrow (default 0.15), and `length` is the arrow length (default 2).

### 6.11 Vacuum tubes

| Type | Arguments | Terminals / notes |
|---|---|---|
| `Triode` | `heater=True/False`, `split="none"/"left"/"right"` | `anode`, `grid`, `grid_R`, `control`, `control_R`, `cathode`, `cathode_R`, `N`–`SW` |
| `VacuumTube` | `grids=0–8`, `cathode="heated"/"cold"/"none"`, `anodetype="plate"/"dot"/"narrow"/"none"`, `heater=True/False`, `split` | `anode`, `cathode`, `cathode_R`, `heat1`, `heat2`, grid terminals, `N`–`SW` |
| `TubeDiode` | `heater`, `split` | Two-electrode tube with `grids=0` fixed |
| `Tetrode` | `heater`, `split` | `grids=2` fixed. Has `screen` and `control` aliases |
| `Pentode` | `heater`, `split`, `strap=True/False` | `grids=3` fixed. Has `suppressor`, `screen`, and `control` aliases |
| `NixieTube` | `anodes=1–32`, `cathode="T"/"cold"/"heated"/"none"`, `anodetype="narrow"/"dot"`, `grid=True/False` | `anode0`..., `cathode`, `grid`, `grid_R` |
| `DualVacuumTube` | `grids_left`, `grids_right`, `heater=True/False`, `cathode="heated"`, `anodetype="plate"` | `anodeA`/`anodeB`, `cathodeA`/`cathodeB`, `gridA*`/`gridB*`, `heat1`/`heat2`, `N`–`SW` |

- Vacuum tube dimensions match schemdraw's `TubeBase` and do not follow `unit`.
- `Triode` accepts `at`, `anchor`, `theta`, `color`, labels, `heater`, and `split`.
- Labels on `VacuumTube` family components can use terminal names in `loc`; the default is top center. Terminal-name labels follow schemdraw's `LabelHint` (`ofst`, `halign`, `valign`, and `fontsize`).
- `DualVacuumTube` supports only `cathode="heated"` and `anodetype="plate"`.

### 6.12 Two-port elements and transactors

| Type | Arguments | Terminals |
|---|---|---|
| `Nullor` | `reverse_output` not allowed | `in_p`, `in_n`, `out_p`, `out_n`, `center` |
| `VoltageTransactor` | `reverse_output=True/False` | Same |
| `TransimpedanceTransactor` | `reverse_output=True/False` | Same |
| `CurrentTransactor` | `reverse_output=True/False` | Same |
| `TransadmittanceTransactor` | `reverse_output=True/False` | Same |

- `reverse` mirrors left/right, and `flip` mirrors top/bottom, including terminals.
- `reverse_output=True` flips only the dependent source on the output side. For voltage-type elements the output +/− is flipped; for current-type elements the output arrow direction changes.
- `reverse_output` on `Nullor` is an error.
- Accepts `at`, `anchor`, `theta`, `color`, `label`, `reverse`, and `flip`.
- Placement does not advance the drawing position.

### 6.13 Meters and displays

| Type | Arguments | Terminals / notes |
|---|---|---|
| `MeterBox` | `width`, `corner`, `inputs`, `input_ofst`, `input_lw`, `input_rad`, `input_fill` | Common box meter. `in1`, `in2`, `name`, and so on |
| `MeterAnalog` | Above plus `needle_percent`, `window_fill`, `needle_color`, `needle_width` | Analog meter. `needle_percent` is 0–100 |
| `MeterDigital` | Above plus `screen_fill`, `screen_lw` | Digital meter. Has a `display` terminal |
| `Oscilloscope` | `screen_fill`, `screen_lw`, `signal`, `signal_color`, `signal_lw`, `grid`, `grid_color`, `grid_lw` | Oscilloscope. `signal` is `none`, `sine`, `square`, or `triangle` |

- The box exposes `in1`, `in2`, `name`, `N`, `S`, `E`, `W`, `NE`, `NW`, `SE`, `SW`, and `xy`.
- Accepts `at`, `anchor`, `color`, `input_fill`, `width`, `corner`, `inputs`, `input_ofst`, `input_lw`, and `input_rad`.
- The default ending position is `in2`. `anchor` can use `in1`, `in2`, and so on as the placement reference.
- Label `loc` can be `name`, `in1`, or `in2`; `MeterDigital` also accepts `display`.
- A `needle_percent` value outside the valid range is an error.

### 6.14 Annotations and other elements

| Type | Arguments | Terminals / notes |
|---|---|---|
| `Arrow` | `double=True/False`, `arrow` | Line with an arrow. Default is `->`; `double=True` gives `<->` |
| `Arrowhead` | `headwidth`, `headlength` | Arrowhead only. `start`, `center`, `end` |
| `DotDotDot` | `radius`, `open=True/False` | Ellipsis (three dots). Normally advances 2 units to the right after drawing |
| `Label` | — | Text only. Put the text in `label` |
| `Tag` | `width`, `height` | Signal-name tag. `start` |
| `Dot` | `open=True/False` | Standalone connection dot. `start`, `center`, `end`, `xy` |

- `Arrow` accepts the same placement arguments as `Line` (direction, `length`, `at`, `to`, `tox`, `toy`, `endpoints`). `Arrowhead`, `Label`, and `Tag` are standalone symbols; `length` is an error. Direction keywords are treated as `theta` (on `Tag` they select the tag direction).
- `Arrow`, `Arrowhead`, `Label`, and `Tag` accept `at`, `color`, `theta`, `flip`, `reverse`, `hold`, and `label`.
- `DotDotDot` becomes hollow with `open=True`. `reverse` makes it advance to the left.
- `Tag`'s `width` defaults to 1.5 units and `height` to 0.625 units. Use `left` or `right` to choose the tag orientation.
- `Dot` can use `at` to refer to another component's terminal. By default the label is placed above the dot; use `loc=top`, `loc=bot`, `loc=left`, or `loc=right` to change it.

### 6.15 Outlets

| Type | Arguments | Terminals / notes |
|---|---|---|
| `OutletA`–`OutletL` | `plug=True/False` | Twelve national outlet styles. `hot`, `neutral`, and `ground` where the style has ground |

- `OutletA` is North America (no ground), `B` North America (with ground), `C` Europe (no ground), `D` India, `E` France and others, `F` Europe (with ground), `G` United Kingdom, `H` Israel, `I` Australia/China, `J` Switzerland, `K` Denmark, and `L` Italy/Chile.
- `plug=True` fills the pins and holes black. The default is `False`.
- Accepts `at`, `color`, `theta`, `flip`, `reverse`, `hold`, and `label`. Direction keywords are treated as `theta`. `length` is an error.

### 6.16 Component name collisions

In schemdraw, the same class name can exist in multiple modules with different shapes. Because fleming type names share one namespace, such components are registered as **`module_ClassName`**.

| fleming type | schemdraw class | Collision |
|---|---|---|
| `dsp_Speaker` | `schemdraw.dsp.Speaker` | `Speaker` (`schemdraw.elements.Speaker`, two-terminal) |

Only the colliding side gets the prefix. Names from `elements` are used as-is; names from another module get the `module_` prefix. The prefix is the schemdraw module name (`dsp`, `flow`, `logic`, `pictorial`) unchanged, and the class spelling and capitalization are preserved.

---

## 7. Implementation limits

- fleming.js is under development. The notation, components, arguments, and rendering results may change without notice.
- Shapes, terminals, and placement are ported by referencing schemdraw 0.23 source and official SVGs, but not every component, argument, or combination matches schemdraw exactly.
- Argument acceptance varies by component. An argument may be accepted by the global argument list but not used by a particular component's drawing code. Unsupported combinations generally produce errors, but this checking is not exhaustive.
- A named block contains exactly one component. Nested named blocks and placing a `hold` block inside a named block are not supported.
- Defining the same name twice in one circuit is an error. Use distinct names when reusing a component.
- General-purpose LaTeX and direct PNG/PDF output are not supported.
- Unsupported components, arguments, and invalid syntax are generally reported as errors rather than silently ignored. However, circuits dropped by `@layout` are not rendered, so errors inside them may not be detected.
- Error messages are in English. Line numbers refer to lines inside the `circuit` block.
