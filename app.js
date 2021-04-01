
const fs = require('fs');
const yaml = require('yaml');
const express = require('express');
const busboy = require('connect-busboy');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3');

const settings = yaml.parse(fs.readFileSync('settings.yaml', 'utf8'));
// sanity check settings: make sure column names do not contain apostrophe

let dbfile = ':memory:';

// Persists the data to the filesystem for debugging.
if (!process.env.RENDER) {
    // make sure the data subdirectory exists
    try {fs.mkdirSync('data')} catch (e) {};
    dbfile = 'data/sqlite.db';
}

const db = new sqlite3.Database(dbfile);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(busboy());

app.post('/api/v1/upload', (req, res) =>  {

    let provider = 'default';

    // busboy is used to parse the uploaded file because it streams. This way
    // the upload can be processed in flight rather than first loading the whole
    // thing into memory. Allows for much larger file uploads.

    req.busboy.on('field', (key, value, keyTruncated, valueTruncated) => {
        //console.log(key, value, keyTruncated, valueTruncated);
        if (key === 'provider') provider = value;
    });

    req.busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        //console.log('file', fieldname, filename, encoding, mimetype);

        // The provider value is normalized: only lower case word characters are allowed
        // Then look up the columns for this provider.
        provider = provider.replace(/\W+/g, '').toLowerCase();
        const {columns: selection} = settings.providers.default;
        const {name, columns} = settings.providers[provider] || settings.providers.default;
        const dbname = `data/${provider}.db`;

        db.serialize(() => {
            db.run(`drop table if exists ${provider}`, [], () => {

                const cmd1 = `create table ${provider} (${columns.map(col => `'${col}' text`).join(', ')})`;
                db.run(cmd1, [], () => {

                    // The insert command happens a lot, but it's always the same, so we build it here.
                    // The values for each row will be inserted using placeholders.
                    const cmd2 = `insert into ${provider} values (${columns.map(() => '?').join(', ')})`;

                    let n = 0;

                    file
                        .pipe(csv(columns))
                        .on('data', async data => {
                            n += 1;
                            const values = selection.map(item => data[item] || '');
                            db.run(cmd2, values);
                        })
                        .on('end', () => {
                            res.json({status: 'success', provider, name, n});
                        });
                });
            });
        });
    });

    req.pipe(req.busboy);
});

app.get('/api/v1/dump',  (req, res) => {
    const provider = (req.query.provider || 'default').replace(/\W+/g, '').toLowerCase();
    const {name, columns} = settings.providers.default;
    db.all(`select * from ${provider}`, (error, rows) => {
        if (error) console.log('error', error);
        if (rows) res.json({provider, name, columns, rows: rows.map(row => Object.values(row))});
    });
});

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/`);
});
