const { fabric } = require('fabric');
const path = require('path');
const fs = require('fs');

const fontFamily = 'Fb Absoluti Con';

// register font in nodeCanvas
fabric.util.clearFabricFontCache(fontFamily);
fabric.nodeCanvas.registerFont(path.join(__dirname, 'public', 'fbabsoluti.otf'), {
    weight: 600, 
    family: fontFamily, 
    style: 'normal'
});

// create canvas and add text
const canvas = new fabric.StaticCanvas(null, {
    width: 400,
    height: 400,
    backgroundColor: 'lightgrey',
});
const txt = new fabric.Textbox('זיידענפעלד', {
    left: 10,
    top: 20,
    fontFamily,
    fontWeight: 600,
    direction: 'rtl',
    textAlign: 'right',
    fontSize: 40
});
canvas.add(txt);
canvas.renderAll();

// generate base 64 and save image in disk
const b64 = canvas.toDataURL({ format: 'jpeg' }).split(',')[1];
fs.writeFileSync(path.join(__dirname, 'nodegenerated.jpg'), b64, { encoding: 'base64' });
console.log('finished');