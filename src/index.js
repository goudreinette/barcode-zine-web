/**
 * Init
 */
Quagga.init({}, err => {
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
      drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
      result.boxes
        .filter(box => box !== result.box)
        .forEach(box => {
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
const reverb = new Tone.Reverb().toMaster();
const distortion = new Tone.Distortion().connect(reverb);
const phaser = new Tone.Phaser().connect(distortion);
const bitcrusher = new Tone.BitCrusher().connect(phaser);
const delay = new Tone.FeedbackDelay().connect(bitcrusher);
const synth = new Tone.AMSynth().connect(delay);

// Make the synth dry at first -- 
function makeDry() {
  distortion.wet = 0
  phaser.wet = 0
  bitcrusher.wet = 0
  delay.wet = 0
}

makeDry()


/**
 * On detected
 */
Quagga.onDetected(result => {
  var code = result.codeResult.code;
  executeCommand(code);
});


function executeCommand(code) {
  const [command, param] = code.toUpperCase().split("-");
  console.log(code, command, param);

  // Scanned an oscillator
  if (command == "OSC") {
    if (param == "SINE") 
      synth.oscillator = new Tone.Oscillator(440, "sine")
    if (param == "SQUARE") 
      synth.oscillator = new Tone.Oscillator(440, "square")
    if (param == "TRIANGLE") 
      synth.oscillator = new Tone.Oscillator(440, "triangle")
    if (param == "SAW") 
      synth.oscillator = new Tone.Oscillator(440, "sawtooth")
  }

  // Scanned an effect
  else if (command == "FX") {
    makeDry()
    if (param == 'DISTORTION')
      distortion.wet = .5
    if (param == 'PHASER')
      phaser.wet = .5
    if (param == 'BITCRUSHER')
      bitcrusher.wet = .5
    if (param == 'DELAY')
      delay.wet = .5
  }

  // Scanned reverb
  else if (command == "R") {
    reverb.decay = parseInt(param);
  }

  // Scanned a note
  else {
    synth.triggerAttackRelease(code.replace("S", "#"), "16n");
  }
}


/**
 * Keyboard debugging
 */
addEventListener("keydown", e => {
  synth.triggerAttackRelease(`${e.key}3`, "16n");
});
