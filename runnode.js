const { fabric } = require('fabric');
const path = require('path');
const fsPromises = require('fs/promises');
const express = require('express');
const opentypeJs = require('opentype.js');
// const stringify = require('json-stringify-safe')

const app = express();
// public
app.use(express.static(path.join(__dirname, 'public')));
app.use('/generated', express.static(path.join(__dirname, 'generated')));


async function readFontProperties(fontPath) {
    try {
        const buffer = await fsPromises.readFile(fontPath); 
        const fontProps = opentypeJs.parse(buffer.buffer)
    
        const { fontFamily, fontSubfamily, fullName, preferredFamily, preferredSubfamily } = fontProps.names;
        // await fsPromises.writeFile('fontprops.json', stringify(fontProps))
        console.log({fontFamily, fontSubfamily, fullName, preferredFamily, preferredSubfamily});

        // because is an object { fontFamily: { en: 'string' } }
        return {
            fontFamily: Object.values(fontFamily)[0],
            fontFullName: Object.values(fullName)[0],
            fontSubfamily: Object.values(fontSubfamily)[0],
            preferredFamily: Object.values(preferredFamily || {})[0],
            preferredSubfamily: Object.values(preferredSubfamily || {})[0]
        }
        
    } catch (err) {
        console.log('[ERROR] cannot read font properties ' + err.message);
        throw new Error(err.message);
    }
}

function registerFont(fontPath, fontFamily, weight = 'normal') {
    try {
        fabric.util.clearFabricFontCache(fontFamily);
        
        fabric.nodeCanvas.registerFont(fontPath, {
            family: fontFamily,   
            weight,
            style: (/italic/i).test(fontFamily) ? 'italic' : 'normal'
        });
    } catch (err) {
        console.log('[ERROR] cannot register font in static canvas ' + err.message);
        throw new Error(err.message);
    }
}


function createCanvasAndSaveImage({ fullFamilyName, fontWeight, specialTxt }) {
    // create canvas and add text
    const canvas = new fabric.StaticCanvas(null, {
        width: 1200,
        height: 800,
        backgroundColor: 'white',
    });
    const txt = new fabric.Textbox(specialTxt, {
        left: 10,
        top: 20,
        fontFamily: fullFamilyName,
        fontWeight,
        fontSize: 100,
        fill: 'black',
        width: 1200
    });
    canvas.add(txt);
    canvas.renderAll();

    // generate base 64 and save image in disk
    const b64 = canvas.toDataURL({ format: 'jpeg' }).split(',')[1];
    fsPromises.writeFile(path.join(__dirname, 'generated', specialTxt.toLowerCase() + '.jpg'), b64, { encoding: 'base64' })
        .then(() => {
            console.log(specialTxt + ' jpg saved');
        })
        .catch((err) => console.log('cannot save jpg', err));
}


const FONTS = [
    { path: path.join(__dirname, 'public', '1Nfp2-XVhd34MZT8D1c4a.otf'), specialTxt: 'Chayala' },
    { path: path.join(__dirname, 'public', 'LW86SlYaHwPxlfuHYEQPv.ttf'), specialTxt: 'Lia Rozeta' },
]

async function runTest() {
    
    for (const fontObj of FONTS) {
        const { fontFullName,  preferredFamily } = await readFontProperties(fontObj.path);
        const weight = 'normal'

        registerFont(fontObj.path, preferredFamily || fontFullName, weight);
        
        createCanvasAndSaveImage({
            fullFamilyName: fontFullName,
            fontWeight: weight,
            specialTxt: fontObj.specialTxt
        });
    }
}


app.listen(7777, () => {
    console.log('test running on port 7777');
    runTest()
        .then(() => {
            console.log('test files generated');
            FONTS.forEach( f => {
                console.log(`http://localhost:7777/generated/${f.specialTxt.toLowerCase()}.jpg`);
            })
        })
        .catch(console.log);
})