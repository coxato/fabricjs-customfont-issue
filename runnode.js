const { fabric } = require('fabric');
const path = require('path');
const fsPromises = require('fs/promises');
const express = require('express');
const opentypeJs = require('opentype.js');
const fontkit = require('fontkit');

const app = express();
// public
app.use(express.static(path.join(__dirname, 'public')));
app.use('/generated', express.static(path.join(__dirname, 'generated')));


function readWOFF2FontProperties(fontPath) {
    return new Promise((resolve, reject) => {
        fontkit.open(fontPath, null, (err, fontProps) => {
            if(err){
                console.log('[ERROR] cannot read .woff2 font properties ' + err.message);
                reject(new Error(err.message));
                return;
            }

            const { familyName, fullName } = fontProps;

            resolve({
                fontFamily: familyName,
                fontFullName: fullName,
                preferredFamily: familyName,
            })
        });
    })
}


async function readStandardFontProperties(fontPath) {
    try {
        const bufferRaw = await fsPromises.readFile(fontPath);
        const fontProps = opentypeJs.parse(bufferRaw.buffer);

        const { fontFamily, fullName, preferredFamily } = fontProps.names;

        // because is an object { fontFamily: { en: 'string' } }
        return {
            fontFamily: Object.values(fontFamily)[0],
            fontFullName: Object.values(fullName)[0],
            preferredFamily: Object.values(preferredFamily || {})[0],
        }
    } catch (err) {
        console.log('[ERROR] cannot read standard font properties ' + err.message);
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


function createCanvasAndSaveImage({ fontFamily, fontWeight, specialTxt }) {
    // create canvas and add text
    const canvas = new fabric.StaticCanvas(null, {
        width: 1200,
        height: 800,
        backgroundColor: 'white',
    });
    const txt = new fabric.Textbox(specialTxt, {
        left: 10,
        top: 20,
        fontFamily: fontFamily,
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
    { path: path.join(__dirname, 'public', 'eRha8YqhC6fIlgBqnskih.otf'), specialTxt: 'בבית מורי חמי' },
    { path: path.join(__dirname, 'public', 'kJMnXVWMzrllXz5YdYWAM.woff2'), specialTxt: 'בביי חמי' },
    { path: path.join(__dirname, 'public', 'kJMnXVWMzrllXz5YdYWAM.woff2'), specialTxt: 'test woff2' },
]


async function runTest() {    
    for (const fontObj of FONTS) {
        const isWoff2 = path.extname(fontObj.path).toLowerCase() === '.woff2';

        const readFontProps = isWoff2 ? readWOFF2FontProperties : readStandardFontProperties;
        const fontProps = await readFontProps(fontObj.path);
        const { fontFullName, fontFamily,  preferredFamily } = fontProps;

        const weight = 'normal'

        registerFont(fontObj.path, preferredFamily || fontFullName, weight);
        
        createCanvasAndSaveImage({
            fontFamily,
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