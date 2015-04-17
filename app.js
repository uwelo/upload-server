/*jshint -W024 */
var express = require("express");
var bodyParser = require("body-parser");
var multer = require("multer");
var fs = require("fs");
var path = require("path");
var app = express();
var moment = require("moment");
var data = {};

moment.locale("de");

//static root
app.use(express.static("uploads"));
// for parsing application/json
app.use(bodyParser.json());
// for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    next();
});

// multipart upload
app.use(multipart());
app.post("/upload", saveData);


// index file
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/form.html");
});

// get uploaded files
app.get("/uploads/", function (req, res) {
    res.send(Object.keys(data).sort(sortByTimestamp).map(function (item) {
        return data[item];
    }));
});

app.get("/vin/:vin", function (req, res) {
    res.send(Object.keys(data)
        .map(function (item) {
            return data[item];
        })
        .filter(function (item) {
            return item.vin === req.params.vin;
        }
    ));
});

app.get("/key/:key", function (req, res) {
    res.send(Object.keys(data)
        .map(function (item) {
            return data[item];
        })
        .filter(function (item) {
            return item.key === req.params.key;
        }
    ));
});

// delete uploaded files
app.delete("/uploads/", function (req, res) {
    data = {};
    save(res, data);
});

// delete uploaded files
app.delete("/vin/:vin", function (req, res) {
    var key = Object.keys(data)
        .map(function (key) {
            return data[key];
        })
        .filter(function (item) {
            return item.vin === req.params.vin;
        })
        .reduce(function (memo, item) {
            return item.folder;
        }, "");

    delete data[key];

    save(res, data);
});

start();

function saveData(req, res) {
    save(res, data);
}


function multipart() {
    return multer({
        dest: "./uploads",
        rename: function (fieldname, filename, req) {
            return filename.replace(/\W+/g, "-").toLowerCase() + Date.now();
        },
        changeDest: function(dest, req) {
            var changedDest = path.join(dest, req.body.key || req.query.key);
            if (!fs.existsSync(changedDest)) {
                fs.mkdirSync(changedDest);
            }
            return changedDest;
        },
        onFileUploadComplete: function (file, req) {
            if (!data[req.body.key || req.query.key]) {
                data[req.body.key || req.query.key] = {
                    vin: req.body.vin || req.query.vin,
                    folder: req.body.key || req.query.key,
                    time: req.body.time || req.query.time,
                    images: []
                };
            }
            data[req.body.key || req.query.key].images.push(path.basename(file.path));
        }
    });
}

function start() {
    fs.readFile("data.json", function (err, filedata) {
        if (err) {
            console.log("error reading data.json", err);
        }

        try {
            data = JSON.parse(filedata);
            startServer();
        } catch (e) {
            console.log("error parsing data.json", e);
        }
    });
}

function startServer() {
    var server = app.listen(process.env.PORT || 5000, function () {
        var host = server.address().address;
        var port = server.address().port;

        console.log("App listening at http://%s:%s", host, port);
    });
}

function sortByTimestamp(a, b) {
    if (data[a].time < data[b].time) {
        return -1;
    }
    if (data[a].time > data[b].time) {
        return 1;
    }
    // a must be equal to b
    return 0;
}

function save(res, obj) {
    fs.writeFile("data.json", JSON.stringify(obj || {}), function (err) {
        if (err) {
            res.status(500).send("error saving data.json");
        }
        res.send(obj);
    });
}


