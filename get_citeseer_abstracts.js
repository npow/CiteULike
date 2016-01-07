var async = require('async');
var fs = require('fs');
var parseString = require('xml2js').parseString;

var CITESEERX_DIR = 'k0.7j-nsw-3g-t-citeseerx-pub/papers';
var FNAME = 'citeseer.txt';

function loadDocs(fname) {
    var docs = fs.readFileSync(fname).toString().split('\n').filter(function (x) {
        return line.indexOf('viewdoc') > -1;
    }).map(function (x) {
        var L = x.split();
        var id = L[0];
        var url = L[1];
        var doi = url.substr(url.indexOf('='));
        return { id: id, doi: doi };
    });
    return docs;
}

function loadTags(fname) {
    var tagMap = {};
    fs.readFileSync(fname).toString().split('\n').filter(function (x) {
        return line.trim().length > 0;
    }).map(function (x) {
        var L = x.split('|');
        var id = L[0];
        var tag = L[3];
        tagMap[id] ||= [];
        tagMap[id].push(tag);
    });
    return tagMap;
}

function getTags(doc, cb) {
    return tagMap[doc.id] || [];
}

function getAbstract(doc, cb) {
    var xml = fs.readFileSync(doc.xmlFile).toString();
    parseString(xml, function (err, result) {
        return result.paper.abstract;
    });
}

docs.forEach(function (doc) {
    doc.xmlFile = util.format('%s/%s.xml', CITESEERX_DIR, doc.doi);
});
async.filter(docs, function (doc, docCB) {
    fs.exists(doc.xmlFile, docCB);
}, function (validDocs) {
    async.map(validDocs, function (doc, docCB) {
        getAbstract(doc, docCB);
    }, function (err, results) {
        async.map(results, getTags, function (err, taggedResults) {
            fs.writeFileSync('citeseer.json', JSON.stringify(taggedResults));
        });
    });
});
