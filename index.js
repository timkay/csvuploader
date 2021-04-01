
const express = require('express');
const busboy = require('connect-busboy');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(busboy());

app.post('/api/v1/upload', (req, res) =>  {

    let n = 0;

    // busboy is used to parse the uploaded file because it streams. This way
    // the upload can be processed in flight rather than first loading the whole
    // thing into memory. Allows for much larger file uploads.

    req.busboy.on('field', function (key, value, keyTruncated, valueTruncated) {
        console.log(key, value, keyTruncated, valueTruncated);
    });

    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        console.log('file', fieldname, filename, encoding, mimetype);
        file
        .pipe(csv())
        .on('data', data => {
            n += 1;
            console.log('data', data);
        })
        .on('end', () => {
            console.log('end');
            res.end(`Uploaded ${n} lines`);
        });
    });

    req.pipe(req.busboy);
});

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/`);
});

