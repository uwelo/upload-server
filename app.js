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
    res.send(data);
});

app.get("/uploads/:key", function (req, res) {
    res.send(data[req.params.key] || {});
});

// delete uploaded files
app.delete("/uploads/", function (req, res) {
    data = {};

    res.send(data);
});

// delete uploaded files
app.delete("/uploads/:key", function (req, res) {
    if (data[req.params.key]) {
        delete data[req.params.key];
    }

    res.send(data);
});


start();




function saveData(req, res) {
    fs.writeFile("data.json", JSON.stringify(data), function (err) {
        if (err) {
            res.send("error saving data.json");
        }
        res.redirect("back");
    });

}

function multipart() {
    return multer({
        dest: "./uploads",
        rename: function (fieldname, filename) {
            console.log(rename);
            return filename.replace(/\W+/g, "-").toLowerCase() + Date.now();
        },
        changeDest: function(dest, req) {
            var changedDest = path.join(dest, req.query.key);
            console.log(changedDest);
            if (!fs.existsSync(changedDest)) {
                fs.mkdirSync(changedDest);
            }
            return changedDest;
        },
        onFileUploadComplete: function (file, req) {
            if (!data[req.query.key]) {
                data[req.query.key] = {
                    vin: req.query.vin,
                    folder: req.query.key,
                    time: req.query.time,
                    images: []
                };
            }
            console.log(data[req.query.key]);
            data[req.query.key].images.push(path.basename(file.path));
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
