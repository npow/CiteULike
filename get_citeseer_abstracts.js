var async = require('async');
var fs = require('fs');
var parseString = require('xml2js').parseString;
var util = require('util');

var CITESEERX_DIR = 'k0.7j-nsw-3g-t-citeseerx-pub/papers';
var CITESEER_DOCS_FNAME = 'citeseer.txt';
var CITEULIKE_TAGS_FNAME = 'current_small';

function loadDocs(fname, cb) {
    var lineReader = require('readline').createInterface({
        input: fs.createReadStream(fname),
        terminal: false
    });

    var docs = [];
    lineReader.on('line', function (x) {
        x = x.replace('\n', '');
        if (x.indexOf('viewdoc') > -1) {
            var L = x.split(' ');
            var id = L[0];
            var url = L[1];
            var doi = url.substr(url.indexOf('=')+1);
            docs.push({ id: id, doi: doi, xmlFile: util.format('%s/%s.xml', CITESEERX_DIR, doi) });
        }
    });
    lineReader.on('close', function () {
        cb(docs);
    });
}

function loadTags(fname, cb) {
    var tagMap = {};
    var lineReader = require('readline').createInterface({
        input: fs.createReadStream(fname),
        terminal: false
    });

    lineReader.on('line', function (x) {
        x = x.replace('\n', '');
        if (x.trim().length > 0) {
            var L = x.split('|');
            var id = L[0];
            var tag = L[3];
            tagMap[id] = tagMap[id] || [];
            tagMap[id].push(tag);
        }
    });
    lineReader.on('close', function () {
        cb(tagMap);
    });
}

function getAbstract(doc, cb) {
    var xml = fs.readFileSync(doc.xmlFile).toString();
    parseString(xml, function (err, result) {
        doc.abstract = result.paper.abstract[0];
        cb();
    });
}

loadTags(CITEULIKE_TAGS_FNAME, function (tagMap) {
    loadDocs(CITESEER_DOCS_FNAME, function (docs) {
        async.filter(docs, function (doc, docCB) {
            fs.exists(doc.xmlFile, docCB);
        }, function (validDocs) {
            async.each(validDocs, function (doc, docCB) {
                getAbstract(doc, docCB);
            }, function (err) {
                var taggedDocs = [];
                validDocs.forEach(function (doc) {
                    if (tagMap[doc.id] && tagMap[doc.id].length > 0) {
                        taggedDocs.push(doc);
                    }
                });
                fs.writeFileSync('citeseer.json', JSON.stringify(taggedDocs));
            });
        });
    });
});
