import Quagga from "quagga";
import Tone from "tone";

/**
 * Init
 */
Quagga.init(
  {
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

  err => {
    if (err) {
      console.log(err);
    } else {
      Quagga.start();
    }
  }
);

/**
 * Debug lines
 */
Quagga.onProcessed(result => {
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
      Quagga.ImageDebug.drawPath(result.line, { x: "x", y: "y" }, drawingCtx, {
        color: "darkred",
        lineWidth: 3
      });
    }
  }
});

/**
 * Synth setup
 */
// Tone, global to interact with it in console
// const reverb = new Tone.Reverb().toMaster();
const synth = (window.synth = new Tone.AMSynth());

synth.toMaster();
// synth.connect(reverb);

Quagga.onDetected(result => {
  var code = result.codeResult.code;
  executeCommand(code);
});

function executeCommand(code) {
  const [command, param] = code.split("-");
  console.log(code, command, param);

  // Scanned an oscillator
  if (command == "OSC") {
  }

  // Scanned an effect
  else if (command == "FX") {
  }

  // Scanned reverb
  else if (command == "RV") {
  }

  // Scanned a note
  else {
    synth.triggerAttackRelease(code.replace("S", "#"), "16n");
  }

  // NOTE
  // if (command == "N") {
  //   synth.triggerAttackRelease(param, "16n");
  // }

  // // FREQUENCY
  // if (command == "F") {
  //   synth.triggerAttackRelease(param, "16n");
  // }

  // // REVERB
  // if (command == "R") {
  //   reverb.decay = parseInt(command);
  // }
}

/**
 * Keyboard debugging
 */
window.addEventListener("keydown", e => {
  synth.triggerAttackRelease(`${e.key}3`, "16n");
});
