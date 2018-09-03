const Busboy = require("busboy");
const streamer = require("./streamer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

function parse(req, res, options = {}, finish) {
    let dir = options.dir || os.tmpDir();
    let body = req.rawBody;
    if (!Buffer.isBuffer(body)) {
        res.status(406).json({ error: "gcf: unable to get raw body" });
        return;
    }

    let fields = {},
        theFile = null;
    let bodyStream = streamer.createReadStream(body);

    let busboy = new Busboy({ headers: req.headers });

    busboy.on("file", function (fieldname, file, filename, encoding, mimetype) {
        var saveTo = path.join(dir, path.basename(crypto.randomBytes(4).toString("hex")));
        file.pipe(fs.createWriteStream(saveTo));
        theFile = saveTo;
    });

    busboy.on("field", function (
        fieldname,
        val,
        fieldnameTruncated,
        valTruncated
    ) {
        fields[fieldname] = val;
    });

    busboy.on("finish", function () {
        console.log("Done parsing form!");
        finish(fields, theFile);
    });

    bodyStream.pipe(busboy);
}

exports.parse = parse;