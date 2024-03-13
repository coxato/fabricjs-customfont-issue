const fontkit = require('fontkit');
const path = require('path');

const fontPath = path.join(__dirname, 'public', 'kJMnXVWMzrllXz5YdYWAM.woff2');
// const fontPath = path.join(__dirname, 'public', 'LW86SlYaHwPxlfuHYEQPv.ttf')

fontkit.open(fontPath, null, (err, f) => {
    console.log(f.familyName);
    console.log(f.fullName);
    console.log(f.postscriptName);
    console.log(f.subfamilyName);
    console.log(f.uniqueSubfamily);
    console.log('###');
    console.log(f.preferredFamily);
    console.log(f.preferredName);
    console.log(f.preferredfamilyName);
})
