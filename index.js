
const fs = require('fs');
const yaml = require('yaml');
const express = require('express');
const busboy = require('connect-busboy');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3');
const {open} = require('sqlite');

const settings = yaml.parse(fs.readFileSync('settings.yaml', 'utf8'));
// sanity check settings: make sure column names do not contain apostrophe

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(busboy());

app.post('/api/v1/upload', (req, res) =>  {

    let provider = 'default';
    let n = 0;

    // busboy is used to parse the uploaded file because it streams. This way
    // the upload can be processed in flight rather than first loading the whole
    // thing into memory. Allows for much larger file uploads.

    req.busboy.on('field', function (key, value, keyTruncated, valueTruncated) {
        //console.log(key, value, keyTruncated, valueTruncated);
        if (key === 'provider') provider = value;
    });

    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        //console.log('file', fieldname, filename, encoding, mimetype);

        (async function () {

            // The provider value is normalized: only lower case word characters are allowed
            // Then look up the columns for this provider.
            provider = provider.replace(/\W+/g, '').toLowerCase();
            const {name, columns} = settings.providers[provider] || settings.providers.default;
            const dbname = `data/${provider}.db`;

            // make sure the data subdirectory exists
            try {await fs.promises.mkdir('data')} catch (e) {console.log(e)};
            try {await fs.promises.unlink(dbname)} catch (e) {};
            const db = await open({filename: dbname, driver: sqlite3.Database});

            const cmd1 = `create table data (${columns.map(col => `'${col}' text`).join(', ')})`;
            console.log(cmd1);
            await db.exec(cmd1);

            // The insert command happens a lot, but it's always the same, so we build it here.
            // The values for each row will be inserted using placeholders.
            const cmd2 = `insert into data values (${columns.map(col => '?').join(', ')})`;

            console.log(cmd2);

            file
            .pipe(csv())
            .on('data', async data => {
                n += 1;
                //console.log('data', data);
                const values = columns.map(item => data[item] || '');
                console.log(values);
                await db.exec(cmd2, values);
            })
            .on('end', () => {
                console.log('end');
                res.end(`Uploaded ${n} lines for provider ${provider}=${name}`);
            });

        })();
    });

    req.pipe(req.busboy);
});

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/`);
});

