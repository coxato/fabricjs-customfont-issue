const express = require('express');
const path = require('path');
const app = express();

// public
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index.html');
})

app.listen(3000, () => {
    console.log('server running on port 3000');
});