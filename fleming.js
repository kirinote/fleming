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

  // Schemdraw documentation examples, keyed by the example name. These are
  // reference images, not interchangeable geometry/anchor definitions.
  const referenceImages = Object.freeze({"Resistor":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><path d=\"M 0.0,-0.0 L 36,-0 L 39,-9 L 45,9 L 51,-9 L 57,9 L 63,-9 L 69,9 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","ResistorVar":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"59.72pt\" width=\"117.2pt\" viewBox=\"-4.6 -31.36 117.2 59.72\"><path d=\"M 0.0,-0.0 L 36,-0 L 39,-9 L 45,9 L 51,-9 L 57,9 L 63,-9 L 69,9 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 45.0,18.0 L 59.983,-14.463\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 62.162 -19.184 L 62.598 -13.256 L 57.368 -15.67 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","Potentiometer":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"52.71999999999999pt\" width=\"117.2pt\" viewBox=\"-4.6 -39.11999999999999 117.2 52.71999999999999\"><path d=\"M 0.0,-0.0 L 36,-0 L 39,-9 L 45,9 L 51,-9 L 57,9 L 63,-9 L 69,9 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,-25.919999999999998 L 54,-18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54 -11 L 51.3 -18 L 56.7 -18 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"54.0\" y=\"-39.519999999999996\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"10\">tap</tspan></text></svg>","Photoresistor":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"50.96000000000001pt\" width=\"117.2pt\" viewBox=\"-4.6 -37.36000000000001 117.2 50.96000000000001\"><path d=\"M 0.0,-0.0 L 36,-0 L 39,-9 L 45,9 L 51,-9 L 57,9 L 63,-9 L 69,9 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 61.199999999999996,-27.0 L 55.086,-19.867\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 51.702 -15.919 L 52.899 -21.741 L 57.272 -17.992 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 72.0,-27.0 L 65.886,-19.867\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 62.502 -15.919 L 63.699 -21.741 L 68.072 -17.992 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","Fuse":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.190751891612383pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.595375945806191 117.2 27.190751891612383\"><path d=\"M 0.0,-0.0 L 38.16,-0 L 38.807,-1.151 L 39.453,-2.283 L 40.1,-3.377 L 40.746,-4.416 L 41.393,-5.383 L 42.039,-6.261 L 42.686,-7.036 L 43.332,-7.696 L 43.979,-8.23 L 44.625,-8.628 L 45.272,-8.885 L 45.918,-8.995 L 46.565,-8.958 L 47.211,-8.774 L 47.858,-8.446 L 48.504,-7.979 L 49.151,-7.382 L 49.798,-6.663 L 50.444,-5.834 L 51.091,-4.91 L 51.737,-3.905 L 52.384,-2.836 L 53.03,-1.72 L 53.677,-0.577 L 54.323,0.577 L 54.97,1.72 L 55.616,2.836 L 56.263,3.905 L 56.909,4.91 L 57.556,5.834 L 58.202,6.663 L 58.849,7.382 L 59.496,7.979 L 60.142,8.446 L 60.789,8.774 L 61.435,8.958 L 62.082,8.995 L 62.728,8.885 L 63.375,8.628 L 64.021,8.23 L 64.668,7.696 L 65.314,7.036 L 65.961,6.261 L 66.607,5.383 L 67.254,4.416 L 67.9,3.377 L 68.547,2.283 L 69.193,1.151 L 69.84,0 L 108,0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 29.520000000000003,-0.0 M 78.48,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"33.84\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"74.16\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","Resistor (IEC)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><path d=\"M 0.0,-0.0 L 36,-0 L 36,-9 L 72,-9 L 72,9 L 36,9 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","ResistorVar (IEC)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"59.72pt\" width=\"117.2pt\" viewBox=\"-4.6 -31.36 117.2 59.72\"><path d=\"M 0.0,-0.0 L 36,-0 L 36,-9 L 72,-9 L 72,9 L 36,9 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 42.0,18.0 L 62.226,-14.868\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 64.952 -19.297 L 64.679 -13.359 L 59.774 -16.377 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","Potentiometer (IEC)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"52.71999999999999pt\" width=\"117.2pt\" viewBox=\"-4.6 -39.11999999999999 117.2 52.71999999999999\"><path d=\"M 0.0,-0.0 L 36,-0 L 36,-9 L 72,-9 L 72,9 L 36,9 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,-25.919999999999998 L 54,-18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54 -11 L 51.3 -18 L 56.7 -18 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"54.0\" y=\"-39.519999999999996\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"10\">tap</tspan></text></svg>","Photoresistor (IEC)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"50.96000000000001pt\" width=\"117.2pt\" viewBox=\"-4.6 -37.36000000000001 117.2 50.96000000000001\"><path d=\"M 0.0,-0.0 L 36,-0 L 36,-9 L 72,-9 L 72,9 L 36,9 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 61.199999999999996,-27.0 L 55.086,-19.867\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 51.702 -15.919 L 52.899 -21.741 L 57.272 -17.992 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 72.0,-27.0 L 65.886,-19.867\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 62.502 -15.919 L 63.699 -21.741 L 68.072 -17.992 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","Fuse (IEC)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><path d=\"M 0.0,-0.0 L 36,-0 L 36,-9 L 72,-9 L 72,9 L 36,9 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 41.94,-9.0 L 41.94,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 66.06,-9.0 L 66.06,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","ResistorIEEE":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><path d=\"M 0.0,-0.0 L 36,-0 L 39,-9 L 45,9 L 51,-9 L 57,9 L 63,-9 L 69,9 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","ResistorIEC":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><path d=\"M 0.0,-0.0 L 36,-0 L 36,-9 L 72,-9 L 72,9 L 36,9 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","ResistorVarIEEE":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"59.72pt\" width=\"117.2pt\" viewBox=\"-4.6 -31.36 117.2 59.72\"><path d=\"M 0.0,-0.0 L 36,-0 L 39,-9 L 45,9 L 51,-9 L 57,9 L 63,-9 L 69,9 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 45.0,18.0 L 59.983,-14.463\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 62.162 -19.184 L 62.598 -13.256 L 57.368 -15.67 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","ResistorVarIEC":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"59.72pt\" width=\"117.2pt\" viewBox=\"-4.6 -31.36 117.2 59.72\"><path d=\"M 0.0,-0.0 L 36,-0 L 36,-9 L 72,-9 L 72,9 L 36,9 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 42.0,18.0 L 62.226,-14.868\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 64.952 -19.297 L 64.679 -13.359 L 59.774 -16.377 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","PotentiometerIEEE":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"52.71999999999999pt\" width=\"117.2pt\" viewBox=\"-4.6 -39.11999999999999 117.2 52.71999999999999\"><path d=\"M 0.0,-0.0 L 36,-0 L 39,-9 L 45,9 L 51,-9 L 57,9 L 63,-9 L 69,9 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,-25.919999999999998 L 54,-18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54 -11 L 51.3 -18 L 56.7 -18 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"54.0\" y=\"-39.519999999999996\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"10\">tap</tspan></text></svg>","PotentiometerIEC":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"52.71999999999999pt\" width=\"117.2pt\" viewBox=\"-4.6 -39.11999999999999 117.2 52.71999999999999\"><path d=\"M 0.0,-0.0 L 36,-0 L 36,-9 L 72,-9 L 72,9 L 36,9 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,-25.919999999999998 L 54,-18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54 -11 L 51.3 -18 L 56.7 -18 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"54.0\" y=\"-39.519999999999996\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"10\">tap</tspan></text></svg>","PhotoresistorIEEE":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"50.96000000000001pt\" width=\"117.2pt\" viewBox=\"-4.6 -37.36000000000001 117.2 50.96000000000001\"><path d=\"M 0.0,-0.0 L 36,-0 L 39,-9 L 45,9 L 51,-9 L 57,9 L 63,-9 L 69,9 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 61.199999999999996,-27.0 L 55.086,-19.867\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 51.702 -15.919 L 52.899 -21.741 L 57.272 -17.992 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 72.0,-27.0 L 65.886,-19.867\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 62.502 -15.919 L 63.699 -21.741 L 68.072 -17.992 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","PhotoresistorIEC":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"50.96000000000001pt\" width=\"117.2pt\" viewBox=\"-4.6 -37.36000000000001 117.2 50.96000000000001\"><path d=\"M 0.0,-0.0 L 36,-0 L 36,-9 L 72,-9 L 72,9 L 36,9 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 61.199999999999996,-27.0 L 55.086,-19.867\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 51.702 -15.919 L 52.899 -21.741 L 57.272 -17.992 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 72.0,-27.0 L 65.886,-19.867\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 62.502 -15.919 L 63.699 -21.741 L 68.072 -17.992 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","FuseUS":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.190751891612383pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.595375945806191 117.2 27.190751891612383\"><path d=\"M 0.0,-0.0 L 38.16,-0 L 38.807,-1.151 L 39.453,-2.283 L 40.1,-3.377 L 40.746,-4.416 L 41.393,-5.383 L 42.039,-6.261 L 42.686,-7.036 L 43.332,-7.696 L 43.979,-8.23 L 44.625,-8.628 L 45.272,-8.885 L 45.918,-8.995 L 46.565,-8.958 L 47.211,-8.774 L 47.858,-8.446 L 48.504,-7.979 L 49.151,-7.382 L 49.798,-6.663 L 50.444,-5.834 L 51.091,-4.91 L 51.737,-3.905 L 52.384,-2.836 L 53.03,-1.72 L 53.677,-0.577 L 54.323,0.577 L 54.97,1.72 L 55.616,2.836 L 56.263,3.905 L 56.909,4.91 L 57.556,5.834 L 58.202,6.663 L 58.849,7.382 L 59.496,7.979 L 60.142,8.446 L 60.789,8.774 L 61.435,8.958 L 62.082,8.995 L 62.728,8.885 L 63.375,8.628 L 64.021,8.23 L 64.668,7.696 L 65.314,7.036 L 65.961,6.261 L 66.607,5.383 L 67.254,4.416 L 67.9,3.377 L 68.547,2.283 L 69.193,1.151 L 69.84,0 L 108,0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 29.520000000000003,-0.0 M 78.48,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"33.84\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"74.16\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","FuseIEEE":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><path d=\"M 0.0,-0.0 L 36,-0 L 36,-9 L 72,-9 L 72,9 L 36,9 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 36.0,-0.0 L 72,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","FuseIEC":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><path d=\"M 0.0,-0.0 L 36,-0 L 36,-9 L 72,-9 L 72,9 L 36,9 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 41.94,-9.0 L 41.94,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 66.06,-9.0 L 66.06,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Rshunt":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"49.8pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 49.8\"><path d=\"M 0.0,-0.0 L 36,-0 L 36,-9 L 72,-9 L 72,9 L 36,9 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 36.0,-0.0 L 22.5,9 L 22.5,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 72.0,-0.0 L 85.5,9 L 85.5,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"22.5\" y=\"11.599999999999998\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"22.5\" dy=\"10\">v1</tspan></text><text x=\"85.5\" y=\"11.599999999999998\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"85.5\" dy=\"10\">v2</tspan></text></svg>","Capacitor":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><path d=\"M 0.0,-0.0 L 50.76,-0 M 50.76,-9 L 50.76,9 M 57.24,-9 L 57.24,9 M 57.24,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Capacitor(polar=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"38.67999999999999pt\" width=\"117.2pt\" viewBox=\"-4.6 -25.079999999999995 117.2 38.67999999999999\"><path d=\"M 0.0,-0.0 L 50.76,-0 M 50.76,-9 L 50.76,9 M 57.24,-9 L 57.24,9 M 57.24,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"42.983999999999995\" y=\"-20.48\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"42.983999999999995\" dy=\"14\">+</tspan></text></svg>","Capacitor2":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"28.320645825342716pt\" width=\"117.2pt\" viewBox=\"-4.6 -14.16032291267136 117.2 28.320645825342716\"><path d=\"M 57.92 9.56 a 4.86 11.25 0 0 1 0 -19.12\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 50.76,-0 M 50.76,-9 L 50.76,9 M 57.24,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Capacitor2(polar=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"39.240322912671346pt\" width=\"117.2pt\" viewBox=\"-4.6 -25.079999999999995 117.2 39.240322912671346\"><path d=\"M 57.92 9.56 a 4.86 11.25 0 0 1 0 -19.12\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 50.76,-0 M 50.76,-9 L 50.76,9 M 57.24,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"42.983999999999995\" y=\"-20.48\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"42.983999999999995\" dy=\"14\">+</tspan></text></svg>","CapacitorVar":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"41.72pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.36 117.2 41.72\"><path d=\"M 0.0,-0.0 L 50.76,-0 M 50.76,-9 L 50.76,9 M 57.24,-9 L 57.24,9 M 57.24,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 38.76,9.0 L 62.862,-7.871\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 67.122 -10.853 L 64.513 -5.512 L 61.21 -10.23 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","CapacitorTrim":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"31.443070860377922pt\" width=\"117.2pt\" viewBox=\"-4.6 -17.843070860377924 117.2 31.443070860377922\"><path d=\"M 0.0,-0.0 L 50.76,-0 M 50.76,-9 L 50.76,9 M 57.24,-9 L 57.24,9 M 57.24,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 39.959999999999994,9.0 L 68.04,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 65.32008278180902,-13.243070860377925 L 70.76,-4.757\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Inductor":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"41.519999999999996pt\" width=\"117.2pt\" viewBox=\"-4.6 -26.519999999999996 117.2 41.519999999999996\"><path d=\"M 36 -0 a 4.5 4.5 0 1 1 9 0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 45 -0 a 4.5 4.5 0 1 1 9 0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 54 -0 a 4.5 4.5 0 1 1 9 0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 63 -0 a 4.5 4.5 0 1 1 9 0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"72.0\" y=\"-26.919999999999998\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"72.0\" dy=\"10\">NE</tspan></text><text x=\"36.0\" y=\"-26.919999999999998\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"36.0\" dy=\"10\">NW</tspan></text><text x=\"72.0\" y=\"-4.6000000000000005\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"72.0\" dy=\"10\">SE</tspan></text><text x=\"36.0\" y=\"-4.6000000000000005\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"36.0\" dy=\"10\">SW</tspan></text></svg>","Inductor(core=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"46.519999999999996pt\" width=\"117.2pt\" viewBox=\"-4.6 -31.52 117.2 46.519999999999996\"><path d=\"M 36 -0 a 4.5 4.5 0 1 1 9 0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 45 -0 a 4.5 4.5 0 1 1 9 0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 54 -0 a 4.5 4.5 0 1 1 9 0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 63 -0 a 4.5 4.5 0 1 1 9 0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 36.0,-9.0 L 72,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"72.0\" y=\"-26.919999999999998\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"72.0\" dy=\"10\">NE</tspan></text><text x=\"36.0\" y=\"-26.919999999999998\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"36.0\" dy=\"10\">NW</tspan></text><text x=\"72.0\" y=\"-4.6000000000000005\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"72.0\" dy=\"10\">SE</tspan></text><text x=\"36.0\" y=\"-4.6000000000000005\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"36.0\" dy=\"10\">SW</tspan></text></svg>","Inductor2":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"59.519999999999996pt\" width=\"117.2pt\" viewBox=\"-4.6 -35.52 117.2 59.519999999999996\"><path d=\"M 0.0,-0.0 L 36,-0 L 36.033,-1.463 L 36.134,-2.964 L 36.304,-4.472 L 36.542,-5.955 L 36.846,-7.382 L 37.214,-8.722 L 37.64,-9.947 L 38.12,-11.033 L 38.645,-11.954 L 39.208,-12.693 L 39.8,-13.234 L 40.412,-13.565 L 41.034,-13.679 L 41.657,-13.574 L 42.269,-13.252 L 42.863,-12.72 L 43.427,-11.989 L 43.954,-11.075 L 44.435,-9.996 L 44.864,-8.776 L 45.234,-7.44 L 45.541,-6.016 L 45.782,-4.535 L 45.955,-3.027 L 46.059,-1.525 L 46.094,-0.06 L 46.065,1.337 L 45.974,2.637 L 45.826,3.812 L 45.628,4.838 L 45.388,5.692 L 45.112,6.357 L 44.811,6.819 L 44.493,7.068 L 44.169,7.099 L 43.849,6.911 L 43.542,6.508 L 43.258,5.899 L 43.006,5.096 L 42.795,4.117 L 42.633,2.981 L 42.525,1.714 L 42.478,0.341 L 42.495,-1.108 L 42.58,-2.603 L 42.733,-4.112 L 42.955,-5.604 L 43.244,-7.047 L 43.597,-8.41 L 44.01,-9.666 L 44.477,-10.787 L 44.991,-11.749 L 45.546,-12.534 L 46.132,-13.123 L 46.74,-13.505 L 47.361,-13.671 L 47.984,-13.619 L 48.6,-13.349 L 49.199,-12.866 L 49.771,-12.181 L 50.308,-11.309 L 50.801,-10.268 L 51.243,-9.08 L 51.627,-7.769 L 51.95,-6.364 L 52.207,-4.893 L 52.396,-3.389 L 52.516,-1.883 L 52.568,-0.406 L 52.554,1.01 L 52.477,2.336 L 52.343,3.543 L 52.156,4.607 L 51.925,5.504 L 51.657,6.216 L 51.361,6.727 L 51.046,7.028 L 50.723,7.111 L 50.401,6.976 L 50.09,6.624 L 49.8,6.063 L 49.54,5.305 L 49.318,4.366 L 49.144,3.266 L 49.022,2.028 L 48.96,0.678 L 48.962,-0.755 L 49.03,-2.242 L 49.167,-3.751 L 49.372,-5.25 L 49.645,-6.707 L 49.983,-8.092 L 50.382,-9.376 L 50.837,-10.532 L 51.341,-11.534 L 51.886,-12.363 L 52.466,-13 L 53.07,-13.433 L 53.688,-13.652 L 54.312,-13.652 L 54.93,-13.433 L 55.534,-13 L 56.114,-12.363 L 56.659,-11.534 L 57.163,-10.532 L 57.618,-9.376 L 58.017,-8.092 L 58.355,-6.707 L 58.628,-5.25 L 58.833,-3.751 L 58.97,-2.242 L 59.038,-0.755 L 59.04,0.678 L 58.978,2.028 L 58.856,3.266 L 58.682,4.366 L 58.46,5.305 L 58.2,6.063 L 57.91,6.624 L 57.599,6.976 L 57.277,7.111 L 56.954,7.028 L 56.639,6.727 L 56.343,6.216 L 56.075,5.504 L 55.844,4.607 L 55.657,3.543 L 55.523,2.336 L 55.446,1.01 L 55.432,-0.406 L 55.484,-1.883 L 55.604,-3.389 L 55.793,-4.893 L 56.05,-6.364 L 56.373,-7.769 L 56.757,-9.08 L 57.199,-10.268 L 57.692,-11.309 L 58.229,-12.181 L 58.801,-12.866 L 59.4,-13.349 L 60.016,-13.619 L 60.639,-13.671 L 61.26,-13.505 L 61.868,-13.123 L 62.454,-12.534 L 63.009,-11.749 L 63.523,-10.787 L 63.99,-9.666 L 64.403,-8.41 L 64.756,-7.047 L 65.045,-5.604 L 65.267,-4.112 L 65.42,-2.603 L 65.505,-1.108 L 65.522,0.341 L 65.475,1.714 L 65.367,2.981 L 65.205,4.117 L 64.994,5.096 L 64.742,5.899 L 64.458,6.508 L 64.151,6.911 L 63.831,7.099 L 63.507,7.068 L 63.189,6.819 L 62.888,6.357 L 62.612,5.692 L 62.372,4.838 L 62.174,3.812 L 62.026,2.637 L 61.935,1.337 L 61.906,-0.06 L 61.941,-1.525 L 62.045,-3.027 L 62.218,-4.535 L 62.459,-6.016 L 62.766,-7.44 L 63.136,-8.776 L 63.565,-9.996 L 64.046,-11.075 L 64.573,-11.989 L 65.137,-12.72 L 65.731,-13.252 L 66.343,-13.574 L 66.966,-13.679 L 67.588,-13.565 L 68.2,-13.234 L 68.792,-12.693 L 69.355,-11.954 L 69.88,-11.033 L 70.36,-9.947 L 70.786,-8.722 L 71.154,-7.382 L 71.458,-5.955 L 71.696,-4.472 L 71.866,-2.964 L 71.967,-1.463 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"72.0\" y=\"-35.92\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"72.0\" dy=\"10\">NE</tspan></text><text x=\"36.0\" y=\"-35.92\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"36.0\" dy=\"10\">NW</tspan></text><text x=\"72.0\" y=\"4.4\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"72.0\" dy=\"10\">SE</tspan></text><text x=\"36.0\" y=\"4.4\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"36.0\" dy=\"10\">SW</tspan></text></svg>","Inductor2(loops=2)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"59.519999999999996pt\" width=\"117.2pt\" viewBox=\"-4.6 -35.52 117.2 59.519999999999996\"><path d=\"M 0.0,-0.0 L 36,-0 L 36.067,-1.662 L 36.271,-3.367 L 36.614,-5.07 L 37.093,-6.724 L 37.704,-8.284 L 38.436,-9.708 L 39.276,-10.956 L 40.21,-11.996 L 41.219,-12.798 L 42.282,-13.341 L 43.379,-13.61 L 44.486,-13.598 L 45.58,-13.304 L 46.64,-12.738 L 47.643,-11.914 L 48.569,-10.855 L 49.401,-9.59 L 50.122,-8.152 L 50.722,-6.582 L 51.189,-4.922 L 51.52,-3.217 L 51.712,-1.514 L 51.767,0.142 L 51.691,1.704 L 51.494,3.131 L 51.187,4.384 L 50.787,5.429 L 50.312,6.236 L 49.781,6.785 L 49.217,7.06 L 48.642,7.054 L 48.079,6.767 L 47.55,6.206 L 47.077,5.388 L 46.681,4.334 L 46.379,3.072 L 46.186,1.639 L 46.116,0.071 L 46.177,-1.588 L 46.375,-3.292 L 46.712,-4.996 L 47.186,-6.653 L 47.791,-8.218 L 48.517,-9.649 L 49.354,-10.906 L 50.284,-11.955 L 51.289,-12.768 L 52.351,-13.323 L 53.447,-13.604 L 54.553,-13.604 L 55.649,-13.323 L 56.711,-12.768 L 57.716,-11.955 L 58.646,-10.906 L 59.483,-9.649 L 60.209,-8.218 L 60.814,-6.653 L 61.288,-4.996 L 61.625,-3.292 L 61.823,-1.588 L 61.884,0.071 L 61.814,1.639 L 61.621,3.072 L 61.319,4.334 L 60.923,5.388 L 60.45,6.206 L 59.921,6.767 L 59.358,7.054 L 58.783,7.06 L 58.219,6.785 L 57.688,6.236 L 57.213,5.429 L 56.813,4.384 L 56.506,3.131 L 56.309,1.704 L 56.233,0.142 L 56.288,-1.514 L 56.48,-3.217 L 56.811,-4.922 L 57.278,-6.582 L 57.878,-8.152 L 58.599,-9.59 L 59.431,-10.855 L 60.357,-11.914 L 61.36,-12.738 L 62.42,-13.304 L 63.514,-13.598 L 64.621,-13.61 L 65.718,-13.341 L 66.781,-12.798 L 67.79,-11.996 L 68.724,-10.956 L 69.564,-9.708 L 70.296,-8.284 L 70.907,-6.724 L 71.386,-5.07 L 71.729,-3.367 L 71.933,-1.662 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"72.0\" y=\"-35.92\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"72.0\" dy=\"10\">NE</tspan></text><text x=\"36.0\" y=\"-35.92\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"36.0\" dy=\"10\">NW</tspan></text><text x=\"72.0\" y=\"4.4\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"72.0\" dy=\"10\">SE</tspan></text><text x=\"36.0\" y=\"4.4\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"36.0\" dy=\"10\">SW</tspan></text></svg>","Diode":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><polygon points=\"47.7,-9 60.3,-0 47.7,9 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 47.7,-0 M 60.3,-9 L 60.3,9 M 60.3,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Diode(fill=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><polygon points=\"47.7,-9 60.3,-0 47.7,9 \" style=\"stroke:black;fill:black;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 47.7,-0 M 60.3,-9 L 60.3,9 M 60.3,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Schottky":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><polygon points=\"47.7,-9 60.3,-0 47.7,9 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 47.7,-0 M 60.3,-9 L 60.3,9 M 60.3,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 60.3,-9.0 L 56.7,-9 L 56.7,-5.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 60.3,9.0 L 63.9,9 L 63.9,5.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","DiodeTunnel":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><polygon points=\"47.7,-9 60.3,-0 47.7,9 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 47.7,-0 M 60.3,-9 L 60.3,9 M 60.3,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 60.3,-9.0 L 56.7,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 60.3,9.0 L 56.7,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","DiodeShockley":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><path d=\"M 0.0,-0.0 L 47.7,-0 L 60.3,-0 L 60.3,-9 L 60.3,9 M 60.3,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 47.699999999999996,9.0 L 47.7,-9 L 60.3,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Zener":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"34.4pt\" width=\"117.2pt\" viewBox=\"-4.6 -17.2 117.2 34.4\"><polygon points=\"47.7,-9 60.3,-0 47.7,9 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 47.7,-0 M 60.3,-9 L 60.3,9 M 60.3,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 60.3,-9.0 L 63.9,-12.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 60.3,9.0 L 56.7,12.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","DiodeTVS":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><polygon points=\"41.4,-9 54,-0 41.4,9 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"54,-0 66.6,-9 66.6,9 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 41.4,-0 M 66.6,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 57.599999999999994,-9.0 L 54,-9 L 54,9 L 50.4,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Varactor":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><polygon points=\"45.36,-9 57.96,-0 45.36,9 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 45.36,-0 M 57.96,-9 L 57.96,9 M 62.64,-9 L 62.64,9 M 62.64,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","LED":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"53.21000000000001pt\" width=\"117.2pt\" viewBox=\"-4.6 -39.61000000000001 117.2 53.21000000000001\"><polygon points=\"47.7,-9 60.3,-0 47.7,9 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 47.7,-0 M 60.3,-9 L 60.3,9 M 60.3,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 56.699999999999996,-13.5 L 62.128,-22.999\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 64.708 -27.514 L 64.628 -21.57 L 59.627 -24.428 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 48.599999999999994,-13.5 L 54.028,-22.999\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 56.608 -27.514 L 56.528 -21.57 L 51.527 -24.428 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","LED2":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"59.42099162877511pt\" width=\"117.2pt\" viewBox=\"-4.6 -45.82099162877511 117.2 59.42099162877511\"><polygon points=\"47.7,-9 60.3,-0 47.7,9 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 47.7,-0 M 60.3,-9 L 60.3,9 M 60.3,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 43.207727049747696,-32.07809819394584 L 43.894,-30.46 L 44.522,-29.004 L 45.093,-27.703 L 45.61,-26.551 L 46.076,-25.54 L 46.493,-24.664 L 46.863,-23.916 L 47.189,-23.288 L 47.474,-22.774 L 47.72,-22.367 L 47.929,-22.06 L 48.105,-21.846 L 48.249,-21.719 L 48.364,-21.671 L 48.453,-21.695 L 48.518,-21.785 L 48.561,-21.934 L 48.586,-22.134 L 48.595,-22.379 L 48.589,-22.662 L 48.573,-22.977 L 48.547,-23.315 L 48.516,-23.671 L 48.48,-24.037 L 48.443,-24.406 L 48.408,-24.772 L 48.376,-25.128 L 48.351,-25.466 L 48.334,-25.78 L 48.329,-26.063 L 48.337,-26.308 L 48.362,-26.509 L 48.406,-26.657 L 48.471,-26.747 L 48.56,-26.772 L 48.675,-26.724 L 48.819,-26.596 L 48.995,-26.382 L 49.204,-26.075 L 49.45,-25.669 L 49.735,-25.155 L 50.061,-24.527 L 50.431,-23.778 L 50.848,-22.902 L 51.313,-21.891 L 51.83,-20.739 L 52.402,-19.438 L 53.029,-17.983 L 53.716,-16.364\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 36.441940180089155,-29.615553162001028 L 37.129,-27.997 L 37.756,-26.542 L 38.327,-25.241 L 38.844,-24.089 L 39.31,-23.078 L 39.727,-22.202 L 40.097,-21.453 L 40.423,-20.825 L 40.708,-20.311 L 40.954,-19.905 L 41.163,-19.598 L 41.339,-19.384 L 41.483,-19.256 L 41.598,-19.208 L 41.687,-19.233 L 41.752,-19.323 L 41.796,-19.471 L 41.82,-19.672 L 41.829,-19.917 L 41.824,-20.2 L 41.807,-20.514 L 41.782,-20.852 L 41.75,-21.208 L 41.714,-21.574 L 41.678,-21.943 L 41.642,-22.309 L 41.61,-22.665 L 41.585,-23.003 L 41.568,-23.318 L 41.563,-23.601 L 41.572,-23.846 L 41.596,-24.046 L 41.64,-24.195 L 41.705,-24.285 L 41.794,-24.309 L 41.909,-24.261 L 42.053,-24.134 L 42.229,-23.92 L 42.438,-23.613 L 42.684,-23.206 L 42.969,-22.692 L 43.295,-22.064 L 43.665,-21.316 L 44.082,-20.44 L 44.548,-19.429 L 45.065,-18.276 L 45.636,-16.976 L 46.263,-15.52 L 46.95,-13.902\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 43.89438804922317,-30.460025252061403 L 44.555,-28.738\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 42.693 -33.594 L 47.244 -29.77 L 41.866 -27.707 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 37.128601179564626,-27.99748022011659 L 37.789,-26.276\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 35.927 -31.131 L 40.478 -27.307 L 35.1 -25.245 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","LED(fill='red')":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"53.21000000000001pt\" width=\"117.2pt\" viewBox=\"-4.6 -39.61000000000001 117.2 53.21000000000001\"><polygon points=\"47.7,-9 60.3,-0 47.7,9 \" style=\"stroke:black;fill:red;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 47.7,-0 M 60.3,-9 L 60.3,9 M 60.3,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 56.699999999999996,-13.5 L 62.128,-22.999\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 64.708 -27.514 L 64.628 -21.57 L 59.627 -24.428 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 48.599999999999994,-13.5 L 54.028,-22.999\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 56.608 -27.514 L 56.528 -21.57 L 51.527 -24.428 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","Photodiode":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"50.278098193945844pt\" width=\"117.2pt\" viewBox=\"-4.6 -36.67809819394584 117.2 50.278098193945844\"><polygon points=\"47.7,-9 60.3,-0 47.7,9 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 47.7,-0 M 60.3,-9 L 60.3,9 M 60.3,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 43.207727049747696,-32.07809819394584 L 43.894,-30.46 L 44.522,-29.004 L 45.093,-27.703 L 45.61,-26.551 L 46.076,-25.54 L 46.493,-24.664 L 46.863,-23.916 L 47.189,-23.288 L 47.474,-22.774 L 47.72,-22.367 L 47.929,-22.06 L 48.105,-21.846 L 48.249,-21.719 L 48.364,-21.671 L 48.453,-21.695 L 48.518,-21.785 L 48.561,-21.934 L 48.586,-22.134 L 48.595,-22.379 L 48.589,-22.662 L 48.573,-22.977 L 48.547,-23.315 L 48.516,-23.671 L 48.48,-24.037 L 48.443,-24.406 L 48.408,-24.772 L 48.376,-25.128 L 48.351,-25.466 L 48.334,-25.78 L 48.329,-26.063 L 48.337,-26.308 L 48.362,-26.509 L 48.406,-26.657 L 48.471,-26.747 L 48.56,-26.772 L 48.675,-26.724 L 48.819,-26.596 L 48.995,-26.382 L 49.204,-26.075 L 49.45,-25.669 L 49.735,-25.155 L 50.061,-24.527 L 50.431,-23.778 L 50.848,-22.902 L 51.313,-21.891 L 51.83,-20.739 L 52.402,-19.438 L 53.029,-17.983 L 53.716,-16.364\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 36.441940180089155,-29.615553162001028 L 37.129,-27.997 L 37.756,-26.542 L 38.327,-25.241 L 38.844,-24.089 L 39.31,-23.078 L 39.727,-22.202 L 40.097,-21.453 L 40.423,-20.825 L 40.708,-20.311 L 40.954,-19.905 L 41.163,-19.598 L 41.339,-19.384 L 41.483,-19.256 L 41.598,-19.208 L 41.687,-19.233 L 41.752,-19.323 L 41.796,-19.471 L 41.82,-19.672 L 41.829,-19.917 L 41.824,-20.2 L 41.807,-20.514 L 41.782,-20.852 L 41.75,-21.208 L 41.714,-21.574 L 41.678,-21.943 L 41.642,-22.309 L 41.61,-22.665 L 41.585,-23.003 L 41.568,-23.318 L 41.563,-23.601 L 41.572,-23.846 L 41.596,-24.046 L 41.64,-24.195 L 41.705,-24.285 L 41.794,-24.309 L 41.909,-24.261 L 42.053,-24.134 L 42.229,-23.92 L 42.438,-23.613 L 42.684,-23.206 L 42.969,-22.692 L 43.295,-22.064 L 43.665,-21.316 L 44.082,-20.44 L 44.548,-19.429 L 45.065,-18.276 L 45.636,-16.976 L 46.263,-15.52 L 46.95,-13.902\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 53.029172675268086,-17.982505263166512 L 52.369,-19.704\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.231 -14.849 L 49.68 -18.673 L 55.058 -20.735 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 46.263385805609545,-15.519960231221697 L 45.603,-17.242\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 47.465 -12.386 L 42.914 -16.21 L 48.292 -18.273 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","Diac":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><polygon points=\"47.7,18 60.3,9 47.7,-0 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"60.3,-18 47.7,-9 60.3,-0 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 47.7,-0 M 60.3,-16.2 L 60.3,16.2 M 47.7,-16.2 L 47.7,16.2 M 60.3,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Triac":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"58.8pt\" width=\"117.2pt\" viewBox=\"-4.6 -36.2 117.2 58.8\"><polygon points=\"47.7,18 60.3,9 47.7,-0 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"60.3,-18 47.7,-9 60.3,-0 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 47.7,-0 M 60.3,-16.2 L 60.3,16.2 M 47.7,-16.2 L 47.7,16.2 M 60.3,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 60.3,-9.0 L 78.3,-18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"78.3\" y=\"-31.599999999999998\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"78.3\" dy=\"10\">gate</tspan></text></svg>","SCR":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"49.8pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 49.8\"><polygon points=\"47.7,-9 60.3,-0 47.7,9 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 47.7,-0 M 60.3,-9 L 60.3,9 M 60.3,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 60.3,-0.0 L 71.1,10.8 L 71.1,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"71.1\" y=\"11.599999999999998\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"71.1\" dy=\"10\">gate</tspan></text></svg>","Breaker":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"25.219959934207893pt\" width=\"117.2pt\" viewBox=\"-4.6 -16.299959934207894 117.2 25.219959934207893\"><path d=\"M 36.63 -3.06 a 18 11.7 0 0 1 34.74 0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"40.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"67.68\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /></svg>","Crystal":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><path d=\"M 0.0,-0.0 L 46.8,-0 M 46.8,-9 L 46.8,9 M 50.4,-9 L 50.4,9 L 57.6,9 L 57.6,-9 L 50.4,-9 M 61.2,-9 L 61.2,9 M 61.2,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","CPE":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><path d=\"M 0.0,-0.0 L 49.5,-0 L 40.5,-0 M 58.5,-0 L 49.5,9 M 58.5,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 49.5,-0.0 L 40.5,-0 M 58.5,-0 L 49.5,-9 M 58.5,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 49.5,-0.0 L 40.5,-9 M 49.5,9 M 58.5,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 49.5,-0.0 L 40.5,9 M 49.5,9 M 58.5,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Josephson":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><path d=\"M 0.0,-0.0 L 54,-0 M 45,-9 L 63,9 M 63,-9 L 45,9 M 54,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Josephson(box=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><polygon points=\"45,-9 45,9 63,9 63,-9 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 45,-0 M 63,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 45.0,-9.0 L 63,9 M 63,-9 L 45,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Motor":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 28.08,-0 L 28.08,-0 M 79.92,-0 L 79.92,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 36.0,7.92 L 28.08,7.92 L 28.08,-7.92 L 36,-7.92\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 72.0,7.92 L 79.92,7.92 L 79.92,-7.92 L 72,-7.92\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Lamp":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 36.0,-0.0 L 36.156,-0.626 L 36.377,-1.256 L 36.664,-1.884 L 37.017,-2.505 L 37.434,-3.11 L 37.912,-3.696 L 38.451,-4.255 L 39.047,-4.782 L 39.695,-5.272 L 40.393,-5.721 L 41.135,-6.122 L 41.917,-6.473 L 42.732,-6.77 L 43.575,-7.01 L 44.441,-7.19 L 45.322,-7.309 L 46.212,-7.366 L 47.105,-7.359 L 47.994,-7.29 L 48.872,-7.158 L 49.734,-6.966 L 50.572,-6.714 L 51.381,-6.406 L 52.155,-6.045 L 52.888,-5.634 L 53.576,-5.177 L 54.215,-4.678 L 54.799,-4.144 L 55.326,-3.579 L 55.792,-2.989 L 56.196,-2.38 L 56.535,-1.758 L 56.809,-1.128 L 57.017,-0.499 L 57.16,0.126 L 57.238,0.738 L 57.253,1.332 L 57.207,1.902 L 57.103,2.442 L 56.944,2.947 L 56.735,3.412 L 56.479,3.832 L 56.183,4.203 L 55.85,4.521 L 55.486,4.783 L 55.099,4.986 L 54.693,5.129 L 54.276,5.21 L 53.853,5.228 L 53.432,5.183 L 53.019,5.075 L 52.621,4.906 L 52.243,4.676 L 51.892,4.39 L 51.574,4.048 L 51.294,3.656 L 51.058,3.216 L 50.87,2.733 L 50.735,2.212 L 50.655,1.659 L 50.636,1.078 L 50.677,0.475 L 50.783,-0.143 L 50.954,-0.77 L 51.191,-1.401 L 51.493,-2.028 L 51.86,-2.645 L 52.291,-3.247 L 52.784,-3.827 L 53.336,-4.379 L 53.944,-4.898 L 54.605,-5.379 L 55.313,-5.817 L 56.065,-6.207 L 56.855,-6.546 L 57.677,-6.83 L 58.526,-7.056 L 59.395,-7.223 L 60.279,-7.328 L 61.17,-7.37 L 62.063,-7.349 L 62.95,-7.265 L 63.825,-7.12 L 64.682,-6.913 L 65.514,-6.648 L 66.315,-6.328 L 67.08,-5.955 L 67.804,-5.532 L 68.481,-5.066 L 69.107,-4.559 L 69.678,-4.017 L 70.191,-3.446 L 70.644,-2.851 L 71.033,-2.238 L 71.357,-1.613 L 71.616,-0.983 L 71.809,-0.354 L 71.937,0.268 L 72,0.876\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Lamp2":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 41.27207793864215,12.727922061357855 L 66.728,-12.728\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 41.27207793864215,-12.727922061357855 L 66.728,12.728\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Neon":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"45\" cy=\"-7.2\" r=\"1.8\" style=\"stroke:black;fill:black;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 50.4,-9.0 L 50.4,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 57.6,-9.0 L 57.6,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 36.0,-0.0 L 50.4,-0 M 57.6,-0 L 72,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Thermistor":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"41.599999999999994pt\" width=\"117.2pt\" viewBox=\"-4.6 -20.799999999999997 117.2 41.599999999999994\"><path d=\"M 0.0,-0.0 L 36,-0 L 36,-9 L 72,-9 L 72,9 L 36,9 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 36.0,16.2 L 43.2,16.2 L 72,-16.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Memristor":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><polygon points=\"36,-9 36,9 39.6,9 39.6,-9 \" style=\"stroke:black;fill:black;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 43.2,-0 L 43.2,5.4 L 50.4,5.4 L 50.4,-5.4 L 57.6,-5.4 L 57.6,5.4 L 64.8,5.4 L 64.8,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 36.0,-9.0 L 72,-9 L 72,9 L 36,9 L 36,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Memristor2":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><path d=\"M 0.0,-0.0 L 28.8,-0 L 28.8,-9 L 36,-9 L 36,9 L 43.2,9 L 43.2,-9 L 50.4,-9 L 50.4,9 L 57.6,9 L 57.6,-9 L 64.8,-9 L 64.8,9 L 72,9 L 72,-0 L 79.2,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Jack":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"54.2pt\" viewBox=\"-13.6 -13.6 54.2 27.2\"><path d=\"M 0.0,-0.0 L -9,-9 M -9,9 L 0,-0 L 36,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Plug":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"45.2pt\" viewBox=\"-4.6 -13.6 45.2 27.2\"><path d=\"M 0.0,-0.0 L 36,-0 M 27,-9 L 36,-0 L 27,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Terminal":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"35.12pt\" width=\"22.16pt\" viewBox=\"-11.08 -17.56 22.16 35.12\"><circle cx=\"0\" cy=\"-0\" r=\"6.48\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M -6.4799999999999995,12.959999999999999 L 6.48,-12.96\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","SparkGap":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><path d=\"M 0.0,-0.0 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 36.0,-0.0 L 43.56,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 50.56 0 L 43.56 4.5 L 43.56 -4.5 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 72.0,-0.0 L 64.44,0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 57.44 0 L 64.44 -4.5 L 64.44 4.5 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","Nullator":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.19991081725951pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.599955408629755 117.2 27.19991081725951\"><ellipse cx=\"54\" cy=\"-0\" rx=\"18\" ry=\"9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Norator":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><circle cx=\"45\" cy=\"-0\" r=\"9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"63\" cy=\"-0\" r=\"9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","CurrentMirror":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"41.64984471899924pt\" width=\"117.2pt\" viewBox=\"-4.6 -26.249844718999242 117.2 41.64984471899924\"><circle cx=\"46.8\" cy=\"-0\" r=\"10.8\" style=\"stroke:black;fill:none;stroke-width:1e-09;stroke-dasharray:None;\" /><circle cx=\"61.2\" cy=\"-0\" r=\"10.8\" style=\"stroke:black;fill:none;stroke-width:1e-09;stroke-dasharray:None;\" /><circle cx=\"46.8\" cy=\"-0\" r=\"10.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"61.2\" cy=\"-0\" r=\"10.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"54.0\" y=\"-21.64984471899924\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"10\">common</tspan></text></svg>","VoltageMirror":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"32.22489560467747pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.22492235949962 117.2 32.22489560467747\"><ellipse cx=\"61.2\" cy=\"-0\" rx=\"10.8\" ry=\"5.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><ellipse cx=\"46.8\" cy=\"-0\" rx=\"10.8\" ry=\"5.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"54.0\" y=\"-17.62492235949962\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"10\">common</tspan></text></svg>","Source":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","SourceV":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 45.0,3.6 L 45,-3.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 59.4,-0.0 L 66.6,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 63.0,3.6 L 63,-3.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","SourceI":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 45.0,-0.0 L 54,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 61 0 L 54 2.7 L 54 -2.7 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","SourceSin":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,9.0 L 55.863,8.25 L 57.6,7.5 L 59.091,6.75 L 60.235,6 L 60.955,5.25 L 61.2,4.5 L 60.955,3.75 L 60.235,3 L 59.091,2.25 L 57.6,1.5 L 55.863,0.75 L 54,-0 L 52.137,-0.75 L 50.4,-1.5 L 48.909,-2.25 L 47.765,-3 L 47.045,-3.75 L 46.8,-4.5 L 47.045,-5.25 L 47.765,-6 L 48.909,-6.75 L 50.4,-7.5 L 52.137,-8.25 L 54,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","SourcePulse":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 50.4,-10.799999999999999 L 50.4,-5.4 L 55.8,-5.4 L 55.8,5.4 L 50.4,5.4 L 50.4,10.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","SourceSquare":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,-9.0 L 61.2,-9 L 61.2,-0 L 46.8,-0 L 46.8,9 L 54,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","SourceTriangle":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 50.4,-9.0 L 61.2,-0 L 50.4,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","SourceRamp":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 50.4,-9.0 L 64.8,7.2 L 50.4,7.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","SourceControlled":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><path d=\"M 0.0,-0.0 L 36,-0 L 54,-18 L 72,-0 L 54,18 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","SourceControlledI":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><path d=\"M 0.0,-0.0 L 36,-0 L 54,-18 L 72,-0 L 54,18 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 45.0,-0.0 L 54,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 61 0 L 54 2.7 L 54 -2.7 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","SourceControlledV":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><path d=\"M 0.0,-0.0 L 36,-0 L 54,-18 L 72,-0 L 54,18 L 36,-0 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 45.0,3.6 L 45,-3.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 59.4,-0.0 L 66.6,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 63.0,3.6 L 63,-3.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","BatteryCell":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"36.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -18.1 117.2 36.2\"><path d=\"M 0.0,-0.0 L 50.625,-0 M 57.375,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 50.625,-13.5 L 50.625,13.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 57.375,-6.75 L 57.375,6.75\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Battery":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"36.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -18.1 117.2 36.2\"><path d=\"M 0.0,-0.0 L 43.875,-0 M 64.125,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 43.875,-13.5 L 43.875,13.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 50.625,-6.75 L 50.625,6.75\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 57.375,-13.5 L 57.375,13.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 64.125,-6.75 L 64.125,6.75\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","BatteryDouble":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"49.8pt\" width=\"117.2pt\" viewBox=\"-4.6 -31.7 117.2 49.8\"><path d=\"M 0.0,-0.0 L 23.625,-0 M 84.375,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 23.625,-13.5 L 23.625,13.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 30.375,-6.75 L 30.375,6.75\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 37.125,-13.5 L 37.125,13.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 43.875,-6.75 L 43.875,6.75\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 50.625,-13.5 L 50.625,13.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 57.375,-6.75 L 57.375,6.75\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 64.125,-13.5 L 64.125,13.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 70.875,-6.75 L 70.875,6.75\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 77.625,-13.5 L 77.625,13.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 84.375,-6.75 L 84.375,6.75\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"50.625\" y=\"-27.099999999999998\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"50.625\" dy=\"10\">tap</tspan></text></svg>","Solar":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"65.0pt\" width=\"117.2pt\" viewBox=\"-4.6 -42.4 117.2 65.0\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 50.4,-4.5 L 50.4,4.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 57.6,-9.9 L 57.6,9.9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 36.0,-0.0 L 50.4,-0 M 57.6,-0 L 72,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 75.60000000000001,-32.4 L 71.164,-27.964\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 66.214 -23.014 L 69.255 -29.873 L 73.073 -26.055 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 82.8,-25.2 L 78.364,-20.764\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 73.414 -15.814 L 76.455 -22.673 L 80.273 -18.855 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","MeterV":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"54.0\" y=\"-14.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"14\">V</tspan></text></svg>","MeterA":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"54.0\" y=\"-14.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"14\">A</tspan></text></svg>","MeterI":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"54.0\" y=\"-14.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"14\">I</tspan></text></svg>","MeterOhm":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"54.0\" y=\"-14.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"14\">Ω</tspan></text></svg>","MeterArrow":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"54\" cy=\"-0\" r=\"18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 L 36,-0 M 72,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 45.0,-5.76 L 55.42,0.909\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 61.315 4.682 L 53.964 3.183 L 56.875 -1.366 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","MeterAnalog":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"90.4pt\" width=\"99.85999999999999pt\" viewBox=\"-24.22 -72.2 99.85999999999999 90.4\"><polygon points=\"54,-46.8 53.999,-46.914 53.996,-47.028 53.992,-47.143 53.986,-47.257 53.977,-47.371 53.967,-47.484 53.956,-47.598 53.942,-47.711 53.927,-47.825 53.91,-47.938 53.891,-48.05 53.87,-48.163 53.847,-48.275 53.823,-48.386 53.797,-48.497 53.769,-48.608 53.74,-48.719 53.708,-48.828 53.675,-48.938 53.641,-49.047 53.604,-49.155 53.566,-49.263 53.526,-49.37 53.484,-49.476 53.441,-49.582 53.396,-49.687 53.349,-49.791 53.301,-49.895 53.251,-49.997 53.2,-50.099 53.146,-50.2 53.092,-50.301 53.035,-50.4 52.977,-50.498 52.918,-50.596 52.857,-50.693 52.795,-50.788 52.73,-50.883 52.665,-50.976 52.598,-51.069 52.529,-51.16 52.46,-51.251 52.388,-51.34 52.316,-51.428 52.241,-51.515 52.166,-51.601 52.089,-51.685 52.011,-51.769 51.931,-51.851 51.851,-51.931 51.769,-52.011 51.685,-52.089 51.601,-52.166 51.515,-52.241 51.428,-52.316 51.34,-52.388 51.251,-52.46 51.16,-52.529 51.069,-52.598 50.976,-52.665 50.883,-52.73 50.788,-52.795 50.693,-52.857 50.596,-52.918 50.498,-52.977 50.4,-53.035 50.301,-53.092 50.2,-53.146 50.099,-53.2 49.997,-53.251 49.895,-53.301 49.791,-53.349 49.687,-53.396 49.582,-53.441 49.476,-53.484 49.37,-53.526 49.263,-53.566 49.155,-53.604 49.047,-53.641 48.938,-53.675 48.828,-53.708 48.719,-53.74 48.608,-53.769 48.497,-53.797 48.386,-53.823 48.275,-53.847 48.163,-53.87 48.05,-53.891 47.938,-53.91 47.825,-53.927 47.711,-53.942 47.598,-53.956 47.484,-53.967 47.371,-53.977 47.257,-53.986 47.143,-53.992 47.028,-53.996 46.914,-53.999 46.8,-54 7.2,-54 7.086,-53.999 6.972,-53.996 6.857,-53.992 6.743,-53.986 6.629,-53.977 6.516,-53.967 6.402,-53.956 6.289,-53.942 6.175,-53.927 6.062,-53.91 5.95,-53.891 5.837,-53.87 5.725,-53.847 5.614,-53.823 5.503,-53.797 5.392,-53.769 5.281,-53.74 5.172,-53.708 5.062,-53.675 4.953,-53.641 4.845,-53.604 4.737,-53.566 4.63,-53.526 4.524,-53.484 4.418,-53.441 4.313,-53.396 4.209,-53.349 4.105,-53.301 4.003,-53.251 3.901,-53.2 3.8,-53.146 3.699,-53.092 3.6,-53.035 3.502,-52.977 3.404,-52.918 3.307,-52.857 3.212,-52.795 3.117,-52.73 3.024,-52.665 2.931,-52.598 2.84,-52.529 2.749,-52.46 2.66,-52.388 2.572,-52.316 2.485,-52.241 2.399,-52.166 2.315,-52.089 2.231,-52.011 2.149,-51.931 2.069,-51.851 1.989,-51.769 1.911,-51.685 1.834,-51.601 1.759,-51.515 1.684,-51.428 1.612,-51.34 1.54,-51.251 1.471,-51.16 1.402,-51.069 1.335,-50.976 1.27,-50.883 1.205,-50.788 1.143,-50.693 1.082,-50.596 1.023,-50.498 0.965,-50.4 0.908,-50.301 0.854,-50.2 0.8,-50.099 0.749,-49.997 0.699,-49.895 0.651,-49.791 0.604,-49.687 0.559,-49.582 0.516,-49.476 0.474,-49.37 0.434,-49.263 0.396,-49.155 0.359,-49.047 0.325,-48.938 0.292,-48.828 0.26,-48.719 0.231,-48.608 0.203,-48.497 0.177,-48.386 0.153,-48.275 0.13,-48.163 0.109,-48.05 0.09,-47.938 0.073,-47.825 0.058,-47.711 0.044,-47.598 0.033,-47.484 0.023,-47.371 0.014,-47.257 0.008,-47.143 0.004,-47.028 0.001,-46.914 0,-46.8 0,-7.2 0.001,-7.086 0.004,-6.972 0.008,-6.857 0.014,-6.743 0.023,-6.629 0.033,-6.516 0.044,-6.402 0.058,-6.289 0.073,-6.175 0.09,-6.062 0.109,-5.95 0.13,-5.837 0.153,-5.725 0.177,-5.614 0.203,-5.503 0.231,-5.392 0.26,-5.281 0.292,-5.172 0.325,-5.062 0.359,-4.953 0.396,-4.845 0.434,-4.737 0.474,-4.63 0.516,-4.524 0.559,-4.418 0.604,-4.313 0.651,-4.209 0.699,-4.105 0.749,-4.003 0.8,-3.901 0.854,-3.8 0.908,-3.699 0.965,-3.6 1.023,-3.502 1.082,-3.404 1.143,-3.307 1.205,-3.212 1.27,-3.117 1.335,-3.024 1.402,-2.931 1.471,-2.84 1.54,-2.749 1.612,-2.66 1.684,-2.572 1.759,-2.485 1.834,-2.399 1.911,-2.315 1.989,-2.231 2.069,-2.149 2.149,-2.069 2.231,-1.989 2.315,-1.911 2.399,-1.834 2.485,-1.759 2.572,-1.684 2.66,-1.612 2.749,-1.54 2.84,-1.471 2.931,-1.402 3.024,-1.335 3.117,-1.27 3.212,-1.205 3.307,-1.143 3.404,-1.082 3.502,-1.023 3.6,-0.965 3.699,-0.908 3.8,-0.854 3.901,-0.8 4.003,-0.749 4.105,-0.699 4.209,-0.651 4.313,-0.604 4.418,-0.559 4.524,-0.516 4.63,-0.474 4.737,-0.434 4.845,-0.396 4.953,-0.359 5.062,-0.325 5.172,-0.292 5.281,-0.26 5.392,-0.231 5.503,-0.203 5.614,-0.177 5.725,-0.153 5.837,-0.13 5.95,-0.109 6.062,-0.09 6.175,-0.073 6.289,-0.058 6.402,-0.044 6.516,-0.033 6.629,-0.023 6.743,-0.014 6.857,-0.008 6.972,-0.004 7.086,-0.001 7.2,-0 46.8,-0 46.914,-0.001 47.028,-0.004 47.143,-0.008 47.257,-0.014 47.371,-0.023 47.484,-0.033 47.598,-0.044 47.711,-0.058 47.825,-0.073 47.938,-0.09 48.05,-0.109 48.163,-0.13 48.275,-0.153 48.386,-0.177 48.497,-0.203 48.608,-0.231 48.719,-0.26 48.828,-0.292 48.938,-0.325 49.047,-0.359 49.155,-0.396 49.263,-0.434 49.37,-0.474 49.476,-0.516 49.582,-0.559 49.687,-0.604 49.791,-0.651 49.895,-0.699 49.997,-0.749 50.099,-0.8 50.2,-0.854 50.301,-0.908 50.4,-0.965 50.498,-1.023 50.596,-1.082 50.693,-1.143 50.788,-1.205 50.883,-1.27 50.976,-1.335 51.069,-1.402 51.16,-1.471 51.251,-1.54 51.34,-1.612 51.428,-1.684 51.515,-1.759 51.601,-1.834 51.685,-1.911 51.769,-1.989 51.851,-2.069 51.931,-2.149 52.011,-2.231 52.089,-2.315 52.166,-2.399 52.241,-2.485 52.316,-2.572 52.388,-2.66 52.46,-2.749 52.529,-2.84 52.598,-2.931 52.665,-3.024 52.73,-3.117 52.795,-3.212 52.857,-3.307 52.918,-3.404 52.977,-3.502 53.035,-3.6 53.092,-3.699 53.146,-3.8 53.2,-3.901 53.251,-4.003 53.301,-4.105 53.349,-4.209 53.396,-4.313 53.441,-4.418 53.484,-4.524 53.526,-4.63 53.566,-4.737 53.604,-4.845 53.641,-4.953 53.675,-5.062 53.708,-5.172 53.74,-5.281 53.769,-5.392 53.797,-5.503 53.823,-5.614 53.847,-5.725 53.87,-5.837 53.891,-5.95 53.91,-6.062 53.927,-6.175 53.942,-6.289 53.956,-6.402 53.967,-6.516 53.977,-6.629 53.986,-6.743 53.992,-6.857 53.996,-6.972 53.999,-7.086 54,-7.2 54,-46.8 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 9 -43.2 Q 27 -50.4 45 -43.2 L 40.5 -30.96 Q 27 -36 13.5 -30.96 Z\" style=\"stroke:black;fill:none;stroke-width:1;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 32.58521098232533,-33.37590475601991 L 34.13,-42.608\" style=\"stroke:black;fill:none;stroke-width:1.5;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"27.0\" y=\"-67.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.0\" dy=\"10\">N</tspan></text><text x=\"27.0\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.0\" dy=\"10\">S</tspan></text><text x=\"57.6\" y=\"-37.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"57.6\" dy=\"10\">E</tspan></text><text x=\"-3.6\" y=\"-37.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">W</tspan></text><text x=\"57.6\" y=\"-67.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"57.6\" dy=\"10\">NE</tspan></text><text x=\"57.6\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"57.6\" dy=\"10\">SE</tspan></text><text x=\"-3.6\" y=\"-67.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">NW</tspan></text><text x=\"-3.6\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">SW</tspan></text><text x=\"14.4\" y=\"-28.0\" dominant-baseline=\"alphabetic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"14.4\" dy=\"10\">in1</tspan></text><text x=\"39.6\" y=\"-28.0\" dominant-baseline=\"alphabetic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"39.6\" dy=\"10\">in2</tspan></text><text x=\"27.0\" y=\"-13.6\" dominant-baseline=\"alphabetic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.0\" dy=\"10\">name</tspan></text><circle cx=\"14.4\" cy=\"-10.8\" r=\"3.6\" style=\"stroke:black;fill:none;stroke-width:1;stroke-dasharray:-;\" /><circle cx=\"39.6\" cy=\"-10.8\" r=\"3.6\" style=\"stroke:black;fill:none;stroke-width:1;stroke-dasharray:-;\" /></svg>","MeterDigital":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"90.4pt\" width=\"99.85999999999999pt\" viewBox=\"-24.22 -72.2 99.85999999999999 90.4\"><polygon points=\"54,-46.8 53.999,-46.914 53.996,-47.028 53.992,-47.143 53.986,-47.257 53.977,-47.371 53.967,-47.484 53.956,-47.598 53.942,-47.711 53.927,-47.825 53.91,-47.938 53.891,-48.05 53.87,-48.163 53.847,-48.275 53.823,-48.386 53.797,-48.497 53.769,-48.608 53.74,-48.719 53.708,-48.828 53.675,-48.938 53.641,-49.047 53.604,-49.155 53.566,-49.263 53.526,-49.37 53.484,-49.476 53.441,-49.582 53.396,-49.687 53.349,-49.791 53.301,-49.895 53.251,-49.997 53.2,-50.099 53.146,-50.2 53.092,-50.301 53.035,-50.4 52.977,-50.498 52.918,-50.596 52.857,-50.693 52.795,-50.788 52.73,-50.883 52.665,-50.976 52.598,-51.069 52.529,-51.16 52.46,-51.251 52.388,-51.34 52.316,-51.428 52.241,-51.515 52.166,-51.601 52.089,-51.685 52.011,-51.769 51.931,-51.851 51.851,-51.931 51.769,-52.011 51.685,-52.089 51.601,-52.166 51.515,-52.241 51.428,-52.316 51.34,-52.388 51.251,-52.46 51.16,-52.529 51.069,-52.598 50.976,-52.665 50.883,-52.73 50.788,-52.795 50.693,-52.857 50.596,-52.918 50.498,-52.977 50.4,-53.035 50.301,-53.092 50.2,-53.146 50.099,-53.2 49.997,-53.251 49.895,-53.301 49.791,-53.349 49.687,-53.396 49.582,-53.441 49.476,-53.484 49.37,-53.526 49.263,-53.566 49.155,-53.604 49.047,-53.641 48.938,-53.675 48.828,-53.708 48.719,-53.74 48.608,-53.769 48.497,-53.797 48.386,-53.823 48.275,-53.847 48.163,-53.87 48.05,-53.891 47.938,-53.91 47.825,-53.927 47.711,-53.942 47.598,-53.956 47.484,-53.967 47.371,-53.977 47.257,-53.986 47.143,-53.992 47.028,-53.996 46.914,-53.999 46.8,-54 7.2,-54 7.086,-53.999 6.972,-53.996 6.857,-53.992 6.743,-53.986 6.629,-53.977 6.516,-53.967 6.402,-53.956 6.289,-53.942 6.175,-53.927 6.062,-53.91 5.95,-53.891 5.837,-53.87 5.725,-53.847 5.614,-53.823 5.503,-53.797 5.392,-53.769 5.281,-53.74 5.172,-53.708 5.062,-53.675 4.953,-53.641 4.845,-53.604 4.737,-53.566 4.63,-53.526 4.524,-53.484 4.418,-53.441 4.313,-53.396 4.209,-53.349 4.105,-53.301 4.003,-53.251 3.901,-53.2 3.8,-53.146 3.699,-53.092 3.6,-53.035 3.502,-52.977 3.404,-52.918 3.307,-52.857 3.212,-52.795 3.117,-52.73 3.024,-52.665 2.931,-52.598 2.84,-52.529 2.749,-52.46 2.66,-52.388 2.572,-52.316 2.485,-52.241 2.399,-52.166 2.315,-52.089 2.231,-52.011 2.149,-51.931 2.069,-51.851 1.989,-51.769 1.911,-51.685 1.834,-51.601 1.759,-51.515 1.684,-51.428 1.612,-51.34 1.54,-51.251 1.471,-51.16 1.402,-51.069 1.335,-50.976 1.27,-50.883 1.205,-50.788 1.143,-50.693 1.082,-50.596 1.023,-50.498 0.965,-50.4 0.908,-50.301 0.854,-50.2 0.8,-50.099 0.749,-49.997 0.699,-49.895 0.651,-49.791 0.604,-49.687 0.559,-49.582 0.516,-49.476 0.474,-49.37 0.434,-49.263 0.396,-49.155 0.359,-49.047 0.325,-48.938 0.292,-48.828 0.26,-48.719 0.231,-48.608 0.203,-48.497 0.177,-48.386 0.153,-48.275 0.13,-48.163 0.109,-48.05 0.09,-47.938 0.073,-47.825 0.058,-47.711 0.044,-47.598 0.033,-47.484 0.023,-47.371 0.014,-47.257 0.008,-47.143 0.004,-47.028 0.001,-46.914 0,-46.8 0,-7.2 0.001,-7.086 0.004,-6.972 0.008,-6.857 0.014,-6.743 0.023,-6.629 0.033,-6.516 0.044,-6.402 0.058,-6.289 0.073,-6.175 0.09,-6.062 0.109,-5.95 0.13,-5.837 0.153,-5.725 0.177,-5.614 0.203,-5.503 0.231,-5.392 0.26,-5.281 0.292,-5.172 0.325,-5.062 0.359,-4.953 0.396,-4.845 0.434,-4.737 0.474,-4.63 0.516,-4.524 0.559,-4.418 0.604,-4.313 0.651,-4.209 0.699,-4.105 0.749,-4.003 0.8,-3.901 0.854,-3.8 0.908,-3.699 0.965,-3.6 1.023,-3.502 1.082,-3.404 1.143,-3.307 1.205,-3.212 1.27,-3.117 1.335,-3.024 1.402,-2.931 1.471,-2.84 1.54,-2.749 1.612,-2.66 1.684,-2.572 1.759,-2.485 1.834,-2.399 1.911,-2.315 1.989,-2.231 2.069,-2.149 2.149,-2.069 2.231,-1.989 2.315,-1.911 2.399,-1.834 2.485,-1.759 2.572,-1.684 2.66,-1.612 2.749,-1.54 2.84,-1.471 2.931,-1.402 3.024,-1.335 3.117,-1.27 3.212,-1.205 3.307,-1.143 3.404,-1.082 3.502,-1.023 3.6,-0.965 3.699,-0.908 3.8,-0.854 3.901,-0.8 4.003,-0.749 4.105,-0.699 4.209,-0.651 4.313,-0.604 4.418,-0.559 4.524,-0.516 4.63,-0.474 4.737,-0.434 4.845,-0.396 4.953,-0.359 5.062,-0.325 5.172,-0.292 5.281,-0.26 5.392,-0.231 5.503,-0.203 5.614,-0.177 5.725,-0.153 5.837,-0.13 5.95,-0.109 6.062,-0.09 6.175,-0.073 6.289,-0.058 6.402,-0.044 6.516,-0.033 6.629,-0.023 6.743,-0.014 6.857,-0.008 6.972,-0.004 7.086,-0.001 7.2,-0 46.8,-0 46.914,-0.001 47.028,-0.004 47.143,-0.008 47.257,-0.014 47.371,-0.023 47.484,-0.033 47.598,-0.044 47.711,-0.058 47.825,-0.073 47.938,-0.09 48.05,-0.109 48.163,-0.13 48.275,-0.153 48.386,-0.177 48.497,-0.203 48.608,-0.231 48.719,-0.26 48.828,-0.292 48.938,-0.325 49.047,-0.359 49.155,-0.396 49.263,-0.434 49.37,-0.474 49.476,-0.516 49.582,-0.559 49.687,-0.604 49.791,-0.651 49.895,-0.699 49.997,-0.749 50.099,-0.8 50.2,-0.854 50.301,-0.908 50.4,-0.965 50.498,-1.023 50.596,-1.082 50.693,-1.143 50.788,-1.205 50.883,-1.27 50.976,-1.335 51.069,-1.402 51.16,-1.471 51.251,-1.54 51.34,-1.612 51.428,-1.684 51.515,-1.759 51.601,-1.834 51.685,-1.911 51.769,-1.989 51.851,-2.069 51.931,-2.149 52.011,-2.231 52.089,-2.315 52.166,-2.399 52.241,-2.485 52.316,-2.572 52.388,-2.66 52.46,-2.749 52.529,-2.84 52.598,-2.931 52.665,-3.024 52.73,-3.117 52.795,-3.212 52.857,-3.307 52.918,-3.404 52.977,-3.502 53.035,-3.6 53.092,-3.699 53.146,-3.8 53.2,-3.901 53.251,-4.003 53.301,-4.105 53.349,-4.209 53.396,-4.313 53.441,-4.418 53.484,-4.524 53.526,-4.63 53.566,-4.737 53.604,-4.845 53.641,-4.953 53.675,-5.062 53.708,-5.172 53.74,-5.281 53.769,-5.392 53.797,-5.503 53.823,-5.614 53.847,-5.725 53.87,-5.837 53.891,-5.95 53.91,-6.062 53.927,-6.175 53.942,-6.289 53.956,-6.402 53.967,-6.516 53.977,-6.629 53.986,-6.743 53.992,-6.857 53.996,-6.972 53.999,-7.086 54,-7.2 54,-46.8 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"5.4,-27.9 5.4,-45.9 48.6,-45.9 48.6,-27.9 \" style=\"stroke:black;fill:none;stroke-width:1;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"27.0\" y=\"-67.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.0\" dy=\"10\">N</tspan></text><text x=\"27.0\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.0\" dy=\"10\">S</tspan></text><text x=\"57.6\" y=\"-37.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"57.6\" dy=\"10\">E</tspan></text><text x=\"-3.6\" y=\"-37.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">W</tspan></text><text x=\"57.6\" y=\"-67.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"57.6\" dy=\"10\">NE</tspan></text><text x=\"57.6\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"57.6\" dy=\"10\">SE</tspan></text><text x=\"-3.6\" y=\"-67.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">NW</tspan></text><text x=\"-3.6\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">SW</tspan></text><text x=\"14.4\" y=\"-28.0\" dominant-baseline=\"alphabetic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"14.4\" dy=\"10\">in1</tspan></text><text x=\"39.6\" y=\"-28.0\" dominant-baseline=\"alphabetic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"39.6\" dy=\"10\">in2</tspan></text><text x=\"27.0\" y=\"-13.6\" dominant-baseline=\"alphabetic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.0\" dy=\"10\">name</tspan></text><text x=\"27.0\" y=\"-41.5\" dominant-baseline=\"alphabetic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.0\" dy=\"10\">display</tspan></text><circle cx=\"14.4\" cy=\"-10.8\" r=\"3.6\" style=\"stroke:black;fill:none;stroke-width:1;stroke-dasharray:-;\" /><circle cx=\"39.6\" cy=\"-10.8\" r=\"3.6\" style=\"stroke:black;fill:none;stroke-width:1;stroke-dasharray:-;\" /></svg>","Oscilloscope":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"90.4pt\" width=\"99.85999999999999pt\" viewBox=\"-24.22 -72.2 99.85999999999999 90.4\"><polygon points=\"54,-46.8 53.999,-46.914 53.996,-47.028 53.992,-47.143 53.986,-47.257 53.977,-47.371 53.967,-47.484 53.956,-47.598 53.942,-47.711 53.927,-47.825 53.91,-47.938 53.891,-48.05 53.87,-48.163 53.847,-48.275 53.823,-48.386 53.797,-48.497 53.769,-48.608 53.74,-48.719 53.708,-48.828 53.675,-48.938 53.641,-49.047 53.604,-49.155 53.566,-49.263 53.526,-49.37 53.484,-49.476 53.441,-49.582 53.396,-49.687 53.349,-49.791 53.301,-49.895 53.251,-49.997 53.2,-50.099 53.146,-50.2 53.092,-50.301 53.035,-50.4 52.977,-50.498 52.918,-50.596 52.857,-50.693 52.795,-50.788 52.73,-50.883 52.665,-50.976 52.598,-51.069 52.529,-51.16 52.46,-51.251 52.388,-51.34 52.316,-51.428 52.241,-51.515 52.166,-51.601 52.089,-51.685 52.011,-51.769 51.931,-51.851 51.851,-51.931 51.769,-52.011 51.685,-52.089 51.601,-52.166 51.515,-52.241 51.428,-52.316 51.34,-52.388 51.251,-52.46 51.16,-52.529 51.069,-52.598 50.976,-52.665 50.883,-52.73 50.788,-52.795 50.693,-52.857 50.596,-52.918 50.498,-52.977 50.4,-53.035 50.301,-53.092 50.2,-53.146 50.099,-53.2 49.997,-53.251 49.895,-53.301 49.791,-53.349 49.687,-53.396 49.582,-53.441 49.476,-53.484 49.37,-53.526 49.263,-53.566 49.155,-53.604 49.047,-53.641 48.938,-53.675 48.828,-53.708 48.719,-53.74 48.608,-53.769 48.497,-53.797 48.386,-53.823 48.275,-53.847 48.163,-53.87 48.05,-53.891 47.938,-53.91 47.825,-53.927 47.711,-53.942 47.598,-53.956 47.484,-53.967 47.371,-53.977 47.257,-53.986 47.143,-53.992 47.028,-53.996 46.914,-53.999 46.8,-54 7.2,-54 7.086,-53.999 6.972,-53.996 6.857,-53.992 6.743,-53.986 6.629,-53.977 6.516,-53.967 6.402,-53.956 6.289,-53.942 6.175,-53.927 6.062,-53.91 5.95,-53.891 5.837,-53.87 5.725,-53.847 5.614,-53.823 5.503,-53.797 5.392,-53.769 5.281,-53.74 5.172,-53.708 5.062,-53.675 4.953,-53.641 4.845,-53.604 4.737,-53.566 4.63,-53.526 4.524,-53.484 4.418,-53.441 4.313,-53.396 4.209,-53.349 4.105,-53.301 4.003,-53.251 3.901,-53.2 3.8,-53.146 3.699,-53.092 3.6,-53.035 3.502,-52.977 3.404,-52.918 3.307,-52.857 3.212,-52.795 3.117,-52.73 3.024,-52.665 2.931,-52.598 2.84,-52.529 2.749,-52.46 2.66,-52.388 2.572,-52.316 2.485,-52.241 2.399,-52.166 2.315,-52.089 2.231,-52.011 2.149,-51.931 2.069,-51.851 1.989,-51.769 1.911,-51.685 1.834,-51.601 1.759,-51.515 1.684,-51.428 1.612,-51.34 1.54,-51.251 1.471,-51.16 1.402,-51.069 1.335,-50.976 1.27,-50.883 1.205,-50.788 1.143,-50.693 1.082,-50.596 1.023,-50.498 0.965,-50.4 0.908,-50.301 0.854,-50.2 0.8,-50.099 0.749,-49.997 0.699,-49.895 0.651,-49.791 0.604,-49.687 0.559,-49.582 0.516,-49.476 0.474,-49.37 0.434,-49.263 0.396,-49.155 0.359,-49.047 0.325,-48.938 0.292,-48.828 0.26,-48.719 0.231,-48.608 0.203,-48.497 0.177,-48.386 0.153,-48.275 0.13,-48.163 0.109,-48.05 0.09,-47.938 0.073,-47.825 0.058,-47.711 0.044,-47.598 0.033,-47.484 0.023,-47.371 0.014,-47.257 0.008,-47.143 0.004,-47.028 0.001,-46.914 0,-46.8 0,-7.2 0.001,-7.086 0.004,-6.972 0.008,-6.857 0.014,-6.743 0.023,-6.629 0.033,-6.516 0.044,-6.402 0.058,-6.289 0.073,-6.175 0.09,-6.062 0.109,-5.95 0.13,-5.837 0.153,-5.725 0.177,-5.614 0.203,-5.503 0.231,-5.392 0.26,-5.281 0.292,-5.172 0.325,-5.062 0.359,-4.953 0.396,-4.845 0.434,-4.737 0.474,-4.63 0.516,-4.524 0.559,-4.418 0.604,-4.313 0.651,-4.209 0.699,-4.105 0.749,-4.003 0.8,-3.901 0.854,-3.8 0.908,-3.699 0.965,-3.6 1.023,-3.502 1.082,-3.404 1.143,-3.307 1.205,-3.212 1.27,-3.117 1.335,-3.024 1.402,-2.931 1.471,-2.84 1.54,-2.749 1.612,-2.66 1.684,-2.572 1.759,-2.485 1.834,-2.399 1.911,-2.315 1.989,-2.231 2.069,-2.149 2.149,-2.069 2.231,-1.989 2.315,-1.911 2.399,-1.834 2.485,-1.759 2.572,-1.684 2.66,-1.612 2.749,-1.54 2.84,-1.471 2.931,-1.402 3.024,-1.335 3.117,-1.27 3.212,-1.205 3.307,-1.143 3.404,-1.082 3.502,-1.023 3.6,-0.965 3.699,-0.908 3.8,-0.854 3.901,-0.8 4.003,-0.749 4.105,-0.699 4.209,-0.651 4.313,-0.604 4.418,-0.559 4.524,-0.516 4.63,-0.474 4.737,-0.434 4.845,-0.396 4.953,-0.359 5.062,-0.325 5.172,-0.292 5.281,-0.26 5.392,-0.231 5.503,-0.203 5.614,-0.177 5.725,-0.153 5.837,-0.13 5.95,-0.109 6.062,-0.09 6.175,-0.073 6.289,-0.058 6.402,-0.044 6.516,-0.033 6.629,-0.023 6.743,-0.014 6.857,-0.008 6.972,-0.004 7.086,-0.001 7.2,-0 46.8,-0 46.914,-0.001 47.028,-0.004 47.143,-0.008 47.257,-0.014 47.371,-0.023 47.484,-0.033 47.598,-0.044 47.711,-0.058 47.825,-0.073 47.938,-0.09 48.05,-0.109 48.163,-0.13 48.275,-0.153 48.386,-0.177 48.497,-0.203 48.608,-0.231 48.719,-0.26 48.828,-0.292 48.938,-0.325 49.047,-0.359 49.155,-0.396 49.263,-0.434 49.37,-0.474 49.476,-0.516 49.582,-0.559 49.687,-0.604 49.791,-0.651 49.895,-0.699 49.997,-0.749 50.099,-0.8 50.2,-0.854 50.301,-0.908 50.4,-0.965 50.498,-1.023 50.596,-1.082 50.693,-1.143 50.788,-1.205 50.883,-1.27 50.976,-1.335 51.069,-1.402 51.16,-1.471 51.251,-1.54 51.34,-1.612 51.428,-1.684 51.515,-1.759 51.601,-1.834 51.685,-1.911 51.769,-1.989 51.851,-2.069 51.931,-2.149 52.011,-2.231 52.089,-2.315 52.166,-2.399 52.241,-2.485 52.316,-2.572 52.388,-2.66 52.46,-2.749 52.529,-2.84 52.598,-2.931 52.665,-3.024 52.73,-3.117 52.795,-3.212 52.857,-3.307 52.918,-3.404 52.977,-3.502 53.035,-3.6 53.092,-3.699 53.146,-3.8 53.2,-3.901 53.251,-4.003 53.301,-4.105 53.349,-4.209 53.396,-4.313 53.441,-4.418 53.484,-4.524 53.526,-4.63 53.566,-4.737 53.604,-4.845 53.641,-4.953 53.675,-5.062 53.708,-5.172 53.74,-5.281 53.769,-5.392 53.797,-5.503 53.823,-5.614 53.847,-5.725 53.87,-5.837 53.891,-5.95 53.91,-6.062 53.927,-6.175 53.942,-6.289 53.956,-6.402 53.967,-6.516 53.977,-6.629 53.986,-6.743 53.992,-6.857 53.996,-6.972 53.999,-7.086 54,-7.2 54,-46.8 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"8.1,-25.92 8.1,-48.6 45.9,-48.6 45.9,-25.92 \" style=\"stroke:black;fill:none;stroke-width:1;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 15.659999999999998,-25.92000000000001 L 15.66,-48.6\" style=\"stroke:#666666;fill:none;stroke-width:0.3;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 23.219999999999995,-25.92000000000001 L 23.22,-48.6\" style=\"stroke:#666666;fill:none;stroke-width:0.3;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 30.779999999999994,-25.92000000000001 L 30.78,-48.6\" style=\"stroke:#666666;fill:none;stroke-width:0.3;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 38.339999999999996,-25.92000000000001 L 38.34,-48.6\" style=\"stroke:#666666;fill:none;stroke-width:0.3;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 8.1,-33.480000000000004 L 45.9,-33.48\" style=\"stroke:#666666;fill:none;stroke-width:0.3;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 8.1,-41.040000000000006 L 45.9,-41.04\" style=\"stroke:#666666;fill:none;stroke-width:0.3;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"27.0\" y=\"-67.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.0\" dy=\"10\">N</tspan></text><text x=\"27.0\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.0\" dy=\"10\">S</tspan></text><text x=\"57.6\" y=\"-37.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"57.6\" dy=\"10\">E</tspan></text><text x=\"-3.6\" y=\"-37.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">W</tspan></text><text x=\"57.6\" y=\"-67.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"57.6\" dy=\"10\">NE</tspan></text><text x=\"57.6\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"57.6\" dy=\"10\">SE</tspan></text><text x=\"-3.6\" y=\"-67.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">NW</tspan></text><text x=\"-3.6\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">SW</tspan></text><text x=\"14.4\" y=\"-28.0\" dominant-baseline=\"alphabetic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"14.4\" dy=\"10\">in1</tspan></text><text x=\"39.6\" y=\"-28.0\" dominant-baseline=\"alphabetic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"39.6\" dy=\"10\">in2</tspan></text><text x=\"27.0\" y=\"-13.6\" dominant-baseline=\"alphabetic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.0\" dy=\"10\">name</tspan></text><circle cx=\"14.4\" cy=\"-10.8\" r=\"3.6\" style=\"stroke:black;fill:none;stroke-width:1;stroke-dasharray:-;\" /><circle cx=\"39.6\" cy=\"-10.8\" r=\"3.6\" style=\"stroke:black;fill:none;stroke-width:1;stroke-dasharray:-;\" /></svg>","Button":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"31.52pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 31.52\"><circle cx=\"40.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"67.68\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 M 40.32,-10.8 L 67.68,-10.8 M 54,-10.8 L 54,-18 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Button(nc=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"25.04pt\" width=\"117.2pt\" viewBox=\"-4.6 -14.32 117.2 25.04\"><circle cx=\"40.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"67.68\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 36,-0 M 40.32,6.12 L 67.68,6.12 M 54,6.12 L 54,-9.72 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Button(contacts=False)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 27.2\"><path d=\"M 0.0,-0.0 L 36,-0 L 40.32,-0 M 40.32,-10.8 L 67.68,-10.8 M 54,-10.8 L 54,-18 M 67.68,-0 L 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Switch":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"29.72pt\" width=\"117.2pt\" viewBox=\"-4.6 -20.799999999999997 117.2 29.72\"><path d=\"M 0.0,-0.0 L 36,-0 M 44.64,-3.6 L 64.8,-16.2 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"40.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"67.68\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","Switch(nc=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"19.64pt\" width=\"117.2pt\" viewBox=\"-4.6 -10.719999999999999 117.2 19.64\"><path d=\"M 0.0,-0.0 L 36,-0 M 44.64,-0 L 68.4,-6.12 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"40.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"67.68\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","Switch(action='open')":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"29.72pt\" width=\"117.2pt\" viewBox=\"-4.6 -20.799999999999997 117.2 29.72\"><path d=\"M 54.71 -15.45 a 9 13.5 0 0 1 4.63 13.43\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 48.569 -18.803 L 56.007 -17.819 L 53.419 -13.079 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 0.0,-0.0 L 36,-0 M 44.64,-3.6 L 64.8,-16.2 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"40.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"67.68\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","Switch(action='close')":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"34.36909476333791pt\" width=\"117.2pt\" viewBox=\"-4.6 -25.44909476333791 117.2 34.36909476333791\"><path d=\"M 54.71 -20.85 a 9 13.5 0 0 1 4.63 13.43\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 58.521 -0.472 L 56.657 -7.739 L 62.02 -7.109 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 0.0,-0.0 L 36,-0 M 44.64,-3.6 L 64.8,-16.2 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"40.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"67.68\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","Switch(contacts=False)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"25.4pt\" width=\"117.2pt\" viewBox=\"-4.6 -20.799999999999997 117.2 25.4\"><path d=\"M 0.0,-0.0 L 36,-0 L 66.6,-16.2 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Switch(contacts=False, nc=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"29.0pt\" width=\"117.2pt\" viewBox=\"-4.6 -24.400000000000002 117.2 29.0\"><path d=\"M 0.0,-0.0 L 36,-0 L 77.4,-16.2 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 72.0,-0.0 L 72,-19.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","SwitchReed":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"30.799999999999997pt\" width=\"117.2pt\" viewBox=\"-4.6 -15.399999999999999 117.2 30.799999999999997\"><path d=\"M 0.0,-0.0 L 39.6,-0 L 70.2,-5.4 M 68.4,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 39.6,10.799999999999999 L 38.908,10.778 L 38.219,10.711 L 37.535,10.601 L 36.861,10.447 L 36.197,10.25 L 35.547,10.011 L 34.914,9.73 L 34.3,9.41 L 33.708,9.051 L 33.14,8.655 L 32.599,8.224 L 32.087,7.758 L 31.605,7.261 L 31.156,6.734 L 30.742,6.179 L 30.364,5.599 L 30.025,4.995 L 29.724,4.372 L 29.465,3.73 L 29.246,3.073 L 29.071,2.403 L 28.938,1.724 L 28.85,1.037 L 28.806,0.346 L 28.806,-0.346 L 28.85,-1.037 L 28.938,-1.724 L 29.071,-2.403 L 29.246,-3.073 L 29.465,-3.73 L 29.724,-4.372 L 30.025,-4.995 L 30.364,-5.599 L 30.742,-6.179 L 31.156,-6.734 L 31.605,-7.261 L 32.087,-7.758 L 32.599,-8.224 L 33.14,-8.655 L 33.708,-9.051 L 34.3,-9.41 L 34.914,-9.73 L 35.547,-10.011 L 36.197,-10.25 L 36.861,-10.447 L 37.535,-10.601 L 38.219,-10.711 L 38.908,-10.778 L 39.6,-10.8 L 75.6,-10.8 L 76.292,-10.778 L 76.981,-10.711 L 77.665,-10.601 L 78.339,-10.447 L 79.003,-10.25 L 79.653,-10.011 L 80.286,-9.73 L 80.9,-9.41 L 81.492,-9.051 L 82.06,-8.655 L 82.601,-8.224 L 83.113,-7.758 L 83.595,-7.261 L 84.044,-6.734 L 84.458,-6.179 L 84.836,-5.599 L 85.175,-4.995 L 85.476,-4.372 L 85.735,-3.73 L 85.954,-3.073 L 86.129,-2.403 L 86.262,-1.724 L 86.35,-1.037 L 86.394,-0.346 L 86.394,0.346 L 86.35,1.037 L 86.262,1.724 L 86.129,2.403 L 85.954,3.073 L 85.735,3.73 L 85.476,4.372 L 85.175,4.995 L 84.836,5.599 L 84.458,6.179 L 84.044,6.734 L 83.595,7.261 L 83.113,7.758 L 82.601,8.224 L 82.06,8.655 L 81.492,9.051 L 80.9,9.41 L 80.286,9.73 L 79.653,10.011 L 79.003,10.25 L 78.339,10.447 L 77.665,10.601 L 76.981,10.711 L 76.292,10.778 L 75.6,10.8 L 39.6,10.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Ground":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"32.24pt\" width=\"27.2pt\" viewBox=\"-13.6 -4.6 27.2 32.24\"><path d=\"M 0.0,-0.0 L 0,14.4 L -9,14.4 L 9,14.4 M -6.3,18.72 L 6.3,18.72 M -1.8,23.04 L 1.8,23.04\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","GroundSignal":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"32.6pt\" width=\"27.2pt\" viewBox=\"-13.6 -4.6 27.2 32.6\"><path d=\"M 0.0,-0.0 L 0,14.4 L -9,14.4 L 0,23.4 L 9,14.4 L 0,14.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","GroundChassis":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"32.6pt\" width=\"29.45pt\" viewBox=\"-18.1 -4.6 29.45 32.6\"><path d=\"M 0.0,-0.0 L 0,14.4 L -6.75,23.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,14.4 L -6.75,14.4 L -13.5,23.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,14.4 L 6.75,14.4 L 0,23.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Vss":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"23.6pt\" width=\"22.7pt\" viewBox=\"-11.35 -4.6 22.7 23.6\"><path d=\"M 0.0,-0.0 L 0,14.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,14.4 L -6.75,14.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,14.4 L 6.75,14.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Vdd":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"23.6pt\" width=\"22.7pt\" viewBox=\"-11.35 -19.0 22.7 23.6\"><path d=\"M 0.0,-0.0 L 0,-14.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-14.4 L -6.75,-14.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-14.4 L 6.75,-14.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Antenna":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"52.4pt\" width=\"36.56pt\" viewBox=\"-18.28 -47.8 36.56 52.4\"><path d=\"M 0.0,-0.0 L 0,-21.6 L -13.68,-43.2 L 13.68,-43.2 L 0,-21.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","AntennaLoop":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"56.0pt\" width=\"52.4pt\" viewBox=\"-22.6 -51.4 52.4 56.0\"><path d=\"M 0.0,-0.0 L 0,-7.2 L -18,-25.2 L 3.6,-46.8 L 25.2,-25.2 L 7.2,-7.2 L 7.2,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","AntennaLoop2":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"72.2pt\" width=\"63.2pt\" viewBox=\"-27.1 -67.6 63.2 72.2\"><path d=\"M 0.0,-0.0 L 0,-9 L -22.5,-9 L -22.5,-54 L 22.5,-54 L 22.5,-18 L -13.5,-18 L -13.5,-63 L 31.5,-63 L 31.5,-9 L 9,-9 L 9,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Dot":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"14.6pt\" width=\"14.6pt\" viewBox=\"-7.3 -7.3 14.6 14.6\"><circle cx=\"0\" cy=\"-0\" r=\"2.7\" style=\"stroke:black;fill:black;stroke-width:2;stroke-dasharray:-;\" /></svg>","Dot(open=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"14.6pt\" width=\"14.6pt\" viewBox=\"-7.3 -7.3 14.6 14.6\"><circle cx=\"0\" cy=\"-0\" r=\"2.7\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","DotDotDot":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"14.6pt\" width=\"50.599999999999994pt\" viewBox=\"10.7 -7.3 50.599999999999994 14.6\"><circle cx=\"18\" cy=\"-0\" r=\"2.7\" style=\"stroke:black;fill:black;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"36\" cy=\"-0\" r=\"2.7\" style=\"stroke:black;fill:black;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-0\" r=\"2.7\" style=\"stroke:black;fill:black;stroke-width:2;stroke-dasharray:-;\" /></svg>","Arrowhead":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"20.0pt\" width=\"18.2pt\" viewBox=\"-13.6 -10.0 18.2 20.0\"><path d=\"M -9.0,-0.0 L -9,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -2 0 L -9 2.7 L -9 -2.7 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","NoConnect":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"22.7pt\" width=\"22.7pt\" viewBox=\"-11.35 -11.35 22.7 22.7\"><path d=\"M -6.75,6.75 L 6.75,-6.75\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -6.75,-6.75 L 6.75,6.75\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","SwitchSpdt":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"67.36pt\" width=\"117.2pt\" viewBox=\"-4.6 -46.279999999999994 117.2 67.36\"><path d=\"M 0.0,-0.0 L 36,-0 M 44.64,-3.6 L 64.8,-16.2 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"40.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"67.68\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"67.68\" cy=\"-25.2\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><text x=\"40.32000000000001\" y=\"-3.5200000000000005\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"40.32000000000001\" dy=\"10\">a</tspan></text><text x=\"67.67999999999999\" y=\"-3.5200000000000005\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"67.67999999999999\" dy=\"10\">b</tspan></text><text x=\"67.67999999999999\" y=\"-41.67999999999999\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"67.67999999999999\" dy=\"10\">c</tspan></text></svg>","SwitchSpdt2":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"70.96000000000001pt\" width=\"45.2pt\" viewBox=\"-4.6 -35.480000000000004 45.2 70.96000000000001\"><path d=\"M 0.0,-0.0 M 8.64,-3.6 L 25.2,-9 M 36,-14.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"4.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"14.4\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"-14.4\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><text x=\"4.32\" y=\"-3.5200000000000005\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"4.32\" dy=\"10\">a</tspan></text><text x=\"31.68\" y=\"-30.880000000000003\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"31.68\" dy=\"10\">b</tspan></text><text x=\"31.68\" y=\"10.880000000000003\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"31.68\" dy=\"10\">c</tspan></text></svg>","SwitchSpdt(action='open')":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"67.36pt\" width=\"117.2pt\" viewBox=\"-4.6 -46.279999999999994 117.2 67.36\"><path d=\"M 54.71 -15.45 a 9 13.5 0 0 1 4.63 13.43\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 48.569 -18.803 L 56.007 -17.819 L 53.419 -13.079 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 0.0,-0.0 L 36,-0 M 44.64,-3.6 L 64.8,-16.2 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"40.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"67.68\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"67.68\" cy=\"-25.2\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><text x=\"40.32000000000001\" y=\"-3.5200000000000005\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"40.32000000000001\" dy=\"10\">a</tspan></text><text x=\"67.67999999999999\" y=\"-3.5200000000000005\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"67.67999999999999\" dy=\"10\">b</tspan></text><text x=\"67.67999999999999\" y=\"-41.67999999999999\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"67.67999999999999\" dy=\"10\">c</tspan></text></svg>","SwitchSpdt2(action='open')":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"70.96000000000001pt\" width=\"45.2pt\" viewBox=\"-4.6 -35.480000000000004 45.2 70.96000000000001\"><path d=\"M 16.91 -11.85 a 9 13.5 0 0 1 4.63 13.43\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 10.769 -15.203 L 18.207 -14.219 L 15.619 -9.479 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 0.0,-0.0 M 8.64,-3.6 L 25.2,-9 M 36,-14.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"4.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"14.4\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"-14.4\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><text x=\"4.32\" y=\"-3.5200000000000005\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"4.32\" dy=\"10\">a</tspan></text><text x=\"31.68\" y=\"-30.880000000000003\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"31.68\" dy=\"10\">b</tspan></text><text x=\"31.68\" y=\"10.880000000000003\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"31.68\" dy=\"10\">c</tspan></text></svg>","SwitchSpdt(action='close')":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"67.36pt\" width=\"117.2pt\" viewBox=\"-4.6 -46.279999999999994 117.2 67.36\"><path d=\"M 54.71 -20.85 a 9 13.5 0 0 1 4.63 13.43\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 58.521 -0.472 L 56.657 -7.739 L 62.02 -7.109 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 0.0,-0.0 L 36,-0 M 44.64,-3.6 L 64.8,-16.2 M 72,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"40.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"67.68\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"67.68\" cy=\"-25.2\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><text x=\"40.32000000000001\" y=\"-3.5200000000000005\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"40.32000000000001\" dy=\"10\">a</tspan></text><text x=\"67.67999999999999\" y=\"-3.5200000000000005\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"67.67999999999999\" dy=\"10\">b</tspan></text><text x=\"67.67999999999999\" y=\"-41.67999999999999\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"67.67999999999999\" dy=\"10\">c</tspan></text></svg>","SwitchSpdt2(action='close')":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"70.96000000000001pt\" width=\"45.2pt\" viewBox=\"-4.6 -35.480000000000004 45.2 70.96000000000001\"><path d=\"M 15.11 -11.85 a 9 13.5 0 0 1 4.63 13.43\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 18.921 8.528 L 17.057 1.261 L 22.42 1.891 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 0.0,-0.0 M 8.64,-3.6 L 25.2,-9 M 36,-14.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"4.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"14.4\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"-14.4\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><text x=\"4.32\" y=\"-3.5200000000000005\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"4.32\" dy=\"10\">a</tspan></text><text x=\"31.68\" y=\"-30.880000000000003\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"31.68\" dy=\"10\">b</tspan></text><text x=\"31.68\" y=\"10.880000000000003\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"31.68\" dy=\"10\">c</tspan></text></svg>","SwitchDpst":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"76.79999999999998pt\" width=\"63.86pt\" viewBox=\"-15.279999999999998 -20.799999999999997 63.86 76.79999999999998\"><path d=\"M 0.0,-0.0 M 8.64,-3.6 L 28.8,-16.2 M 36,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 8.64,32.4 L 28.8,19.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 18.0,27.0 L 18,-7.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:2,3.3;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"4.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"4.32\" cy=\"36\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"36\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><text x=\"0.7199999999999996\" y=\"-15.399999999999999\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"0.7199999999999996\" dy=\"10\">p1</tspan></text><text x=\"35.28\" y=\"-15.399999999999999\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"35.28\" dy=\"10\">t1</tspan></text><text x=\"0.7199999999999996\" y=\"31.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"0.7199999999999996\" dy=\"10\">p2</tspan></text><text x=\"35.28\" y=\"31.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"35.28\" dy=\"10\">t2</tspan></text></svg>","SwitchDpdt":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"119.19999999999999pt\" width=\"63.86pt\" viewBox=\"-15.279999999999998 -34.4 63.86 119.19999999999999\"><path d=\"M 0.0,-0.0 M 8.64,-3.6 L 25.2,-9 M 36,-14.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 8.64,46.8 L 25.2,41.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 18.0,41.4 L 18,-7.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:2,3.3;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"4.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"14.4\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"-14.4\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"4.32\" cy=\"50.4\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"64.8\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"36\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><text x=\"0.7199999999999996\" y=\"-15.399999999999999\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"0.7199999999999996\" dy=\"10\">p1</tspan></text><text x=\"35.28\" y=\"-29.8\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"35.28\" dy=\"10\">t1</tspan></text><text x=\"35.28\" y=\"-1.0\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"35.28\" dy=\"10\">t2</tspan></text><text x=\"0.7199999999999996\" y=\"45.8\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"0.7199999999999996\" dy=\"10\">p2</tspan></text><text x=\"35.28\" y=\"31.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"35.28\" dy=\"10\">t3</tspan></text><text x=\"35.28\" y=\"60.19999999999999\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"35.28\" dy=\"10\">t4</tspan></text></svg>","SwitchDpst(link=False)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"76.79999999999998pt\" width=\"63.86pt\" viewBox=\"-15.279999999999998 -20.799999999999997 63.86 76.79999999999998\"><path d=\"M 0.0,-0.0 M 8.64,-3.6 L 28.8,-16.2 M 36,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 8.64,32.4 L 28.8,19.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"4.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"4.32\" cy=\"36\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"36\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><text x=\"0.7199999999999996\" y=\"-15.399999999999999\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"0.7199999999999996\" dy=\"10\">p1</tspan></text><text x=\"35.28\" y=\"-15.399999999999999\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"35.28\" dy=\"10\">t1</tspan></text><text x=\"0.7199999999999996\" y=\"31.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"0.7199999999999996\" dy=\"10\">p2</tspan></text><text x=\"35.28\" y=\"31.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"35.28\" dy=\"10\">t2</tspan></text></svg>","SwitchDpdt(link=False)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"119.19999999999999pt\" width=\"63.86pt\" viewBox=\"-15.279999999999998 -34.4 63.86 119.19999999999999\"><path d=\"M 0.0,-0.0 M 8.64,-3.6 L 25.2,-9 M 36,-14.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 8.64,46.8 L 25.2,41.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"4.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"14.4\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"-14.4\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"4.32\" cy=\"50.4\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"64.8\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"31.68\" cy=\"36\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><text x=\"0.7199999999999996\" y=\"-15.399999999999999\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"0.7199999999999996\" dy=\"10\">p1</tspan></text><text x=\"35.28\" y=\"-29.8\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"35.28\" dy=\"10\">t1</tspan></text><text x=\"35.28\" y=\"-1.0\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"35.28\" dy=\"10\">t2</tspan></text><text x=\"0.7199999999999996\" y=\"45.8\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"0.7199999999999996\" dy=\"10\">p2</tspan></text><text x=\"35.28\" y=\"31.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"35.28\" dy=\"10\">t3</tspan></text><text x=\"35.28\" y=\"60.19999999999999\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"35.28\" dy=\"10\">t4</tspan></text></svg>","SwitchRotary(n=6)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"99.05147195389375pt\" width=\"59.553810226936164pt\" viewBox=\"-14.92 -54.165735976946884 59.553810226936164 99.05147195389375\"><path d=\"M 0.0,-0.0 L 0.785,17.983\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 1.09 24.976 L -1.912 18.101 L 3.483 17.865 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><circle cx=\"0\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"1.57\" cy=\"35.966\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"21.915\" cy=\"28.561\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"34.334\" cy=\"10.825\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"34.334\" cy=\"-10.825\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"21.915\" cy=\"-28.561\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"1.57\" cy=\"-35.966\" r=\"4.32\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">P</tspan></text><text x=\"1.5702979451520962\" y=\"22.36573597694688\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"1.5702979451520962\" dy=\"10\">T1</tspan></text><text x=\"21.915411444313943\" y=\"14.960720250484467\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"21.915411444313943\" dy=\"10\">T2</tspan></text><text x=\"34.33381022693617\" y=\"-2.7745912178461642\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"34.33381022693617\" dy=\"10\">T3</tspan></text><text x=\"34.33381022693617\" y=\"-24.425408782153827\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"34.33381022693617\" dy=\"10\">T4</tspan></text><text x=\"21.915411444313946\" y=\"-42.16072025048446\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"21.915411444313946\" dy=\"10\">T5</tspan></text><text x=\"1.5702979451520962\" y=\"-49.56573597694688\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"1.5702979451520962\" dy=\"10\">T6</tspan></text></svg>","SwitchDIP":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"79.60000000000001pt\" width=\"81.2pt\" viewBox=\"-4.6 -61.400000000000006 81.2 79.60000000000001\"><polygon points=\"0,-0 72,-0 72,-43.2 0,-43.2 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"7.2,-21.6 21.6,-21.6 21.6,-36 7.2,-36 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"7.2,-7.2 21.6,-7.2 21.6,-21.6 7.2,-21.6 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"28.8,-21.6 43.2,-21.6 43.2,-36 28.8,-36 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"28.8,-7.2 43.2,-7.2 43.2,-21.6 28.8,-21.6 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"50.4,-21.6 64.8,-21.6 64.8,-36 50.4,-36 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"50.4,-7.2 64.8,-7.2 64.8,-21.6 50.4,-21.6 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"14.4\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"14.4\" dy=\"10\">a1</tspan></text><text x=\"14.4\" y=\"-56.80000000000001\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"14.4\" dy=\"10\">b1</tspan></text><text x=\"36.0\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"36.0\" dy=\"10\">a2</tspan></text><text x=\"36.0\" y=\"-56.80000000000001\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"36.0\" dy=\"10\">b2</tspan></text><text x=\"57.6\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"57.6\" dy=\"10\">a3</tspan></text><text x=\"57.6\" y=\"-56.80000000000001\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"57.6\" dy=\"10\">b3</tspan></text></svg>","SwitchDIP(pattern=[0, 0, 1])":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"79.60000000000001pt\" width=\"81.2pt\" viewBox=\"-4.6 -61.400000000000006 81.2 79.60000000000001\"><polygon points=\"0,-0 72,-0 72,-43.2 0,-43.2 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"7.2,-21.6 21.6,-21.6 21.6,-36 7.2,-36 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"7.2,-7.2 21.6,-7.2 21.6,-21.6 7.2,-21.6 \" style=\"stroke:black;fill:#333333;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"28.8,-21.6 43.2,-21.6 43.2,-36 28.8,-36 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"28.8,-7.2 43.2,-7.2 43.2,-21.6 28.8,-21.6 \" style=\"stroke:black;fill:#333333;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"50.4,-21.6 64.8,-21.6 64.8,-36 50.4,-36 \" style=\"stroke:black;fill:#333333;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"50.4,-7.2 64.8,-7.2 64.8,-21.6 50.4,-21.6 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"14.4\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"14.4\" dy=\"10\">a1</tspan></text><text x=\"14.4\" y=\"-56.80000000000001\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"14.4\" dy=\"10\">b1</tspan></text><text x=\"36.0\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"36.0\" dy=\"10\">a2</tspan></text><text x=\"36.0\" y=\"-56.80000000000001\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"36.0\" dy=\"10\">b2</tspan></text><text x=\"57.6\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"57.6\" dy=\"10\">a3</tspan></text><text x=\"57.6\" y=\"-56.80000000000001\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"57.6\" dy=\"10\">b3</tspan></text></svg>","Speaker":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"72.2pt\" width=\"57.92pt\" viewBox=\"-21.82 -27.1 57.92 72.2\"><polygon points=\"9,-9 9,27 18,27 18,-9 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polyline points=\"18,-9 31.5,-22.5 31.5,40.5 18,27 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 9,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,18.0 L 9,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-3.6\" y=\"-10.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">in1</tspan></text><text x=\"-3.6\" y=\"8.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">in2</tspan></text></svg>","Mic":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"53.42pt\" viewBox=\"-22.600000000000005 -13.6 53.42 45.2\"><path d=\"M -18 -9 a 18 18 0 1 1 0 36\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 9,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,18.0 L 9,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -18.0,-9.0 L -18,27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"12.6\" y=\"-10.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"12.6\" dy=\"10\">in1</tspan></text><text x=\"12.6\" y=\"8.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"12.6\" dy=\"10\">in2</tspan></text></svg>","AudioJack":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"72.4pt\" width=\"114.32pt\" viewBox=\"-76.6 -54.2 114.32 72.4\"><path d=\"M -2.6999999999999997,-0.0 L -72,-0 L -72,-36 L -64.8,-36 L -64.8,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -2.6999999999999997,-36.0 L -39.6,-36 L -45,-30.6 L -50.4,-36\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"3.6\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">sleeve</tspan></text><text x=\"3.6\" y=\"-49.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">tip</tspan></text><circle cx=\"0\" cy=\"-0\" r=\"2.7\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"0\" cy=\"-36\" r=\"2.7\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","AudioJack(ring=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"85.0pt\" width=\"121.52000000000001pt\" viewBox=\"-83.80000000000001 -54.2 121.52000000000001 85.0\"><path d=\"M -2.6999999999999997,12.6 L -72,12.6 L -72,-0 L -72,-36 L -79.2,-36 L -79.2,-0 L -72,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -2.6999999999999997,-3.6 L -54,-3.6 L -59.4,-9 L -64.8,-3.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -2.6999999999999997,-36.0 L -39.6,-36 L -45,-30.6 L -50.4,-36\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"3.6\" y=\"6.199999999999999\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">sleeve</tspan></text><text x=\"3.6\" y=\"-13.6\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">ring</tspan></text><text x=\"3.6\" y=\"-49.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">tip</tspan></text><circle cx=\"0\" cy=\"12.6\" r=\"2.7\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"0\" cy=\"-3.6\" r=\"2.7\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"0\" cy=\"-36\" r=\"2.7\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","AudioJack(switch=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"79.60000000000001pt\" width=\"123.56pt\" viewBox=\"-76.6 -61.400000000000006 123.56 79.60000000000001\"><path d=\"M -2.6999999999999997,-0.0 L -72,-0 L -72,-36 L -64.8,-36 L -64.8,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -2.6999999999999997,-43.199999999999996 L -39.6,-43.2 L -45,-37.8 L -50.4,-43.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-28.799999999999997 L -18,-28.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -18.0,-28.799999999999997 L -18,-34.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -18 -41.2 L -15.3 -34.2 L -20.7 -34.2 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"3.6\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">sleeve</tspan></text><text x=\"3.6\" y=\"-56.800000000000004\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">tip</tspan></text><text x=\"3.6\" y=\"-38.8\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">tipswitch</tspan></text><circle cx=\"0\" cy=\"-0\" r=\"2.7\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"0\" cy=\"-43.2\" r=\"2.7\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"0\" cy=\"-28.8\" r=\"2.7\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","AudioJack(switch=True, ring=True, ringswitch=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"99.4pt\" width=\"137.06pt\" viewBox=\"-83.80000000000001 -61.400000000000006 137.06 99.4\"><path d=\"M -2.6999999999999997,19.8 L -72,19.8 L -72,-0 L -72,-36 L -79.2,-36 L -79.2,-0 L -72,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -2.6999999999999997,3.6 L -54,3.6 L -59.4,-1.8 L -64.8,3.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -2.6999999999999997,-43.199999999999996 L -39.6,-43.2 L -45,-37.8 L -50.4,-43.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-28.799999999999997 L -18,-28.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -18.0,-28.799999999999997 L -18,-34.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -18 -41.2 L -15.3 -34.2 L -20.7 -34.2 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 0.0,-10.8 L -18,-10.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -18.0,-10.8 L -18,-5.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -18 1.6 L -20.7 -5.4 L -15.3 -5.4 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"3.6\" y=\"13.400000000000002\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">sleeve</tspan></text><text x=\"3.6\" y=\"-6.4\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">ring</tspan></text><text x=\"3.6\" y=\"-56.800000000000004\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">tip</tspan></text><text x=\"3.6\" y=\"-38.8\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">tipswitch</tspan></text><text x=\"3.6\" y=\"-20.8\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">ringswitch</tspan></text><circle cx=\"0\" cy=\"19.8\" r=\"2.7\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"0\" cy=\"3.6\" r=\"2.7\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"0\" cy=\"-43.2\" r=\"2.7\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"0\" cy=\"-28.8\" r=\"2.7\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"0\" cy=\"-10.8\" r=\"2.7\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","Gap(label=['+', 'Gap', '-'])":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"23.199999999999996pt\" width=\"117.2pt\" viewBox=\"-4.6 -11.599999999999998 117.2 23.199999999999996\"><text x=\"27.0\" y=\"-14.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.0\" dy=\"14\">+</tspan></text><text x=\"54.0\" y=\"-14.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"14\">Gap</tspan></text><text x=\"81.0\" y=\"-14.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"81.0\" dy=\"14\">-</tspan></text></svg>","Label(label='Hello')":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"23.199999999999996pt\" width=\"40.784pt\" viewBox=\"-16.792 -15.199999999999998 40.784 23.199999999999996\"><text x=\"3.6\" y=\"-17.6\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"3.6\" dy=\"14\">Hello</tspan></text><text x=\"3.6\" y=\"-17.6\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"3.6\" dy=\"14\">Hello</tspan></text></svg>","Tag(label='Tag')":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"31.7pt\" width=\"63.2pt\" viewBox=\"-4.6 -15.85 63.2 31.7\"><polygon points=\"0,-0 11.25,-11.25 54,-11.25 54,11.25 11.25,11.25 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"27.0\" y=\"-12.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"12\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.0\" dy=\"12\">Tag</tspan></text></svg>","Opamp":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"102.28pt\" width=\"127.76228634059946pt\" viewBox=\"-24.52 -51.14 127.76228634059946 102.28\"><path d=\"M 0.0,-0.0 L 0,-45 L 77.942,-0 L 0,45 L 0,-0 M 77.942,-0\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 6.142785792574934,-22.5 L 13.343,-22.5\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 6.142785792574934,22.5 L 13.343,22.5\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 9.742785792574933,26.099999999999998 L 9.743,18.9\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"0\" cy=\"-22.5\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"-6.3\" y=\"-32.5\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-6.3\" dy=\"10\">in1</tspan></text><circle cx=\"0\" cy=\"22.5\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"-6.3\" y=\"12.5\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-6.3\" dy=\"10\">in2</tspan></text><circle cx=\"77.942\" cy=\"-0\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"84.24228634059946\" y=\"-10.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"84.24228634059946\" dy=\"10\">out</tspan></text><circle cx=\"25.981\" cy=\"-30.24\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"25.980762113533157\" y=\"-46.54\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"25.980762113533157\" dy=\"10\">vd</tspan></text><circle cx=\"25.981\" cy=\"30.24\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"25.980762113533157\" y=\"26.54\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"25.980762113533157\" dy=\"10\">vs</tspan></text><circle cx=\"51.962\" cy=\"15.12\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"51.96152422706631\" y=\"11.419999999999998\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"51.96152422706631\" dy=\"10\">n1</tspan></text><circle cx=\"51.962\" cy=\"-15.12\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"51.96152422706631\" y=\"-31.419999999999998\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"51.96152422706631\" dy=\"10\">n2</tspan></text><circle cx=\"70.148\" cy=\"-4.68\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"70.14805770653952\" y=\"-20.98\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"70.14805770653952\" dy=\"10\">n2a</tspan></text><circle cx=\"70.148\" cy=\"4.68\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"70.14805770653952\" y=\"0.9800000000000004\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"70.14805770653952\" dy=\"10\">n1a</tspan></text></svg>","Opamp(sign=False)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"102.28pt\" width=\"127.76228634059949pt\" viewBox=\"155.48000000000002 -51.14 127.76228634059949 102.28\"><path d=\"M 180.0,-0.0 L 180,-45 L 257.942,-0 L 180,45 L 180,-0 M 257.942,-0\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"180\" cy=\"-22.5\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"173.70000000000002\" y=\"-32.5\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"173.70000000000002\" dy=\"10\">in1</tspan></text><circle cx=\"180\" cy=\"22.5\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"173.70000000000002\" y=\"12.5\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"173.70000000000002\" dy=\"10\">in2</tspan></text><circle cx=\"257.942\" cy=\"-0\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"264.24228634059943\" y=\"-10.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"264.24228634059943\" dy=\"10\">out</tspan></text><circle cx=\"205.981\" cy=\"-30.24\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"205.98076211353316\" y=\"-46.54\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"205.98076211353316\" dy=\"10\">vd</tspan></text><circle cx=\"205.981\" cy=\"30.24\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"205.98076211353316\" y=\"26.54\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"205.98076211353316\" dy=\"10\">vs</tspan></text><circle cx=\"231.962\" cy=\"15.12\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"231.96152422706632\" y=\"11.419999999999998\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"231.96152422706632\" dy=\"10\">n1</tspan></text><circle cx=\"231.962\" cy=\"-15.12\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"231.96152422706632\" y=\"-31.419999999999998\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"231.96152422706632\" dy=\"10\">n2</tspan></text><circle cx=\"250.148\" cy=\"-4.68\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"250.14805770653953\" y=\"-20.98\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"250.14805770653953\" dy=\"10\">n2a</tspan></text><circle cx=\"250.148\" cy=\"4.68\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><text x=\"250.14805770653953\" y=\"0.9800000000000004\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"250.14805770653953\" dy=\"10\">n1a</tspan></text></svg>","Opamp(leads=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"99.2pt\" width=\"160.96028634059945pt\" viewBox=\"339.542 -49.6 160.96028634059945 99.2\"><path d=\"M 382.5,-0.0 L 382.5,-45 L 460.442,-0 L 382.5,45 L 382.5,-0 M 460.442,-0\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 388.64278579257495,-22.5 L 395.843,-22.5\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 388.64278579257495,22.5 L 395.843,22.5\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 392.2427857925749,26.099999999999998 L 392.243,18.9\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 360.0,-22.5 L 382.5,-22.5\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 360.0,22.5 L 382.5,22.5\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 460.4422863405994,-0.0 L 482.942,-0\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"356.40000000000003\" y=\"-35.099999999999994\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"9\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"356.40000000000003\" dy=\"9\">in1</tspan></text><text x=\"356.40000000000003\" y=\"9.900000000000002\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"9\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"356.40000000000003\" dy=\"9\">in2</tspan></text><text x=\"482.9422863405994\" y=\"-12.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"9\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"482.9422863405994\" dy=\"9\">out</tspan></text><circle cx=\"360\" cy=\"-22.5\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><circle cx=\"360\" cy=\"22.5\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /><circle cx=\"482.942\" cy=\"-0\" r=\"2.7\" style=\"stroke:blue;fill:blue;stroke-width:2.0;stroke-dasharray:-;\" /></svg>","Bjt":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"86.56pt\" width=\"104.0pt\" viewBox=\"-30.4 -43.28 104.0 86.56\"><path d=\"M 0.0,-0.0 L 13.2,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-13.2 L 13.2,13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 27.06,18.48 L 27.06,25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-3.6\" y=\"-10.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">base</tspan></text><text x=\"30.659999999999997\" y=\"-38.68\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">collector</tspan></text><text x=\"30.659999999999997\" y=\"18.68\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">emitter</tspan></text></svg>","BjtNpn":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"86.56pt\" width=\"104.0pt\" viewBox=\"-30.4 -43.28 104.0 86.56\"><path d=\"M 0.0,-0.0 L 13.2,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-13.2 L 13.2,13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 27.06,18.48 L 27.06,25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 20.227,12.623\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 25.541 17.178 L 17.884 15.356 L 22.57 9.89 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"-3.6\" y=\"-10.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">base</tspan></text><text x=\"30.659999999999997\" y=\"-38.68\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">collector</tspan></text><text x=\"30.659999999999997\" y=\"18.68\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">emitter</tspan></text></svg>","BjtPnp":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"86.56pt\" width=\"104.0pt\" viewBox=\"-30.4 -43.28 104.0 86.56\"><path d=\"M 0.0,-0.0 L 13.2,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-13.2 L 13.2,13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 27.06,18.48 L 27.06,25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 27.06,-18.48 L 20.033,-12.457\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 14.719 -7.902 L 17.69 -15.19 L 22.376 -9.724 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"-3.6\" y=\"-10.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">base</tspan></text><text x=\"30.659999999999997\" y=\"18.68\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">collector</tspan></text><text x=\"30.659999999999997\" y=\"-38.68\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">emitter</tspan></text></svg>","Bjt(circle=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"86.56pt\" width=\"81.23pt\" viewBox=\"-30.4 -43.28 81.23 86.56\"><circle cx=\"19.8\" cy=\"-0\" r=\"19.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 13.2,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-13.2 L 13.2,13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 27.06,18.48 L 27.06,25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-3.6\" y=\"-10.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">base</tspan></text><text x=\"27.06\" y=\"-38.68\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.06\" dy=\"10\">collector</tspan></text><text x=\"27.06\" y=\"18.68\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.06\" dy=\"10\">emitter</tspan></text></svg>","BjtNpn(circle=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"86.56pt\" width=\"81.23pt\" viewBox=\"-30.4 -43.28 81.23 86.56\"><circle cx=\"19.8\" cy=\"-0\" r=\"19.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 13.2,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-13.2 L 13.2,13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 27.06,18.48 L 27.06,25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 20.227,12.623\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 25.541 17.178 L 17.884 15.356 L 22.57 9.89 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"-3.6\" y=\"-10.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">base</tspan></text><text x=\"27.06\" y=\"-38.68\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.06\" dy=\"10\">collector</tspan></text><text x=\"27.06\" y=\"18.68\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.06\" dy=\"10\">emitter</tspan></text></svg>","BjtPnp(circle=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"86.56pt\" width=\"81.23pt\" viewBox=\"-30.4 -43.28 81.23 86.56\"><circle cx=\"19.8\" cy=\"-0\" r=\"19.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 13.2,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-13.2 L 13.2,13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 27.06,18.48 L 27.06,25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 27.06,-18.48 L 20.033,-12.457\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 14.719 -7.902 L 17.69 -15.19 L 22.376 -9.724 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"-3.6\" y=\"-10.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">base</tspan></text><text x=\"27.06\" y=\"18.68\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.06\" dy=\"10\">collector</tspan></text><text x=\"27.06\" y=\"-38.68\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.06\" dy=\"10\">emitter</tspan></text></svg>","BjtPnp2c":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"86.56pt\" width=\"104.0pt\" viewBox=\"-30.4 -43.28 104.0 86.56\"><path d=\"M 0.0,-0.0 L 13.2,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-13.2 L 13.2,13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 27.06,18.48 L 27.06,25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 27.06,-18.48 L 20.033,-12.457\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 14.719 -7.902 L 17.69 -15.19 L 22.376 -9.724 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 13.2,-2.4000000000000004 L 27.06,9.48\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-3.6\" y=\"-10.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">base</tspan></text><text x=\"30.659999999999997\" y=\"18.68\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">collector</tspan></text><text x=\"30.659999999999997\" y=\"-38.68\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">emitter</tspan></text><text x=\"30.659999999999997\" y=\"-0.5200000000000014\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">C2</tspan></text></svg>","BjtPnp2c(circle=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"86.56pt\" width=\"81.23pt\" viewBox=\"-30.4 -43.28 81.23 86.56\"><circle cx=\"19.8\" cy=\"-0\" r=\"19.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 13.2,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-13.2 L 13.2,13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 27.06,18.48 L 27.06,25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 27.06,-18.48 L 20.033,-12.457\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 14.719 -7.902 L 17.69 -15.19 L 22.376 -9.724 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 13.2,-2.4000000000000004 L 27.06,9.48\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-3.6\" y=\"-10.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">base</tspan></text><text x=\"27.06\" y=\"18.68\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.06\" dy=\"10\">collector</tspan></text><text x=\"27.06\" y=\"-38.68\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"27.06\" dy=\"10\">emitter</tspan></text><text x=\"30.659999999999997\" y=\"-0.5200000000000014\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">C2</tspan></text></svg>","NpnSchottky":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"86.56pt\" width=\"104.0pt\" viewBox=\"-30.4 -43.28 104.0 86.56\"><path d=\"M 0.0,-0.0 L 13.2,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-13.2 L 13.2,13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 27.06,18.48 L 27.06,25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 20.227,12.623\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 25.541 17.178 L 17.884 15.356 L 22.57 9.89 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 13.2,-13.2 L 13.2,-16.8 L 16.8,-16.8 L 16.8,-13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,13.2 L 13.2,16.8 L 9.6,16.8 L 9.6,13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-3.6\" y=\"-10.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">base</tspan></text><text x=\"30.659999999999997\" y=\"-38.68\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">collector</tspan></text><text x=\"30.659999999999997\" y=\"18.68\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">emitter</tspan></text></svg>","PnpSchottky":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"86.56pt\" width=\"104.0pt\" viewBox=\"-30.4 -43.28 104.0 86.56\"><path d=\"M 0.0,-0.0 L 13.2,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-13.2 L 13.2,13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 27.06,18.48 L 27.06,25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 27.06,-18.48 L 20.033,-12.457\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 14.719 -7.902 L 17.69 -15.19 L 22.376 -9.724 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 13.2,-13.2 L 13.2,-16.8 L 9.6,-16.8 L 9.6,-13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,13.2 L 13.2,16.8 L 16.8,16.8 L 16.8,13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-3.6\" y=\"-10.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">base</tspan></text><text x=\"30.659999999999997\" y=\"18.68\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">collector</tspan></text><text x=\"30.659999999999997\" y=\"-38.68\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">emitter</tspan></text></svg>","IgbtN":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"86.56pt\" width=\"101.6pt\" viewBox=\"-28.0 -43.28 101.6 86.56\"><path d=\"M 13.2,-13.2 L 13.2,13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 27.06,18.48 L 27.06,25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 20.227,12.623\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 25.541 17.178 L 17.884 15.356 L 22.57 9.89 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 7.799999999999999,-10.499999999999998 L 7.8,10.5 L 2.4,10.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-1.2000000000000006\" y=\"0.4999999999999982\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-1.2000000000000006\" dy=\"10\">base</tspan></text><text x=\"30.659999999999997\" y=\"-38.68\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">collector</tspan></text><text x=\"30.659999999999997\" y=\"18.68\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">emitter</tspan></text></svg>","IgbtP":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"86.56pt\" width=\"101.6pt\" viewBox=\"-28.0 -43.28 101.6 86.56\"><path d=\"M 13.2,-13.2 L 13.2,13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 27.06,18.48 L 27.06,25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 27.06,-18.48 L 20.033,-12.457\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 14.719 -7.902 L 17.69 -15.19 L 22.376 -9.724 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 2.3999999999999995,-10.499999999999998 L 7.8,-10.5 L 7.8,10.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-1.2000000000000006\" y=\"-20.5\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-1.2000000000000006\" dy=\"10\">base</tspan></text><text x=\"30.659999999999997\" y=\"18.68\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">collector</tspan></text><text x=\"30.659999999999997\" y=\"-38.68\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">emitter</tspan></text></svg>","NpnPhoto":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"86.56pt\" width=\"104.0pt\" viewBox=\"-30.4 -43.28 104.0 86.56\"><path d=\"M 13.2,-13.2 L 13.2,13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 27.06,18.48 L 27.06,25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 20.227,12.623\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 25.541 17.178 L 17.884 15.356 L 22.57 9.89 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M -3.6,-13.2 L 2.565,-8.816\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 8.27 -4.759 L 0.479 -5.882 L 4.652 -11.75 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M -3.6,-4.199999999999999 L 2.565,0.184\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 8.27 4.241 L 0.479 3.118 L 4.652 -2.75 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"-3.6\" y=\"-10.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">base</tspan></text><text x=\"30.659999999999997\" y=\"-38.68\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">collector</tspan></text><text x=\"30.659999999999997\" y=\"18.68\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">emitter</tspan></text></svg>","PnpPhoto":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"86.56pt\" width=\"104.0pt\" viewBox=\"-30.4 -43.28 104.0 86.56\"><path d=\"M 13.2,-13.2 L 13.2,13.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,-6.6 L 27.06,-18.48 L 27.06,-25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13.2,6.6 L 27.06,18.48 L 27.06,25.08\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 27.06,-18.48 L 20.033,-12.457\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 14.719 -7.902 L 17.69 -15.19 L 22.376 -9.724 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M -3.6,-13.2 L 2.565,-8.816\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 8.27 -4.759 L 0.479 -5.882 L 4.652 -11.75 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M -3.6,-4.199999999999999 L 2.565,0.184\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 8.27 4.241 L 0.479 3.118 L 4.652 -2.75 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"-3.6\" y=\"-10.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">base</tspan></text><text x=\"30.659999999999997\" y=\"18.68\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">collector</tspan></text><text x=\"30.659999999999997\" y=\"-38.68\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"30.659999999999997\" dy=\"10\">emitter</tspan></text></svg>","NFet":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"90.4pt\" width=\"116.6pt\" viewBox=\"-39.099999999999994 -18.2 116.6 90.4\"><path d=\"M 0.0,-0.0 L 0,15 L 24,15 L 24,39 L 0,39 L 0,54\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 29.999999999999996,14.999999999999998 L 30,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 29.999999999999996,27.0 L 49.2,27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-3.6\" y=\"47.6\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text><text x=\"52.800000000000004\" y=\"17.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"52.800000000000004\" dy=\"10\">gate</tspan></text></svg>","PFet":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"90.4pt\" width=\"116.6pt\" viewBox=\"-39.099999999999994 -18.2 116.6 90.4\"><circle cx=\"34.2\" cy=\"27\" r=\"4.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 0,15 L 24,15 L 24,39 L 0,39 L 0,54\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 29.999999999999996,14.999999999999998 L 30,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 38.4,27.0 L 49.2,27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"47.6\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text><text x=\"52.800000000000004\" y=\"17.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"52.800000000000004\" dy=\"10\">gate</tspan></text></svg>","NFet(bulk=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"90.4pt\" width=\"116.6pt\" viewBox=\"-39.099999999999994 -18.2 116.6 90.4\"><path d=\"M 0.0,-0.0 L 0,15 L 24,15 L 24,39 L 0,39 L 0,54\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 29.999999999999996,14.999999999999998 L 30,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 29.999999999999996,27.0 L 49.2,27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,27.0 L 15,27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 22 27 L 15 30.6 L 15 23.4 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"-3.6\" y=\"47.6\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text><text x=\"52.800000000000004\" y=\"17.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"52.800000000000004\" dy=\"10\">gate</tspan></text><text x=\"-3.6\" y=\"17.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">bulk</tspan></text></svg>","PFet(bulk=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"90.4pt\" width=\"116.6pt\" viewBox=\"-39.099999999999994 -18.2 116.6 90.4\"><circle cx=\"34.2\" cy=\"27\" r=\"4.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 0,15 L 24,15 L 24,39 L 0,39 L 0,54\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 29.999999999999996,14.999999999999998 L 30,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 38.4,27.0 L 49.2,27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,27.0 L 15,27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 22 27 L 15 30.6 L 15 23.4 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"47.6\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text><text x=\"52.800000000000004\" y=\"17.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"52.800000000000004\" dy=\"10\">gate</tspan></text><text x=\"-3.6\" y=\"17.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">bulk</tspan></text></svg>","JFet":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"84.4pt\" width=\"100.39999999999999pt\" viewBox=\"-39.099999999999994 -18.2 100.39999999999999 84.4\"><path d=\"M 0.0,-0.0 L 0,15 L 18,15 L 18,10.2 L 18,37.8 L 18,33 L 0,33 L 0,48\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 18.0,33.0 L 33,33\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-3.6\" y=\"41.6\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text><text x=\"36.599999999999994\" y=\"23.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text></svg>","JFetN":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"84.4pt\" width=\"100.39999999999999pt\" viewBox=\"-39.099999999999994 -18.2 100.39999999999999 84.4\"><path d=\"M 0.0,-0.0 L 0,15 L 18,15 L 18,10.2 L 18,37.8 L 18,33 L 0,33 L 0,48\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 18.0,33.0 L 33,33\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 21.599999999999998,33.0 L 19.8,33\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 26.8 33 L 19.8 36.6 L 19.8 29.4 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"-3.6\" y=\"41.6\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text><text x=\"36.599999999999994\" y=\"23.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text></svg>","JFetP":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"84.4pt\" width=\"100.39999999999999pt\" viewBox=\"-39.099999999999994 -18.2 100.39999999999999 84.4\"><path d=\"M 0.0,-0.0 L 0,15 L 18,15 L 18,10.2 L 18,37.8 L 18,33 L 0,33 L 0,48\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 18.0,33.0 L 33,33\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 27.0,33.0 L 27,33\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 20 33 L 27 29.4 L 27 36.6 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"-3.6\" y=\"41.6\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text><text x=\"36.599999999999994\" y=\"23.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text></svg>","JFetN(circle=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"84.4pt\" width=\"83.30000000000001pt\" viewBox=\"-22.0 -18.2 83.30000000000001 84.4\"><circle cx=\"9\" cy=\"24\" r=\"26.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 0,15 L 18,15 L 18,10.2 L 18,37.8 L 18,33 L 0,33 L 0,48\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 18.0,33.0 L 33,33\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 21.599999999999998,33.0 L 19.8,33\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 26.8 33 L 19.8 36.6 L 19.8 29.4 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"0.0\" y=\"41.6\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"0.0\" dy=\"10\">source</tspan></text><text x=\"0.0\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"0.0\" dy=\"10\">drain</tspan></text><text x=\"36.599999999999994\" y=\"23.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text></svg>","JFetP(circle=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"84.4pt\" width=\"83.30000000000001pt\" viewBox=\"-22.0 -18.2 83.30000000000001 84.4\"><circle cx=\"9\" cy=\"24\" r=\"26.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 0,15 L 18,15 L 18,10.2 L 18,37.8 L 18,33 L 0,33 L 0,48\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 18.0,33.0 L 33,33\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 27.0,33.0 L 27,33\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 20 33 L 27 29.4 L 27 36.6 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"0.0\" y=\"41.6\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"0.0\" dy=\"10\">source</tspan></text><text x=\"0.0\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"0.0\" dy=\"10\">drain</tspan></text><text x=\"36.599999999999994\" y=\"23.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text></svg>","Hemt":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"90.4pt\" width=\"110.6pt\" viewBox=\"-39.099999999999994 -18.2 110.6 90.4\"><path d=\"M 0.0,-0.0 L 0,15 L 24,15 M 24,10.8 L 24,17.28 M 24,23.76 L 24,30.24 M 24,36.72 L 24,43.2 M 24,39 L 0,39 L 0,54\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 24.0,27.0 L 43.2,27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 9.0,39.0 L 24,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 2 39 L 9 35.4 L 9 42.6 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"-3.6\" y=\"47.6\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"46.800000000000004\" y=\"17.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"46.800000000000004\" dy=\"10\">gate</tspan></text></svg>","Hemt(split=False)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"90.4pt\" width=\"110.6pt\" viewBox=\"-39.099999999999994 -18.2 110.6 90.4\"><path d=\"M 0.0,-0.0 L 0,15 L 24,15 M 24,10.8 L 24,43.2 M 24,39 L 0,39 L 0,54\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 24.0,27.0 L 43.2,27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 9.0,39.0 L 24,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 2 39 L 9 35.4 L 9 42.6 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"-3.6\" y=\"47.6\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"46.800000000000004\" y=\"17.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"46.800000000000004\" dy=\"10\">gate</tspan></text></svg>","Hemt(arrow=False)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"90.4pt\" width=\"110.6pt\" viewBox=\"-39.099999999999994 -18.2 110.6 90.4\"><path d=\"M 0.0,-0.0 L 0,15 L 24,15 M 24,10.8 L 24,17.28 M 24,23.76 L 24,30.24 M 24,36.72 L 24,43.2 M 24,39 L 0,39 L 0,54\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 24.0,27.0 L 43.2,27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 9.0,39.0 L 24,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 2 39 L 9 35.4 L 9 42.6 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"-3.6\" y=\"47.6\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"46.800000000000004\" y=\"17.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"46.800000000000004\" dy=\"10\">gate</tspan></text></svg>","NMos":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"97.4pt\" viewBox=\"-58.3 -18.2 97.4 96.39999999999999\"><path d=\"M -9.0,19.5 L -9,22.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,28.5 L -9,31.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,37.49999999999999 L -9,40.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,20.999999999999996 L 0,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,20.999999999999996 L 0,21\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,59.99999999999999 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,39.0 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -29.999999999999996,41.99999999999999 L -15,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -14.999999999999998,41.99999999999999 L -15,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -3.0000000000000004,29.999999999999996 L 0,30\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -7 30 L -3 27 L -3 33 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 0.0,29.999999999999996 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">drain</tspan></text><text x=\"-33.599999999999994\" y=\"31.999999999999993\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-33.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"3.6\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">source</tspan></text></svg>","PMos":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"97.4pt\" viewBox=\"-58.3 -18.2 97.4 96.39999999999999\"><path d=\"M -9.0,19.5 L -9,22.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,28.5 L -9,31.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,37.49999999999999 L -9,40.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,20.999999999999996 L 0,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,20.999999999999996 L 0,21\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,59.99999999999999 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,39.0 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -29.999999999999996,18.0 L -15,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -14.999999999999998,18.0 L -15,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,29.999999999999996 L -6,30\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -2 30 L -6 33 L -6 27 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 0.0,29.999999999999996 L 0,21\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">source</tspan></text><text x=\"-33.599999999999994\" y=\"8.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-33.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"3.6\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"3.6\" dy=\"10\">drain</tspan></text></svg>","NMos(diode=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"78.35pt\" viewBox=\"-58.3 -18.2 78.35 96.39999999999999\"><polygon points=\"9,27 6,33 12,33 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,19.5 L -9,22.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,28.5 L -9,31.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,37.49999999999999 L -9,40.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,20.999999999999996 L 0,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,20.999999999999996 L 0,21\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,59.99999999999999 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,39.0 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -29.999999999999996,41.99999999999999 L -15,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -14.999999999999998,41.99999999999999 L -15,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -3.0000000000000004,29.999999999999996 L 0,30\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -7 30 L -3 27 L -3 33 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 0.0,29.999999999999996 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,20.999999999999996 L 9,21\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 9.0,20.999999999999996 L 9,27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 6.0,27.0 L 12,27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 9.0,33.0 L 9,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 9.0,39.0 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"0.0\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"0.0\" dy=\"10\">drain</tspan></text><text x=\"-33.599999999999994\" y=\"31.999999999999993\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-33.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"0.0\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"0.0\" dy=\"10\">source</tspan></text></svg>","PMos(diode=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"78.35pt\" viewBox=\"-58.3 -18.2 78.35 96.39999999999999\"><polygon points=\"9,27 6,33 12,33 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,19.5 L -9,22.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,28.5 L -9,31.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,37.49999999999999 L -9,40.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,20.999999999999996 L 0,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,20.999999999999996 L 0,21\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,59.99999999999999 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,39.0 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -29.999999999999996,18.0 L -15,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -14.999999999999998,18.0 L -15,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,29.999999999999996 L -6,30\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -2 30 L -6 33 L -6 27 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 0.0,29.999999999999996 L 0,21\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,20.999999999999996 L 9,21\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 9.0,20.999999999999996 L 9,27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 6.0,27.0 L 12,27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 9.0,33.0 L 9,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 9.0,39.0 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"0.0\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"0.0\" dy=\"10\">source</tspan></text><text x=\"-33.599999999999994\" y=\"8.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-33.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"0.0\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"0.0\" dy=\"10\">drain</tspan></text></svg>","NMos(circle=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"80.9pt\" viewBox=\"-58.3 -18.2 80.9 96.39999999999999\"><circle cx=\"-3\" cy=\"30\" r=\"21\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M -9.0,19.5 L -9,22.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,28.5 L -9,31.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,37.49999999999999 L -9,40.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,20.999999999999996 L 0,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,20.999999999999996 L 0,21\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,59.99999999999999 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,39.0 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -29.999999999999996,41.99999999999999 L -15,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -14.999999999999998,41.99999999999999 L -15,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -3.0000000000000004,29.999999999999996 L 0,30\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -7 30 L -3 27 L -3 33 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 0.0,29.999999999999996 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"0.0\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"0.0\" dy=\"10\">drain</tspan></text><text x=\"-33.599999999999994\" y=\"31.999999999999993\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-33.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"0.0\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"0.0\" dy=\"10\">source</tspan></text></svg>","PMos(circle=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"80.9pt\" viewBox=\"-58.3 -18.2 80.9 96.39999999999999\"><circle cx=\"-3\" cy=\"30\" r=\"21\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M -9.0,19.5 L -9,22.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,28.5 L -9,31.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,37.49999999999999 L -9,40.5\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,20.999999999999996 L 0,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,20.999999999999996 L 0,21\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,59.99999999999999 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,39.0 L 0,39\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -29.999999999999996,18.0 L -15,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -14.999999999999998,18.0 L -15,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -9.0,29.999999999999996 L -6,30\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -2 30 L -6 33 L -6 27 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 0.0,29.999999999999996 L 0,21\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"0.0\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"0.0\" dy=\"10\">source</tspan></text><text x=\"-33.599999999999994\" y=\"8.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-33.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"0.0\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"0.0\" dy=\"10\">drain</tspan></text></svg>","AnalogNFet":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"100.39999999999999pt\" viewBox=\"-39.099999999999994 -18.2 100.39999999999999 96.39999999999999\"><path d=\"M 0.0,-0.0 L 0,15 L 15,15 L 15,45 L 0,45 L 0,60\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 14.999999999999998,45.0 L 9,45\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 2 45 L 9 40.5 L 9 49.5 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 17.999999999999996,17.999999999999996 L 18,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,42.0 L 33,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"36.599999999999994\" y=\"32.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"-3.6\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text></svg>","AnalogPFet":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"100.39999999999999pt\" viewBox=\"-39.099999999999994 -18.2 100.39999999999999 96.39999999999999\"><path d=\"M 0.0,-0.0 L 0,15 L 15,15 L 15,45 L 0,45 L 0,60\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,14.999999999999998 L 6,15\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13 15 L 6 19.5 L 6 10.5 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 17.999999999999996,17.999999999999996 L 18,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,17.999999999999996 L 33,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"36.599999999999994\" y=\"7.9999999999999964\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text></svg>","AnalogBiasedFet":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"100.39999999999999pt\" viewBox=\"-39.099999999999994 -18.2 100.39999999999999 96.39999999999999\"><circle cx=\"4.5\" cy=\"45\" r=\"2.25\" style=\"stroke:black;fill:black;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 0,15 L 15,15 L 15,45 L 0,45 L 0,60\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,17.999999999999996 L 18,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,42.0 L 33,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"36.599999999999994\" y=\"32.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"-3.6\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text></svg>","AnalogNFet(bulk=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"100.39999999999999pt\" viewBox=\"-39.099999999999994 -18.2 100.39999999999999 96.39999999999999\"><path d=\"M 0.0,-0.0 L 0,15 L 15,15 L 15,45 L 0,45 L 0,60\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,17.999999999999996 L 18,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,42.0 L 33,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,29.999999999999996 L 6,30\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13 30 L 6 34.5 L 6 25.5 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"36.599999999999994\" y=\"32.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"-3.6\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text><text x=\"-3.6\" y=\"19.999999999999996\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">bulk</tspan></text></svg>","AnalogPFet(bulk=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"100.39999999999999pt\" viewBox=\"-39.099999999999994 -18.2 100.39999999999999 96.39999999999999\"><path d=\"M 0.0,-0.0 L 0,15 L 15,15 L 15,45 L 0,45 L 0,60\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,17.999999999999996 L 18,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,17.999999999999996 L 33,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 14.999999999999998,29.999999999999996 L 9,30\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 2 30 L 9 25.5 L 9 34.5 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"36.599999999999994\" y=\"7.9999999999999964\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text><text x=\"-3.6\" y=\"19.999999999999996\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">bulk</tspan></text></svg>","AnalogBiasedFet(bluk=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"100.39999999999999pt\" viewBox=\"-39.099999999999994 -18.2 100.39999999999999 96.39999999999999\"><circle cx=\"4.5\" cy=\"45\" r=\"2.25\" style=\"stroke:black;fill:black;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 0,15 L 15,15 L 15,45 L 0,45 L 0,60\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,17.999999999999996 L 18,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,42.0 L 33,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"36.599999999999994\" y=\"32.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"-3.6\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text></svg>","AnalogBiasedFet(arrow=False)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"100.39999999999999pt\" viewBox=\"-39.099999999999994 -18.2 100.39999999999999 96.39999999999999\"><circle cx=\"4.5\" cy=\"45\" r=\"2.25\" style=\"stroke:black;fill:black;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 0,15 L 15,15 L 15,45 L 0,45 L 0,60\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,17.999999999999996 L 18,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,42.0 L 33,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"36.599999999999994\" y=\"32.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"-3.6\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text></svg>","AnalogPFet(arrow=False)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"100.39999999999999pt\" viewBox=\"-39.099999999999994 -18.2 100.39999999999999 96.39999999999999\"><path d=\"M 0.0,-0.0 L 0,15 L 15,15 L 15,45 L 0,45 L 0,60\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,14.999999999999998 L 6,15\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13 15 L 6 19.5 L 6 10.5 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 17.999999999999996,17.999999999999996 L 18,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,17.999999999999996 L 33,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"36.599999999999994\" y=\"7.9999999999999964\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text></svg>","AnalogNFet(offset_gate=False)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"100.39999999999999pt\" viewBox=\"-39.099999999999994 -18.2 100.39999999999999 96.39999999999999\"><path d=\"M 0.0,-0.0 L 0,15 L 15,15 L 15,45 L 0,45 L 0,60\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 14.999999999999998,45.0 L 9,45\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 2 45 L 9 40.5 L 9 49.5 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 17.999999999999996,17.999999999999996 L 18,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,29.999999999999996 L 33,30\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"36.599999999999994\" y=\"19.999999999999996\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"-3.6\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text></svg>","AnalogPFet(offset_gate=False)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"100.39999999999999pt\" viewBox=\"-39.099999999999994 -18.2 100.39999999999999 96.39999999999999\"><path d=\"M 0.0,-0.0 L 0,15 L 15,15 L 15,45 L 0,45 L 0,60\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,14.999999999999998 L 6,15\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 13 15 L 6 19.5 L 6 10.5 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 17.999999999999996,17.999999999999996 L 18,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,29.999999999999996 L 33,30\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"36.599999999999994\" y=\"19.999999999999996\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text></svg>","AnalogBiasedFet(offset_gate=False)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"100.39999999999999pt\" viewBox=\"-39.099999999999994 -18.2 100.39999999999999 96.39999999999999\"><circle cx=\"4.5\" cy=\"45\" r=\"2.25\" style=\"stroke:black;fill:black;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 0,15 L 15,15 L 15,45 L 0,45 L 0,60\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,17.999999999999996 L 18,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,29.999999999999996 L 33,30\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"36.599999999999994\" y=\"19.999999999999996\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"-3.6\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text></svg>","BjtNpn2":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"58.62pt\" width=\"117.2pt\" viewBox=\"-4.6 -46.81999999999999 117.2 58.62\"><path d=\"M 0.0,-0.0 L 34.2,-0 L 46.8,-15.12 L 61.2,-15.12 L 73.8,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 40.5,-15.12 L 67.5,-15.12\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,-15.12 L 54,-28.62\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 34.199999999999996,-0.0 L 41.038,-8.206\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 45.52 -13.584 L 43.804 -5.901 L 38.273 -10.511 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"54.0\" y=\"-42.22\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"10\">base</tspan></text></svg>","BjtPnp2":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"58.62pt\" width=\"117.2pt\" viewBox=\"-4.6 -46.81999999999999 117.2 58.62\"><path d=\"M 0.0,-0.0 L 34.2,-0 L 46.8,-15.12 L 61.2,-15.12 L 73.8,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 40.5,-15.12 L 67.5,-15.12\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,-15.12 L 54,-28.62\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 61.199999999999996,-15.12 L 68.038,-6.914\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 72.52 -1.536 L 65.273 -4.609 L 70.804 -9.219 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"54.0\" y=\"-42.22\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"10\">base</tspan></text></svg>","BjtPnp2c2":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"65.02pt\" width=\"117.2pt\" viewBox=\"-4.6 -46.81999999999999 117.2 65.02\"><path d=\"M 0.0,-0.0 L 34.2,-0 L 46.8,-15.12 L 61.2,-15.12 L 73.8,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 40.5,-15.12 L 67.5,-15.12\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,-15.12 L 54,-28.62\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 61.199999999999996,-15.12 L 68.038,-6.914\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 72.52 -1.536 L 65.273 -4.609 L 70.804 -9.219 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 43.199999999999996,-0.0 L 55.8,-15.12\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"54.0\" y=\"-42.22\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"10\">base</tspan></text><text x=\"43.199999999999996\" y=\"-6.4\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"43.199999999999996\" dy=\"10\">C2</tspan></text></svg>","NFet2":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"72.0pt\" width=\"117.2pt\" viewBox=\"-4.6 -67.4 117.2 72.0\"><path d=\"M 0.0,-0.0 L 27,-0 L 42,-0 L 42,-24 L 66,-24 L 66,-0 L 81,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 41.99999999999999,-29.999999999999996 L 66,-30\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,-29.999999999999996 L 54,-49.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"54.0\" y=\"-62.800000000000004\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"10\">gate</tspan></text></svg>","PFet2":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"72.0pt\" width=\"117.2pt\" viewBox=\"-4.6 -67.4 117.2 72.0\"><circle cx=\"54\" cy=\"-34.2\" r=\"4.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 27,-0 L 42,-0 L 42,-24 L 66,-24 L 66,-0 L 81,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 41.99999999999999,-29.999999999999996 L 66,-30\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,-38.4 L 54,-49.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"54.0\" y=\"-62.800000000000004\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"10\">gate</tspan></text></svg>","JFetN2":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"55.8pt\" width=\"117.2pt\" viewBox=\"-4.6 -51.199999999999996 117.2 55.8\"><path d=\"M 0.0,-0.0 L 30,-0 L 45,-0 L 45,-18 L 63,-18 L 63,-0 L 78,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 40.2,-18.0 L 67.8,-18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 63.0,-18.0 L 63,-33\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 63.0,-18.0 L 63,-19.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 63 -26.8 L 66.6 -19.8 L 59.4 -19.8 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"63.0\" y=\"-46.599999999999994\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"63.0\" dy=\"10\">gate</tspan></text></svg>","JFetP2":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"55.8pt\" width=\"117.2pt\" viewBox=\"-4.6 -51.199999999999996 117.2 55.8\"><path d=\"M 0.0,-0.0 L 30,-0 L 45,-0 L 45,-18 L 63,-18 L 63,-0 L 78,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 40.2,-18.0 L 67.8,-18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 63.0,-18.0 L 63,-33\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 63.0,-28.8 L 63,-27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 63 -20 L 59.4 -27 L 66.6 -27 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><text x=\"63.0\" y=\"-46.599999999999994\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"63.0\" dy=\"10\">gate</tspan></text></svg>","NMos2(diode=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"64.8pt\" width=\"117.2pt\" viewBox=\"-4.6 -16.599999999999998 117.2 64.8\"><polygon points=\"51,-9 57,-6 57,-12 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 24,-0 L 45,-0 L 45,9 M 63,9 L 63,-0 L 84,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 43.50000000000001,9.0 L 46.5,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 52.50000000000001,9.0 L 55.5,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 61.5,9.0 L 64.5,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 66.0,29.999999999999996 L 66,15\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 66.0,14.999999999999998 L 42,15\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,3.0000000000000004 L 54,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54 7 L 51 3 L 57 3 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 54.0,-0.0 L 63,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 45.0,-0.0 L 45,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 45.0,-9.0 L 51,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 51.0,-6.0 L 51,-12\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 57.00000000000001,-9.0 L 63,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 63.0,-9.0 L 63,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"24.000000000000004\" y=\"-13.6\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"24.000000000000004\" dy=\"10\">drain</tspan></text><text x=\"66.0\" y=\"23.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"66.0\" dy=\"10\">gate</tspan></text><text x=\"83.99999999999999\" y=\"-13.6\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"83.99999999999999\" dy=\"10\">source</tspan></text></svg>","PMos2(diode=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"64.8pt\" width=\"117.2pt\" viewBox=\"-4.6 -16.599999999999998 117.2 64.8\"><polygon points=\"51,-9 57,-6 57,-12 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 24,-0 L 45,-0 L 45,9 M 63,9 L 63,-0 L 84,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 43.50000000000001,9.0 L 46.5,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 52.50000000000001,9.0 L 55.5,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 61.5,9.0 L 64.5,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 42.0,29.999999999999996 L 42,15\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 42.0,14.999999999999998 L 66,15\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,9.0 L 54,6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54 2 L 57 6 L 51 6 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 54.0,-0.0 L 45,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 45.0,-0.0 L 45,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 45.0,-9.0 L 51,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 51.0,-6.0 L 51,-12\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 57.00000000000001,-9.0 L 63,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 63.0,-9.0 L 63,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"24.000000000000004\" y=\"-13.6\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"24.000000000000004\" dy=\"10\">source</tspan></text><text x=\"42.0\" y=\"23.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"42.0\" dy=\"10\">gate</tspan></text><text x=\"83.99999999999999\" y=\"-13.6\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"83.99999999999999\" dy=\"10\">drain</tspan></text></svg>","NMos2(circle=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"70.8pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 70.8\"><circle cx=\"54\" cy=\"3\" r=\"21\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 24,-0 L 45,-0 L 45,9 M 63,9 L 63,-0 L 84,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 43.50000000000001,9.0 L 46.5,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 52.50000000000001,9.0 L 55.5,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 61.5,9.0 L 64.5,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 66.0,29.999999999999996 L 66,15\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 66.0,14.999999999999998 L 42,15\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,3.0000000000000004 L 54,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54 7 L 51 3 L 57 3 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 54.0,-0.0 L 63,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"24.000000000000004\" y=\"-13.6\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"24.000000000000004\" dy=\"10\">drain</tspan></text><text x=\"66.0\" y=\"23.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"66.0\" dy=\"10\">gate</tspan></text><text x=\"83.99999999999999\" y=\"-13.6\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"83.99999999999999\" dy=\"10\">source</tspan></text></svg>","PMos2(circle=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"70.8pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 70.8\"><circle cx=\"54\" cy=\"3\" r=\"21\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 24,-0 L 45,-0 L 45,9 M 63,9 L 63,-0 L 84,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 43.50000000000001,9.0 L 46.5,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 52.50000000000001,9.0 L 55.5,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 61.5,9.0 L 64.5,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 42.0,29.999999999999996 L 42,15\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 42.0,14.999999999999998 L 66,15\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,9.0 L 54,6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54 2 L 57 6 L 51 6 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 54.0,-0.0 L 45,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"24.000000000000004\" y=\"-13.6\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"24.000000000000004\" dy=\"10\">source</tspan></text><text x=\"42.0\" y=\"23.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"42.0\" dy=\"10\">gate</tspan></text><text x=\"83.99999999999999\" y=\"-13.6\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"83.99999999999999\" dy=\"10\">drain</tspan></text></svg>","Line":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"9.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -4.6 117.2 9.2\"><path d=\"M 0.0,-0.0 L 54,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Arrow":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"20.0pt\" width=\"117.2pt\" viewBox=\"-4.6 -10.0 117.2 20.0\"><path d=\"M 0.0,-0.0 L 54,-0 L 99,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 106 0 L 99 2.7 L 99 -2.7 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","Arrow(double=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"20.0pt\" width=\"117.2pt\" viewBox=\"-4.6 -10.0 117.2 20.0\"><path d=\"M 9.0,-0.0 L 54,-0 L 99,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 2 0 L 9 -2.7 L 9 2.7 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 106 0 L 99 2.7 L 99 -2.7 Z\" style=\"stroke:black;fill:black;stroke-linecap:butt;stroke-linejoin:miter;\" /></svg>","DataBusLine":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"27.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -13.6 117.2 27.2\"><path d=\"M 0.0,-0.0 L 54,-0 M 49.5,-9 L 58.5,9 M 54,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Ic (HC7476 J-K flip flop)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"132.8pt\" width=\"135.2pt\" viewBox=\"-22.6 -112.6 135.2 132.8\"><path d=\"M 0.0,-0.0 L 90,-0 L 90,-108 L 0,-108 L 0,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-18.0 L -18,-18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-24.3 L 12.6,-18 L 0,-11.7\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-54.0 L -18,-54\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-90.0 L -18,-90\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 90.0,-36.0 L 108,-36\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 90.0,-72.0 L 108,-72\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-2.6999999999999997\" y=\"-31.7\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-2.6999999999999997\" dy=\"11\">1</tspan></text><text x=\"-2.6999999999999997\" y=\"-67.69999999999999\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-2.6999999999999997\" dy=\"11\">16</tspan></text><text x=\"5.3999999999999995\" y=\"-68.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"5.3999999999999995\" dy=\"14\">K</tspan></text><text x=\"-2.6999999999999997\" y=\"-103.7\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-2.6999999999999997\" dy=\"11\">4</tspan></text><text x=\"5.3999999999999995\" y=\"-104.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"5.3999999999999995\" dy=\"14\">J</tspan></text><text x=\"92.7\" y=\"-49.699999999999996\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"92.7\" dy=\"11\">14</tspan></text><text x=\"84.60000000000001\" y=\"-50.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"84.60000000000001\" dy=\"14\"><tspan text-decoration=\"overline\">Q</tspan></tspan></text><text x=\"92.7\" y=\"-85.7\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"92.7\" dy=\"11\">15</tspan></text><text x=\"84.60000000000001\" y=\"-86.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"84.60000000000001\" dy=\"14\">Q</tspan></text><text x=\"45.0\" y=\"-8.4\" dominant-baseline=\"hanging\" fill=\"black\" font-size=\"12\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"45.0\" dy=\"12\">HC7476</tspan></text></svg>","Multiplexer":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"147.13537846789976pt\" width=\"135.2pt\" viewBox=\"-22.6 -100.56768923394988 135.2 147.13537846789976\"><circle cx=\"45\" cy=\"26.384\" r=\"5.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,41.967689233949876 L 90,-0 L 90,-54 L 0,-95.968 L 0,41.968\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-5.4 L -18,-5.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-27.0 L -18,-27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-48.6 L -18,-48.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 90.0,-27.0 L 108,-27\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 45.0,31.783844616974942 L 45,38.984\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"5.3999999999999995\" y=\"-19.4\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"5.3999999999999995\" dy=\"14\">C</tspan></text><text x=\"5.3999999999999995\" y=\"-41.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"5.3999999999999995\" dy=\"14\">B</tspan></text><text x=\"5.3999999999999995\" y=\"-62.6\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"5.3999999999999995\" dy=\"14\">A</tspan></text><text x=\"84.60000000000001\" y=\"-41.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"84.60000000000001\" dy=\"14\">Q</tspan></text><text x=\"45.0\" y=\"1.583844616974945\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"45.0\" dy=\"14\">T</tspan></text></svg>","SevenSegment":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"200.0pt\" width=\"135.2pt\" viewBox=\"-22.6 -195.39999999999998 135.2 200.0\"><polygon points=\"40.337,-149.4 46.675,-154.8 85.555,-154.8 90.017,-149.4 83.679,-144 44.799,-144 \" style=\"stroke:gray;fill:red;stroke-width:0.5;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"83.175,-97.56 89.513,-102.96 96.264,-141.84 91.802,-147.24 85.464,-141.84 78.713,-102.96 \" style=\"stroke:gray;fill:red;stroke-width:0.5;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"73.798,-43.56 80.136,-48.96 86.887,-87.84 82.425,-93.24 76.087,-87.84 69.336,-48.96 \" style=\"stroke:gray;fill:red;stroke-width:0.5;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"21.583,-41.4 27.921,-46.8 66.801,-46.8 71.263,-41.4 64.925,-36 26.045,-36 \" style=\"stroke:gray;fill:red;stroke-width:0.5;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"19.798,-43.56 26.136,-48.96 32.887,-87.84 28.425,-93.24 22.087,-87.84 15.336,-48.96 \" style=\"stroke:gray;fill:red;stroke-width:0.5;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"29.175,-97.56 35.513,-102.96 42.264,-141.84 37.802,-147.24 31.464,-141.84 24.713,-102.96 \" style=\"stroke:gray;fill:red;stroke-width:0.5;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"30.96,-95.4 37.298,-100.8 76.178,-100.8 80.64,-95.4 74.302,-90 35.422,-90 \" style=\"stroke:gray;fill:red;stroke-width:0.5;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 108,-0 L 108,-190.8 L 0,-190.8 L 0,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-160.2 L -18,-160.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-138.6 L -18,-138.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-117.0 L -18,-117\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-95.39999999999999 L -18,-95.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-73.8 L -18,-73.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-52.2 L -18,-52.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-30.6 L -18,-30.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"68.64978181717623\" y=\"-166.95999999999998\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"68.64978181717623\" dy=\"10\">a</tspan></text><text x=\"59.272780223161995\" y=\"-112.96\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"59.272780223161995\" dy=\"10\">g</tspan></text><text x=\"49.895778629147756\" y=\"-58.959999999999994\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"49.895778629147756\" dy=\"10\">d</tspan></text><text x=\"95.04850079700711\" y=\"-132.39999999999998\" dominant-baseline=\"central\" fill=\"black\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"95.04850079700711\" dy=\"10\">b</tspan></text><text x=\"85.67149920299288\" y=\"-78.39999999999999\" dominant-baseline=\"central\" fill=\"black\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"85.67149920299288\" dy=\"10\">c</tspan></text><text x=\"16.55149920299288\" y=\"-78.39999999999999\" dominant-baseline=\"central\" fill=\"black\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"16.55149920299288\" dy=\"10\">e</tspan></text><text x=\"25.928500797007118\" y=\"-132.39999999999998\" dominant-baseline=\"central\" fill=\"black\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"25.928500797007118\" dy=\"10\">f</tspan></text><text x=\"-2.6999999999999997\" y=\"-173.89999999999998\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-2.6999999999999997\" dy=\"11\">a</tspan></text><text x=\"-2.6999999999999997\" y=\"-152.3\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-2.6999999999999997\" dy=\"11\">b</tspan></text><text x=\"-2.6999999999999997\" y=\"-130.7\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-2.6999999999999997\" dy=\"11\">c</tspan></text><text x=\"-2.6999999999999997\" y=\"-109.10000000000001\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-2.6999999999999997\" dy=\"11\">d</tspan></text><text x=\"-2.6999999999999997\" y=\"-87.5\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-2.6999999999999997\" dy=\"11\">e</tspan></text><text x=\"-2.6999999999999997\" y=\"-65.9\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-2.6999999999999997\" dy=\"11\">f</tspan></text><text x=\"-2.6999999999999997\" y=\"-44.300000000000004\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-2.6999999999999997\" dy=\"11\">g</tspan></text></svg>","IcDIP":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"185.60000000000005pt\" width=\"160.4pt\" viewBox=\"-26.2 -181.00000000000003 160.4 185.60000000000005\"><polygon points=\"0,-0 108,-0 108,-176.4 0,-176.4 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"0,-18 0,-39.6 -21.6,-39.6 -21.6,-18 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"108,-18 108,-39.6 129.6,-39.6 129.6,-18 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"0,-57.6 0,-79.2 -21.6,-79.2 -21.6,-57.6 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"108,-57.6 108,-79.2 129.6,-79.2 129.6,-57.6 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"0,-97.2 0,-118.8 -21.6,-118.8 -21.6,-97.2 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"108,-97.2 108,-118.8 129.6,-118.8 129.6,-97.2 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"0,-136.8 0,-158.4 -21.6,-158.4 -21.6,-136.8 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"108,-136.8 108,-158.4 129.6,-158.4 129.6,-136.8 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 43.199999999999996,-176.4 L 43.222,-175.708 L 43.289,-175.019 L 43.399,-174.335 L 43.553,-173.661 L 43.75,-172.997 L 43.989,-172.347 L 44.27,-171.714 L 44.59,-171.1 L 44.949,-170.508 L 45.345,-169.94 L 45.776,-169.399 L 46.242,-168.887 L 46.739,-168.405 L 47.266,-167.956 L 47.821,-167.542 L 48.401,-167.164 L 49.005,-166.825 L 49.628,-166.524 L 50.27,-166.265 L 50.927,-166.046 L 51.597,-165.871 L 52.276,-165.738 L 52.963,-165.65 L 53.654,-165.606 L 54.346,-165.606 L 55.037,-165.65 L 55.724,-165.738 L 56.403,-165.871 L 57.073,-166.046 L 57.73,-166.265 L 58.372,-166.524 L 58.995,-166.825 L 59.599,-167.164 L 60.179,-167.542 L 60.734,-167.956 L 61.261,-168.405 L 61.758,-168.887 L 62.224,-169.399 L 62.655,-169.94 L 63.051,-170.508 L 63.41,-171.1 L 63.73,-171.714 L 64.011,-172.347 L 64.25,-172.997 L 64.447,-173.661 L 64.601,-174.335 L 64.711,-175.019 L 64.778,-175.708 L 64.8,-176.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-10.799999999999999\" y=\"-38.8\" dominant-baseline=\"central\" fill=\"black\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"-10.799999999999999\" dy=\"10\">4</tspan></text><text x=\"118.8\" y=\"-38.8\" dominant-baseline=\"central\" fill=\"black\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"118.8\" dy=\"10\">5</tspan></text><text x=\"-10.799999999999999\" y=\"-78.4\" dominant-baseline=\"central\" fill=\"black\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"-10.799999999999999\" dy=\"10\">3</tspan></text><text x=\"118.8\" y=\"-78.4\" dominant-baseline=\"central\" fill=\"black\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"118.8\" dy=\"10\">6</tspan></text><text x=\"-10.799999999999999\" y=\"-118.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"-10.799999999999999\" dy=\"10\">2</tspan></text><text x=\"118.8\" y=\"-118.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"118.8\" dy=\"10\">7</tspan></text><text x=\"-10.799999999999999\" y=\"-157.6\" dominant-baseline=\"central\" fill=\"black\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"-10.799999999999999\" dy=\"10\">1</tspan></text><text x=\"118.8\" y=\"-157.6\" dominant-baseline=\"central\" fill=\"black\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"118.8\" dy=\"10\">8</tspan></text></svg>","VoltageRegulator":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"81.2pt\" width=\"117.2pt\" viewBox=\"-22.6 -58.6 117.2 81.2\"><path d=\"M 0.0,-0.0 L 72,-0 L 72,-54 L 0,-54 L 0,-0\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-36.0 L -18,-36\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 72.0,-36.0 L 90,-36\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 36.0,-0.0 L 36,18\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"5.3999999999999995\" y=\"-50.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"5.3999999999999995\" dy=\"14\">in</tspan></text><text x=\"66.60000000000001\" y=\"-50.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"66.60000000000001\" dy=\"14\">out</tspan></text><text x=\"36.0\" y=\"-19.4\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"36.0\" dy=\"14\">gnd</tspan></text></svg>","DFlipFlop":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"117.2pt\" width=\"166.94pt\" viewBox=\"-45.339999999999996 -112.6 166.94 117.2\"><path d=\"M 0.0,-0.0 L 72,-0 L 72,-108 L 0,-108 L 0,-0\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-90.0 L -18,-90\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-18.0 L -18,-18\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-24.3 L 12.6,-18 L 0,-11.7\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 72.0,-90.0 L 90,-90\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 72.0,-18.0 L 90,-18\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"5.3999999999999995\" y=\"-104.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"5.3999999999999995\" dy=\"14\">D</tspan></text><text x=\"66.60000000000001\" y=\"-104.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"66.60000000000001\" dy=\"14\">Q</tspan></text><text x=\"66.60000000000001\" y=\"-32.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"66.60000000000001\" dy=\"14\"><tspan text-decoration=\"overline\">Q</tspan></tspan></text><text x=\"-21.599999999999998\" y=\"-100.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-21.599999999999998\" dy=\"10\">D</tspan></text><text x=\"93.60000000000001\" y=\"-100.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"93.60000000000001\" dy=\"10\">Q</tspan></text><text x=\"93.60000000000001\" y=\"-28.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"93.60000000000001\" dy=\"10\">Qbar</tspan></text><text x=\"-21.599999999999998\" y=\"-28.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-21.599999999999998\" dy=\"10\">CLK</tspan></text></svg>","JKFlipFlop":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"117.2pt\" width=\"166.94pt\" viewBox=\"-45.339999999999996 -112.6 166.94 117.2\"><path d=\"M 0.0,-0.0 L 72,-0 L 72,-108 L 0,-108 L 0,-0\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-90.0 L -18,-90\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-54.0 L -18,-54\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-60.300000000000004 L 12.6,-54 L 0,-47.7\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-18.0 L -18,-18\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 72.0,-90.0 L 90,-90\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 72.0,-18.0 L 90,-18\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"5.3999999999999995\" y=\"-104.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"5.3999999999999995\" dy=\"14\">J</tspan></text><text x=\"5.3999999999999995\" y=\"-32.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"5.3999999999999995\" dy=\"14\">K</tspan></text><text x=\"66.60000000000001\" y=\"-104.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"66.60000000000001\" dy=\"14\">Q</tspan></text><text x=\"66.60000000000001\" y=\"-32.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"66.60000000000001\" dy=\"14\"><tspan text-decoration=\"overline\">Q</tspan></tspan></text><text x=\"-21.599999999999998\" y=\"-100.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-21.599999999999998\" dy=\"10\">J</tspan></text><text x=\"-21.599999999999998\" y=\"-28.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-21.599999999999998\" dy=\"10\">K</tspan></text><text x=\"93.60000000000001\" y=\"-100.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"93.60000000000001\" dy=\"10\">Q</tspan></text><text x=\"93.60000000000001\" y=\"-28.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"93.60000000000001\" dy=\"10\">Qbar</tspan></text><text x=\"-21.599999999999998\" y=\"-64.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-21.599999999999998\" dy=\"10\">CLK</tspan></text></svg>","Ic555":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"288.3999999999999pt\" width=\"256.03999999999996pt\" viewBox=\"-65.02000000000001 -234.19999999999996 256.03999999999996 288.3999999999999\"><path d=\"M 0.0,-0.0 L 126,-0 L 126,-180 L 0,-180 L 0,-0\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-36.0 L -36,-36\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-90.0 L -36,-90\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-144.0 L -36,-144\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 126.0,-63.0 L 162,-63\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 126.0,-117.0 L 162,-117\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 36.0,-180.0 L 36,-216\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 90.0,-180.0 L 90,-216\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 63.0,-0.0 L 63,36\" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-2.6999999999999997\" y=\"-49.699999999999996\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-2.6999999999999997\" dy=\"11\">2</tspan></text><text x=\"5.3999999999999995\" y=\"-50.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"5.3999999999999995\" dy=\"14\">TRG</tspan></text><text x=\"-2.6999999999999997\" y=\"-103.7\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-2.6999999999999997\" dy=\"11\">6</tspan></text><text x=\"5.3999999999999995\" y=\"-104.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"5.3999999999999995\" dy=\"14\">THR</tspan></text><text x=\"-2.6999999999999997\" y=\"-157.70000000000002\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-2.6999999999999997\" dy=\"11\">7</tspan></text><text x=\"5.3999999999999995\" y=\"-158.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"5.3999999999999995\" dy=\"14\">DIS</tspan></text><text x=\"128.70000000000002\" y=\"-76.7\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"128.70000000000002\" dy=\"11\">5</tspan></text><text x=\"120.60000000000001\" y=\"-77.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"120.60000000000001\" dy=\"14\">CTL</tspan></text><text x=\"128.70000000000002\" y=\"-130.7\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"128.70000000000002\" dy=\"11\">3</tspan></text><text x=\"120.60000000000001\" y=\"-131.0\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"120.60000000000001\" dy=\"14\">OUT</tspan></text><text x=\"38.699999999999996\" y=\"-193.70000000000002\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"38.699999999999996\" dy=\"11\">4</tspan></text><text x=\"36.0\" y=\"-188.6\" dominant-baseline=\"hanging\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"36.0\" dy=\"14\">RST</tspan></text><text x=\"92.7\" y=\"-193.70000000000002\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"92.7\" dy=\"11\">8</tspan></text><text x=\"90.0\" y=\"-188.6\" dominant-baseline=\"hanging\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"90.0\" dy=\"14\">Vcc</tspan></text><text x=\"65.7\" y=\"-8.3\" dominant-baseline=\"hanging\" fill=\"black\" font-size=\"11\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"65.7\" dy=\"11\">1</tspan></text><text x=\"63.0\" y=\"-19.4\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"14\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"63.0\" dy=\"14\">GND</tspan></text><text x=\"36.0\" y=\"-229.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"36.0\" dy=\"10\">RST</tspan></text><text x=\"-39.6\" y=\"-154.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-39.6\" dy=\"10\">DIS</tspan></text><text x=\"90.0\" y=\"-229.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"90.0\" dy=\"10\">Vcc</tspan></text><text x=\"-39.6\" y=\"-100.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-39.6\" dy=\"10\">THR</tspan></text><text x=\"-39.6\" y=\"-46.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-39.6\" dy=\"10\">TRG</tspan></text><text x=\"165.6\" y=\"-73.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"165.6\" dy=\"10\">CTL</tspan></text><text x=\"165.6\" y=\"-127.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"165.6\" dy=\"10\">OUT</tspan></text><text x=\"63.0\" y=\"29.6\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"63.0\" dy=\"10\">GND</tspan></text><text x=\"66.60000000000001\" y=\"-107.60000000000001\" dominant-baseline=\"central\" fill=\"black\" font-size=\"14.0\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"66.60000000000001\" dy=\"14.0\">555</tspan></text></svg>","Header":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"95.6pt\" width=\"30.799999999999997pt\" viewBox=\"-4.6 -91.0 30.799999999999997 95.6\"><polygon points=\"0,-0 0,-86.4 21.6,-86.4 21.6,-0 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"10.8\" cy=\"-75.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-54\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-32.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-10.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","Header(shownumber=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"95.6pt\" width=\"37.73pt\" viewBox=\"-11.53 -91.0 37.73 95.6\"><polygon points=\"0,-0 0,-86.4 21.6,-86.4 21.6,-0 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-1.8\" y=\"-84.60000000000001\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-1.8\" dy=\"9\">1</tspan></text><text x=\"-1.8\" y=\"-62.99999999999999\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-1.8\" dy=\"9\">2</tspan></text><text x=\"-1.8\" y=\"-41.4\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-1.8\" dy=\"9\">3</tspan></text><text x=\"-1.8\" y=\"-19.800000000000004\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-1.8\" dy=\"9\">4</tspan></text><circle cx=\"10.8\" cy=\"-75.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-54\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-32.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-10.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","Header(rows=3, cols=2)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"74.0pt\" width=\"52.4pt\" viewBox=\"-4.6 -69.39999999999999 52.4 74.0\"><polygon points=\"0,-0 0,-64.8 43.2,-64.8 43.2,-0 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"10.8\" cy=\"-54\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-54\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-32.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-32.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-10.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-10.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","Header(style='square')":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"95.6pt\" width=\"30.799999999999997pt\" viewBox=\"-4.6 -91.0 30.799999999999997 95.6\"><polygon points=\"0,-0 0,-86.4 21.6,-86.4 21.6,-0 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"7.2,-72 14.4,-72 14.4,-79.2 7.2,-79.2 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"7.2,-50.4 14.4,-50.4 14.4,-57.6 7.2,-57.6 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"7.2,-28.8 14.4,-28.8 14.4,-36 7.2,-36 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"7.2,-7.2 14.4,-7.2 14.4,-14.4 7.2,-14.4 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Header(style='screw')":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"95.6pt\" width=\"30.799999999999997pt\" viewBox=\"-4.6 -91.0 30.799999999999997 95.6\"><polygon points=\"0,-0 0,-86.4 21.6,-86.4 21.6,-0 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"10.8\" cy=\"-75.6\" r=\"6.3\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-54\" r=\"6.3\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-32.4\" r=\"6.3\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-10.8\" r=\"6.3\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 14.4,-79.2 L 7.2,-72\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 14.4,-57.599999999999994 L 7.2,-50.4\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 14.4,-35.99999999999999 L 7.2,-28.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 14.4,-14.400000000000006 L 7.2,-7.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Header(pinsleft=['A','B','C','D'])":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"95.6pt\" width=\"38.648pt\" viewBox=\"-12.447999999999999 -91.0 38.648 95.6\"><polygon points=\"0,-0 0,-86.4 21.6,-86.4 21.6,-0 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"-1.8\" y=\"-84.60000000000001\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-1.8\" dy=\"9\">A</tspan></text><text x=\"-1.8\" y=\"-62.99999999999999\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-1.8\" dy=\"9\">B</tspan></text><text x=\"-1.8\" y=\"-41.4\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-1.8\" dy=\"9\">C</tspan></text><text x=\"-1.8\" y=\"-19.800000000000004\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-1.8\" dy=\"9\">D</tspan></text><circle cx=\"10.8\" cy=\"-75.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-54\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-32.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-10.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","Jumper":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"95.6pt\" width=\"52.4pt\" viewBox=\"-4.6 -91.0 52.4 95.6\"><polygon points=\"0,-0 0,-86.4 43.2,-86.4 43.2,-0 \" style=\"stroke:black;fill:none;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"1.8,-45 41.4,-45 41.4,-63 1.8,-63 \" style=\"stroke:black;fill:lightgray;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"7.2,-72 14.4,-72 14.4,-79.2 7.2,-79.2 \" style=\"stroke:black;fill:white;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"28.8,-72 36,-72 36,-79.2 28.8,-79.2 \" style=\"stroke:black;fill:white;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"7.2,-50.4 14.4,-50.4 14.4,-57.6 7.2,-57.6 \" style=\"stroke:black;fill:white;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"28.8,-50.4 36,-50.4 36,-57.6 28.8,-57.6 \" style=\"stroke:black;fill:white;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"7.2,-28.8 14.4,-28.8 14.4,-36 7.2,-36 \" style=\"stroke:black;fill:white;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"28.8,-28.8 36,-28.8 36,-36 28.8,-36 \" style=\"stroke:black;fill:white;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"7.2,-7.2 14.4,-7.2 14.4,-14.4 7.2,-14.4 \" style=\"stroke:black;fill:white;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"28.8,-7.2 36,-7.2 36,-14.4 28.8,-14.4 \" style=\"stroke:black;fill:white;stroke-width:2.0;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","DE9":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"153.2pt\" width=\"52.4pt\" viewBox=\"-4.6 -130.6 52.4 153.2\"><polygon points=\"43.2,-112.5 43.198,-112.679 43.193,-112.857 43.184,-113.036 43.172,-113.214 43.156,-113.392 43.136,-113.57 43.113,-113.747 43.087,-113.924 43.057,-114.1 43.023,-114.275 42.986,-114.45 42.946,-114.624 42.902,-114.797 42.855,-114.97 42.804,-115.141 42.75,-115.311 42.692,-115.48 42.631,-115.648 42.567,-115.815 42.5,-115.981 42.429,-116.145 42.355,-116.307 42.278,-116.469 42.197,-116.628 42.114,-116.786 42.027,-116.942 41.938,-117.097 41.845,-117.25 41.749,-117.4 41.65,-117.549 41.548,-117.696 41.444,-117.841 41.336,-117.984 41.226,-118.124 41.113,-118.263 40.997,-118.399 40.879,-118.533 40.758,-118.664 40.634,-118.793 40.508,-118.92 40.379,-119.044 40.248,-119.165 40.115,-119.284 39.979,-119.4 39.841,-119.513 39.7,-119.624 39.558,-119.732 39.413,-119.836 39.266,-119.939 39.118,-120.038 38.967,-120.134 38.815,-120.227 38.66,-120.317 38.504,-120.404 38.346,-120.488 38.187,-120.569 38.026,-120.646 37.864,-120.721 37.7,-120.792 37.534,-120.86 37.368,-120.924 37.2,-120.985 37.031,-121.043 36.861,-121.098 36.689,-121.149 36.517,-121.197 36.344,-121.241 36.17,-121.282 35.995,-121.319 35.82,-121.353 35.644,-121.383 35.467,-121.41 35.29,-121.434 35.113,-121.454 34.935,-121.47 34.756,-121.483 34.578,-121.492 34.399,-121.498 34.221,-121.5 34.042,-121.499 33.863,-121.494 33.685,-121.485 33.507,-121.473 33.329,-121.458 33.151,-121.439 32.974,-121.416 32.797,-121.39 32.621,-121.36 32.445,-121.327 32.27,-121.291 32.096,-121.251 31.923,-121.207 31.75,-121.16 31.579,-121.11 31.408,-121.056 31.239,-120.999 31.071,-120.939 30.904,-120.875 30.738,-120.808 5.538,-110.308 5.44,-110.266 5.342,-110.223 5.245,-110.179 5.148,-110.134 5.051,-110.088 4.956,-110.04 4.86,-109.991 4.766,-109.942 4.672,-109.891 4.578,-109.839 4.486,-109.786 4.393,-109.732 4.302,-109.676 4.211,-109.62 4.121,-109.563 4.031,-109.504 3.943,-109.445 3.854,-109.384 3.767,-109.322 3.68,-109.26 3.595,-109.196 3.51,-109.131 3.425,-109.066 3.342,-108.999 3.259,-108.931 3.177,-108.862 3.096,-108.793 3.016,-108.722 2.936,-108.651 2.858,-108.578 2.78,-108.505 2.703,-108.43 2.627,-108.355 2.552,-108.279 2.478,-108.202 2.405,-108.124 2.333,-108.045 2.261,-107.966 2.191,-107.885 2.121,-107.804 2.053,-107.722 1.985,-107.639 1.919,-107.555 1.853,-107.471 1.789,-107.385 1.726,-107.299 1.663,-107.212 1.602,-107.125 1.541,-107.037 1.482,-106.948 1.424,-106.858 1.367,-106.768 1.311,-106.677 1.256,-106.585 1.202,-106.493 1.149,-106.4 1.097,-106.306 1.046,-106.212 0.997,-106.117 0.949,-106.022 0.901,-105.926 0.855,-105.83 0.81,-105.733 0.767,-105.635 0.724,-105.537 0.683,-105.438 0.642,-105.339 0.603,-105.24 0.565,-105.14 0.529,-105.039 0.493,-104.939 0.459,-104.837 0.426,-104.736 0.394,-104.634 0.363,-104.531 0.334,-104.428 0.306,-104.325 0.279,-104.222 0.253,-104.118 0.228,-104.014 0.205,-103.91 0.183,-103.805 0.162,-103.7 0.142,-103.595 0.124,-103.49 0.107,-103.384 0.091,-103.279 0.077,-103.173 0.063,-103.067 0.051,-102.96 0.041,-102.854 0.031,-102.748 0.023,-102.641 0.016,-102.534 0.01,-102.427 0.006,-102.321 0.003,-102.214 0.001,-102.107 0,-102 0,-6 0.001,-5.893 0.003,-5.786 0.006,-5.679 0.01,-5.573 0.016,-5.466 0.023,-5.359 0.031,-5.252 0.041,-5.146 0.051,-5.04 0.063,-4.933 0.077,-4.827 0.091,-4.721 0.107,-4.616 0.124,-4.51 0.142,-4.405 0.162,-4.3 0.183,-4.195 0.205,-4.09 0.228,-3.986 0.253,-3.882 0.279,-3.778 0.306,-3.675 0.334,-3.572 0.363,-3.469 0.394,-3.366 0.426,-3.264 0.459,-3.163 0.493,-3.061 0.529,-2.961 0.565,-2.86 0.603,-2.76 0.642,-2.661 0.683,-2.562 0.724,-2.463 0.767,-2.365 0.81,-2.267 0.855,-2.17 0.901,-2.074 0.949,-1.978 0.997,-1.883 1.046,-1.788 1.097,-1.694 1.149,-1.6 1.202,-1.507 1.256,-1.415 1.311,-1.323 1.367,-1.232 1.424,-1.142 1.482,-1.052 1.541,-0.963 1.602,-0.875 1.663,-0.788 1.726,-0.701 1.789,-0.615 1.853,-0.529 1.919,-0.445 1.985,-0.361 2.053,-0.278 2.121,-0.196 2.191,-0.115 2.261,-0.034 2.333,0.045 2.405,0.124 2.478,0.202 2.552,0.279 2.627,0.355 2.703,0.43 2.78,0.505 2.858,0.578 2.936,0.651 3.016,0.722 3.096,0.793 3.177,0.862 3.259,0.931 3.342,0.999 3.425,1.066 3.51,1.131 3.595,1.196 3.68,1.26 3.767,1.322 3.854,1.384 3.943,1.445 4.031,1.504 4.121,1.563 4.211,1.62 4.302,1.676 4.393,1.732 4.486,1.786 4.578,1.839 4.672,1.891 4.766,1.942 4.86,1.991 4.956,2.04 5.051,2.088 5.148,2.134 5.245,2.179 5.342,2.223 5.44,2.266 5.538,2.308 30.738,12.808 30.904,12.875 31.071,12.939 31.239,12.999 31.408,13.056 31.579,13.11 31.75,13.16 31.923,13.207 32.096,13.251 32.27,13.291 32.445,13.327 32.621,13.36 32.797,13.39 32.974,13.416 33.151,13.439 33.329,13.458 33.507,13.473 33.685,13.485 33.863,13.494 34.042,13.499 34.221,13.5 34.399,13.498 34.578,13.492 34.756,13.483 34.935,13.47 35.113,13.454 35.29,13.434 35.467,13.41 35.644,13.383 35.82,13.353 35.995,13.319 36.17,13.282 36.344,13.241 36.517,13.197 36.689,13.149 36.861,13.098 37.031,13.043 37.2,12.985 37.368,12.924 37.534,12.86 37.7,12.792 37.864,12.721 38.026,12.646 38.187,12.569 38.346,12.488 38.504,12.404 38.66,12.317 38.815,12.227 38.967,12.134 39.118,12.038 39.266,11.939 39.413,11.836 39.558,11.732 39.7,11.624 39.841,11.513 39.979,11.4 40.115,11.284 40.248,11.165 40.379,11.044 40.508,10.92 40.634,10.793 40.758,10.664 40.879,10.533 40.997,10.399 41.113,10.263 41.226,10.124 41.336,9.984 41.444,9.841 41.548,9.696 41.65,9.549 41.749,9.4 41.845,9.25 41.938,9.097 42.027,8.942 42.114,8.786 42.197,8.628 42.278,8.469 42.355,8.307 42.429,8.145 42.5,7.981 42.567,7.815 42.631,7.648 42.692,7.48 42.75,7.311 42.804,7.141 42.855,6.97 42.902,6.797 42.946,6.624 42.986,6.45 43.023,6.275 43.057,6.1 43.087,5.924 43.113,5.747 43.136,5.57 43.156,5.392 43.172,5.214 43.184,5.036 43.193,4.857 43.198,4.679 43.2,4.5 43.2,-112.5 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"10.8\" cy=\"-86.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-64.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-43.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-21.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-99\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-77.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-55.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-34.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-12.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","DE9(number=True)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"153.2pt\" width=\"52.4pt\" viewBox=\"-4.6 -130.6 52.4 153.2\"><polygon points=\"43.2,-112.5 43.198,-112.679 43.193,-112.857 43.184,-113.036 43.172,-113.214 43.156,-113.392 43.136,-113.57 43.113,-113.747 43.087,-113.924 43.057,-114.1 43.023,-114.275 42.986,-114.45 42.946,-114.624 42.902,-114.797 42.855,-114.97 42.804,-115.141 42.75,-115.311 42.692,-115.48 42.631,-115.648 42.567,-115.815 42.5,-115.981 42.429,-116.145 42.355,-116.307 42.278,-116.469 42.197,-116.628 42.114,-116.786 42.027,-116.942 41.938,-117.097 41.845,-117.25 41.749,-117.4 41.65,-117.549 41.548,-117.696 41.444,-117.841 41.336,-117.984 41.226,-118.124 41.113,-118.263 40.997,-118.399 40.879,-118.533 40.758,-118.664 40.634,-118.793 40.508,-118.92 40.379,-119.044 40.248,-119.165 40.115,-119.284 39.979,-119.4 39.841,-119.513 39.7,-119.624 39.558,-119.732 39.413,-119.836 39.266,-119.939 39.118,-120.038 38.967,-120.134 38.815,-120.227 38.66,-120.317 38.504,-120.404 38.346,-120.488 38.187,-120.569 38.026,-120.646 37.864,-120.721 37.7,-120.792 37.534,-120.86 37.368,-120.924 37.2,-120.985 37.031,-121.043 36.861,-121.098 36.689,-121.149 36.517,-121.197 36.344,-121.241 36.17,-121.282 35.995,-121.319 35.82,-121.353 35.644,-121.383 35.467,-121.41 35.29,-121.434 35.113,-121.454 34.935,-121.47 34.756,-121.483 34.578,-121.492 34.399,-121.498 34.221,-121.5 34.042,-121.499 33.863,-121.494 33.685,-121.485 33.507,-121.473 33.329,-121.458 33.151,-121.439 32.974,-121.416 32.797,-121.39 32.621,-121.36 32.445,-121.327 32.27,-121.291 32.096,-121.251 31.923,-121.207 31.75,-121.16 31.579,-121.11 31.408,-121.056 31.239,-120.999 31.071,-120.939 30.904,-120.875 30.738,-120.808 5.538,-110.308 5.44,-110.266 5.342,-110.223 5.245,-110.179 5.148,-110.134 5.051,-110.088 4.956,-110.04 4.86,-109.991 4.766,-109.942 4.672,-109.891 4.578,-109.839 4.486,-109.786 4.393,-109.732 4.302,-109.676 4.211,-109.62 4.121,-109.563 4.031,-109.504 3.943,-109.445 3.854,-109.384 3.767,-109.322 3.68,-109.26 3.595,-109.196 3.51,-109.131 3.425,-109.066 3.342,-108.999 3.259,-108.931 3.177,-108.862 3.096,-108.793 3.016,-108.722 2.936,-108.651 2.858,-108.578 2.78,-108.505 2.703,-108.43 2.627,-108.355 2.552,-108.279 2.478,-108.202 2.405,-108.124 2.333,-108.045 2.261,-107.966 2.191,-107.885 2.121,-107.804 2.053,-107.722 1.985,-107.639 1.919,-107.555 1.853,-107.471 1.789,-107.385 1.726,-107.299 1.663,-107.212 1.602,-107.125 1.541,-107.037 1.482,-106.948 1.424,-106.858 1.367,-106.768 1.311,-106.677 1.256,-106.585 1.202,-106.493 1.149,-106.4 1.097,-106.306 1.046,-106.212 0.997,-106.117 0.949,-106.022 0.901,-105.926 0.855,-105.83 0.81,-105.733 0.767,-105.635 0.724,-105.537 0.683,-105.438 0.642,-105.339 0.603,-105.24 0.565,-105.14 0.529,-105.039 0.493,-104.939 0.459,-104.837 0.426,-104.736 0.394,-104.634 0.363,-104.531 0.334,-104.428 0.306,-104.325 0.279,-104.222 0.253,-104.118 0.228,-104.014 0.205,-103.91 0.183,-103.805 0.162,-103.7 0.142,-103.595 0.124,-103.49 0.107,-103.384 0.091,-103.279 0.077,-103.173 0.063,-103.067 0.051,-102.96 0.041,-102.854 0.031,-102.748 0.023,-102.641 0.016,-102.534 0.01,-102.427 0.006,-102.321 0.003,-102.214 0.001,-102.107 0,-102 0,-6 0.001,-5.893 0.003,-5.786 0.006,-5.679 0.01,-5.573 0.016,-5.466 0.023,-5.359 0.031,-5.252 0.041,-5.146 0.051,-5.04 0.063,-4.933 0.077,-4.827 0.091,-4.721 0.107,-4.616 0.124,-4.51 0.142,-4.405 0.162,-4.3 0.183,-4.195 0.205,-4.09 0.228,-3.986 0.253,-3.882 0.279,-3.778 0.306,-3.675 0.334,-3.572 0.363,-3.469 0.394,-3.366 0.426,-3.264 0.459,-3.163 0.493,-3.061 0.529,-2.961 0.565,-2.86 0.603,-2.76 0.642,-2.661 0.683,-2.562 0.724,-2.463 0.767,-2.365 0.81,-2.267 0.855,-2.17 0.901,-2.074 0.949,-1.978 0.997,-1.883 1.046,-1.788 1.097,-1.694 1.149,-1.6 1.202,-1.507 1.256,-1.415 1.311,-1.323 1.367,-1.232 1.424,-1.142 1.482,-1.052 1.541,-0.963 1.602,-0.875 1.663,-0.788 1.726,-0.701 1.789,-0.615 1.853,-0.529 1.919,-0.445 1.985,-0.361 2.053,-0.278 2.121,-0.196 2.191,-0.115 2.261,-0.034 2.333,0.045 2.405,0.124 2.478,0.202 2.552,0.279 2.627,0.355 2.703,0.43 2.78,0.505 2.858,0.578 2.936,0.651 3.016,0.722 3.096,0.793 3.177,0.862 3.259,0.931 3.342,0.999 3.425,1.066 3.51,1.131 3.595,1.196 3.68,1.26 3.767,1.322 3.854,1.384 3.943,1.445 4.031,1.504 4.121,1.563 4.211,1.62 4.302,1.676 4.393,1.732 4.486,1.786 4.578,1.839 4.672,1.891 4.766,1.942 4.86,1.991 4.956,2.04 5.051,2.088 5.148,2.134 5.245,2.179 5.342,2.223 5.44,2.266 5.538,2.308 30.738,12.808 30.904,12.875 31.071,12.939 31.239,12.999 31.408,13.056 31.579,13.11 31.75,13.16 31.923,13.207 32.096,13.251 32.27,13.291 32.445,13.327 32.621,13.36 32.797,13.39 32.974,13.416 33.151,13.439 33.329,13.458 33.507,13.473 33.685,13.485 33.863,13.494 34.042,13.499 34.221,13.5 34.399,13.498 34.578,13.492 34.756,13.483 34.935,13.47 35.113,13.454 35.29,13.434 35.467,13.41 35.644,13.383 35.82,13.353 35.995,13.319 36.17,13.282 36.344,13.241 36.517,13.197 36.689,13.149 36.861,13.098 37.031,13.043 37.2,12.985 37.368,12.924 37.534,12.86 37.7,12.792 37.864,12.721 38.026,12.646 38.187,12.569 38.346,12.488 38.504,12.404 38.66,12.317 38.815,12.227 38.967,12.134 39.118,12.038 39.266,11.939 39.413,11.836 39.558,11.732 39.7,11.624 39.841,11.513 39.979,11.4 40.115,11.284 40.248,11.165 40.379,11.044 40.508,10.92 40.634,10.793 40.758,10.664 40.879,10.533 40.997,10.399 41.113,10.263 41.226,10.124 41.336,9.984 41.444,9.841 41.548,9.696 41.65,9.549 41.749,9.4 41.845,9.25 41.938,9.097 42.027,8.942 42.114,8.786 42.197,8.628 42.278,8.469 42.355,8.307 42.429,8.145 42.5,7.981 42.567,7.815 42.631,7.648 42.692,7.48 42.75,7.311 42.804,7.141 42.855,6.97 42.902,6.797 42.946,6.624 42.986,6.45 43.023,6.275 43.057,6.1 43.087,5.924 43.113,5.747 43.136,5.57 43.156,5.392 43.172,5.214 43.184,5.036 43.193,4.857 43.198,4.679 43.2,4.5 43.2,-112.5 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"10.799999999999999\" y=\"-99.00000000000001\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"10.799999999999999\" dy=\"9\">9</tspan></text><text x=\"10.799999999999999\" y=\"-77.4\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"10.799999999999999\" dy=\"9\">8</tspan></text><text x=\"10.799999999999999\" y=\"-55.800000000000004\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"10.799999999999999\" dy=\"9\">7</tspan></text><text x=\"10.799999999999999\" y=\"-34.199999999999996\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"10.799999999999999\" dy=\"9\">6</tspan></text><text x=\"32.4\" y=\"-111.60000000000001\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"32.4\" dy=\"9\">5</tspan></text><text x=\"32.4\" y=\"-90.00000000000001\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"32.4\" dy=\"9\">4</tspan></text><text x=\"32.4\" y=\"-68.4\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"32.4\" dy=\"9\">3</tspan></text><text x=\"32.4\" y=\"-46.800000000000004\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"32.4\" dy=\"9\">2</tspan></text><text x=\"32.4\" y=\"-25.2\" dominant-baseline=\"ideographic\" fill=\"black\" font-size=\"9\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"32.4\" dy=\"9\">1</tspan></text><circle cx=\"10.8\" cy=\"-86.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-64.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-43.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-21.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-99\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-77.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-55.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-34.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-12.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","DB25":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"326.0pt\" width=\"52.4pt\" viewBox=\"-4.6 -303.4 52.4 326.0\"><polygon points=\"43.2,-285.3 43.198,-285.479 43.193,-285.657 43.184,-285.836 43.172,-286.014 43.156,-286.192 43.136,-286.37 43.113,-286.547 43.087,-286.724 43.057,-286.9 43.023,-287.075 42.986,-287.25 42.946,-287.424 42.902,-287.597 42.855,-287.77 42.804,-287.941 42.75,-288.111 42.692,-288.28 42.631,-288.448 42.567,-288.615 42.5,-288.781 42.429,-288.945 42.355,-289.107 42.278,-289.269 42.197,-289.428 42.114,-289.586 42.027,-289.742 41.938,-289.897 41.845,-290.05 41.749,-290.2 41.65,-290.349 41.548,-290.496 41.444,-290.641 41.336,-290.784 41.226,-290.924 41.113,-291.063 40.997,-291.199 40.879,-291.333 40.758,-291.464 40.634,-291.593 40.508,-291.72 40.379,-291.844 40.248,-291.965 40.115,-292.084 39.979,-292.2 39.841,-292.313 39.7,-292.424 39.558,-292.532 39.413,-292.636 39.266,-292.739 39.118,-292.838 38.967,-292.934 38.815,-293.027 38.66,-293.117 38.504,-293.204 38.346,-293.288 38.187,-293.369 38.026,-293.446 37.864,-293.521 37.7,-293.592 37.534,-293.66 37.368,-293.724 37.2,-293.785 37.031,-293.843 36.861,-293.898 36.689,-293.949 36.517,-293.997 36.344,-294.041 36.17,-294.082 35.995,-294.119 35.82,-294.153 35.644,-294.183 35.467,-294.21 35.29,-294.234 35.113,-294.254 34.935,-294.27 34.756,-294.283 34.578,-294.292 34.399,-294.298 34.221,-294.3 34.042,-294.299 33.863,-294.294 33.685,-294.285 33.507,-294.273 33.329,-294.258 33.151,-294.239 32.974,-294.216 32.797,-294.19 32.621,-294.16 32.445,-294.127 32.27,-294.091 32.096,-294.051 31.923,-294.007 31.75,-293.96 31.579,-293.91 31.408,-293.856 31.239,-293.799 31.071,-293.739 30.904,-293.675 30.738,-293.608 5.538,-283.108 5.44,-283.066 5.342,-283.023 5.245,-282.979 5.148,-282.934 5.051,-282.888 4.956,-282.84 4.86,-282.791 4.766,-282.742 4.672,-282.691 4.578,-282.639 4.486,-282.586 4.393,-282.532 4.302,-282.476 4.211,-282.42 4.121,-282.363 4.031,-282.304 3.943,-282.245 3.854,-282.184 3.767,-282.122 3.68,-282.06 3.595,-281.996 3.51,-281.931 3.425,-281.866 3.342,-281.799 3.259,-281.731 3.177,-281.662 3.096,-281.593 3.016,-281.522 2.936,-281.451 2.858,-281.378 2.78,-281.305 2.703,-281.23 2.627,-281.155 2.552,-281.079 2.478,-281.002 2.405,-280.924 2.333,-280.845 2.261,-280.766 2.191,-280.685 2.121,-280.604 2.053,-280.522 1.985,-280.439 1.919,-280.355 1.853,-280.271 1.789,-280.185 1.726,-280.099 1.663,-280.012 1.602,-279.925 1.541,-279.837 1.482,-279.748 1.424,-279.658 1.367,-279.568 1.311,-279.477 1.256,-279.385 1.202,-279.293 1.149,-279.2 1.097,-279.106 1.046,-279.012 0.997,-278.917 0.949,-278.822 0.901,-278.726 0.855,-278.63 0.81,-278.533 0.767,-278.435 0.724,-278.337 0.683,-278.238 0.642,-278.139 0.603,-278.04 0.565,-277.94 0.529,-277.839 0.493,-277.739 0.459,-277.637 0.426,-277.536 0.394,-277.434 0.363,-277.331 0.334,-277.228 0.306,-277.125 0.279,-277.022 0.253,-276.918 0.228,-276.814 0.205,-276.71 0.183,-276.605 0.162,-276.5 0.142,-276.395 0.124,-276.29 0.107,-276.184 0.091,-276.079 0.077,-275.973 0.063,-275.867 0.051,-275.76 0.041,-275.654 0.031,-275.548 0.023,-275.441 0.016,-275.334 0.01,-275.227 0.006,-275.121 0.003,-275.014 0.001,-274.907 -0,-274.8 0,-6 0.001,-5.893 0.003,-5.786 0.006,-5.679 0.01,-5.573 0.016,-5.466 0.023,-5.359 0.031,-5.252 0.041,-5.146 0.051,-5.04 0.063,-4.933 0.077,-4.827 0.091,-4.721 0.107,-4.616 0.124,-4.51 0.142,-4.405 0.162,-4.3 0.183,-4.195 0.205,-4.09 0.228,-3.986 0.253,-3.882 0.279,-3.778 0.306,-3.675 0.334,-3.572 0.363,-3.469 0.394,-3.366 0.426,-3.264 0.459,-3.163 0.493,-3.061 0.529,-2.961 0.565,-2.86 0.603,-2.76 0.642,-2.661 0.683,-2.562 0.724,-2.463 0.767,-2.365 0.81,-2.267 0.855,-2.17 0.901,-2.074 0.949,-1.978 0.997,-1.883 1.046,-1.788 1.097,-1.694 1.149,-1.6 1.202,-1.507 1.256,-1.415 1.311,-1.323 1.367,-1.232 1.424,-1.142 1.482,-1.052 1.541,-0.963 1.602,-0.875 1.663,-0.788 1.726,-0.701 1.789,-0.615 1.853,-0.529 1.919,-0.445 1.985,-0.361 2.053,-0.278 2.121,-0.196 2.191,-0.115 2.261,-0.034 2.333,0.045 2.405,0.124 2.478,0.202 2.552,0.279 2.627,0.355 2.703,0.43 2.78,0.505 2.858,0.578 2.936,0.651 3.016,0.722 3.096,0.793 3.177,0.862 3.259,0.931 3.342,0.999 3.425,1.066 3.51,1.131 3.595,1.196 3.68,1.26 3.767,1.322 3.854,1.384 3.943,1.445 4.031,1.504 4.121,1.563 4.211,1.62 4.302,1.676 4.393,1.732 4.486,1.786 4.578,1.839 4.672,1.891 4.766,1.942 4.86,1.991 4.956,2.04 5.051,2.088 5.148,2.134 5.245,2.179 5.342,2.223 5.44,2.266 5.538,2.308 30.738,12.808 30.904,12.875 31.071,12.939 31.239,12.999 31.408,13.056 31.579,13.11 31.75,13.16 31.923,13.207 32.096,13.251 32.27,13.291 32.445,13.327 32.621,13.36 32.797,13.39 32.974,13.416 33.151,13.439 33.329,13.458 33.507,13.473 33.685,13.485 33.863,13.494 34.042,13.499 34.221,13.5 34.399,13.498 34.578,13.492 34.756,13.483 34.935,13.47 35.113,13.454 35.29,13.434 35.467,13.41 35.644,13.383 35.82,13.353 35.995,13.319 36.17,13.282 36.344,13.241 36.517,13.197 36.689,13.149 36.861,13.098 37.031,13.043 37.2,12.985 37.368,12.924 37.534,12.86 37.7,12.792 37.864,12.721 38.026,12.646 38.187,12.569 38.346,12.488 38.504,12.404 38.66,12.317 38.815,12.227 38.967,12.134 39.118,12.038 39.266,11.939 39.413,11.836 39.558,11.732 39.7,11.624 39.841,11.513 39.979,11.4 40.115,11.284 40.248,11.165 40.379,11.044 40.508,10.92 40.634,10.793 40.758,10.664 40.879,10.533 40.997,10.399 41.113,10.263 41.226,10.124 41.336,9.984 41.444,9.841 41.548,9.696 41.65,9.549 41.749,9.4 41.845,9.25 41.938,9.097 42.027,8.942 42.114,8.786 42.197,8.628 42.278,8.469 42.355,8.307 42.429,8.145 42.5,7.981 42.567,7.815 42.631,7.648 42.692,7.48 42.75,7.311 42.804,7.141 42.855,6.97 42.902,6.797 42.946,6.624 42.986,6.45 43.023,6.275 43.057,6.1 43.087,5.924 43.113,5.747 43.136,5.57 43.156,5.392 43.172,5.214 43.184,5.036 43.193,4.857 43.198,4.679 43.2,4.5 43.2,-285.3 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"10.8\" cy=\"-259.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-237.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-216\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-194.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-172.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-151.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-129.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-108\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-86.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-64.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-43.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-21.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-271.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-250.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-228.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-207\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-185.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-163.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-142.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-120.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-99\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-77.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-55.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-34.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-12.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","DA15":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"218.0pt\" width=\"52.4pt\" viewBox=\"-4.6 -195.39999999999998 52.4 218.0\"><polygon points=\"43.2,-177.3 43.198,-177.479 43.193,-177.657 43.184,-177.836 43.172,-178.014 43.156,-178.192 43.136,-178.37 43.113,-178.547 43.087,-178.724 43.057,-178.9 43.023,-179.075 42.986,-179.25 42.946,-179.424 42.902,-179.597 42.855,-179.77 42.804,-179.941 42.75,-180.111 42.692,-180.28 42.631,-180.448 42.567,-180.615 42.5,-180.781 42.429,-180.945 42.355,-181.107 42.278,-181.269 42.197,-181.428 42.114,-181.586 42.027,-181.742 41.938,-181.897 41.845,-182.05 41.749,-182.2 41.65,-182.349 41.548,-182.496 41.444,-182.641 41.336,-182.784 41.226,-182.924 41.113,-183.063 40.997,-183.199 40.879,-183.333 40.758,-183.464 40.634,-183.593 40.508,-183.72 40.379,-183.844 40.248,-183.965 40.115,-184.084 39.979,-184.2 39.841,-184.313 39.7,-184.424 39.558,-184.532 39.413,-184.636 39.266,-184.739 39.118,-184.838 38.967,-184.934 38.815,-185.027 38.66,-185.117 38.504,-185.204 38.346,-185.288 38.187,-185.369 38.026,-185.446 37.864,-185.521 37.7,-185.592 37.534,-185.66 37.368,-185.724 37.2,-185.785 37.031,-185.843 36.861,-185.898 36.689,-185.949 36.517,-185.997 36.344,-186.041 36.17,-186.082 35.995,-186.119 35.82,-186.153 35.644,-186.183 35.467,-186.21 35.29,-186.234 35.113,-186.254 34.935,-186.27 34.756,-186.283 34.578,-186.292 34.399,-186.298 34.221,-186.3 34.042,-186.299 33.863,-186.294 33.685,-186.285 33.507,-186.273 33.329,-186.258 33.151,-186.239 32.974,-186.216 32.797,-186.19 32.621,-186.16 32.445,-186.127 32.27,-186.091 32.096,-186.051 31.923,-186.007 31.75,-185.96 31.579,-185.91 31.408,-185.856 31.239,-185.799 31.071,-185.739 30.904,-185.675 30.738,-185.608 5.538,-175.108 5.44,-175.066 5.342,-175.023 5.245,-174.979 5.148,-174.934 5.051,-174.888 4.956,-174.84 4.86,-174.791 4.766,-174.742 4.672,-174.691 4.578,-174.639 4.486,-174.586 4.393,-174.532 4.302,-174.476 4.211,-174.42 4.121,-174.363 4.031,-174.304 3.943,-174.245 3.854,-174.184 3.767,-174.122 3.68,-174.06 3.595,-173.996 3.51,-173.931 3.425,-173.866 3.342,-173.799 3.259,-173.731 3.177,-173.662 3.096,-173.593 3.016,-173.522 2.936,-173.451 2.858,-173.378 2.78,-173.305 2.703,-173.23 2.627,-173.155 2.552,-173.079 2.478,-173.002 2.405,-172.924 2.333,-172.845 2.261,-172.766 2.191,-172.685 2.121,-172.604 2.053,-172.522 1.985,-172.439 1.919,-172.355 1.853,-172.271 1.789,-172.185 1.726,-172.099 1.663,-172.012 1.602,-171.925 1.541,-171.837 1.482,-171.748 1.424,-171.658 1.367,-171.568 1.311,-171.477 1.256,-171.385 1.202,-171.293 1.149,-171.2 1.097,-171.106 1.046,-171.012 0.997,-170.917 0.949,-170.822 0.901,-170.726 0.855,-170.63 0.81,-170.533 0.767,-170.435 0.724,-170.337 0.683,-170.238 0.642,-170.139 0.603,-170.04 0.565,-169.94 0.529,-169.839 0.493,-169.739 0.459,-169.637 0.426,-169.536 0.394,-169.434 0.363,-169.331 0.334,-169.228 0.306,-169.125 0.279,-169.022 0.253,-168.918 0.228,-168.814 0.205,-168.71 0.183,-168.605 0.162,-168.5 0.142,-168.395 0.124,-168.29 0.107,-168.184 0.091,-168.079 0.077,-167.973 0.063,-167.867 0.051,-167.76 0.041,-167.654 0.031,-167.548 0.023,-167.441 0.016,-167.334 0.01,-167.227 0.006,-167.121 0.003,-167.014 0.001,-166.907 -0,-166.8 0,-6 0.001,-5.893 0.003,-5.786 0.006,-5.679 0.01,-5.573 0.016,-5.466 0.023,-5.359 0.031,-5.252 0.041,-5.146 0.051,-5.04 0.063,-4.933 0.077,-4.827 0.091,-4.721 0.107,-4.616 0.124,-4.51 0.142,-4.405 0.162,-4.3 0.183,-4.195 0.205,-4.09 0.228,-3.986 0.253,-3.882 0.279,-3.778 0.306,-3.675 0.334,-3.572 0.363,-3.469 0.394,-3.366 0.426,-3.264 0.459,-3.163 0.493,-3.061 0.529,-2.961 0.565,-2.86 0.603,-2.76 0.642,-2.661 0.683,-2.562 0.724,-2.463 0.767,-2.365 0.81,-2.267 0.855,-2.17 0.901,-2.074 0.949,-1.978 0.997,-1.883 1.046,-1.788 1.097,-1.694 1.149,-1.6 1.202,-1.507 1.256,-1.415 1.311,-1.323 1.367,-1.232 1.424,-1.142 1.482,-1.052 1.541,-0.963 1.602,-0.875 1.663,-0.788 1.726,-0.701 1.789,-0.615 1.853,-0.529 1.919,-0.445 1.985,-0.361 2.053,-0.278 2.121,-0.196 2.191,-0.115 2.261,-0.034 2.333,0.045 2.405,0.124 2.478,0.202 2.552,0.279 2.627,0.355 2.703,0.43 2.78,0.505 2.858,0.578 2.936,0.651 3.016,0.722 3.096,0.793 3.177,0.862 3.259,0.931 3.342,0.999 3.425,1.066 3.51,1.131 3.595,1.196 3.68,1.26 3.767,1.322 3.854,1.384 3.943,1.445 4.031,1.504 4.121,1.563 4.211,1.62 4.302,1.676 4.393,1.732 4.486,1.786 4.578,1.839 4.672,1.891 4.766,1.942 4.86,1.991 4.956,2.04 5.051,2.088 5.148,2.134 5.245,2.179 5.342,2.223 5.44,2.266 5.538,2.308 30.738,12.808 30.904,12.875 31.071,12.939 31.239,12.999 31.408,13.056 31.579,13.11 31.75,13.16 31.923,13.207 32.096,13.251 32.27,13.291 32.445,13.327 32.621,13.36 32.797,13.39 32.974,13.416 33.151,13.439 33.329,13.458 33.507,13.473 33.685,13.485 33.863,13.494 34.042,13.499 34.221,13.5 34.399,13.498 34.578,13.492 34.756,13.483 34.935,13.47 35.113,13.454 35.29,13.434 35.467,13.41 35.644,13.383 35.82,13.353 35.995,13.319 36.17,13.282 36.344,13.241 36.517,13.197 36.689,13.149 36.861,13.098 37.031,13.043 37.2,12.985 37.368,12.924 37.534,12.86 37.7,12.792 37.864,12.721 38.026,12.646 38.187,12.569 38.346,12.488 38.504,12.404 38.66,12.317 38.815,12.227 38.967,12.134 39.118,12.038 39.266,11.939 39.413,11.836 39.558,11.732 39.7,11.624 39.841,11.513 39.979,11.4 40.115,11.284 40.248,11.165 40.379,11.044 40.508,10.92 40.634,10.793 40.758,10.664 40.879,10.533 40.997,10.399 41.113,10.263 41.226,10.124 41.336,9.984 41.444,9.841 41.548,9.696 41.65,9.549 41.749,9.4 41.845,9.25 41.938,9.097 42.027,8.942 42.114,8.786 42.197,8.628 42.278,8.469 42.355,8.307 42.429,8.145 42.5,7.981 42.567,7.815 42.631,7.648 42.692,7.48 42.75,7.311 42.804,7.141 42.855,6.97 42.902,6.797 42.946,6.624 42.986,6.45 43.023,6.275 43.057,6.1 43.087,5.924 43.113,5.747 43.136,5.57 43.156,5.392 43.172,5.214 43.184,5.036 43.193,4.857 43.198,4.679 43.2,4.5 43.2,-177.3 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"10.8\" cy=\"-151.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-129.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-108\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-86.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-64.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-43.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-21.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-163.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-142.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-120.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-99\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-77.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-55.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-34.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-12.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","DC37":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"455.59999999999997pt\" width=\"52.4pt\" viewBox=\"-4.6 -432.99999999999994 52.4 455.59999999999997\"><polygon points=\"43.2,-414.9 43.198,-415.079 43.193,-415.257 43.184,-415.436 43.172,-415.614 43.156,-415.792 43.136,-415.97 43.113,-416.147 43.087,-416.324 43.057,-416.5 43.023,-416.675 42.986,-416.85 42.946,-417.024 42.902,-417.197 42.855,-417.37 42.804,-417.541 42.75,-417.711 42.692,-417.88 42.631,-418.048 42.567,-418.215 42.5,-418.381 42.429,-418.545 42.355,-418.707 42.278,-418.869 42.197,-419.028 42.114,-419.186 42.027,-419.342 41.938,-419.497 41.845,-419.65 41.749,-419.8 41.65,-419.949 41.548,-420.096 41.444,-420.241 41.336,-420.384 41.226,-420.524 41.113,-420.663 40.997,-420.799 40.879,-420.933 40.758,-421.064 40.634,-421.193 40.508,-421.32 40.379,-421.444 40.248,-421.565 40.115,-421.684 39.979,-421.8 39.841,-421.913 39.7,-422.024 39.558,-422.132 39.413,-422.236 39.266,-422.339 39.118,-422.438 38.967,-422.534 38.815,-422.627 38.66,-422.717 38.504,-422.804 38.346,-422.888 38.187,-422.969 38.026,-423.046 37.864,-423.121 37.7,-423.192 37.534,-423.26 37.368,-423.324 37.2,-423.385 37.031,-423.443 36.861,-423.498 36.689,-423.549 36.517,-423.597 36.344,-423.641 36.17,-423.682 35.995,-423.719 35.82,-423.753 35.644,-423.783 35.467,-423.81 35.29,-423.834 35.113,-423.854 34.935,-423.87 34.756,-423.883 34.578,-423.892 34.399,-423.898 34.221,-423.9 34.042,-423.899 33.863,-423.894 33.685,-423.885 33.507,-423.873 33.329,-423.858 33.151,-423.839 32.974,-423.816 32.797,-423.79 32.621,-423.76 32.445,-423.727 32.27,-423.691 32.096,-423.651 31.923,-423.607 31.75,-423.56 31.579,-423.51 31.408,-423.456 31.239,-423.399 31.071,-423.339 30.904,-423.275 30.738,-423.208 5.538,-412.708 5.44,-412.666 5.342,-412.623 5.245,-412.579 5.148,-412.534 5.051,-412.488 4.956,-412.44 4.86,-412.391 4.766,-412.342 4.672,-412.291 4.578,-412.239 4.486,-412.186 4.393,-412.132 4.302,-412.076 4.211,-412.02 4.121,-411.963 4.031,-411.904 3.943,-411.845 3.854,-411.784 3.767,-411.722 3.68,-411.66 3.595,-411.596 3.51,-411.531 3.425,-411.466 3.342,-411.399 3.259,-411.331 3.177,-411.262 3.096,-411.193 3.016,-411.122 2.936,-411.051 2.858,-410.978 2.78,-410.905 2.703,-410.83 2.627,-410.755 2.552,-410.679 2.478,-410.602 2.405,-410.524 2.333,-410.445 2.261,-410.366 2.191,-410.285 2.121,-410.204 2.053,-410.122 1.985,-410.039 1.919,-409.955 1.853,-409.871 1.789,-409.785 1.726,-409.699 1.663,-409.612 1.602,-409.525 1.541,-409.437 1.482,-409.348 1.424,-409.258 1.367,-409.168 1.311,-409.077 1.256,-408.985 1.202,-408.893 1.149,-408.8 1.097,-408.706 1.046,-408.612 0.997,-408.517 0.949,-408.422 0.901,-408.326 0.855,-408.23 0.81,-408.133 0.767,-408.035 0.724,-407.937 0.683,-407.838 0.642,-407.739 0.603,-407.64 0.565,-407.54 0.529,-407.439 0.493,-407.339 0.459,-407.237 0.426,-407.136 0.394,-407.034 0.363,-406.931 0.334,-406.828 0.306,-406.725 0.279,-406.622 0.253,-406.518 0.228,-406.414 0.205,-406.31 0.183,-406.205 0.162,-406.1 0.142,-405.995 0.124,-405.89 0.107,-405.784 0.091,-405.679 0.077,-405.573 0.063,-405.467 0.051,-405.36 0.041,-405.254 0.031,-405.148 0.023,-405.041 0.016,-404.934 0.01,-404.827 0.006,-404.721 0.003,-404.614 0.001,-404.507 0,-404.4 0,-6 0.001,-5.893 0.003,-5.786 0.006,-5.679 0.01,-5.573 0.016,-5.466 0.023,-5.359 0.031,-5.252 0.041,-5.146 0.051,-5.04 0.063,-4.933 0.077,-4.827 0.091,-4.721 0.107,-4.616 0.124,-4.51 0.142,-4.405 0.162,-4.3 0.183,-4.195 0.205,-4.09 0.228,-3.986 0.253,-3.882 0.279,-3.778 0.306,-3.675 0.334,-3.572 0.363,-3.469 0.394,-3.366 0.426,-3.264 0.459,-3.163 0.493,-3.061 0.529,-2.961 0.565,-2.86 0.603,-2.76 0.642,-2.661 0.683,-2.562 0.724,-2.463 0.767,-2.365 0.81,-2.267 0.855,-2.17 0.901,-2.074 0.949,-1.978 0.997,-1.883 1.046,-1.788 1.097,-1.694 1.149,-1.6 1.202,-1.507 1.256,-1.415 1.311,-1.323 1.367,-1.232 1.424,-1.142 1.482,-1.052 1.541,-0.963 1.602,-0.875 1.663,-0.788 1.726,-0.701 1.789,-0.615 1.853,-0.529 1.919,-0.445 1.985,-0.361 2.053,-0.278 2.121,-0.196 2.191,-0.115 2.261,-0.034 2.333,0.045 2.405,0.124 2.478,0.202 2.552,0.279 2.627,0.355 2.703,0.43 2.78,0.505 2.858,0.578 2.936,0.651 3.016,0.722 3.096,0.793 3.177,0.862 3.259,0.931 3.342,0.999 3.425,1.066 3.51,1.131 3.595,1.196 3.68,1.26 3.767,1.322 3.854,1.384 3.943,1.445 4.031,1.504 4.121,1.563 4.211,1.62 4.302,1.676 4.393,1.732 4.486,1.786 4.578,1.839 4.672,1.891 4.766,1.942 4.86,1.991 4.956,2.04 5.051,2.088 5.148,2.134 5.245,2.179 5.342,2.223 5.44,2.266 5.538,2.308 30.738,12.808 30.904,12.875 31.071,12.939 31.239,12.999 31.408,13.056 31.579,13.11 31.75,13.16 31.923,13.207 32.096,13.251 32.27,13.291 32.445,13.327 32.621,13.36 32.797,13.39 32.974,13.416 33.151,13.439 33.329,13.458 33.507,13.473 33.685,13.485 33.863,13.494 34.042,13.499 34.221,13.5 34.399,13.498 34.578,13.492 34.756,13.483 34.935,13.47 35.113,13.454 35.29,13.434 35.467,13.41 35.644,13.383 35.82,13.353 35.995,13.319 36.17,13.282 36.344,13.241 36.517,13.197 36.689,13.149 36.861,13.098 37.031,13.043 37.2,12.985 37.368,12.924 37.534,12.86 37.7,12.792 37.864,12.721 38.026,12.646 38.187,12.569 38.346,12.488 38.504,12.404 38.66,12.317 38.815,12.227 38.967,12.134 39.118,12.038 39.266,11.939 39.413,11.836 39.558,11.732 39.7,11.624 39.841,11.513 39.979,11.4 40.115,11.284 40.248,11.165 40.379,11.044 40.508,10.92 40.634,10.793 40.758,10.664 40.879,10.533 40.997,10.399 41.113,10.263 41.226,10.124 41.336,9.984 41.444,9.841 41.548,9.696 41.65,9.549 41.749,9.4 41.845,9.25 41.938,9.097 42.027,8.942 42.114,8.786 42.197,8.628 42.278,8.469 42.355,8.307 42.429,8.145 42.5,7.981 42.567,7.815 42.631,7.648 42.692,7.48 42.75,7.311 42.804,7.141 42.855,6.97 42.902,6.797 42.946,6.624 42.986,6.45 43.023,6.275 43.057,6.1 43.087,5.924 43.113,5.747 43.136,5.57 43.156,5.392 43.172,5.214 43.184,5.036 43.193,4.857 43.198,4.679 43.2,4.5 43.2,-414.9 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"10.8\" cy=\"-388.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-367.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-345.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-324\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-302.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-280.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-259.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-237.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-216\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-194.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-172.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-151.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-129.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-108\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-86.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-64.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-43.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-21.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-401.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-379.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-358.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-336.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-315\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-293.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-271.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-250.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-228.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-207\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-185.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-163.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-142.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-120.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-99\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-77.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-55.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-34.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-12.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","DD50":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"412.4pt\" width=\"74.0pt\" viewBox=\"-4.6 -389.8 74.0 412.4\"><polygon points=\"64.8,-373.359 64.798,-373.527 64.794,-373.694 64.786,-373.861 64.775,-374.028 64.761,-374.195 64.744,-374.362 64.724,-374.528 64.701,-374.694 64.674,-374.859 64.645,-375.024 64.612,-375.188 64.577,-375.352 64.538,-375.515 64.496,-375.677 64.452,-375.838 64.404,-375.999 64.354,-376.158 64.3,-376.317 64.244,-376.475 64.184,-376.631 64.122,-376.787 64.057,-376.941 63.989,-377.094 63.918,-377.245 63.844,-377.396 63.768,-377.545 63.688,-377.692 63.606,-377.838 63.522,-377.983 63.434,-378.125 63.344,-378.267 63.252,-378.406 63.157,-378.544 63.059,-378.68 62.959,-378.814 62.856,-378.946 62.751,-379.076 62.643,-379.205 62.533,-379.331 62.421,-379.455 62.306,-379.577 62.19,-379.697 62.071,-379.815 61.95,-379.931 61.826,-380.044 61.701,-380.155 61.573,-380.263 61.444,-380.37 61.313,-380.473 61.179,-380.575 61.044,-380.674 60.907,-380.77 60.768,-380.864 60.628,-380.955 60.486,-381.043 60.342,-381.129 60.197,-381.212 60.05,-381.293 59.902,-381.37 59.752,-381.445 59.601,-381.517 59.448,-381.587 59.295,-381.653 59.14,-381.717 58.984,-381.777 58.827,-381.835 58.668,-381.89 58.509,-381.942 58.349,-381.991 58.188,-382.037 58.026,-382.08 57.864,-382.119 57.7,-382.156 57.536,-382.19 57.372,-382.221 57.207,-382.249 57.041,-382.273 56.875,-382.295 56.709,-382.313 56.542,-382.329 56.375,-382.341 56.208,-382.35 56.04,-382.356 55.873,-382.359 55.706,-382.359 55.538,-382.355 55.371,-382.349 55.204,-382.339 55.037,-382.327 54.87,-382.311 54.704,-382.292 54.538,-382.27 54.372,-382.245 54.207,-382.217 54.043,-382.186 53.879,-382.152 53.715,-382.114 53.553,-382.074 53.391,-382.031 6.591,-369.031 6.478,-368.999 6.364,-368.965 6.252,-368.929 6.139,-368.892 6.028,-368.854 5.916,-368.814 5.805,-368.773 5.695,-368.731 5.586,-368.686 5.477,-368.641 5.368,-368.594 5.26,-368.546 5.153,-368.496 5.047,-368.445 4.941,-368.392 4.836,-368.338 4.731,-368.283 4.628,-368.226 4.525,-368.168 4.423,-368.108 4.321,-368.048 4.221,-367.985 4.121,-367.922 4.022,-367.857 3.924,-367.791 3.827,-367.724 3.731,-367.656 3.635,-367.586 3.541,-367.515 3.448,-367.442 3.355,-367.369 3.264,-367.294 3.173,-367.218 3.083,-367.141 2.995,-367.063 2.907,-366.983 2.821,-366.903 2.736,-366.821 2.651,-366.738 2.568,-366.654 2.486,-366.569 2.405,-366.483 2.325,-366.396 2.246,-366.308 2.169,-366.219 2.093,-366.129 2.017,-366.038 1.943,-365.945 1.871,-365.852 1.799,-365.758 1.729,-365.663 1.66,-365.567 1.592,-365.47 1.526,-365.373 1.461,-365.274 1.397,-365.175 1.334,-365.075 1.273,-364.973 1.213,-364.872 1.154,-364.769 1.097,-364.666 1.041,-364.561 0.987,-364.457 0.934,-364.351 0.882,-364.245 0.832,-364.138 0.783,-364.03 0.735,-363.922 0.689,-363.813 0.645,-363.704 0.601,-363.594 0.56,-363.483 0.519,-363.372 0.481,-363.261 0.443,-363.149 0.407,-363.036 0.373,-362.923 0.34,-362.809 0.309,-362.696 0.279,-362.581 0.25,-362.467 0.223,-362.351 0.198,-362.236 0.174,-362.12 0.152,-362.004 0.131,-361.888 0.111,-361.771 0.094,-361.655 0.077,-361.538 0.063,-361.42 0.05,-361.303 0.038,-361.185 0.028,-361.068 0.019,-360.95 0.012,-360.832 0.007,-360.714 0.003,-360.596 0.001,-360.477 -0,-360.359 -0,-6.841 0.001,-6.723 0.003,-6.604 0.007,-6.486 0.012,-6.368 0.019,-6.25 0.028,-6.132 0.038,-6.015 0.05,-5.897 0.063,-5.78 0.077,-5.662 0.094,-5.545 0.111,-5.429 0.131,-5.312 0.152,-5.196 0.174,-5.08 0.198,-4.964 0.223,-4.849 0.25,-4.733 0.279,-4.619 0.309,-4.504 0.34,-4.391 0.373,-4.277 0.407,-4.164 0.443,-4.051 0.481,-3.939 0.519,-3.828 0.56,-3.717 0.601,-3.606 0.645,-3.496 0.689,-3.387 0.735,-3.278 0.783,-3.17 0.832,-3.062 0.882,-2.955 0.934,-2.849 0.987,-2.743 1.041,-2.639 1.097,-2.534 1.154,-2.431 1.213,-2.328 1.273,-2.227 1.334,-2.125 1.397,-2.025 1.461,-1.926 1.526,-1.827 1.592,-1.73 1.66,-1.633 1.729,-1.537 1.799,-1.442 1.871,-1.348 1.943,-1.255 2.017,-1.162 2.093,-1.071 2.169,-0.981 2.246,-0.892 2.325,-0.804 2.405,-0.717 2.486,-0.631 2.568,-0.546 2.651,-0.462 2.736,-0.379 2.821,-0.297 2.907,-0.217 2.995,-0.137 3.083,-0.059 3.173,0.018 3.264,0.094 3.355,0.169 3.448,0.242 3.541,0.315 3.635,0.386 3.731,0.456 3.827,0.524 3.924,0.591 4.022,0.657 4.121,0.722 4.221,0.785 4.321,0.848 4.423,0.908 4.525,0.968 4.628,1.026 4.731,1.083 4.836,1.138 4.941,1.192 5.047,1.245 5.153,1.296 5.26,1.346 5.368,1.394 5.477,1.441 5.586,1.486 5.695,1.531 5.805,1.573 5.916,1.614 6.028,1.654 6.139,1.692 6.252,1.729 6.364,1.765 6.478,1.799 6.591,1.831 53.391,14.831 53.553,14.874 53.715,14.914 53.879,14.952 54.043,14.986 54.207,15.017 54.372,15.045 54.538,15.07 54.704,15.092 54.87,15.111 55.037,15.127 55.204,15.139 55.371,15.149 55.538,15.155 55.706,15.159 55.873,15.159 56.04,15.156 56.208,15.15 56.375,15.141 56.542,15.129 56.709,15.113 56.875,15.095 57.041,15.073 57.207,15.049 57.372,15.021 57.536,14.99 57.7,14.956 57.864,14.919 58.026,14.88 58.188,14.837 58.349,14.791 58.509,14.742 58.668,14.69 58.827,14.635 58.984,14.577 59.14,14.517 59.295,14.453 59.448,14.387 59.601,14.317 59.752,14.245 59.902,14.17 60.05,14.093 60.197,14.012 60.342,13.929 60.486,13.843 60.628,13.755 60.768,13.664 60.907,13.57 61.044,13.474 61.179,13.375 61.313,13.273 61.444,13.17 61.573,13.063 61.701,12.955 61.826,12.844 61.95,12.731 62.071,12.615 62.19,12.497 62.306,12.377 62.421,12.255 62.533,12.131 62.643,12.005 62.751,11.876 62.856,11.746 62.959,11.614 63.059,11.48 63.157,11.344 63.252,11.206 63.344,11.067 63.434,10.925 63.522,10.783 63.606,10.638 63.688,10.492 63.768,10.345 63.844,10.196 63.918,10.045 63.989,9.894 64.057,9.741 64.122,9.587 64.184,9.431 64.244,9.275 64.3,9.117 64.354,8.958 64.404,8.799 64.452,8.638 64.496,8.477 64.538,8.315 64.577,8.152 64.612,7.988 64.645,7.824 64.674,7.659 64.701,7.494 64.724,7.328 64.744,7.162 64.761,6.995 64.775,6.828 64.786,6.661 64.794,6.494 64.798,6.327 64.8,6.159 64.8,-373.359 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"10.8\" cy=\"-358.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-336.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-315\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-293.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-271.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-250.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-228.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-207\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-185.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-163.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-142.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-120.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-99\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-77.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-55.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-34.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"10.8\" cy=\"-12.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-345.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-324\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-302.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-280.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-259.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-237.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-216\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-194.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-172.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-151.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-129.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-108\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-86.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-64.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-43.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"32.4\" cy=\"-21.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-358.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-336.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-315\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-293.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-271.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-250.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-228.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-207\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-185.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-163.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-142.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-120.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-99\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-77.4\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-55.8\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-34.2\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"54\" cy=\"-12.6\" r=\"3.6\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","OutletA":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"85.56753236814714pt\" width=\"106.38612694639258pt\" viewBox=\"-53.19306347319629 -42.78376618407357 106.38612694639258 85.56753236814714\"><polygon points=\"-32.784,-38.184 -33.988,-36.94 -35.152,-35.659 -36.274,-34.341 -37.353,-32.987 -38.388,-31.6 -39.379,-30.18 -40.323,-28.73 -41.22,-27.249 -42.07,-25.741 -42.871,-24.207 -43.622,-22.647 -44.322,-21.064 -44.972,-19.46 -45.57,-17.835 -46.115,-16.192 -46.608,-14.533 -47.047,-12.858 -47.432,-11.171 -47.763,-9.472 -48.039,-7.763 -48.26,-6.046 -48.427,-4.323 -48.538,-2.596 -48.593,-0.866 -48.593,0.866 -48.538,2.596 -48.427,4.323 -48.26,6.046 -48.039,7.763 -47.763,9.472 -47.432,11.171 -47.047,12.858 -46.608,14.533 -46.115,16.192 -45.57,17.835 -44.972,19.46 -44.322,21.064 -43.622,22.647 -42.871,24.207 -42.07,25.741 -41.22,27.249 -40.323,28.73 -39.379,30.18 -38.388,31.6 -37.353,32.987 -36.274,34.341 -35.152,35.659 -33.988,36.94 -32.784,38.184 32.784,38.184 33.988,36.94 35.152,35.659 36.274,34.341 37.353,32.987 38.388,31.6 39.379,30.18 40.323,28.73 41.22,27.249 42.07,25.741 42.871,24.207 43.622,22.647 44.322,21.064 44.972,19.46 45.57,17.835 46.115,16.192 46.608,14.533 47.047,12.858 47.432,11.171 47.763,9.472 48.039,7.763 48.26,6.046 48.427,4.323 48.538,2.596 48.593,0.866 48.593,-0.866 48.538,-2.596 48.427,-4.323 48.26,-6.046 48.039,-7.763 47.763,-9.472 47.432,-11.171 47.047,-12.858 46.608,-14.533 46.115,-16.192 45.57,-17.835 44.972,-19.46 44.322,-21.064 43.622,-22.647 42.871,-24.207 42.07,-25.741 41.22,-27.249 40.323,-28.73 39.379,-30.18 38.388,-31.6 37.353,-32.987 36.274,-34.341 35.152,-35.659 33.988,-36.94 32.784,-38.184 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"-24.545,-12.656 -24.545,12.656 -17.795,12.656 -17.795,-12.656 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"24.545,-10.125 24.545,10.125 17.795,10.125 17.795,-10.125 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","OutletB":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"85.56753236814714pt\" width=\"106.38612694639258pt\" viewBox=\"-53.19306347319629 -42.78376618407357 106.38612694639258 85.56753236814714\"><polygon points=\"-32.784,-38.184 -33.988,-36.94 -35.152,-35.659 -36.274,-34.341 -37.353,-32.987 -38.388,-31.6 -39.379,-30.18 -40.323,-28.73 -41.22,-27.249 -42.07,-25.741 -42.871,-24.207 -43.622,-22.647 -44.322,-21.064 -44.972,-19.46 -45.57,-17.835 -46.115,-16.192 -46.608,-14.533 -47.047,-12.858 -47.432,-11.171 -47.763,-9.472 -48.039,-7.763 -48.26,-6.046 -48.427,-4.323 -48.538,-2.596 -48.593,-0.866 -48.593,0.866 -48.538,2.596 -48.427,4.323 -48.26,6.046 -48.039,7.763 -47.763,9.472 -47.432,11.171 -47.047,12.858 -46.608,14.533 -46.115,16.192 -45.57,17.835 -44.972,19.46 -44.322,21.064 -43.622,22.647 -42.871,24.207 -42.07,25.741 -41.22,27.249 -40.323,28.73 -39.379,30.18 -38.388,31.6 -37.353,32.987 -36.274,34.341 -35.152,35.659 -33.988,36.94 -32.784,38.184 32.784,38.184 33.988,36.94 35.152,35.659 36.274,34.341 37.353,32.987 38.388,31.6 39.379,30.18 40.323,28.73 41.22,27.249 42.07,25.741 42.871,24.207 43.622,22.647 44.322,21.064 44.972,19.46 45.57,17.835 46.115,16.192 46.608,14.533 47.047,12.858 47.432,11.171 47.763,9.472 48.039,7.763 48.26,6.046 48.427,4.323 48.538,2.596 48.593,0.866 48.593,-0.866 48.538,-2.596 48.427,-4.323 48.26,-6.046 48.039,-7.763 47.763,-9.472 47.432,-11.171 47.047,-12.858 46.608,-14.533 46.115,-16.192 45.57,-17.835 44.972,-19.46 44.322,-21.064 43.622,-22.647 42.871,-24.207 42.07,-25.741 41.22,-27.249 40.323,-28.73 39.379,-30.18 38.388,-31.6 37.353,-32.987 36.274,-34.341 35.152,-35.659 33.988,-36.94 32.784,-38.184 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"-24.545,-19.406 -24.545,5.906 -17.795,5.906 -17.795,-19.406 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"24.545,-16.875 24.545,3.375 17.795,3.375 17.795,-16.875 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"-6.75,21.6 -6.75,28.35 6.75,28.35 6.75,21.6 6.75,21.6 6.736,21.168 6.695,20.737 6.626,20.31 6.529,19.888 6.406,19.473 6.257,19.067 6.082,18.671 5.881,18.288 5.657,17.918 5.41,17.563 5.14,17.224 4.849,16.904 4.538,16.603 4.209,16.323 3.862,16.064 3.499,15.828 3.122,15.615 2.732,15.428 2.331,15.265 1.921,15.129 1.502,15.019 1.077,14.937 0.648,14.881 0.216,14.853 -0.216,14.853 -0.648,14.881 -1.077,14.937 -1.502,15.019 -1.921,15.129 -2.331,15.265 -2.732,15.428 -3.122,15.615 -3.499,15.828 -3.862,16.064 -4.209,16.323 -4.538,16.603 -4.849,16.904 -5.14,17.224 -5.41,17.563 -5.657,17.918 -5.881,18.288 -6.082,18.671 -6.257,19.067 -6.406,19.473 -6.529,19.888 -6.626,20.31 -6.695,20.737 -6.736,21.168 -6.75,21.6 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","OutletC":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"88.4pt\" width=\"88.4pt\" viewBox=\"-44.2 -44.2 88.4 88.4\"><circle cx=\"0\" cy=\"-0\" r=\"39.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"-19.8\" cy=\"-0\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"19.8\" cy=\"-0\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","OutletD":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"88.4pt\" width=\"88.4pt\" viewBox=\"-44.2 -44.2 88.4 88.4\"><circle cx=\"0\" cy=\"-0\" r=\"39.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"-19.8\" cy=\"9.9\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"19.8\" cy=\"9.9\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"0\" cy=\"-15.84\" r=\"5.94\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","OutletE":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"88.4pt\" width=\"88.4pt\" viewBox=\"-44.2 -44.2 88.4 88.4\"><circle cx=\"0\" cy=\"-0\" r=\"39.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"-19.8\" cy=\"-0\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"19.8\" cy=\"-0\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"0\" cy=\"-19.8\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","OutletF":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"88.4pt\" width=\"88.4pt\" viewBox=\"-44.2 -44.2 88.4 88.4\"><circle cx=\"0\" cy=\"-0\" r=\"39.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"-19.8\" cy=\"-0\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"19.8\" cy=\"-0\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M -4.95,-37.800000000000004 L -4.95,-31.2 L 4.95,-31.2 L 4.95,-37.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M -4.95,37.800000000000004 L -4.95,31.2 L 4.95,31.2 L 4.95,37.8\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","OutletG":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"88.4pt\" width=\"88.4pt\" viewBox=\"-44.2 -44.2 88.4 88.4\"><circle cx=\"0\" cy=\"-0\" r=\"39.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><polygon points=\"-3.96,-29.7 -3.96,-9.9 3.96,-9.9 3.96,-29.7 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"-6.6,15.84 -6.6,22.44 -26.4,22.44 -26.4,15.84 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"6.6,15.84 6.6,22.44 26.4,22.44 26.4,15.84 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","OutletH":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"88.4pt\" width=\"88.4pt\" viewBox=\"-44.2 -44.2 88.4 88.4\"><circle cx=\"0\" cy=\"-0\" r=\"39.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><polygon points=\"-2.475,9.9 -2.475,24.75 2.475,24.75 2.475,9.9 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"9.811,-2.807 22.672,-10.232 20.197,-14.518 7.336,-7.093 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"-7.336,-7.093 -20.197,-14.518 -22.672,-10.232 -9.811,-2.807 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","OutletI":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"88.4pt\" width=\"88.4pt\" viewBox=\"-44.2 -44.2 88.4 88.4\"><circle cx=\"0\" cy=\"-0\" r=\"39.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><polygon points=\"-2.475,9.9 -2.475,24.75 2.475,24.75 2.475,9.9 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"22.393,-6.211 14.968,-19.072 10.682,-16.597 18.107,-3.736 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><polygon points=\"-18.107,-3.736 -10.682,-16.597 -14.968,-19.072 -22.393,-6.211 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","OutletJ":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"68.60000000000001pt\" width=\"128.0pt\" viewBox=\"-64.0 -34.300000000000004 128.0 68.60000000000001\"><polygon points=\"-59.4,-0 -35.64,-29.7 35.64,-29.7 59.4,-0 35.64,29.7 -35.64,29.7 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"-29.7\" cy=\"-0\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"0\" cy=\"9.9\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"29.7\" cy=\"-0\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","OutletK":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"88.4pt\" width=\"88.4pt\" viewBox=\"-44.2 -44.2 88.4 88.4\"><circle cx=\"0\" cy=\"-0\" r=\"39.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"-19.8\" cy=\"-0\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"19.8\" cy=\"-0\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><polygon points=\"-4.95,19.8 -4.95,14.85 4.95,14.85 4.95,19.8 4.95,19.8 4.94,20.117 4.909,20.433 4.859,20.746 4.788,21.056 4.698,21.36 4.588,21.658 4.46,21.948 4.313,22.229 4.149,22.5 3.967,22.761 3.769,23.009 3.556,23.244 3.328,23.464 3.086,23.67 2.832,23.86 2.566,24.033 2.29,24.189 2.004,24.326 1.71,24.445 1.408,24.545 1.101,24.626 0.79,24.687 0.475,24.727 0.159,24.747 -0.159,24.747 -0.475,24.727 -0.79,24.687 -1.101,24.626 -1.408,24.545 -1.71,24.445 -2.004,24.326 -2.29,24.189 -2.566,24.033 -2.832,23.86 -3.086,23.67 -3.328,23.464 -3.556,23.244 -3.769,23.009 -3.967,22.761 -4.149,22.5 -4.313,22.229 -4.46,21.948 -4.588,21.658 -4.698,21.36 -4.788,21.056 -4.859,20.746 -4.909,20.433 -4.94,20.117 -4.95,19.8 \" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","OutletL":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"56.72pt\" width=\"116.12pt\" viewBox=\"-58.06 -28.36 116.12 56.72\"><polygon points=\"-53.46,-23.76 53.46,-23.76 53.46,23.76 -53.46,23.76 \" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><circle cx=\"-26.73\" cy=\"-0\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"0\" cy=\"-0\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"26.73\" cy=\"-0\" r=\"4.95\" style=\"stroke:black;fill:white;stroke-width:2;stroke-dasharray:-;\" /></svg>","And":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"75.8pt\" viewBox=\"-4.6 -22.6 75.8 45.2\"><path d=\"M 36.0,18.0 L 37.153,17.963 L 38.302,17.852 L 39.441,17.668 L 40.566,17.411 L 41.672,17.083 L 42.755,16.685 L 43.81,16.217 L 44.833,15.684 L 45.82,15.086 L 46.766,14.425 L 47.668,13.706 L 48.522,12.93 L 49.325,12.101 L 50.073,11.223 L 50.763,10.298 L 51.393,9.331 L 51.959,8.326 L 52.459,7.286 L 52.892,6.217 L 53.256,5.121 L 53.549,4.005 L 53.769,2.873 L 53.917,1.728 L 53.991,0.577 L 53.991,-0.577 L 53.917,-1.728 L 53.769,-2.873 L 53.549,-4.005 L 53.256,-5.121 L 52.892,-6.217 L 52.459,-7.286 L 51.959,-8.326 L 51.393,-9.331 L 50.763,-10.298 L 50.073,-11.223 L 49.325,-12.101 L 48.522,-12.93 L 47.668,-13.706 L 46.766,-14.425 L 45.82,-15.086 L 44.833,-15.684 L 43.81,-16.217 L 42.755,-16.685 L 41.672,-17.083 L 40.566,-17.411 L 39.441,-17.668 L 38.302,-17.852 L 37.153,-17.963 L 36,-18 L 36,-18 L 12.6,-18 L 12.6,-0 L 12.6,18 L 36,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,9.0 L 12.6,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-9.0 L 12.6,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,-0.0 L 66.6,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Nand":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"75.8pt\" viewBox=\"-4.6 -22.6 75.8 45.2\"><circle cx=\"58.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 36.0,18.0 L 37.153,17.963 L 38.302,17.852 L 39.441,17.668 L 40.566,17.411 L 41.672,17.083 L 42.755,16.685 L 43.81,16.217 L 44.833,15.684 L 45.82,15.086 L 46.766,14.425 L 47.668,13.706 L 48.522,12.93 L 49.325,12.101 L 50.073,11.223 L 50.763,10.298 L 51.393,9.331 L 51.959,8.326 L 52.459,7.286 L 52.892,6.217 L 53.256,5.121 L 53.549,4.005 L 53.769,2.873 L 53.917,1.728 L 53.991,0.577 L 53.991,-0.577 L 53.917,-1.728 L 53.769,-2.873 L 53.549,-4.005 L 53.256,-5.121 L 52.892,-6.217 L 52.459,-7.286 L 51.959,-8.326 L 51.393,-9.331 L 50.763,-10.298 L 50.073,-11.223 L 49.325,-12.101 L 48.522,-12.93 L 47.668,-13.706 L 46.766,-14.425 L 45.82,-15.086 L 44.833,-15.684 L 43.81,-16.217 L 42.755,-16.685 L 41.672,-17.083 L 40.566,-17.411 L 39.441,-17.668 L 38.302,-17.852 L 37.153,-17.963 L 36,-18 L 36,-18 L 12.6,-18 L 12.6,-0 L 12.6,18 L 36,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,9.0 L 12.6,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-9.0 L 12.6,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 62.64,-0.0 L 66.6,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Or":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"44.480000000000004pt\" width=\"77.60000000000001pt\" viewBox=\"-4.6 -22.240000000000002 77.60000000000001 44.480000000000004\"><path d=\"M 12.6,17.640000000000004 L 30.6,17.64 L 31.114,17.633 L 31.629,17.611 L 32.143,17.574 L 32.657,17.522 L 33.171,17.456 L 33.686,17.376 L 34.2,17.28 L 34.714,17.17 L 35.229,17.045 L 35.743,16.905 L 36.257,16.751 L 36.771,16.582 L 37.286,16.398 L 37.8,16.2 L 38.314,15.987 L 38.829,15.759 L 39.343,15.517 L 39.857,15.26 L 40.371,14.988 L 40.886,14.701 L 41.4,14.4 L 41.914,14.084 L 42.429,13.753 L 42.943,13.408 L 43.457,13.048 L 43.971,12.673 L 44.486,12.284 L 45,11.88 L 45.514,11.461 L 46.029,11.028 L 46.543,10.58 L 47.057,10.117 L 47.571,9.639 L 48.086,9.147 L 48.6,8.64 L 49.114,8.118 L 49.629,7.582 L 50.143,7.031 L 50.657,6.465 L 51.171,5.885 L 51.686,5.29 L 52.2,4.68 L 52.714,4.056 L 53.229,3.416 L 53.743,2.762 L 54.257,2.094 L 54.771,1.411 L 55.286,0.713 L 55.8,-0 L 55.8,-0 L 55.286,-0.713 L 54.771,-1.411 L 54.257,-2.094 L 53.743,-2.762 L 53.229,-3.416 L 52.714,-4.056 L 52.2,-4.68 L 51.686,-5.29 L 51.171,-5.885 L 50.657,-6.465 L 50.143,-7.031 L 49.629,-7.582 L 49.114,-8.118 L 48.6,-8.64 L 48.086,-9.147 L 47.571,-9.639 L 47.057,-10.117 L 46.543,-10.58 L 46.029,-11.028 L 45.514,-11.461 L 45,-11.88 L 44.486,-12.284 L 43.971,-12.673 L 43.457,-13.048 L 42.943,-13.408 L 42.429,-13.753 L 41.914,-14.084 L 41.4,-14.4 L 40.886,-14.701 L 40.371,-14.988 L 39.857,-15.26 L 39.343,-15.517 L 38.829,-15.759 L 38.314,-15.987 L 37.8,-16.2 L 37.286,-16.398 L 36.771,-16.582 L 36.257,-16.751 L 35.743,-16.905 L 35.229,-17.045 L 34.714,-17.17 L 34.2,-17.28 L 33.686,-17.376 L 33.171,-17.456 L 32.657,-17.522 L 32.143,-17.574 L 31.629,-17.611 L 31.114,-17.633 L 30.6,-17.64 L 12.6,-17.64 L 12.6,-17.64 L 13.291,-16.92 L 13.954,-16.2 L 14.587,-15.48 L 15.192,-14.76 L 15.768,-14.04 L 16.315,-13.32 L 16.834,-12.6 L 17.323,-11.88 L 17.784,-11.16 L 18.216,-10.44 L 18.619,-9.72 L 18.994,-9 L 19.339,-8.28 L 19.656,-7.56 L 19.944,-6.84 L 20.203,-6.12 L 20.434,-5.4 L 20.635,-4.68 L 20.808,-3.96 L 20.952,-3.24 L 21.067,-2.52 L 21.154,-1.8 L 21.211,-1.08 L 21.24,-0.36 L 21.24,0.36 L 21.211,1.08 L 21.154,1.8 L 21.067,2.52 L 20.952,3.24 L 20.808,3.96 L 20.635,4.68 L 20.434,5.4 L 20.203,6.12 L 19.944,6.84 L 19.656,7.56 L 19.339,8.28 L 18.994,9 L 18.619,9.72 L 18.216,10.44 L 17.784,11.16 L 17.323,11.88 L 16.834,12.6 L 16.315,13.32 L 15.768,14.04 L 15.192,14.76 L 14.587,15.48 L 13.954,16.2 L 13.291,16.92 L 12.6,17.64\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,9.0 L 18.994,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-9.0 L 18.994,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 55.80000000000001,-0.0 L 68.4,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Nor":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"44.480000000000004pt\" width=\"77.60000000000001pt\" viewBox=\"-4.6 -22.240000000000002 77.60000000000001 44.480000000000004\"><circle cx=\"60.12\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 12.6,17.640000000000004 L 30.6,17.64 L 31.114,17.633 L 31.629,17.611 L 32.143,17.574 L 32.657,17.522 L 33.171,17.456 L 33.686,17.376 L 34.2,17.28 L 34.714,17.17 L 35.229,17.045 L 35.743,16.905 L 36.257,16.751 L 36.771,16.582 L 37.286,16.398 L 37.8,16.2 L 38.314,15.987 L 38.829,15.759 L 39.343,15.517 L 39.857,15.26 L 40.371,14.988 L 40.886,14.701 L 41.4,14.4 L 41.914,14.084 L 42.429,13.753 L 42.943,13.408 L 43.457,13.048 L 43.971,12.673 L 44.486,12.284 L 45,11.88 L 45.514,11.461 L 46.029,11.028 L 46.543,10.58 L 47.057,10.117 L 47.571,9.639 L 48.086,9.147 L 48.6,8.64 L 49.114,8.118 L 49.629,7.582 L 50.143,7.031 L 50.657,6.465 L 51.171,5.885 L 51.686,5.29 L 52.2,4.68 L 52.714,4.056 L 53.229,3.416 L 53.743,2.762 L 54.257,2.094 L 54.771,1.411 L 55.286,0.713 L 55.8,-0 L 55.8,-0 L 55.286,-0.713 L 54.771,-1.411 L 54.257,-2.094 L 53.743,-2.762 L 53.229,-3.416 L 52.714,-4.056 L 52.2,-4.68 L 51.686,-5.29 L 51.171,-5.885 L 50.657,-6.465 L 50.143,-7.031 L 49.629,-7.582 L 49.114,-8.118 L 48.6,-8.64 L 48.086,-9.147 L 47.571,-9.639 L 47.057,-10.117 L 46.543,-10.58 L 46.029,-11.028 L 45.514,-11.461 L 45,-11.88 L 44.486,-12.284 L 43.971,-12.673 L 43.457,-13.048 L 42.943,-13.408 L 42.429,-13.753 L 41.914,-14.084 L 41.4,-14.4 L 40.886,-14.701 L 40.371,-14.988 L 39.857,-15.26 L 39.343,-15.517 L 38.829,-15.759 L 38.314,-15.987 L 37.8,-16.2 L 37.286,-16.398 L 36.771,-16.582 L 36.257,-16.751 L 35.743,-16.905 L 35.229,-17.045 L 34.714,-17.17 L 34.2,-17.28 L 33.686,-17.376 L 33.171,-17.456 L 32.657,-17.522 L 32.143,-17.574 L 31.629,-17.611 L 31.114,-17.633 L 30.6,-17.64 L 12.6,-17.64 L 12.6,-17.64 L 13.291,-16.92 L 13.954,-16.2 L 14.587,-15.48 L 15.192,-14.76 L 15.768,-14.04 L 16.315,-13.32 L 16.834,-12.6 L 17.323,-11.88 L 17.784,-11.16 L 18.216,-10.44 L 18.619,-9.72 L 18.994,-9 L 19.339,-8.28 L 19.656,-7.56 L 19.944,-6.84 L 20.203,-6.12 L 20.434,-5.4 L 20.635,-4.68 L 20.808,-3.96 L 20.952,-3.24 L 21.067,-2.52 L 21.154,-1.8 L 21.211,-1.08 L 21.24,-0.36 L 21.24,0.36 L 21.211,1.08 L 21.154,1.8 L 21.067,2.52 L 20.952,3.24 L 20.808,3.96 L 20.635,4.68 L 20.434,5.4 L 20.203,6.12 L 19.944,6.84 L 19.656,7.56 L 19.339,8.28 L 18.994,9 L 18.619,9.72 L 18.216,10.44 L 17.784,11.16 L 17.323,11.88 L 16.834,12.6 L 16.315,13.32 L 15.768,14.04 L 15.192,14.76 L 14.587,15.48 L 13.954,16.2 L 13.291,16.92 L 12.6,17.64\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,9.0 L 18.994,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-9.0 L 18.994,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 64.44000000000001,-0.0 L 68.4,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Xor":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"44.480000000000004pt\" width=\"77.60000000000001pt\" viewBox=\"-4.6 -22.240000000000002 77.60000000000001 44.480000000000004\"><path d=\"M 12.6,17.640000000000004 L 30.6,17.64 L 31.114,17.633 L 31.629,17.611 L 32.143,17.574 L 32.657,17.522 L 33.171,17.456 L 33.686,17.376 L 34.2,17.28 L 34.714,17.17 L 35.229,17.045 L 35.743,16.905 L 36.257,16.751 L 36.771,16.582 L 37.286,16.398 L 37.8,16.2 L 38.314,15.987 L 38.829,15.759 L 39.343,15.517 L 39.857,15.26 L 40.371,14.988 L 40.886,14.701 L 41.4,14.4 L 41.914,14.084 L 42.429,13.753 L 42.943,13.408 L 43.457,13.048 L 43.971,12.673 L 44.486,12.284 L 45,11.88 L 45.514,11.461 L 46.029,11.028 L 46.543,10.58 L 47.057,10.117 L 47.571,9.639 L 48.086,9.147 L 48.6,8.64 L 49.114,8.118 L 49.629,7.582 L 50.143,7.031 L 50.657,6.465 L 51.171,5.885 L 51.686,5.29 L 52.2,4.68 L 52.714,4.056 L 53.229,3.416 L 53.743,2.762 L 54.257,2.094 L 54.771,1.411 L 55.286,0.713 L 55.8,-0 L 55.8,-0 L 55.286,-0.713 L 54.771,-1.411 L 54.257,-2.094 L 53.743,-2.762 L 53.229,-3.416 L 52.714,-4.056 L 52.2,-4.68 L 51.686,-5.29 L 51.171,-5.885 L 50.657,-6.465 L 50.143,-7.031 L 49.629,-7.582 L 49.114,-8.118 L 48.6,-8.64 L 48.086,-9.147 L 47.571,-9.639 L 47.057,-10.117 L 46.543,-10.58 L 46.029,-11.028 L 45.514,-11.461 L 45,-11.88 L 44.486,-12.284 L 43.971,-12.673 L 43.457,-13.048 L 42.943,-13.408 L 42.429,-13.753 L 41.914,-14.084 L 41.4,-14.4 L 40.886,-14.701 L 40.371,-14.988 L 39.857,-15.26 L 39.343,-15.517 L 38.829,-15.759 L 38.314,-15.987 L 37.8,-16.2 L 37.286,-16.398 L 36.771,-16.582 L 36.257,-16.751 L 35.743,-16.905 L 35.229,-17.045 L 34.714,-17.17 L 34.2,-17.28 L 33.686,-17.376 L 33.171,-17.456 L 32.657,-17.522 L 32.143,-17.574 L 31.629,-17.611 L 31.114,-17.633 L 30.6,-17.64 L 12.6,-17.64 L 12.6,-17.64 L 13.291,-16.92 L 13.954,-16.2 L 14.587,-15.48 L 15.192,-14.76 L 15.768,-14.04 L 16.315,-13.32 L 16.834,-12.6 L 17.323,-11.88 L 17.784,-11.16 L 18.216,-10.44 L 18.619,-9.72 L 18.994,-9 L 19.339,-8.28 L 19.656,-7.56 L 19.944,-6.84 L 20.203,-6.12 L 20.434,-5.4 L 20.635,-4.68 L 20.808,-3.96 L 20.952,-3.24 L 21.067,-2.52 L 21.154,-1.8 L 21.211,-1.08 L 21.24,-0.36 L 21.24,0.36 L 21.211,1.08 L 21.154,1.8 L 21.067,2.52 L 20.952,3.24 L 20.808,3.96 L 20.635,4.68 L 20.434,5.4 L 20.203,6.12 L 19.944,6.84 L 19.656,7.56 L 19.339,8.28 L 18.994,9 L 18.619,9.72 L 18.216,10.44 L 17.784,11.16 L 17.323,11.88 L 16.834,12.6 L 16.315,13.32 L 15.768,14.04 L 15.192,14.76 L 14.587,15.48 L 13.954,16.2 L 13.291,16.92 L 12.6,17.64\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 7.199999999999999,17.640000000000004 L 7.891,16.92 L 8.554,16.2 L 9.187,15.48 L 9.792,14.76 L 10.368,14.04 L 10.915,13.32 L 11.434,12.6 L 11.923,11.88 L 12.384,11.16 L 12.816,10.44 L 13.219,9.72 L 13.594,9 L 13.939,8.28 L 14.256,7.56 L 14.544,6.84 L 14.803,6.12 L 15.034,5.4 L 15.235,4.68 L 15.408,3.96 L 15.552,3.24 L 15.667,2.52 L 15.754,1.8 L 15.811,1.08 L 15.84,0.36 L 15.84,-0.36 L 15.811,-1.08 L 15.754,-1.8 L 15.667,-2.52 L 15.552,-3.24 L 15.408,-3.96 L 15.235,-4.68 L 15.034,-5.4 L 14.803,-6.12 L 14.544,-6.84 L 14.256,-7.56 L 13.939,-8.28 L 13.594,-9 L 13.219,-9.72 L 12.816,-10.44 L 12.384,-11.16 L 11.923,-11.88 L 11.434,-12.6 L 10.915,-13.32 L 10.368,-14.04 L 9.792,-14.76 L 9.187,-15.48 L 8.554,-16.2 L 7.891,-16.92 L 7.2,-17.64\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,9.0 L 13.594,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-9.0 L 13.594,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 55.80000000000001,-0.0 L 68.4,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Xnor":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"44.480000000000004pt\" width=\"77.60000000000001pt\" viewBox=\"-4.6 -22.240000000000002 77.60000000000001 44.480000000000004\"><circle cx=\"60.12\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 12.6,17.640000000000004 L 30.6,17.64 L 31.114,17.633 L 31.629,17.611 L 32.143,17.574 L 32.657,17.522 L 33.171,17.456 L 33.686,17.376 L 34.2,17.28 L 34.714,17.17 L 35.229,17.045 L 35.743,16.905 L 36.257,16.751 L 36.771,16.582 L 37.286,16.398 L 37.8,16.2 L 38.314,15.987 L 38.829,15.759 L 39.343,15.517 L 39.857,15.26 L 40.371,14.988 L 40.886,14.701 L 41.4,14.4 L 41.914,14.084 L 42.429,13.753 L 42.943,13.408 L 43.457,13.048 L 43.971,12.673 L 44.486,12.284 L 45,11.88 L 45.514,11.461 L 46.029,11.028 L 46.543,10.58 L 47.057,10.117 L 47.571,9.639 L 48.086,9.147 L 48.6,8.64 L 49.114,8.118 L 49.629,7.582 L 50.143,7.031 L 50.657,6.465 L 51.171,5.885 L 51.686,5.29 L 52.2,4.68 L 52.714,4.056 L 53.229,3.416 L 53.743,2.762 L 54.257,2.094 L 54.771,1.411 L 55.286,0.713 L 55.8,-0 L 55.8,-0 L 55.286,-0.713 L 54.771,-1.411 L 54.257,-2.094 L 53.743,-2.762 L 53.229,-3.416 L 52.714,-4.056 L 52.2,-4.68 L 51.686,-5.29 L 51.171,-5.885 L 50.657,-6.465 L 50.143,-7.031 L 49.629,-7.582 L 49.114,-8.118 L 48.6,-8.64 L 48.086,-9.147 L 47.571,-9.639 L 47.057,-10.117 L 46.543,-10.58 L 46.029,-11.028 L 45.514,-11.461 L 45,-11.88 L 44.486,-12.284 L 43.971,-12.673 L 43.457,-13.048 L 42.943,-13.408 L 42.429,-13.753 L 41.914,-14.084 L 41.4,-14.4 L 40.886,-14.701 L 40.371,-14.988 L 39.857,-15.26 L 39.343,-15.517 L 38.829,-15.759 L 38.314,-15.987 L 37.8,-16.2 L 37.286,-16.398 L 36.771,-16.582 L 36.257,-16.751 L 35.743,-16.905 L 35.229,-17.045 L 34.714,-17.17 L 34.2,-17.28 L 33.686,-17.376 L 33.171,-17.456 L 32.657,-17.522 L 32.143,-17.574 L 31.629,-17.611 L 31.114,-17.633 L 30.6,-17.64 L 12.6,-17.64 L 12.6,-17.64 L 13.291,-16.92 L 13.954,-16.2 L 14.587,-15.48 L 15.192,-14.76 L 15.768,-14.04 L 16.315,-13.32 L 16.834,-12.6 L 17.323,-11.88 L 17.784,-11.16 L 18.216,-10.44 L 18.619,-9.72 L 18.994,-9 L 19.339,-8.28 L 19.656,-7.56 L 19.944,-6.84 L 20.203,-6.12 L 20.434,-5.4 L 20.635,-4.68 L 20.808,-3.96 L 20.952,-3.24 L 21.067,-2.52 L 21.154,-1.8 L 21.211,-1.08 L 21.24,-0.36 L 21.24,0.36 L 21.211,1.08 L 21.154,1.8 L 21.067,2.52 L 20.952,3.24 L 20.808,3.96 L 20.635,4.68 L 20.434,5.4 L 20.203,6.12 L 19.944,6.84 L 19.656,7.56 L 19.339,8.28 L 18.994,9 L 18.619,9.72 L 18.216,10.44 L 17.784,11.16 L 17.323,11.88 L 16.834,12.6 L 16.315,13.32 L 15.768,14.04 L 15.192,14.76 L 14.587,15.48 L 13.954,16.2 L 13.291,16.92 L 12.6,17.64\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 7.199999999999999,17.640000000000004 L 7.891,16.92 L 8.554,16.2 L 9.187,15.48 L 9.792,14.76 L 10.368,14.04 L 10.915,13.32 L 11.434,12.6 L 11.923,11.88 L 12.384,11.16 L 12.816,10.44 L 13.219,9.72 L 13.594,9 L 13.939,8.28 L 14.256,7.56 L 14.544,6.84 L 14.803,6.12 L 15.034,5.4 L 15.235,4.68 L 15.408,3.96 L 15.552,3.24 L 15.667,2.52 L 15.754,1.8 L 15.811,1.08 L 15.84,0.36 L 15.84,-0.36 L 15.811,-1.08 L 15.754,-1.8 L 15.667,-2.52 L 15.552,-3.24 L 15.408,-3.96 L 15.235,-4.68 L 15.034,-5.4 L 14.803,-6.12 L 14.544,-6.84 L 14.256,-7.56 L 13.939,-8.28 L 13.594,-9 L 13.219,-9.72 L 12.816,-10.44 L 12.384,-11.16 L 11.923,-11.88 L 11.434,-12.6 L 10.915,-13.32 L 10.368,-14.04 L 9.792,-14.76 L 9.187,-15.48 L 8.554,-16.2 L 7.891,-16.92 L 7.2,-17.64\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,9.0 L 13.594,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-9.0 L 13.594,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 64.44000000000001,-0.0 L 68.4,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Buf":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><path d=\"M 0.0,-0.0 L 42.3,-0 M 65.7,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 42.300000000000004,-18.0 L 65.7,-0 L 42.3,18 L 42.3,-18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Not":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"65.7\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 37.98,-0 M 70.02,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 37.98,-18.0 L 61.38,-0 L 37.98,18 L 37.98,-18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","NotNot":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"70.02\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"70.02\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"37.98\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 33.66,-0 M 74.34,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 42.300000000000004,-18.0 L 65.7,-0 L 42.3,18 L 42.3,-18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Tgate":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"86.8pt\" width=\"117.2pt\" viewBox=\"-4.6 -43.4 117.2 86.8\"><circle cx=\"54\" cy=\"-12.96\" r=\"2.88\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 42.3,-0 M 65.7,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 42.300000000000004,-0.0 L 42.3,18 L 65.7,-0 L 42.3,-18 L 42.3,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 65.7,-0.0 L 65.7,18 L 42.3,-0 L 65.7,-18 L 65.7,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,-15.840000000000002 L 54,-25.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,10.080000000000002 L 54,25.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"54.0\" y=\"18.799999999999997\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"10\">c</tspan></text><text x=\"54.0\" y=\"-38.8\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"54.0\" dy=\"10\">cbar</tspan></text></svg>","Tristate":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"66.0pt\" width=\"117.2pt\" viewBox=\"-4.6 -43.4 117.2 66.0\"><circle cx=\"65.7\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 37.98,-0 M 70.02,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 37.98,-18.0 L 61.38,-0 L 37.98,18 L 37.98,-18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 49.67999999999999,-10.080000000000002 L 49.68,-25.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"49.67999999999999\" y=\"-38.8\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"middle\"><tspan x=\"49.67999999999999\" dy=\"10\">c</tspan></text></svg>","Schmitt":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><path d=\"M 0.0,-0.0 L 42.3,-0 M 65.7,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 42.300000000000004,-18.0 L 65.7,-0 L 42.3,18 L 42.3,-18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 44.82000000000001,5.3999999999999995 L 51.3,5.4 L 51.3,-5.4 M 54.18,-5.4 L 47.7,-5.4 L 47.7,5.4\" style=\"stroke:black;fill:none;stroke-width:1;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","SchmittNot":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"117.2pt\" viewBox=\"-4.6 -22.6 117.2 45.2\"><circle cx=\"65.7\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 37.98,-0 M 70.02,-0 L 108,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 37.98,-18.0 L 61.38,-0 L 37.98,18 L 37.98,-18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 40.5,5.3999999999999995 L 46.98,5.4 L 46.98,-5.4 M 49.86,-5.4 L 43.38,-5.4 L 43.38,5.4\" style=\"stroke:black;fill:none;stroke-width:1;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","SchmittAnd":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"75.8pt\" viewBox=\"-4.6 -22.6 75.8 45.2\"><path d=\"M 36.0,18.0 L 37.153,17.963 L 38.302,17.852 L 39.441,17.668 L 40.566,17.411 L 41.672,17.083 L 42.755,16.685 L 43.81,16.217 L 44.833,15.684 L 45.82,15.086 L 46.766,14.425 L 47.668,13.706 L 48.522,12.93 L 49.325,12.101 L 50.073,11.223 L 50.763,10.298 L 51.393,9.331 L 51.959,8.326 L 52.459,7.286 L 52.892,6.217 L 53.256,5.121 L 53.549,4.005 L 53.769,2.873 L 53.917,1.728 L 53.991,0.577 L 53.991,-0.577 L 53.917,-1.728 L 53.769,-2.873 L 53.549,-4.005 L 53.256,-5.121 L 52.892,-6.217 L 52.459,-7.286 L 51.959,-8.326 L 51.393,-9.331 L 50.763,-10.298 L 50.073,-11.223 L 49.325,-12.101 L 48.522,-12.93 L 47.668,-13.706 L 46.766,-14.425 L 45.82,-15.086 L 44.833,-15.684 L 43.81,-16.217 L 42.755,-16.685 L 41.672,-17.083 L 40.566,-17.411 L 39.441,-17.668 L 38.302,-17.852 L 37.153,-17.963 L 36,-18 L 36,-18 L 12.6,-18 L 12.6,-0 L 12.6,18 L 36,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,9.0 L 12.6,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-9.0 L 12.6,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 54.0,-0.0 L 66.6,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 26.820000000000004,5.3999999999999995 L 33.3,5.4 L 33.3,-5.4 M 36.18,-5.4 L 29.7,-5.4 L 29.7,5.4\" style=\"stroke:black;fill:none;stroke-width:1;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","SchmittNand":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"75.8pt\" viewBox=\"-4.6 -22.6 75.8 45.2\"><circle cx=\"58.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 36.0,18.0 L 37.153,17.963 L 38.302,17.852 L 39.441,17.668 L 40.566,17.411 L 41.672,17.083 L 42.755,16.685 L 43.81,16.217 L 44.833,15.684 L 45.82,15.086 L 46.766,14.425 L 47.668,13.706 L 48.522,12.93 L 49.325,12.101 L 50.073,11.223 L 50.763,10.298 L 51.393,9.331 L 51.959,8.326 L 52.459,7.286 L 52.892,6.217 L 53.256,5.121 L 53.549,4.005 L 53.769,2.873 L 53.917,1.728 L 53.991,0.577 L 53.991,-0.577 L 53.917,-1.728 L 53.769,-2.873 L 53.549,-4.005 L 53.256,-5.121 L 52.892,-6.217 L 52.459,-7.286 L 51.959,-8.326 L 51.393,-9.331 L 50.763,-10.298 L 50.073,-11.223 L 49.325,-12.101 L 48.522,-12.93 L 47.668,-13.706 L 46.766,-14.425 L 45.82,-15.086 L 44.833,-15.684 L 43.81,-16.217 L 42.755,-16.685 L 41.672,-17.083 L 40.566,-17.411 L 39.441,-17.668 L 38.302,-17.852 L 37.153,-17.963 L 36,-18 L 36,-18 L 12.6,-18 L 12.6,-0 L 12.6,18 L 36,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,9.0 L 12.6,9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-9.0 L 12.6,-9\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 62.64,-0.0 L 66.6,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 26.820000000000004,5.3999999999999995 L 33.3,5.4 L 33.3,-5.4 M 36.18,-5.4 L 29.7,-5.4 L 29.7,5.4\" style=\"stroke:black;fill:none;stroke-width:1;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Nand(inputs=3)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"75.8pt\" viewBox=\"-4.6 -22.6 75.8 45.2\"><circle cx=\"58.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 36.0,18.0 L 37.153,17.963 L 38.302,17.852 L 39.441,17.668 L 40.566,17.411 L 41.672,17.083 L 42.755,16.685 L 43.81,16.217 L 44.833,15.684 L 45.82,15.086 L 46.766,14.425 L 47.668,13.706 L 48.522,12.93 L 49.325,12.101 L 50.073,11.223 L 50.763,10.298 L 51.393,9.331 L 51.959,8.326 L 52.459,7.286 L 52.892,6.217 L 53.256,5.121 L 53.549,4.005 L 53.769,2.873 L 53.917,1.728 L 53.991,0.577 L 53.991,-0.577 L 53.917,-1.728 L 53.769,-2.873 L 53.549,-4.005 L 53.256,-5.121 L 52.892,-6.217 L 52.459,-7.286 L 51.959,-8.326 L 51.393,-9.331 L 50.763,-10.298 L 50.073,-11.223 L 49.325,-12.101 L 48.522,-12.93 L 47.668,-13.706 L 46.766,-14.425 L 45.82,-15.086 L 44.833,-15.684 L 43.81,-16.217 L 42.755,-16.685 L 41.672,-17.083 L 40.566,-17.411 L 39.441,-17.668 L 38.302,-17.852 L 37.153,-17.963 L 36,-18 L 36,-18 L 12.6,-18 L 12.6,-0 L 12.6,18 L 36,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,11.88 L 12.6,11.88\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 12.6,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-11.88 L 12.6,-11.88\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 62.64,-0.0 L 66.6,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Nor(inputs=4)":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"66.8pt\" width=\"77.60000000000001pt\" viewBox=\"-4.6 -33.4 77.60000000000001 66.8\"><circle cx=\"60.12\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 12.6,17.640000000000004 L 30.6,17.64 L 31.114,17.633 L 31.629,17.611 L 32.143,17.574 L 32.657,17.522 L 33.171,17.456 L 33.686,17.376 L 34.2,17.28 L 34.714,17.17 L 35.229,17.045 L 35.743,16.905 L 36.257,16.751 L 36.771,16.582 L 37.286,16.398 L 37.8,16.2 L 38.314,15.987 L 38.829,15.759 L 39.343,15.517 L 39.857,15.26 L 40.371,14.988 L 40.886,14.701 L 41.4,14.4 L 41.914,14.084 L 42.429,13.753 L 42.943,13.408 L 43.457,13.048 L 43.971,12.673 L 44.486,12.284 L 45,11.88 L 45.514,11.461 L 46.029,11.028 L 46.543,10.58 L 47.057,10.117 L 47.571,9.639 L 48.086,9.147 L 48.6,8.64 L 49.114,8.118 L 49.629,7.582 L 50.143,7.031 L 50.657,6.465 L 51.171,5.885 L 51.686,5.29 L 52.2,4.68 L 52.714,4.056 L 53.229,3.416 L 53.743,2.762 L 54.257,2.094 L 54.771,1.411 L 55.286,0.713 L 55.8,-0 L 55.8,-0 L 55.286,-0.713 L 54.771,-1.411 L 54.257,-2.094 L 53.743,-2.762 L 53.229,-3.416 L 52.714,-4.056 L 52.2,-4.68 L 51.686,-5.29 L 51.171,-5.885 L 50.657,-6.465 L 50.143,-7.031 L 49.629,-7.582 L 49.114,-8.118 L 48.6,-8.64 L 48.086,-9.147 L 47.571,-9.639 L 47.057,-10.117 L 46.543,-10.58 L 46.029,-11.028 L 45.514,-11.461 L 45,-11.88 L 44.486,-12.284 L 43.971,-12.673 L 43.457,-13.048 L 42.943,-13.408 L 42.429,-13.753 L 41.914,-14.084 L 41.4,-14.4 L 40.886,-14.701 L 40.371,-14.988 L 39.857,-15.26 L 39.343,-15.517 L 38.829,-15.759 L 38.314,-15.987 L 37.8,-16.2 L 37.286,-16.398 L 36.771,-16.582 L 36.257,-16.751 L 35.743,-16.905 L 35.229,-17.045 L 34.714,-17.17 L 34.2,-17.28 L 33.686,-17.376 L 33.171,-17.456 L 32.657,-17.522 L 32.143,-17.574 L 31.629,-17.611 L 31.114,-17.633 L 30.6,-17.64 L 12.6,-17.64 L 12.6,-17.64 L 13.291,-16.92 L 13.954,-16.2 L 14.587,-15.48 L 15.192,-14.76 L 15.768,-14.04 L 16.315,-13.32 L 16.834,-12.6 L 17.323,-11.88 L 17.784,-11.16 L 18.216,-10.44 L 18.619,-9.72 L 18.994,-9 L 19.339,-8.28 L 19.656,-7.56 L 19.944,-6.84 L 20.203,-6.12 L 20.434,-5.4 L 20.635,-4.68 L 20.808,-3.96 L 20.952,-3.24 L 21.067,-2.52 L 21.154,-1.8 L 21.211,-1.08 L 21.24,-0.36 L 21.24,0.36 L 21.211,1.08 L 21.154,1.8 L 21.067,2.52 L 20.952,3.24 L 20.808,3.96 L 20.635,4.68 L 20.434,5.4 L 20.203,6.12 L 19.944,6.84 L 19.656,7.56 L 19.339,8.28 L 18.994,9 L 18.619,9.72 L 18.216,10.44 L 17.784,11.16 L 17.323,11.88 L 16.834,12.6 L 16.315,13.32 L 15.768,14.04 L 15.192,14.76 L 14.587,15.48 L 13.954,16.2 L 13.291,16.92 L 12.6,17.64\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,21.6 L 12.6,21.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,7.2 L 19.804,7.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-7.2 L 19.804,-7.2\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-21.6 L 12.6,-21.6\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 12.6,-28.8 L 12.6,-17.64\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 12.6,28.8 L 12.6,17.64\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 64.44000000000001,-0.0 L 68.4,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","Nand(inputs=3, inputnots=[1])":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"45.2pt\" width=\"75.8pt\" viewBox=\"-4.6 -22.6 75.8 45.2\"><circle cx=\"58.32\" cy=\"-0\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><circle cx=\"8.28\" cy=\"-11.88\" r=\"4.32\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 36.0,18.0 L 37.153,17.963 L 38.302,17.852 L 39.441,17.668 L 40.566,17.411 L 41.672,17.083 L 42.755,16.685 L 43.81,16.217 L 44.833,15.684 L 45.82,15.086 L 46.766,14.425 L 47.668,13.706 L 48.522,12.93 L 49.325,12.101 L 50.073,11.223 L 50.763,10.298 L 51.393,9.331 L 51.959,8.326 L 52.459,7.286 L 52.892,6.217 L 53.256,5.121 L 53.549,4.005 L 53.769,2.873 L 53.917,1.728 L 53.991,0.577 L 53.991,-0.577 L 53.917,-1.728 L 53.769,-2.873 L 53.549,-4.005 L 53.256,-5.121 L 52.892,-6.217 L 52.459,-7.286 L 51.959,-8.326 L 51.393,-9.331 L 50.763,-10.298 L 50.073,-11.223 L 49.325,-12.101 L 48.522,-12.93 L 47.668,-13.706 L 46.766,-14.425 L 45.82,-15.086 L 44.833,-15.684 L 43.81,-16.217 L 42.755,-16.685 L 41.672,-17.083 L 40.566,-17.411 L 39.441,-17.668 L 38.302,-17.852 L 37.153,-17.963 L 36,-18 L 36,-18 L 12.6,-18 L 12.6,-0 L 12.6,18 L 36,18\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,11.88 L 12.6,11.88\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-0.0 L 12.6,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 0.0,-11.88 L 3.96,-11.88\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 62.64,-0.0 L 66.6,-0\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /></svg>","AnalogBiasedFet(arrow=False) [electrical_184_0]":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:lang=\"en\" height=\"96.39999999999999pt\" width=\"100.39999999999999pt\" viewBox=\"-39.099999999999994 -18.2 100.39999999999999 96.39999999999999\"><circle cx=\"4.5\" cy=\"45\" r=\"2.25\" style=\"stroke:black;fill:black;stroke-width:2;stroke-dasharray:-;\" /><path d=\"M 0.0,-0.0 L 0,15 L 15,15 L 15,45 L 0,45 L 0,60\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,17.999999999999996 L 18,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><path d=\"M 17.999999999999996,42.0 L 33,42\" style=\"stroke:black;fill:none;stroke-width:2;stroke-dasharray:-;stroke-linecap:round;stroke-linejoin:round;\" /><text x=\"36.599999999999994\" y=\"32.0\" dominant-baseline=\"central\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"start\"><tspan x=\"36.599999999999994\" dy=\"10\">gate</tspan></text><text x=\"-3.6\" y=\"53.599999999999994\" dominant-baseline=\"hanging\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">source</tspan></text><text x=\"-3.6\" y=\"-13.6\" dominant-baseline=\"ideographic\" fill=\"blue\" font-size=\"10\" font-family=\"sans\" text-anchor=\"end\"><tspan x=\"-3.6\" dy=\"10\">drain</tspan></text></svg>"});

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
  const inductorPath = () => {
    let d = 'M 0,0 L 36,0';
    for (let i = 0; i < 4; i++) d += ` M ${36 + i * 9},0 a 4.5,4.5 0 1 1 9,0`;
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
  const sourceSinPath = () => {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const x = Number((54 + 7.2 * Math.sin(Math.PI * i / 12)).toFixed(3));
      const y = Number((9 - 0.75 * i).toFixed(3));
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
        const px = x => (x * P).toFixed(3);
        const py = y => (-y * P).toFixed(3);
        // p1_path: (0,0) gap (2r, .1) → (.8/.7, .45/.25) gap (1, .4)
        const x1 = 2 * dotR, y1 = 0.1, x2 = dpdt ? 0.7 : 0.8, y2 = dpdt ? 0.25 : 0.45;
        const seg1 = contacts
          ? `M ${px(x1)},${py(y1)} L ${px(x2)},${py(y2)}`
          : `M 0,0 L ${px(x2)},${py(y2)}`;
        // p2_path: (2r, yofst+.1) → (.8/.7, yofst+.45/.25)
        const seg2 = contacts
          ? `M ${px(x1)},${py(yofst + y1)} L ${px(x2)},${py(yofst + y2)}`
          : `M 0,${py(yofst)} L ${px(x2)},${py(yofst + y2)}`;
        let dots = '';
        if (contacts) {
          const half = 1 - dotR;
          const pts = dpdt
            ? [[dotR, 0], [half, -0.4], [half, 0.4], [dotR, yofst], [half, yofst - 0.4], [half, yofst + 0.4]]
            : [[dotR, 0], [half, 0], [dotR, yofst], [half, yofst]];
          dots = pts.map(([x, y]) => switchDot(x * P, -y * P, c)).join('');
        }
        // link: (0.5, yofst+.25) → (0.5, 0.2), dotted
        const bar = link
          ? `<path d="M ${px(0.5)},${py(yofst + 0.25)} L ${px(0.5)},${py(0.2)}" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="2 3.3"/>`
          : '';
        return `<path d="${seg1} ${seg2}" ${s}/>${bar}${dots}`;
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
        const contacts = options.contacts !== false, nc = options.nc === true, link = options.link !== false;
        const lever = nc ? 'M 44.64,0 L 65.7,-5.4' : 'M 44.64,-3.6 L 64.8,-16.2';
        const dots = contacts
          ? switchDot(40.32, 0, c) + switchDot(67.68, 0, c)
          : (nc ? `<path d="M 67.68,0 L 67.68,-5.4" ${s}/>` : '');
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
        const dots = switchDot(40.32, 0, c) + switchDot(67.68, 0, c) +
          (contacts ? switchDot(67.68, -25.2, c) : '');
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
        const dots = contacts
          ? switchDot(4.32, 0, c) + switchDot(31.68, 14.4, c) + switchDot(31.68, -14.4, c) : '';
        const action = options.action;
        // `SegmentArc((.35, 0))` / `((.30, 0))` in the element's local frame.
        const arrow = action === 'open' || action === 'close'
          ? switchArc(action === 'open' ? 0.35 : 0.3, 0, 0.5, 0.75, -10, 70, action === 'open' ? 'ccw' : 'cw', c) : '';
        return `<path d="${lever}" ${s}/>${dots}${arrow}`;
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
      body: (s, c) => `<path d="${fuseSine}" ${s}/><circle cx="33.84" cy="0" r="4.32" fill="white" stroke="${c}" stroke-width="2"/><circle cx="74.16" cy="0" r="4.32" fill="white" stroke="${c}" stroke-width="2"/>`
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
    return [9, 9];
  }

  // Local anchors of a two-terminal element, in the element's unrotated SVG
  // frame (x along the element, y down). `reverse` mirrors x about the body
  // centre and `sy` is -1 for `flip`, matching the drawing code below.
  // The points here are also used to publish a named element's anchors.
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
    if (type === 'BatteryDouble') points.tap = [bodyCenter - batterySpan / 2 + 27, -13.5 * sy];
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
      const right = contacts ? 31.68 : 36;
      const px = contacts ? 4.32 : 0;
      const ax = lx => mx(bodyCenter - 54 + px + (lx - 4.32));
      points.p1 = [ax(4.32), 0];
      points.t1 = [ax(right - px + 4.32), dpdt ? -14.4 * sy : 0];
      if (dpdt) points.t2 = [ax(right - px + 4.32), 14.4 * sy];
      points.p2 = [ax(4.32), pole2 * sy];
      if (!dpdt) points.t2 = [ax(right - px + 4.32), pole2 * sy];
      points.t3 = [ax(right - px + 4.32), dpdt ? (pole2 - 14.4) * sy : pole2 * sy];
      if (dpdt) points.t4 = [ax(right - px + 4.32), (pole2 + 14.4) * sy];
    }
    if (type === 'MeterArrow') {
      // Source anchors istart/iend are the ends of the 1-unit body.
      points.istart = [bodyCenter - 18, 0];
      points.iend = [bodyCenter + 18, 0];
    }
    if (type === 'Inductor2') {
      const a = bodyCenter - 18, b = bodyCenter + 18;
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
        if (!['top', 'bot', 'bottom', 'left', 'right', 'start', 'end', 'istart', 'iend', 'base', 'collector', 'emitter', 'center', 'C2', 'gate', 'source', 'drain', 'bulk', 'name', 'in1', 'in2', 'out', 'c', 'cbar', 'display', 'vd', 'vs', 'n1', 'n2', 'n1a', 'n2a'].includes(locAlias) && !/^in\d+$/.test(locAlias) && !/^p\d+(?:_in)?$/.test(locAlias) && !/^(?:N|S|E|W|NE|NW|SE|SW)$/.test(locAlias)) throw new Error(`Invalid label location: ${word}`);
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
    const allowed = ['at', 'anchor', 'theta', 'color', 'drop', 'hold', 'fill',
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
      const m = /^([A-Za-z_]\w*)\.([A-Za-z_]\w*)$/.exec(ref || '');
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
      if (!record.sub && !['Resistor', 'ResistorIEEE', 'ResistorIEC', 'ResistorVar', 'ResistorVarIEC', 'ResistorVarIEEE', 'Capacitor', 'Capacitor2', 'Inductor', 'Inductor2', 'CPE', 'Nullator', 'Norator', 'Diode', 'DiodeTunnel', 'DiodeTVS', 'DiodeShockley', 'Josephson', 'Zener', 'LED', 'Diac', 'Schottky', 'Varactor', 'Potentiometer', 'PotentiometerIEC', 'PotentiometerIEEE', 'Rshunt', 'SCR', 'Triac', 'Fuse', 'FuseIEC', 'FuseIEEE', 'RBox', 'Thermistor', 'Crystal', 'CapacitorVar', 'CapacitorTrim', 'Photoresistor', 'PhotoresistorBox', 'PhotoresistorIEC', 'PhotoresistorIEEE', 'Coax', 'Triax', 'Motor', 'BusLine', 'DataBusLine', 'BusConnect', 'CoaxConnect', 'Plug', 'Jack', 'Terminal', 'Jumper', 'DE9', 'DB25', 'DA15', 'DC37', 'DD50', 'Switch', 'Button', 'SwitchSpdt', 'SwitchSpdt2', 'SwitchDpst', 'SwitchDpdt', 'SwitchRotary', 'SwitchDIP', 'SwitchReed', 'Battery', 'BatteryCell', 'BatteryDouble', 'Line', 'Wire', 'OrthoLines', 'Dot', 'Source', 'SourceSin', 'SourceV', 'SourceI', 'SourcePulse', 'SourceSquare', 'SourceTriangle', 'SourceRamp', 'Lamp', 'Lamp2', 'Solar', 'Neon', 'Photodiode', 'LED2', 'FuseUS', 'Memristor', 'Memristor2', 'SparkGap', 'MeterV', 'MeterA', 'MeterI', 'MeterOhm', 'MeterArrow', 'SourceControlled', 'SourceControlledV', 'SourceControlledI', 'Gap', 'Breaker', 'Optocoupler', 'Relay', 'Opamp', 'Ground', 'GroundSignal', 'GroundChassis', 'Vdd', 'Vss', 'NoConnect', 'Antenna', 'AntennaLoop', 'AntennaLoop2', 'Speaker', 'Mic', 'AudioJack', "OutletA","OutletB","OutletC","OutletD","OutletE","OutletF","OutletG","OutletH","OutletI","OutletJ","OutletK","OutletL", 'Arrowhead', 'DotDotDot', 'Label', 'Tag', 'Bjt', 'JFet', 'Hemt', 'NpnSchottky', 'PnpSchottky', 'BjtNpn', 'BjtPnp', 'BjtPnp2c', 'BjtNpn2', 'BjtPnp2', 'BjtPnp2c2', 'IgbtN', 'IgbtP', 'NpnPhoto', 'PnpPhoto', 'AnalogNFet', 'AnalogPFet', 'AnalogBiasedFet', 'NMos2', 'PMos2', 'NFet2', 'PFet2', 'JFetN2', 'JFetP2', 'JFetN', 'JFetP', 'NFet', 'PFet', 'NMos', 'PMos', 'CurrentMirror', 'VoltageMirror', 'Ic', 'Multiplexer', 'VoltageRegulator', 'DFlipFlop', 'JKFlipFlop', 'Ic555', 'SevenSegment', 'MeterBox', 'MeterAnalog', 'MeterDigital', 'Oscilloscope', 'IcDIP', 'Header', 'Transformer', 'LoopCurrent', 'CurrentLabel', 'CurrentLabelInline', 'Rectifier', 'Triode', 'DualVacuumTube', 'Nullor', 'VoltageTransactor', 'TransimpedanceTransactor', 'CurrentTransactor', 'TransadmittanceTransactor', 'Box', 'Square', 'Circle', 'Sum', 'SumSigma', 'Mixer', 'Amp', 'OscillatorBox', 'Oscillator', 'Filter', 'Adc', 'Dac', 'Demod', 'Circulator', 'Isolator', 'VGA', 'dsp_Speaker', ...logicGateTypes].includes(type)) throw new Error(`Unsupported component: ${type}`);
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
          if (!record.sub && !['at', 'to', 'tox', 'toy', 'endpoints', 'anchor', 'theta', 'color', 'drop', 'shift', 'scale', 'tap_length', 'idot', 'dot', 'leads', 'lead', 'hold', 'flip', 'reverse', 'length', 'shape', 'k', 'arrow', 'delta', 'dx', 'dy', 'size', 'pin', 'side', 'preclr', 'preclrinvert', 'slant', 'pinspacing', 'demux', 'decimal', 'digit', 'segcolor', 'tilt', 'labelsegments', 'anode', 'cathode', 'needle_percent', 'window_fill', 'input_fill', 'signal', 'signal_color', 'signal_lw', 'grid', ...(DSP_TYPES.has(type) ? ['w', 'h', 'minsize', 'pad', 'radius', 'response', 'tuneup', 'N', 'E', 'S', 'W', 'fill'] : []), ...(['IcDIP', 'Header', 'Transformer'].includes(type) ? ['pins', 'notch', 'width', 'pinw', 'spacing', 'number', 'pfontsize', 'rows', 'cols', 'style', 'numbering', 'shownumber', 'pinspacing', 'edge', 'pinfill', 't1', 't2', 'core', 'loop', 'align', 'pinsleft', 'pinsright', 'pinalignleft', 'pinalignright', 'pinfontsizeleft', 'pinfontsizeright'] : []), ...(['NFet2', 'PFet2', 'NFet', 'PFet'].includes(type) ? ['bulk'] : []), ...(['JFetN2', 'JFetP2'].includes(type) ? ['circle'] : []), ...(['AnalogNFet', 'AnalogPFet', 'AnalogBiasedFet'].includes(type) ? ['bulk', 'offset_gate', 'source_arrow'] : []), ...(type === 'Breaker' ? ['dots'] : []), ...(type === 'Optocoupler' ? ['box', 'boxfill', 'boxpad', 'base'] : []), ...(type === 'Relay' ? ['switch', 'core', 'link', 'box', 'boxfill', 'boxpad', 'swreverse', 'swflip', 'unit', 'cycl'] : []), ...(type === 'Inductor2' ? ['loops', 'core'] : []), ...(type === 'Capacitor2' ? ['polar'] : []), ...(type === 'Josephson' ? ['box'] : []), ...(type === 'Coax' ? ['radius', 'leadlen'] : []), ...(type === 'Triax' ? ['radiusinner', 'radiusouter', 'leadlen', 'shieldofststart', 'shieldofstend'] : []), ...(type === 'BusLine' ? ['lw'] : []), ...(type === 'BusConnect' ? ['n', 'slant_up', 'dy', 'lwbus', 'l'] : []), ...(type === 'CoaxConnect' ? ['radius', 'radiusinner', 'fillinner'] : []), ...(type === 'Terminal' ? ['r', 'open'] : []), ...(type === 'Jumper' ? ['pinspacing'] : []), ...(['DE9', 'DB25', 'DA15', 'DC37', 'DD50'].includes(type) ? ['pinspacing', 'edge', 'number', 'pinfill'] : []), ...(['MeterBox', 'MeterAnalog', 'MeterDigital', 'Oscilloscope'].includes(type) ? ['width', 'corner', 'inputs', 'input_ofst', 'input_lw', 'input_rad'] : []), ...(type === 'MeterAnalog' ? ['needle_color', 'needle_width'] : []), ...(['MeterDigital', 'Oscilloscope'].includes(type) ? ['screen_fill', 'screen_lw'] : []), ...(type === 'Oscilloscope' ? ['grid_color', 'grid_lw'] : []), ...(logicMultiInputTypes.has(type) ? ['inputs', 'inputnots', 'leadin', 'leadout'] : []), ...(type === 'Tristate' ? ['outputnot', 'controlnot'] : []), ...(type === 'Ic' ? ['plblofst', 'botlabel'] : []), ...(type === 'OrthoLines' ? ['n', 'dy', 'xstart'] : []), ...(type === 'Capacitor' ? ['polar'] : []), ...(type === 'Inductor' ? ['core'] : []), ...(['Diode', 'LED'].includes(type) ? ['fill'] : []), ...(type === 'Dot' ? ['open'] : []), ...(type === 'Opamp' ? ['sign'] : []), ...(type === 'Button' ? ['nc', 'contacts'] : []), ...(['NMos', 'PMos', 'NMos2', 'PMos2'].includes(type) ? ['diode'] : []), ...(['NFet', 'PFet'].includes(type) ? ['bulk'] : []), ...(['Switch', 'SwitchSpdt', 'SwitchSpdt2'].includes(type) ? ['contacts', 'nc', 'action'] : []), ...(type === 'SwitchRotary' ? ['n', 'dtheta', 'theta0', 'radius', 'arrowlen', 'arrowcontact'] : []), ...(type === 'SwitchDIP' ? ['n', 'pattern', 'switchcolor', 'swidth', 'spacing'] : []), ...(['SwitchDpst', 'SwitchDpdt'].includes(type) ? ['contacts', 'link'] : []), ...(['Bjt', 'JFet', 'NpnSchottky', 'PnpSchottky', 'BjtNpn', 'BjtPnp', 'BjtPnp2c', 'JFetN', 'JFetP', 'NMos', 'PMos', 'NMos2', 'PMos2'].includes(type) ? ['circle'] : []), ...(type === 'Hemt' ? ['split', 'source_arrow'] : []), ...(type === 'AudioJack' ? ['ring', 'switch', 'ringswitch', 'dots', 'open', 'radius'] : []), ...(/^Outlet[A-L]$/.test(type) ? ['plug'] : []), ...(type === 'Arrowhead' ? ['headwidth', 'headlength'] : []), ...(type === 'DotDotDot' ? ['radius', 'open'] : []), ...(type === 'Tag' ? ['width', 'height'] : []), ...(type === 'Arrow' ? ['double'] : []), ...(type === 'LoopCurrent' ? ['elms', 'pad', 'direction', 'theta1', 'theta2'] : []), ...(type === 'CurrentLabel' ? ['top', 'ofst', 'headlength', 'headwidth'] : []), ...(type === 'CurrentLabelInline' ? ['direction', 'start', 'ofst', 'headlength', 'headwidth'] : []), ...(['Nullor', 'VoltageTransactor', 'TransimpedanceTransactor', 'CurrentTransactor', 'TransadmittanceTransactor'].includes(type) ? ['reverse_output'] : []), ...(type === 'Triode' ? ['heater', 'split'] : []), ...(type === 'DualVacuumTube' ? ['grids_left', 'grids_right', 'heater', 'cathode', 'anodetype'] : [])].includes(key)) throw new Error(`Unsupported argument: ${key}`);
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
      if ('endpoints' in options && ['at', 'to', 'tox', 'toy'].some(key => key in options)) throw new Error('endpoints cannot be combined with at, to, tox, or toy.');
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
      if (!isMeter && (labels.some(label => (!labelStyleAllowed(label) && (label.fontsize !== undefined || label.color !== undefined)) || (!logicGateTypes.has(type) && type !== 'Opamp' && ['name', 'in1', 'in2', 'display'].includes(label.loc))) || ['needle_percent', 'window_fill', 'input_fill', 'signal', 'signal_color', 'signal_lw', 'grid'].some(key => key in options))) throw new Error(`The specified arguments are not supported for ${type}.`);
      if (type !== 'Wire' && (['shape', 'k'].some(key => key in options) || (type !== 'Line' && 'arrow' in options))) throw new Error(`Wire arguments cannot be used with ${type}.`);
      if (type === 'Line' && 'arrow' in options && !['->', '<-', '<->', '|->', '|-o', 'o-', '-o', 'o-o'].includes(options.arrow)) throw new Error('Invalid Line arrow.');
      if (type === 'Rectifier') {
        // Schemdraw's Rectifier: four diodes forming a bridge, with N/S/E/W
        // anchors. It is a compound element, so it does not move the cursor.
        if (selectedDirection || length !== null || Object.keys(options).some(key => !['at', 'anchor', 'theta', 'color', 'fill'].includes(key))) throw new Error('Rectifier supports at, anchor, theta, color, and fill.');
        if ('at' in options) [x, y] = atPoint(options.at);
        let theta = 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          theta = Number(options.theta);
        }
        const c = 76.36753236814713, full = 2 * 76.36753236814713;
        const local = { W: [0, 0], N: [c, -c], E: [full, 0], S: [c, c] };
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
        elements.push(`<g transform="translate(${x} ${y}) rotate(${-theta})">${body}</g>`);
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
        const allowed = ['at', 'anchor', 'theta', 'color', 'grids_left', 'grids_right', 'heater', 'cathode', 'anodetype'];
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
        let body = `<rect x="${-halfW}" y="0" width="${WIDTH}" height="${H}" rx="${Math.min(halfW, H / 2)}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
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
        if ('anchor' in options && !Object.prototype.hasOwnProperty.call(localAnchors, options.anchor)) throw new Error(`Unknown anchor: ${options.anchor}`);
        const origin = 'at' in options ? atPoint(options.at) : [x, y];
        const offset = 'anchor' in options ? localAnchors[options.anchor] : [0, 0];
        const rad = -theta * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
        const tf = ([px, py]) => [origin[0] + (px - offset[0]) * cos - (py - offset[1]) * sin, origin[1] + (px - offset[0]) * sin + (py - offset[1]) * cos];
        const transform = `translate(${origin[0]} ${origin[1]})`
          + (theta ? ` rotate(${-theta})` : '')
          + (offset[0] || offset[1] ? ` translate(${-offset[0]} ${-offset[1]})` : '');
        elements.push(`<g transform="${transform}">${body}</g>`);
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
        for (const corner of [[-halfW, 0], [halfW, 0], [halfW, H], [-halfW, H]]) {
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
      if (type === 'Triode') {
        // Schemdraw's Triode (elements/tubes.py). Coordinates follow
        // VacuumTube._draw_envelope/_draw_elements: tube_w=1.75, grid_w=0.7,
        // grid_ygap=tube_w/9, n_grid_dashes=3, dot_radius=0.075, heated
        // cathode, plate anode, no heater.
        const allowed = ['at', 'anchor', 'theta', 'color', 'heater', 'split'];
        if (selectedDirection || length !== null || Object.keys(options).some(key => !allowed.includes(key))) throw new Error('Triode supports at, anchor, theta, color, heater, and split.');
        if ('heater' in options) {
          if (!['True', 'False'].includes(options.heater)) throw new Error('heater must be True or False.');
          if (options.heater === 'True') throw new Error('Triode heater=True is not supported.');
        }
        if ('split' in options && options.split !== 'none') throw new Error('Triode split other than none is not supported.');
        let theta = 0;
        if ('theta' in options) {
          if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
          theta = Number(options.theta);
        }
        const TUBE_W = 1.75 * 36;
        const TUBE_R = TUBE_W / 2;
        const GRID_W = TUBE_W * 0.4;
        const GRID_GAP = TUBE_W / 9;
        const DOT_R = 0.075 * 36;
        const H = TUBE_W;
        // SVG y grows downward: the anode N is at y=0 and the envelope bottom at y=H.
        const gridY = H / 2;
        const anodeY = gridY - GRID_GAP;
        const catY = gridY + GRID_GAP;
        const gridLeft = -GRID_W / 2, gridRight = GRID_W / 2;
        const gridXGap = GRID_W / (3 + 2);
        const gridDashW = (GRID_W - gridXGap * 2) / 3;
        const gridXs = [0, 1, 2].map(i => gridLeft + i * (gridDashW + gridXGap));
        const sq2 = TUBE_R / Math.SQRT2;
        const localAnchors = {
          N: [0, 0], S: [0, H], E: [TUBE_R, H / 2], W: [-TUBE_R, H / 2],
          NE: [sq2, TUBE_R - sq2], NW: [-sq2, TUBE_R - sq2],
          SE: [sq2, TUBE_R + sq2], SW: [-sq2, TUBE_R + sq2],
          anode: [0, 0],
          grid: [gridLeft - gridXGap, gridY], grid_R: [gridRight + gridXGap, gridY],
          control: [gridLeft - gridXGap, gridY], control_R: [gridRight + gridXGap, gridY],
          cathode: [gridLeft, catY + DOT_R * 2], cathode_R: [gridRight, catY + DOT_R * 2]
        };
        if ('anchor' in options && !Object.prototype.hasOwnProperty.call(localAnchors, options.anchor)) throw new Error(`Unknown anchor: ${options.anchor}`);
        const origin = 'at' in options ? atPoint(options.at) : [x, y];
        const offset = 'anchor' in options ? localAnchors[options.anchor] : [0, 0];
        const rad = -theta * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
        const tf = ([px, py]) => [origin[0] + (px - offset[0]) * cos - (py - offset[1]) * sin, origin[1] + (px - offset[0]) * sin + (py - offset[1]) * cos];
        let body = `<circle cx="0" cy="${H / 2}" r="${TUBE_R}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
        const seg = (x1, y1, x2, y2, lw = 2) => { body += `<path d="M ${x1},${y1} L ${x2},${y2}" fill="none" stroke="${color}" stroke-width="${lw}" stroke-linecap="round"/>`; };
        // Anode plate and its lead from N.
        seg(gridLeft, anodeY, gridRight, anodeY);
        seg(0, 0, 0, anodeY);
        // Control grid: three dashes.
        for (const gx of gridXs) seg(gx, gridY, gx + gridDashW, gridY);
        // Heated cathode.
        body += `<path d="M ${gridLeft},${catY + DOT_R * 2} L ${gridLeft},${catY} L ${gridRight},${catY} L ${gridRight},${catY + DOT_R * 2}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
        const transform = `translate(${origin[0]} ${origin[1]})`
          + (theta ? ` rotate(${-theta})` : '')
          + (offset[0] || offset[1] ? ` translate(${-offset[0]} ${-offset[1]})` : '');
        elements.push(`<g transform="${transform}">${body}</g>`);
        labels.forEach((label, i) => {
          if (label.rotate !== undefined) throw new Error('Triode does not support label rotation.');
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          if (label.loc) {
            if (!Object.prototype.hasOwnProperty.call(localAnchors, label.loc)) throw new Error(`Unknown Triode label anchor: ${label.loc}`);
            const [px, py] = localAnchors[label.loc];
            const hints = { NE: [.12, .12, 'left'], NW: [-.12, .12, 'right'], SE: [.12, -.12, 'left'], SW: [-.12, -.12, 'right'] }[label.loc];
            const ox = hints ? hints[0] : (Array.isArray(label.ofst) ? label.ofst[0] : 0);
            const oy = hints ? hints[1] : (Array.isArray(label.ofst) ? label.ofst[1] : (label.ofst == null ? 0.1 : label.ofst));
            const halign = hints ? hints[2] : 'center';
            const [lx, ly] = tf([px + ox * 36, py - oy * 36]);
            const anchor = { left: 'start', center: 'middle', right: 'end' }[label.halign || halign];
            elements.push(`<text x="${lx}" y="${ly - size}" dominant-baseline="central" text-anchor="${anchor}"${textFill} font-family="sans-serif" font-size="${size}"><tspan x="${lx}" dy="${size}">${labelContent(label.text)}</tspan></text>`);
            return;
          }
          const anchorY = -0.1 * 36;
          const [lx, ly] = tf([0, anchorY - i * (size + 2)]);
          elements.push(`<text x="${lx}" y="${ly - size}" dominant-baseline="ideographic" text-anchor="middle"${textFill} font-family="sans-serif" font-size="${size}"><tspan x="${lx}" dy="${size}">${labelContent(label.text)}</tspan></text>`);
        });
        const anchors = Object.create(null);
        for (const [key, point] of Object.entries(localAnchors)) anchors[key] = tf(point);
        for (const corner of [[-TUBE_R, 0], [TUBE_R, 0], [TUBE_R, H], [-TUBE_R, H]]) {
          const [bx, by] = tf(corner);
          bounds(bx, by, bx, by);
        }
        if (name) {
          names[name] = anchors;
          namedTypes[name] = type;
          namedDirs[name] = [1, 0];
          namedBoxes[name] = { ...elemBox };
        }
        log(`Triode: at (${origin[0] / 36}, ${-origin[1] / 36})`);
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
        const allowedSS = ['at', 'anchor', 'drop', 'theta', 'color', 'decimal', 'digit', 'segcolor', 'tilt', 'labelsegments', 'anode', 'cathode'];
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
        const slots = decimal ? 8 : 7;
        const pins = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((n, i) => ({ side: 'L', num: n, anchor: n, slot: `${slots - i}/${slots}` }));
        if (decimal) pins.push({ side: 'L', num: 'dp', anchor: 'dp', slot: `1/${slots}` });
        if (anode) pins.push({ side: 'T', num: 'ca', anchor: 'anode' });
        if (cathode) pins.push({ side: 'B', num: 'cc', anchor: 'cathode' });
        const anchors = { center: [W / 2, -HH / 2], xy: [0, 0] };
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
            const end = side === 'L' ? [p[0] - 18, p[1]] : side === 'R' ? [p[0] + 18, p[1]] : side === 'T' ? [p[0], p[1] - 18] : [p[0], p[1] + 18];
            leads += `M ${p[0]},${p[1]} L ${end[0]},${end[1]} `;
            if (side === 'L') texts += `<text x="-2.7" y="${-z - 2.7}" text-anchor="end"${textFill} font-family="sans-serif" font-size="11">${pin.num}</text>`;
            else if (side === 'R') texts += `<text x="${W + 2.7}" y="${-z - 2.7}" text-anchor="start"${textFill} font-family="sans-serif" font-size="11">${pin.num}</text>`;
            else if (side === 'T') texts += `<text x="${z + 2.7}" y="${-HH - 2.7}" text-anchor="start"${textFill} font-family="sans-serif" font-size="11">${pin.num}</text>`;
            else texts += `<text x="${z + 2.7}" y="2.7" text-anchor="start" dominant-baseline="hanging"${textFill} font-family="sans-serif" font-size="11">${pin.num}</text>`;
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
          const points = pts.map(([px, py]) => `${(px * 36).toFixed(3)},${(-py * 36).toFixed(3)}`).join(' ');
          return `<polygon points="${points}" fill="${fills[name] ? segcolor : 'none'}" stroke="gray" stroke-width="0.5"/>`;
        };
        let glyph = poly(segA, 'a') + poly(segB, 'b') + poly(segC, 'c') + poly(segD, 'd') + poly(segE, 'e') + poly(segF, 'f') + poly(segG, 'g');
        if (decimal) glyph += `<circle cx="${(left + seglen + segw + .075) * 36}" cy="${-bottom * 36}" r="5.4" fill="${segcolor}" stroke="gray" stroke-width="0.5"/>`;
        if (labelsegments) {
          const labels = {
            a: [seglen / 2 + halfspace, seglen * 2 + halfw + marginy, 'middle', ''],
            g: [seglen / 2 + halfspace, seglen + halfw + marginy, 'middle', ''],
            d: [seglen / 2 + halfspace, halfw + marginy, 'middle', ''],
            b: [seglen + halfw + halfspace, seglen * 1.5, 'start', ' dominant-baseline="central"'],
            c: [seglen + halfw + halfspace, seglen * .5, 'start', ' dominant-baseline="central"'],
            e: [-halfw - halfspace, seglen * .5, 'end', ' dominant-baseline="central"'],
            f: [-halfw - halfspace, seglen * 1.5, 'end', ' dominant-baseline="central"']
          };
          for (const [ch, [sx2, sy2, anchor2, base2]] of Object.entries(labels)) {
            const tx = (sx2 + lam * sy2 + left) * 36, ty = -(sy2 + bottom) * 36;
            glyph += `<text x="${tx}" y="${ty}" text-anchor="${anchor2}"${base2}${textFill} font-family="sans-serif" font-size="10">${ch}</text>`;
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
        let body = `<path d="M 0,0 L ${W},0 L ${W},${-HH} L 0,${-HH} Z" ${stroke}/><path d="${leads}" ${stroke}/>${glyph}`;
        for (const label of labels) body += `<text x="${W / 2}" y="${-HH / 2}" text-anchor="middle" dominant-baseline="central"${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(label.text)}</text>`;
        elements.push(`<g transform="translate(${bodyX} ${bodyY}) rotate(${angle2})">${body}${texts}</g>`);
        for (const [lx, ly] of [[-20, -HH - 20], [W + 20, 20], [-20, 20], [W + 20, -HH - 20]]) {
          const [bx2, by2] = placed.transform(lx, ly);
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
        const rounded = (points, r) => {
          const seg = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
          let d = '';
          points.forEach((p, i) => {
            const prev = points[(i + points.length - 1) % points.length], next = points[(i + 1) % points.length];
            const inLen = seg(p, prev), outLen = seg(next, p);
            const before = [p[0] + (prev[0] - p[0]) / inLen * r, p[1] + (prev[1] - p[1]) / inLen * r];
            const after = [p[0] + (next[0] - p[0]) / outLen * r, p[1] + (next[1] - p[1]) / outLen * r];
            d += `${i ? 'L' : 'M'} ${before[0].toFixed(3)},${before[1].toFixed(3)} Q ${p[0]},${p[1]} ${after[0].toFixed(3)},${after[1].toFixed(3)} `;
          });
          return d + 'Z';
        };
        let glyph = `<path d="${rounded(pts, 9)}" ${stroke}/>`;
        const anchors = { xy: [0, 0] }, pinCircles = [];
        const addPin = (px, py, num) => {
          anchors[`pin${num}`] = [px, py];
          glyph += `<circle cx="${px}" cy="${py}" r="3.6" fill="${pinfill}" stroke="${color}" stroke-width="2"/>`;
          pinCircles.push([px, py]);
          if (number) glyph += `<text x="${px}" y="${py - 12.6}" text-anchor="middle" dominant-baseline="ideographic"${textFill} font-family="sans-serif" font-size="9">${num}</text>`;
        };
        for (let c = 0; c < cfg.cols.length; c++) {
          const px = edge + c * sp;
          for (let i = 0; i < cfg.cols[c]; i++) {
            const leftStyle = type === 'DD50' ? c !== 1 : c === 0;
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
        const placed = placeComponent({ anchors }, [x, y], { direction: [dx2, dy2], anchor: options.anchor === undefined ? null : options.anchor });
        const [bodyX, bodyY] = placed.transform(0, 0);
        for (const label of labels) glyph += `<text x="${w / 2}" y="${-h2 / 2}" text-anchor="middle" dominant-baseline="central"${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(label.text)}</text>`;
        elements.push(`<g transform="translate(${bodyX} ${bodyY}) rotate(${angle2})">${glyph}</g>`);
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
          glyph = `<circle cx="0" cy="0" r="${r1}" fill="none" stroke="${color}" stroke-width="2"/><circle cx="0" cy="0" r="${r2}" fill="${fill}" stroke="${color}" stroke-width="2"/>`;
          anchors = { center: [0, 0], N: [0, r1], S: [0, -r1], E: [r1, 0], W: [-r1, 0], xy: [0, 0] };
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
          glyph = `<circle cx="0" cy="0" r="${r}" fill="${open ? 'white' : color}" stroke="${color}" stroke-width="2"/><path d="M ${-r},${2 * r} L ${r},${-2 * r}" ${stroke}/>`;
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
        const placed = placeComponent({ anchors }, [x, y], { direction: [dx2, dy2], anchor: options.anchor === undefined ? null : options.anchor });
        const [bodyX, bodyY] = placed.transform(0, 0);
        elements.push(`<g transform="translate(${bodyX} ${bodyY}) rotate(${angle2})">${glyph}</g>`);
        // Redraw the cover circle (and the terminal slash on top of it) last.
        if (coverFill !== null) {
          overlay.push(`<g transform="translate(${bodyX} ${bodyY}) rotate(${angle2})"><circle cx="0" cy="0" r="${coverRadius}" fill="${coverFill}" stroke="${color}" stroke-width="2"/>${coverShadow}</g>`);
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
        const placed = placeComponent({ anchors }, [x, y], { direction: [dx2, dy2], anchor: options.anchor === undefined ? null : options.anchor });
        const [bodyX, bodyY] = placed.transform(0, 0);
        elements.push(`<g transform="translate(${bodyX} ${bodyY}) rotate(${angle2})">${glyph}</g>`);
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
          body += `<path d="M 0,0 L 0,18 M 0,54 L 0,72 M 0,18 a 4.5 4.5 -270 1 1 0 9 M 0,27 a 4.5 4.5 -270 1 1 0 9 M 0,36 a 4.5 4.5 -270 1 1 0 9 M 0,45 a 4.5 4.5 -270 1 1 0 9" ${stroke}/>`;
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
        const placed = placeComponent({ anchors }, [x, y], { direction: [dx2, dy2], anchor: options.anchor === undefined ? null : options.anchor });
        const [bodyX, bodyY] = placed.transform(0, 0);
        elements.push(`<g transform="translate(${bodyX} ${bodyY}) rotate(${angle2})">${body}</g>`);
        // White switch contacts again on top of the dotted link and any leads.
        for (const key of ['a', 'b', 'c', 't1', 't2', 't3', 't4', 'p1', 'p2']) {
          if (!Object.prototype.hasOwnProperty.call(placed.anchors, key)) continue;
          const [wx, wy] = placed.anchors[key];
          whiteMarker(wx, wy, 4.32, color);
        }
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
        const placed = placeComponent({ anchors }, [x, y], { direction: [dx2, dy2], anchor: options.anchor === undefined ? null : options.anchor });
        const [bodyX, bodyY] = placed.transform(0, 0);
        elements.push(`<g transform="translate(${bodyX} ${bodyY}) rotate(${angle2})">${body}</g>`);
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
        const allowedIc = ['at', 'anchor', 'drop', 'theta', 'color', 'size', 'pin', 'side', 'pinspacing', 'plblofst', 'botlabel', ...(isMux ? ['demux', 'slant', 'pinspacing', 'flip', 'reverse'] : [])];
        if (labels.some(label => label.items || label.halign != null || label.ofst != null || label.rotate !== undefined) || Object.keys(options).some(key => !allowedIc.includes(key))) throw new Error(`${type} supports size, side, pin, pinspacing, plblofst, botlabel, at, anchor, drop, theta, color, and labels${isMux ? ', demux, slant, pinspacing, flip, reverse' : ''}.`);
        const sizeMatch = /^\(\s*(\d+(?:\.\d+)?|\.\d+)\s+(\d+(?:\.\d+)?|\.\d+)\s*\)$/.exec(options.size === undefined ? '' : options.size);
        if (options.size !== undefined && !sizeMatch) throw new Error(`${type} size must be specified as "(width height)".`);
        if (!sizeMatch && isMux) throw new Error('Multiplexer requires size="(width height)".');
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
        const flip = isMux && 'flip' in options, reverse = isMux && 'reverse' in options;
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
        const specific = type === 'IcDIP' ? ['pins', 'notch', 'width', 'pinw', 'spacing', 'number', 'pfontsize'] : type === 'Header' ? ['rows', 'cols', 'style', 'numbering', 'shownumber', 'pinspacing', 'edge', 'pinfill', 'pinsleft', 'pinsright', 'pinalignleft', 'pinalignright', 'pinfontsizeleft', 'pinfontsizeright', 'flip', 'dx', 'dy'] : ['t1', 't2', 'core', 'loop', 'align'];
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
        let box, headerW = 0, headerH = 0, dipPins = 0;
        const path = d => shapes.push(`<path d="${d}" ${stroke}/>`);
        const text = (px, py, value, size, align = 'middle', baseline = 'central') => texts.push({ px, py, value, size, align, baseline });
        if (type === 'IcDIP') {
          const pins = num('pins', 8, true, 100), w = num('width', 3) * 36, pw = num('pinw', .6) * 36, space = num('spacing', .5) * 36;
          dipPins = pins;
          if (pins % 2) throw new Error('IcDIP pins must be an even number.');
          const height = pins / 2 * pw + (pins / 2 + 1) * space;
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
          const rows = num('rows', 4, true, 100), cols = num('cols', 1, true, 2), spacing = num('pinspacing', .6) * 36, edge = num('edge', .3) * 36;
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
          headerW = w; headerH = h;
          path(`M 0,0 V ${-h} H ${w} V 0 Z`);
          for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
            const px = col * spacing + edge, py = -h + row * spacing + edge;
            const n = numbering === 'lr' ? row * cols + col + 1 : numbering === 'ud' ? row + col * rows + 1 : col % 2 ? rows * col + rows - row : row + 1;
            anchors[`pin${n}`] = [px, py];
            if (style === 'square') {
              shapes.push(`<rect x="${px-r}" y="${py-r}" width="${2*r}" height="${2*r}" fill="white" stroke="${color}" stroke-width="2"/>`);
              pinMarks.push({ px, py, r, style, fill: 'white' });
            } else {
              shapes.push(`<circle cx="${px}" cy="${py}" r="${style === 'screw' ? r * 1.75 : r}" fill="${fill}" stroke="${color}" stroke-width="2"/>`);
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
        const headerFlip = type === 'Header' && 'flip' in options;
        if (headerFlip) {
          for (const key of Object.keys(anchors)) anchors[key] = [anchors[key][0], -anchors[key][1]];
          for (const item of texts) item.py = -item.py;
          for (const mark of pinMarks) mark.py = -mark.py;
          box = [box[0], -box[3], box[2], -box[1]];
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
        const headerMirror = headerFlip ? ' scale(1 -1)' : '';
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
          end = point(options.to);
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
          const target = point(options.to);
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
        const allowed = ['at', 'anchor', 'color', 'input_fill', 'width', 'corner', 'inputs', 'input_ofst', 'input_lw', 'input_rad',
          ...(analog ? ['needle_percent', 'window_fill', 'needle_color', 'needle_width'] : []),
          ...(digital || scope ? ['screen_fill', 'screen_lw'] : []),
          ...(scope ? ['signal', 'signal_color', 'signal_lw', 'grid', 'grid_color', 'grid_lw'] : [])];
        if (selectedDirection || Object.keys(options).some(key => !allowed.includes(key))) throw new Error(`The specified arguments are not supported for ${type}.`);
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
        const radians = typeof direction === 'number' ? direction * Math.PI / 180 : 0;
        const [dx, dy, angle] = typeof direction === 'number' ? [Math.cos(radians), -Math.sin(radians), -direction] : directions[direction];
        const placed = placeComponent(definition, [x, y], { direction: [dx, dy], anchor: options.anchor === undefined ? null : options.anchor });
        const [ox, oy] = placed.transform(0, 0);
        let shape = `<rect x="0" y="${-W}" width="${W}" height="${W}" rx="${corner}" ${stroke}/>`;
        if (inputs) shape += `<circle cx="${inputOfst[0]}" cy="${-inputOfst[1]}" r="${inputRad}" fill="${inputFill}" stroke="${color}" stroke-width="${inputLw}"/><circle cx="${W - inputOfst[0]}" cy="${-inputOfst[1]}" r="${inputRad}" fill="${inputFill}" stroke="${color}" stroke-width="${inputLw}"/>`;
        if (analog) {
          const center = W / 2, arcy = 43.2, arcy2 = 30.96, arch = 7.2;
          const a = (112 - 45 * needle / 100) * Math.PI / 180;
          shape += `<path d="M ${center - W / 3},-${arcy} Q ${center},-${arcy + arch} ${center + W / 3},-${arcy} L ${center + W / 4},-${arcy2} Q ${center},-${arcy2 + arch * .7} ${center - W / 4},-${arcy2} Z" fill="${windowFill}" stroke="black" stroke-width="1"/>`;
          shape += `<path d="M ${center + 33.84 * Math.cos(a)},${-33.84 * Math.sin(a)} L ${center + 43.2 * Math.cos(a)},${-43.2 * Math.sin(a)}" fill="none" stroke="${needleColor}" stroke-width="${needleWidth}"/>`;
        }
        if (digital) {
          const wleft = W * .1, wright = W * .9, wtop = W * .85, wheight = W / 3;
          shape += `<rect x="${wleft}" y="${-wtop}" width="${wright - wleft}" height="${wheight}" fill="${screenFill}" stroke="${color}" stroke-width="${screenLw}"/>`;
        }
        if (scope) {
          const wleft = W * .15, wright = W * .85, wwidth = wright - wleft;
          const grid = wwidth / 5, wheight = grid * 3, wtop = W * .9, wbot = wtop - wheight;
          shape += `<rect x="${wleft}" y="${-wtop}" width="${wwidth}" height="${wheight}" fill="${screenFill}" stroke="${color}" stroke-width="${screenLw}"/>`;
          if (gridOn) {
            let gridPath = '';
            for (let i = 1; i <= 4; i++) gridPath += `M ${wleft + i * grid},${-wtop} L ${wleft + i * grid},${-wbot} `;
            for (let i = 1; i <= 2; i++) gridPath += `M ${wleft},${-(wbot + i * grid)} L ${wright},${-(wbot + i * grid)} `;
            shape += `<path d="${gridPath}" fill="none" stroke="${gridColor}" stroke-width="${gridLw}"/>`;
          }
          const sbot = wbot + wheight / 4, stop = wtop - wheight / 4;
          const e1 = wleft + wwidth / 3 - 3.6, e2 = wleft + wwidth * 2 / 3 - 3.6, e3 = wright - 3.6;
          let pts = [];
          if (signal === 'sine') pts = Array.from({ length: 20 }, (_, i) => [wleft + wwidth * i / 19, -(wbot + wheight / 2 + Math.sin(i / 19 * Math.PI * 2) * wheight / 2 * .75)]);
          if (signal === 'square') pts = [[wleft, -sbot], [e1, -sbot], [e1, -stop], [e2, -stop], [e2, -sbot], [e3, -sbot], [e3, -stop], [wright, -stop]];
          if (signal === 'triangle') pts = [[wleft, -sbot], [e1, -stop], [e2, -sbot], [e3, -stop], [wright, -(stop - 3.6)]];
          if (pts.length) shape += `<path d="${pts.map(([px, py], i) => `${i ? 'L' : 'M'} ${px},${py}`).join(' ')}" fill="none" stroke="${signalColor}" stroke-width="${signalWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
        }
        elements.push(`<g transform="translate(${ox} ${oy}) rotate(${angle})">${shape}</g>`);
        const margin = Math.max(2, signalWidth / 2);
        for (const corner2 of [[0, 0], [W, 0], [0, -W], [W, -W]]) {
          const [bx, by] = placed.transform(...corner2);
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
      const genericLabel = Object.prototype.hasOwnProperty.call(twoTerminalParts, type)
        || ['BjtNpn2', 'BjtPnp2', 'BjtPnp2c2', 'NMos2', 'PMos2', 'NFet2', 'PFet2', 'JFetN2', 'JFetP2',
          'Potentiometer', 'PotentiometerIEC', 'PotentiometerIEEE', 'Rshunt', 'SCR', 'Triac',
          'Battery', 'BatteryCell', 'BatteryDouble', 'SourceI', 'Zener', 'LED', 'Diac'].includes(type);
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
      if ('reverse' in options && !['SourceV', 'SourceI', 'Zener', 'Potentiometer', 'Rshunt', 'SCR', 'Triac', 'Ground', 'GroundSignal', 'GroundChassis', 'Vdd', 'Vss', 'NoConnect', 'CurrentMirror', 'VoltageMirror', 'Breaker', 'Inductor2', 'CPE', 'Nullator', 'Norator', 'Memristor2', 'ResistorVar', 'Capacitor2', 'ResistorVarIEC', 'ResistorVarIEEE', 'PotentiometerIEC', 'PotentiometerIEEE', 'FuseIEC', 'FuseIEEE', 'DiodeTunnel', 'DiodeTVS', 'DiodeShockley', 'Josephson', 'Photoresistor', 'PhotoresistorBox', 'PhotoresistorIEC', 'PhotoresistorIEEE', 'Coax', 'Triax', 'Motor', 'BusLine', 'DataBusLine', 'Battery', 'BatteryCell', 'BatteryDouble', ...transistors, ...Object.keys(twoTerminalParts), ...logicGateTypes, 'SwitchRotary', 'SwitchDIP', 'Antenna', 'AntennaLoop', 'AntennaLoop2', 'Speaker', 'Mic', 'AudioJack', "OutletA","OutletB","OutletC","OutletD","OutletE","OutletF","OutletG","OutletH","OutletI","OutletJ","OutletK","OutletL", 'Tag', 'Label', 'Arrowhead', 'DotDotDot'].includes(type)) throw new Error(`${type} does not support reverse.`);
      if ('flip' in options && !['Zener', 'LED', 'Diac', 'Fuse', 'Battery', 'BatteryCell', 'BatteryDouble', 'SourceI', 'Potentiometer', 'Rshunt', 'SCR', 'Triac', 'Ground', 'GroundSignal', 'GroundChassis', 'Vdd', 'Vss', 'NoConnect', 'CurrentMirror', 'VoltageMirror', 'Breaker', 'Inductor2', 'CPE', 'Nullator', 'Norator', 'Memristor2', 'ResistorVar', 'Capacitor2', 'ResistorVarIEC', 'ResistorVarIEEE', 'PotentiometerIEC', 'PotentiometerIEEE', 'FuseIEC', 'FuseIEEE', 'DiodeTunnel', 'DiodeTVS', 'DiodeShockley', 'Josephson', 'Photoresistor', 'PhotoresistorBox', 'PhotoresistorIEC', 'PhotoresistorIEEE', 'Coax', 'Triax', 'Motor', 'BusLine', 'DataBusLine', ...transistors, ...Object.keys(twoTerminalParts), ...logicGateTypes, 'SwitchRotary', 'SwitchDIP', 'Antenna', 'AntennaLoop', 'AntennaLoop2', 'Speaker', 'Mic', 'AudioJack', "OutletA","OutletB","OutletC","OutletD","OutletE","OutletF","OutletG","OutletH","OutletI","OutletJ","OutletK","OutletL", 'Tag', 'Label', 'Arrowhead', 'DotDotDot'].includes(type)) throw new Error(`${type} does not support flip.`);
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
        if (!['JFetN2', 'JFetP2', 'Bjt', 'JFet', 'NpnSchottky', 'PnpSchottky', 'BjtNpn', 'BjtPnp', 'BjtPnp2c', 'JFetN', 'JFetP', 'NMos', 'PMos', 'NMos2', 'PMos2'].includes(type)) throw new Error('circle can only be specified for BJT/JFET/MOSFET-family components.');
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
        if (type === 'Opamp' || type === 'Dot') throw new Error(`${type} does not support theta.`);
        if (typeof options.theta !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(options.theta) || !Number.isFinite(Number(options.theta))) throw new Error('theta must be a finite number.');
        if (selectedDirection || 'endpoints' in options || 'to' in options || ('tox' in options && !(type in twoTerminalParts)) || ('toy' in options && !(type in twoTerminalParts) && type !== 'Line')) throw new Error('theta cannot be combined with a direction, endpoints, to, tox, or toy.');
      }
      if ('length' in options) {
        if (length !== null) throw new Error('Only one length may be specified.');
        if (typeof options.length !== 'string') throw new Error('A length value is required.');
        length = readLength(options.length, unit);
      }
      if ('endpoints' in options && (['BjtNpn', 'Dot', 'Opamp', 'Ground'].includes(type) || selectedDirection || length !== null)) throw new Error(`${type} endpoints cannot be combined with the specified options.`);
      if ('at' in options) [x, y] = atPoint(options.at);
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
        const modes = ['at', 'anchor', 'theta', 'color', 'drop', 'flip', 'reverse',
          ...(definition.analog ? ['bulk', 'offset_gate', 'source_arrow'] : []),
          ...(['NMos', 'PMos'].includes(type) ? ['diode'] : []),
          ...(['NFet', 'PFet'].includes(type) ? ['bulk'] : []),
          ...(definition.extendable || ['BjtNpn', 'BjtPnp', 'BjtPnp2c', 'JFetN', 'JFetP', 'NMos', 'PMos'].includes(type) ? ['circle'] : []),
          ...(definition.hemt ? ['split', 'source_arrow'] : [])];
        if (length !== null || Object.keys(options).some(key => !modes.includes(key))) throw new Error(`${type} supports at, anchor, direction, theta, color, drop, flip, reverse, and terminal labels.`);
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
        if (('leads' in options && !['True', 'False'].includes(options.leads)) || selectedDirection || length !== null || 'to' in options || 'tox' in options || 'toy' in options || 'dot' in options || 'idot' in options) throw new Error('Opamp supports leads=True/False, anchor, at, hold, and labels.');
        if (labels.some(label => label.items || label.rotate !== undefined || (label.loc != null && label.loc !== 'center' && !Object.prototype.hasOwnProperty.call(opampHints, label.loc)))) throw new Error('Opamp labels support loc center, in1, in2, out, vd, vs, n1, n2, n1a, n2a.');
        const width = 45 * Math.sqrt(3), lead = options.leads === 'True' ? 22.5 : 0;
        const definition = componentDefinitions.Opamp(lead);
        if ('anchor' in options) {
          if (!Object.prototype.hasOwnProperty.call(definition.anchors, options.anchor)) throw new Error(`Unsupported Opamp anchor: ${options.anchor}`);
        }
        const placed = placeComponent(definition, [x, y], { anchor: options.anchor === undefined ? null : options.anchor, scale: [zoom, zoom] });
        [x, y] = placed.transform(0, 0);
        const bodyX = x + lead;
        const anchors = placed.anchors;
        // Draw in local coordinates so `scale` can wrap the whole glyph.
        const leads = lead ? ` M 0,-22.5 L ${lead},-22.5 M 0,22.5 L ${lead},22.5 M ${lead + width},0 L ${lead + width + lead},0` : '';
        const sign = options.sign === 'False' ? '' : ` M ${lead + 6.143},-22.5 L ${lead + 13.343},-22.5 M ${lead + 6.143},22.5 L ${lead + 13.343},22.5 M ${lead + 9.743},18.9 L ${lead + 9.743},26.1`;
        const opampScale = zoom === 1 ? '' : ` scale(${zoom})`;
        const opStroke = zoom === 1 ? stroke : stroke.replace(/stroke-width="2"/g, `stroke-width="${2 / zoom}"`);
        elements.push(`<g transform="translate(${x} ${y})${opampScale}"><path d="M ${lead},-45 L ${lead + width},0 L ${lead},45 Z${leads}${sign}" ${opStroke}/></g>`);
        const bx = x, by = y;
        for (const [cx, cy] of [[lead, -45], [lead + width, 0], [lead, 45], [lead - 22.5, -22.5], [lead - 22.5, 22.5], [lead + width + lead, 0]]) {
          bounds(bx + cx * zoom, by + cy * zoom, bx + cx * zoom, by + cy * zoom);
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
          const anchorPoint = label.loc === 'center' ? [bodyX + width / 2 * zoom, y] : anchors[label.loc || 'center'];
          const lx = anchorPoint[0] + ox * 36 * zoom;
          const ly = anchorPoint[1] - oy * 36 * zoom;
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
          // Schemdraw draws the tag from the anchor (0,0) to +w; `left` rotates
          // it 180 degrees and `reverse` mirrors it about the body centre.
          const s = tagLeft ? -1 : 1;
          const rev = 'reverse' in options;
          const tip = rev ? s * w : 0;
          const base = rev ? s * (w - h) : s * h;
          const far = rev ? 0 : s * w;
          body = `<polygon points="${tip.toFixed(3)},0 ${base.toFixed(3)},${(-h).toFixed(3)} ${far.toFixed(3)},${(-h).toFixed(3)} ${far.toFixed(3)},${h.toFixed(3)} ${base.toFixed(3)},${h.toFixed(3)}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
        }
        if (body) elements.push(`<g transform="${tf}">${body}</g>`);
        for (const label of labels) {
          if (label.items || label.halign != null || label.ofst != null) throw new Error(`${type} does not support label arguments.`);
          const loc = label.loc || 'center';
          const size = label.fontsize === undefined ? (type === 'Tag' && !labelSizeSet ? 12 : labelSize) : label.fontsize;
          let lx = x, ly = y;
          if (loc === 'center') {
            // The body centre is the same whether or not it is mirrored.
            lx = x + (type === 'Tag' ? (tagLeft ? -1 : 1) * num('width', 1.5) / 2 : 0);
          }
          else if (loc === 'top') ly = y - (type === 'Tag' ? 18 : 10);
          else if (loc === 'bot' || loc === 'bottom') ly = y + (type === 'Tag' ? 18 : 10);
          else if (loc === 'left') lx = x - (type === 'Tag' ? 8 : 6);
          else if (loc === 'right') lx = x + (type === 'Tag' ? num('width', 1.5) + 8 : 6);
          else throw new Error(`Unsupported ${type} label loc: ${loc}`);
          const anchor = loc === 'left' ? 'end' : loc === 'right' ? 'start' : 'middle';
          const width = Math.max(size, Array.from(label.text).length * size * 0.75);
          bounds(lx - width, ly - size, lx + width, ly + size);
          elements.push(`<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="central" fill="${label.color || color}" font-family="sans-serif" font-size="${size}">${labelContent(label.text)}</text>`);
        }
        if (type === 'Tag') bounds(x - 4, y - 14, x + num('width', 1.5) + 4, y + 14);
        else if (type === 'Arrowhead') bounds(x - 12, y - 6, x + 4, y + 6);
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
        const span = type === 'OutletA' || type === 'OutletB' ? 56 : 48;
        bounds(x - span, y - span, x + span, y + span);
        if (name) {
          const out = Object.create(null);
          for (const key of Object.keys(def.anchors)) out[key] = [x + sx * def.anchors[key][0] * P, y - sy2 * def.anchors[key][1] * P];
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
        const sx = 'reverse' in options ? -1 : 1, sy2 = 'flip' in options ? -1 : 1;
        const tf = `translate(${x} ${y})` + (theta ? ` rotate(${-theta})` : '') + ((sx !== 1 || sy2 !== 1) ? ` scale(${sx} ${sy2})` : '');
        elements.push(`<g transform="${tf}">${glyph}</g>`);
        // The white contact dots must sit above leads drawn afterwards.
        if (dots && fill === 'white') {
          const toWorld = localToWorld(x, y, sx, sy2, theta);
          for (const key of Object.keys(jackAnchors)) {
            const [wx, wy] = toWorld(jackAnchors[key][0] * P, -jackAnchors[key][1] * P);
            whiteMarker(wx, wy, r * P, color);
          }
        }
        for (const label of labels) {
          if (label.items || label.halign != null || label.ofst != null || label.rotate !== undefined) throw new Error('AudioJack does not support label arguments.');
          const loc = label.loc || 'top';
          let lx = x - 36, ly = y;
          if (loc === 'top') { ly = y - 56; }
          else if (loc === 'bot' || loc === 'bottom') { ly = y + 52; }
          else if (loc === 'left') { lx = x - 90; }
          else if (loc === 'right') { lx = x + 20; }
          else throw new Error(`Unsupported AudioJack label loc: ${loc}`);
          const anchor = loc === 'left' ? 'end' : loc === 'right' ? 'start' : 'middle';
          const width = Math.max(12, Array.from(label.text).length * 10);
          bounds(lx - width, ly - 18, lx + width, ly + 8);
          elements.push(`<text x="${lx}" y="${ly}" text-anchor="${anchor}"${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(label.text)}</text>`);
        }
        bounds(x - 84, y - (ring && ringSwitch ? 96 : 60), x + 18, y + 18);
        if (name) {
          const out = Object.create(null);
          for (const key of Object.keys(jackAnchors)) out[key] = [x + jackAnchors[key][0] * P, y - jackAnchors[key][1] * P];
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
        const tf = `translate(${x} ${y})` + (theta ? ` rotate(${-theta})` : '') + ((sx !== 1 || sy2 !== 1) ? ` scale(${sx} ${sy2})` : '');
        elements.push(`<g transform="${tf}">${glyph}</g>`);
        for (const label of labels) {
          if (label.items || label.halign != null || label.ofst != null || label.rotate !== undefined) throw new Error(`${type} does not support label arguments.`);
          const loc = label.loc || 'top';
          let lx = x, ly = y;
          if (loc === 'top') ly = y - 30;
          else if (loc === 'bot' || loc === 'bottom') ly = y + 30;
          else if (loc === 'left') lx = x - 30;
          else if (loc === 'right') lx = x + 40;
          else throw new Error(`Unsupported ${type} label loc: ${loc}`);
          const anchor = loc === 'left' ? 'end' : loc === 'right' ? 'start' : 'middle';
          const width = Math.max(12, Array.from(label.text).length * 10);
          bounds(lx - width, ly - 18, lx + width, ly + 8);
          elements.push(`<text x="${lx}" y="${ly}" text-anchor="${anchor}"${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(label.text)}</text>`);
        }
        bounds(x - 24, y - 28, x + 36, y + 44);
        if (name) names[name] = { in1: [x, y], in2: [x, y + 18], start: [x, y], center: [x, y], end: [x, y], xy: [x, y] };
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
        const sx = 'reverse' in options ? -1 : 1, sy2 = 'flip' in options ? -1 : 1;
        const tf = `translate(${x} ${y})` + (theta ? ` rotate(${-theta})` : '') + ((sx !== 1 || sy2 !== 1) ? ` scale(${sx} ${sy2})` : '');
        elements.push(`<g transform="${tf}"><path d="${glyph}" ${stroke}/></g>`);
        for (const label of labels) {
          if (label.items || label.halign != null || label.ofst != null || label.rotate !== undefined) throw new Error(`${type} does not support label arguments.`);
          const loc = label.loc || 'top';
          let lx = x, ly = y;
          if (loc === 'top') { ly = y - 52; }
          else if (loc === 'bot' || loc === 'bottom') { ly = y + 20; }
          else if (loc === 'left') { lx = x - 26; }
          else if (loc === 'right') { lx = x + 26; }
          else throw new Error(`Unsupported ${type} label loc: ${loc}`);
          const anchor = loc === 'left' ? 'end' : loc === 'right' ? 'start' : 'middle';
          const width = Math.max(12, Array.from(label.text).length * 10);
          bounds(lx - width, ly - 18, lx + width, ly + 8);
          elements.push(`<text x="${lx}" y="${ly}" text-anchor="${anchor}"${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(label.text)}</text>`);
        }
        bounds(x - (type === 'AntennaLoop2' ? 32 : 26), y - (type === 'AntennaLoop2' ? 66 : 48), x + (type === 'AntennaLoop2' ? 32 : 26), y + 4);
        if (name) names[name] = { start: [x, y], center: [x, y], end: [x, y], xy: [x, y] };
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
            // Schemdraw resolves offsets per side: top labels use the positive
            // magnitude (default 0.1), bottom labels invert an explicit offset.
            const ofstY = Array.isArray(label.ofst) ? label.ofst[1] : (typeof label.ofst === 'number' ? label.ofst : null);
            const off = loc === 'top' ? (ofstY == null ? 0.1 : ofstY) : (ofstY == null ? 0.1 : -ofstY);
            let ly0 = loc === 'top' ? extF[0] - off * 36 : extF[1] + off * 36;
            if (Array.isArray(label.ofst)) lx0 += label.ofst[0] * 36;
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
        if (selectedDirection || length !== null || 'anchor' in options || ['to', 'tox', 'toy', 'endpoints'].some(key => key in options)) throw new Error(`${type} does not support direction, length, anchor, to/tox/toy, or endpoints.`);
        if ('at' in options) [x, y] = atPoint(options.at);
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
          glyph += switchDot(0, 0, color);
          for (let i = 0; i < n; i++) {
            const t = (theta0 + dtheta * i) * Math.PI / 180;
            const px = radius * Math.cos(t), py = radius * Math.sin(t);
            glyph += switchDot(px, -py, color);
            anchors[`T${i + 1}`] = [x + sxw * px, y + syw * -py];
            if (i === arrowcontact) {
              const ax2 = arrowlen * Math.cos(t), ay2 = -arrowlen * Math.sin(t);
              const ux = ax2, uy = ay2, len = Math.hypot(ux, uy) || 1;
              const [ex, ey] = [ux / len, uy / len], [nx, ny] = [-ey, ex];
              glyph += `<path d="M 0,0 L ${(ax2 - ex * 9).toFixed(3)},${(ay2 - ey * 9).toFixed(3)}" ${stroke}/>` +
                `<path d="M ${(ax2 + ex * 1.5).toFixed(3)},${(ay2 + ey * 1.5).toFixed(3)} L ${(ax2 - ex * 7.5 + nx * 2.7).toFixed(3)},${(ay2 - ey * 7.5 + ny * 2.7).toFixed(3)} L ${(ax2 - ex * 7.5 - nx * 2.7).toFixed(3)},${(ay2 - ey * 7.5 - ny * 2.7).toFixed(3)} Z" fill="${color}"/>`;
            }
          }
          anchors.P = [x, y];
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
            anchors[`a${i + 1}`] = [x + sxw * (lx + swidth / 2), y];
              anchors[`b${i + 1}`] = [x + sxw * (lx + swidth / 2), y + syw * -height];
          }
          reachOne = width + 10;
          reachTwo = height + 10;
        }
        // The glyph is built in screen coordinates; mirror it around the
        // insertion point for flip / reverse.
        glyph = sxw === 1 && syw === 1 ? glyph
          : `<g transform="translate(${x} ${y}) scale(${sxw} ${syw}) translate(${-x} ${-y})">${glyph}</g>`;
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
        const shift = anchorName === null ? [0, 0] : spec.anchors[anchorName];
        const originX = x, originY = y;
        const rad = -theta * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
        // Local drawing units (y up) → world SVG pixels.
        const tf = ([px, py]) => {
          const qx = (px - shift[0]) * 36, qy = -(py - shift[1]) * 36;
          return [originX + qx * cos - qy * sin, originY + qx * sin + qy * cos];
        };
        const transform = `translate(${originX} ${originY})`
          + (theta ? ` rotate(${-theta})` : '')
          + (shift[0] || shift[1] ? ` translate(${-shift[0] * 36} ${shift[1] * 36})` : '');
        elements.push(`<g transform="${transform}">${spec.body}</g>`);
        // Glyph texts (Σ, mixer ports) are segments in Schemdraw: their
        // position follows the element, but the text itself stays upright.
        for (const glyph of spec.glyphs) {
          const [gx, gy] = tf([glyph.x / 36, -glyph.y / 36]);
          elements.push(`<text x="${gx}" y="${gy - glyph.size}" text-anchor="middle" dominant-baseline="central"${textFill} font-family="sans-serif" font-size="${glyph.size}"><tspan x="${gx}" dy="${glyph.size}">${labelContent(glyph.value)}</tspan></text>`);
        }
        for (const label of labels) {
          if (label.items) throw new Error(`${type} does not support list labels.`);
          if (label.rotate !== undefined) throw new Error(`${type} does not support label rotation.`);
          const size = label.fontsize === undefined ? labelSize : label.fontsize;
          const placement = dspLabelPosition(label, spec, theta);
          const [lx, ly] = tf([placement.x / 36, -placement.y / 36]);
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
        placedAnchors.xy = tf([0, 0]);
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
        for (const label of labels) {
          if (label.items || label.halign != null || label.ofst != null || label.rotate !== undefined) throw new Error('SwitchSpdt2 does not support list labels or label offsets.');
          const loc = label.loc || 'top';
          let localX, localY, anchor, baseline;
          if (loc === 'top') { localX = 18; localY = -24; anchor = 'middle'; baseline = 'ideographic'; }
          else if (loc === 'bot' || loc === 'bottom') { localX = 18; localY = 28; anchor = 'middle'; baseline = 'hanging'; }
          else if (loc === 'left') { localX = -8; localY = 0; anchor = 'end'; baseline = 'central'; }
          else if (loc === 'right') { localX = 44; localY = 0; anchor = 'start'; baseline = 'central'; }
          else throw new Error(`Unsupported SwitchSpdt2 label loc: ${loc}`);
          const [tx, ty] = world([localX, localY]);
          elements.push(`<text x="${tx}" y="${ty}" text-anchor="${anchor}" dominant-baseline="${baseline}"${textFill} font-family="sans-serif" font-size="${labelSize}">${labelContent(label.text)}</text>`);
          const width = Math.max(12, Array.from(label.text).length * 10);
          bounds(tx - width, ty - 18, tx + width, ty + 8);
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
      if (['to', 'tox', 'toy'].filter(key => key in options).length > 1) throw new Error('to, tox, and toy cannot be specified together.');
      if ('anchor' in options && ['to', 'tox', 'toy', 'endpoints'].some(key => key in options)) throw new Error('anchor cannot be combined with to, tox, toy, or endpoints.');
      if ((length !== null) && ('to' in options || (('tox' in options || 'toy' in options) && !('theta' in options)))) throw new Error(`A length cannot be combined with to/tox/toy (${type}).`);
      let targetPoint = null;
      if ('to' in options || 'endpoints' in options) {
        if ('endpoints' in options) {
          const ref = '[A-Za-z_]\\w*\\.[A-Za-z_]\\w*';
          const match = new RegExp(`^\\s*(${ref})\\s+(${ref})\\s*$`).exec(options.endpoints);
          if (!match) throw new Error('endpoints must specify start and end references separated by whitespace.');
          [x, y] = point(match[1]);
          targetPoint = point(match[2]);
        } else targetPoint = point(options.to);
        const vx = targetPoint[0] - x, vy = targetPoint[1] - y;
        length = Math.hypot(vx, vy);
        if (!Number.isFinite(length) || length === 0) throw new Error('Start and end points must be distinct finite positions.');
        if (vy === 0) direction = vx < 0 ? 'left' : 'right';
        else if (vx === 0) direction = vy < 0 ? 'up' : 'down';
        else direction = Math.atan2(-vy, vx) * 180 / Math.PI;
      } else if ('tox' in options) {
        const target = point(options.tox)[0];
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
      } else if ('toy' in options) {
        const target = point(options.toy)[1];
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
      } else if ('theta' in options) {
        const degrees = ((Number(options.theta) % 360) + 360) % 360;
        direction = ({ 0: 'right', 90: 'up', 180: 'left', 270: 'down' })[degrees] || Number(options.theta);
      } else if (selectedDirection) direction = selectedDirection;
      else if (isSource || ['BjtNpn2', 'BjtPnp2', 'BjtPnp2c2', 'CurrentMirror', 'VoltageMirror', 'Nullator', 'Norator'].includes(type)) direction = 'up';
      if (length === null) length = unit;
      if (type === 'Line' && 'arrow' in options && (!Number.isFinite(length) || length === 0)) throw new Error('Cannot add an arrow to a zero-length or invalid Line.');
      if (type === 'Gap' && length < 36) length = 36;
      if (targetPoint && type === 'Gap' && length !== Math.hypot(targetPoint[0] - x, targetPoint[1] - y)) throw new Error('Gap terminal spacing is too short.');
      if (type === 'Resistor' && length < 36) throw new Error('Resistor length is too short.');
      if (type === 'Inductor' && length < 36) throw new Error('Inductor length is too short.');
      if (type === 'Capacitor' && length < 6.48) throw new Error('Capacitor length is too short.');
      if (['Diode', 'Zener', 'LED', 'Diac', 'SCR', 'Triac'].includes(type) && length < 12.6) throw new Error(`${type} length is too short.`);
      const partDef = twoTerminalParts[type];
      if (zoom !== 1 && !(partDef && (partDef.form === 'glyph' || partDef.form === 'path' || ['Source', 'SourceV', 'SourceSin', 'Line'].includes(type))) && !['Potentiometer', 'PotentiometerIEC', 'PotentiometerIEEE'].includes(type)) throw new Error(`scale is not supported for ${type}.`);
      if (partDef && partDef.form === 'glyph' && length < partDef.half * 2) throw new Error(`${type} length is too short.`);
      if (['Potentiometer', 'Rshunt', 'Fuse'].includes(type) && length < 36) throw new Error(`${type} length is too short.`);
      if (['BjtNpn2', 'BjtPnp2', 'BjtPnp2c2'].includes(type) && length < 39.6) throw new Error(`${type} length is too short.`);
      if (['NMos2', 'PMos2'].includes(type) && length < 60) throw new Error(`${type} length is too short.`);
      if (['NFet2', 'PFet2'].includes(type) && length < 54) throw new Error(`${type} length is too short.`);
      if (['JFetN2', 'JFetP2'].includes(type) && length < 48) throw new Error(`${type} length is too short.`);
      if (['CurrentMirror', 'VoltageMirror'].includes(type) && length < 36) throw new Error(`${type} length is too short.`);
      if (type === 'Breaker' && length < 36) throw new Error('Breaker length is too short.');
      if (type === 'Inductor2' && length < 36) throw new Error('Inductor2 length is too short.');
      if (type === 'CPE' && length < 9) throw new Error('CPE length is too short.');
      if (['Nullator', 'Norator'].includes(type) && length < 36) throw new Error(`${type} length is too short.`);
      if (type === 'Memristor2' && length < 50.4) throw new Error('Memristor2 length is too short.');
      if (type === 'ResistorVar' && length < 36) throw new Error('ResistorVar length is too short.');
      if (['ResistorVarIEC', 'ResistorVarIEEE', 'PotentiometerIEC', 'PotentiometerIEEE', 'FuseIEC', 'FuseIEEE'].includes(type) && length < 36) throw new Error(`${type} length is too short.`);
      if (type === 'Capacitor2' && length < 6.48) throw new Error('Capacitor2 length is too short.');
      if (['DiodeTunnel', 'DiodeShockley'].includes(type) && length < 12.6) throw new Error(`${type} length is too short.`);
      if (type === 'DiodeTVS' && length < 25.2) throw new Error('DiodeTVS length is too short.');
      if (type === 'Josephson' && length < 18) throw new Error('Josephson length is too short.');
      if (['Photoresistor', 'PhotoresistorBox', 'PhotoresistorIEC', 'PhotoresistorIEEE'].includes(type) && length < 36) throw new Error(`${type} length is too short.`);
      if (type === 'Motor' && length < 51.84) throw new Error('Motor length is too short.');
      const batterySpan = type === 'Battery' ? 20.25 : type === 'BatteryCell' ? 6.75 : type === 'BatteryDouble' ? 60.75 : 0;
      if (batterySpan && length < batterySpan) throw new Error(`${type} length is too short.`);
      if (isSource && length < 36) throw new Error(`${type} length is too short.`);
      const arbitraryAngle = typeof direction === 'number';
      const radians = arbitraryAngle ? direction * Math.PI / 180 : 0;
      const [dx, dy, angle] = arbitraryAngle ? [Math.cos(radians), -Math.sin(radians), -direction] : directions[direction];
      let startX = x, startY = y;
      let endX = targetPoint ? targetPoint[0] : x + dx * length;
      let endY = targetPoint ? targetPoint[1] : y + dy * length;
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
      if (type === 'Resistor') {
        const a = length / 2 - 18 + shiftOffset;
        path = `M 0,0 L ${a},0 L ${a + 3},-9 L ${a + 9},9 L ${a + 15},-9 L ${a + 21},9 L ${a + 27},-9 L ${a + 33},9 L ${a + 36},0 L ${length},0`;
      }
      if (type === 'Capacitor' && (length !== defaultUnit || shiftOffset !== 0)) {
        const first = length / 2 - 3.24 + shiftOffset, second = length / 2 + 3.24 + shiftOffset;
        path = `M 0,0 L ${first},0 M ${first},-9 L ${first},9 M ${second},-9 L ${second},9 M ${second},0 L ${length},0`;
      }
      if (type === 'Inductor' && (length !== defaultUnit || shiftOffset !== 0)) {
        const start = length / 2 - 18 + shiftOffset;
        path = `M 0,0 L ${start},0`;
        for (let i = 0; i < 4; i++) path += ` M ${start + i * 9},0 a 4.5,4.5 0 1 1 9,0`;
        path += ` M ${start + 36},0 L ${length},0`;
      }
      let shapeExtra = '';
      if (type === 'Inductor2') {
        const c = length / 2 + shiftOffset, a = c - 18;
        path = `M 0,0 L ${a},0 M ${a + 36},0 L ${length},0`;
        const points = cycloidPoints(loops);
        let glyph = `M ${a},0` + points.map(([u, v]) => ` L ${(a + u * 36).toFixed(4)},${(v * 36 * sy).toFixed(4)}`).join('');
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
        shapeExtra = glyph;
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
        shapeExtra = sy === -1 ? `<g transform="scale(1 -1)">${glyph}</g>` : glyph;
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
        shapeExtra = `<path d="M ${c - 4.5},${-9 * sy} L ${c + 4.5},${9 * sy}" ${stroke}/>`;
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
        glyph += type === 'BjtNpn2' ? arrow(a, 0, diagL, barY) : arrow(diagR, barY, b, 0);
        if (type === 'BjtPnp2c2') {
          // Second collector: a short diagonal from the C2 tap to the base bar.
          glyph += `<path d="M ${a + 9},0 L ${a + 21.6},${barY}" ${stroke}/>`;
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
        shapeExtra = `<path d="M ${first + 9},${-13.5 * sy} L ${first + 14.428},${-23 * sy}" ${stroke}/><path d="M ${first + 17.008},${-27.514 * sy} L ${first + 16.928},${-21.57 * sy} L ${first + 11.927},${-24.428 * sy} Z" fill="${color}"/><path d="M ${first + 0.9},${-13.5 * sy} L ${first + 6.328},${-23 * sy}" ${stroke}/><path d="M ${first + 8.908},${-27.514 * sy} L ${first + 8.828},${-21.57 * sy} L ${first + 3.827},${-24.428 * sy} Z" fill="${color}"/>`;
      }
      if (type === 'Diac') {
        const first = length / 2 - 6.3 + shiftOffset, second = first + 12.6;
        path = `M 0,0 L ${first},0 M ${second},${-16.2 * sy} L ${second},${16.2 * sy} M ${first},${-16.2 * sy} L ${first},${16.2 * sy} M ${second},0 L ${length},0`;
        shapeExtra = `<path d="M ${first},${18 * sy} L ${second},${9 * sy} L ${first},0 Z M ${second},${-18 * sy} L ${first},${-9 * sy} L ${second},0 Z" ${stroke}/>`;
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
      const dpAnchors = {};
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
        const bodyFlip = ['SwitchDpst', 'SwitchDpdt'].includes(type) ? 1 : sy;
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
        const reflected = ('reverse' in options && !['Potentiometer', 'Rshunt', 'SCR', 'Triac', 'BjtNpn2', 'BjtPnp2', 'NMos2', 'PMos2', 'ResistorVar'].includes(type))
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
          let listLoc = label.loc || (type === 'Gap' ? 'center' : 'top');
          if (listLoc === 'bot') listLoc = 'bottom';
          if (thetaDeg > 90 && thetaDeg <= 270) {
            listLoc = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[listLoc] || listLoc;
          }
          let ox = 0, oy = 0;
          const ofst = label.ofst == null ? (type === 'Gap' ? 0 : 0.1) : label.ofst;
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
          const halign = label.halign || rotalign[0];
          const valign = label.valign || rotalign[1];
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
        if ((Object.prototype.hasOwnProperty.call(twoTerminalParts, type) || ['Gap', 'Potentiometer', 'PotentiometerIEC', 'PotentiometerIEEE', 'Rshunt', 'SCR', 'Triac'].includes(type)) && !label.items && label.rotate === undefined) {
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
          let labelLoc = label.loc || (['Potentiometer', 'PotentiometerIEC', 'PotentiometerIEEE', 'LED', 'LED2', 'Photodiode'].includes(type) ? 'bottom' : type === 'Gap' ? 'center' : 'top');
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
          const ofst = label.ofst == null ? (type === 'Gap' ? 0 : 0.1) : label.ofst;
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
          const halign = label.halign || rotalign[0];
          const valign = label.valign || rotalign[1];
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
        contactPoints.push(pts.a, pts.b);
        if (switchContacts) contactPoints.push(pts.c);
      }
      if (type === 'SwitchDpst' || type === 'SwitchDpdt') {
        if (switchContacts) {
          const pts = twoTerminalLocalAnchors(type, length, shiftOffset, sy, options);
          for (const key of ['p1', 'p2', 't1', 't2', 't3', 't4']) if (pts[key]) contactPoints.push(pts[key]);
        }
      }
      if (type === 'FuseUS') contactPoints.push([33.84, 0], [74.16, 0]);
      for (const [contactX, contactY] of contactPoints) {
        const [wx, wy] = markerWorld(contactX, contactY);
        whiteMarker(wx, wy, 4.32, color);
      }
      if (name) {
        const anchors = { start: [startX, startY], end: [endX, endY], center: [centerX, centerY] };
        const local = (lx, ly) => [x + dx * lx - dy * ly, y + dy * lx + dx * ly];
        const bodyCenter = length / 2 + shiftOffset;
        const mx = lx => 'reverse' in options ? 2 * bodyCenter - lx : lx;
        if (['Potentiometer', 'PotentiometerIEC', 'PotentiometerIEEE'].includes(type)) anchors.tap = local(mx(bodyCenter), -tapH * zoom * sy);
        if (type === 'Rshunt') { anchors.v1 = local(mx(bodyCenter - 31.5), 18 * sy); anchors.v2 = local(mx(bodyCenter + 31.5), 18 * sy); }
        if (type === 'SCR') anchors.gate = local(mx(bodyCenter + 17.1), 18 * sy);
        if (type === 'Triac') anchors.gate = local(mx(bodyCenter + 24.3), -18 * sy);
        if (type === 'BatteryDouble') anchors.tap = local(mx(bodyCenter - batterySpan / 2 + 27), -13.5 * sy);
        if (type === 'BjtNpn2' || type === 'BjtPnp2' || type === 'BjtPnp2c2') {
          anchors.base = local(bodyCenter, -28.62 * sy);
          const emitterAtEnd = (type !== 'BjtNpn2') !== ('reverse' in options);
          anchors.emitter = emitterAtEnd ? [endX, endY] : [startX, startY];
          anchors.collector = emitterAtEnd ? [startX, startY] : [endX, endY];
          if (type === 'BjtPnp2c2') anchors.C2 = local(bodyCenter + ('reverse' in options ? 10.8 : -10.8), 0);
        }
        if (type === 'NMos2' || type === 'PMos2') {
          const gateOffset = (type === 'NMos2' ? 12 : -12) * ('reverse' in options ? -1 : 1);
          anchors.gate = local(bodyCenter + gateOffset, 30 * sy);
          const sourceAtBodyEnd = (type === 'NMos2') !== ('reverse' in options);
          anchors.source = local(sourceAtBodyEnd ? bodyCenter + 30 : bodyCenter - 30, 0);
          anchors.drain = local(sourceAtBodyEnd ? bodyCenter - 30 : bodyCenter + 30, 0);
          anchors.S = anchors.source;
          anchors.D = anchors.drain;
        }
        if (type === 'NFet2' || type === 'PFet2') {
          const sourceAtEnd = !('reverse' in options);
          anchors.gate = local(bodyCenter, -49.2 * sy);
          anchors.source = sourceAtEnd ? [endX, endY] : [startX, startY];
          anchors.drain = sourceAtEnd ? [startX, startY] : [endX, endY];
          anchors.S = anchors.source;
          anchors.D = anchors.drain;
          if (bulk) anchors.bulk = local(bodyCenter, 0);
        }
        if (type === 'JFetN2' || type === 'JFetP2') {
          const gateOffset = 9 * ('reverse' in options ? -1 : 1);
          anchors.gate = local(bodyCenter + gateOffset, -33 * sy);
          const sourceAtEnd = !('reverse' in options);
          anchors.source = sourceAtEnd ? [endX, endY] : [startX, startY];
          anchors.drain = sourceAtEnd ? [startX, startY] : [endX, endY];
          anchors.S = anchors.source;
          anchors.D = anchors.drain;
        }
        if (type === 'CurrentMirror' || type === 'VoltageMirror') {
          const offset = type === 'CurrentMirror'
            ? Math.sqrt(0.3 * 0.3 - 0.2 * 0.2) * 36
            : Math.sqrt(1 - 0.2 * 0.2 / (0.3 * 0.3)) * 0.15 * 36;
          anchors.common = local(bodyCenter, -offset * sy);
        }
        if (type === 'SwitchSpdt') {
          // Schemdraw: a at the pivot, b on the second throw, c on the throw
          // above (flip/reverse move them with the glyph).
          const contacts = !('contacts' in options) || options.contacts === 'True';
          const a = contacts ? bodyCenter - 13.68 : bodyCenter - 18;
          const b = contacts ? bodyCenter + 13.68 : bodyCenter + 18;
          anchors.a = local(mx(a), 0);
          anchors.b = local(mx(b), 0);
          anchors.c = local(mx(b), -25.2 * sy);
        }
        if (type === 'SwitchSpdt2') {
          const contacts = options.contacts !== false;
          const left = contacts ? bodyCenter - 49.68 : bodyCenter - 54;
          const right = contacts ? bodyCenter - 22.32 : bodyCenter - 18;
          anchors.a = local(mx(left), 0);
          anchors.b = local(mx(right), -14.4 * sy);
          anchors.c = local(mx(right), 14.4 * sy);
        }
        if (type === 'SwitchDpst' || type === 'SwitchDpdt') {
          // Pole 1 sits on the terminal line, pole 2 one unit below it. The
          // body is drawn centred at x = 54 with the poles at 4.32/31.68, so
          // the anchors use the same offsets and follow flip via `sy`.
          const contacts = options.contacts !== false;
          const dpdt = type === 'SwitchDpdt';
          const pole2 = dpdt ? 50.4 : 36;
          const right = contacts ? 31.68 : 36;
          // Positions are relative to the first pole (x = 4.32, y = 0).
          const px = contacts ? 4.32 : 0;
          const ax = lx => mx(bodyCenter - 54 + px + (lx - 4.32));
          dpAnchors.p1 = local(ax(4.32), 0);
          dpAnchors.t1 = local(ax(right - px + 4.32), dpdt ? -14.4 * sy : 0);
          if (dpdt) dpAnchors.t2 = local(ax(right - px + 4.32), 14.4 * sy);
          dpAnchors.p2 = local(ax(4.32), pole2 * sy);
          if (!dpdt) dpAnchors.t2 = local(ax(right - px + 4.32), pole2 * sy);
          dpAnchors.t3 = local(ax(right - px + 4.32), dpdt ? (pole2 - 14.4) * sy : pole2 * sy);
          if (dpdt) dpAnchors.t4 = local(ax(right - px + 4.32), (pole2 + 14.4) * sy);
        }
        if (type === 'MeterArrow') {
          anchors.istart = local(bodyCenter - 18, 0);
          anchors.iend = local(bodyCenter + 18, 0);
        }
        if (type === 'Inductor2') {
          const a = bodyCenter - 18, b = bodyCenter + 18;
          anchors.NW = local(mx(a), -22.32 * sy);
          anchors.NE = local(mx(b), -22.32 * sy);
          anchors.SW = local(mx(a), 18 * sy);
          anchors.SE = local(mx(b), 18 * sy);
          anchors.istart = local(a, 0);
          anchors.iend = local(b, 0);
          anchors.xy = local(a, 0);
        }
        if (type === 'Coax') {
          const L = length, l = coaxLead, r = coaxRadius;
          anchors.shieldstart = local(mx(l), r * sy);
          anchors.shieldstart_top = local(mx(l), -r * sy);
          anchors.shieldend = local(mx(L - l), r * sy);
          anchors.shieldend_top = local(mx(L - l), -r * sy);
          anchors.shieldcenter = local(mx(L / 2), r * sy);
          anchors.shieldcenter_top = local(mx(L / 2), -r * sy);
        }
        if (type === 'Triax') {
          const L = length, l = triaxLead, r1 = triaxR1, r2 = triaxR2, os = triaxOfsStart, oe = triaxOfsEnd;
          anchors.guardstart = local(mx(l), r1 * sy);
          anchors.guardstart_top = local(mx(l), -r1 * sy);
          anchors.guardend = local(mx(L - l), r1 * sy);
          anchors.guardend_top = local(mx(L - l), -r1 * sy);
          anchors.shieldstart = local(mx(l + os), r2 * sy);
          anchors.shieldstart_top = local(mx(l + os), -r2 * sy);
          anchors.shieldend = local(mx(L - l - oe), r2 * sy);
          anchors.shieldend_top = local(mx(L - l - oe), -r2 * sy);
          anchors.shieldcenter = local(mx(L / 2), r2 * sy);
          anchors.shieldcenter_top = local(mx(L / 2), -r2 * sy);
        }
        Object.assign(anchors, dpAnchors);
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
