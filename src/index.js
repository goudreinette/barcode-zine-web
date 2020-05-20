import Quagga from "quagga";
import Tone from "tone";
import $ from "jquery";

$(function() {
  var value;
  var App = {
    init: function() {
      Quagga.init(this.state, function(err) {
        if (err) {
          console.log(err);
          return;
        }
        Quagga.start();
      });
    },
    querySelectedReaders: function() {
      return Array.prototype.slice
        .call(document.querySelectorAll(".readers input[type=checkbox]"))
        .filter(function(element) {
          return !!element.checked;
        })
        .map(function(element) {
          return element.getAttribute("name");
        });
    },
    _accessByPath: function(obj, path, val) {
      var parts = path.split("."),
        depth = parts.length,
        setter = typeof val !== "undefined" ? true : false;

      return parts.reduce(function(o, key, i) {
        if (setter && i + 1 === depth) {
          if (typeof o[key] === "object" && typeof val === "object") {
            Object.assign(o[key], val);
          } else {
            o[key] = val;
          }
        }
        return key in o ? o[key] : {};
      }, obj);
    },
    _convertNameToState: function(name) {
      return name
        .replace("_", ".")
        .split("-")
        .reduce(function(result, value) {
          return result + value.charAt(0).toUpperCase() + value.substring(1);
        });
    },
    detachListeners: function() {
      $(".controls").off("click", "button.stop");
      $(".controls .reader-config-group").off("change", "input, select");
    },
    setState: function(path, value) {
      var self = this;

      if (typeof self._accessByPath(self.inputMapper, path) === "function") {
        value = self._accessByPath(self.inputMapper, path)(value);
      }

      self._accessByPath(self.state, path, value);

      console.log(JSON.stringify(self.state));
      App.detachListeners();
      Quagga.stop();
      App.init();
    },
    inputMapper: {
      inputStream: {
        constraints: function(value) {
          if (/^(\d+)x(\d+)$/.test(value)) {
            var values = value.split("x");
            return {
              width: { min: parseInt(values[0]) },
              height: { min: parseInt(values[1]) }
            };
          }
          return {
            deviceId: value
          };
        }
      },
      numOfWorkers: function(value) {
        return parseInt(value);
      },
      decoder: {
        readers: function(value) {
          if (value === "ean_extended") {
            return [
              {
                format: "ean_reader",
                config: {
                  supplements: ["ean_5_reader", "ean_2_reader"]
                }
              }
            ];
          }
          console.log("value before format :" + value);
          return [
            {
              format: value + "_reader",
              config: {}
            }
          ];
        }
      }
    },
    state: {
      inputStream: {
        type: "LiveStream",
        constraints: {
          width: { min: 640 },
          height: { min: 480 },
          aspectRatio: { min: 1, max: 100 },
          facingMode: "environment" // or user
        }
      },
      locator: {
        patchSize: "large",
        halfSample: true
      },
      numOfWorkers: 4,
      decoder: {
        readers: ["code_39_reader", "code_128_reader"]
      },
      locate: true,
      multiple: true
    },
    lastResult: null
  };

  //value =  App.querySelectedReaders() ;
  App.init();

  /**
   * Blah blah rea
   */

  Quagga.onProcessed(function(result) {
    var drawingCtx = Quagga.canvas.ctx.overlay,
      drawingCanvas = Quagga.canvas.dom.overlay;

    if (result) {
      if (result.boxes) {
        drawingCtx.clearRect(
          0,
          0,
          parseInt(drawingCanvas.getAttribute("width")),
          parseInt(drawingCanvas.getAttribute("height"))
        );
        result.boxes
          .filter(function(box) {
            return box !== result.box;
          })
          .forEach(function(box) {
            Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
              color: "black",
              lineWidth: 2
            });
          });
      }

      if (result.box) {
        Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
          color: "black",
          lineWidth: 2
        });
      }

      if (result.codeResult && result.codeResult.code) {
        Quagga.ImageDebug.drawPath(
          result.line,
          { x: "x", y: "y" },
          drawingCtx,
          { color: "darkred", lineWidth: 3 }
        );
      }
    }
  });

  // Tone, global to interact with it in console
  const reverb = new Tone.Reverb().toMaster();
  window.synth = new Tone.AMSynth();

  synth.connect(reverb);

  Quagga.onDetected(function(result) {
    var code = result.codeResult.code;

    executeCommand(code);

    if (App.lastResult !== code) {
      App.lastResult = code;
      var $node = null,
        canvas = Quagga.canvas.dom.image;

      $node = $(
        '<li><div class="thumbnail"><div class="imgWrapper"><img /></div><div class="caption"><h4 class="code"></h4></div></div></li>'
      );
      // $node.find("img").attr("src", canvas.toDataURL());
      $node.find("h4.code").html(code);
      $("#result_strip ul.thumbnails").prepend($node);
    }
  });
});

function executeCommand(code) {
  const [command, param] = code.split("-");
  console.log(code, command, param);

  // NOTE
  if (command == "N") {
    synth.triggerAttackRelease(param, "16n");
  }

  // FREQUENCY
  if (command == "F") {
    synth.triggerAttackRelease(param, "16n");
  }

  // REVERB
  if (command == "R") {
    reverb.decay = parseInt(command);
  }
}

addEventListener("keydown", e => {
  synth.triggerAttackRelease(`${e.key}3`, "16n");
});
