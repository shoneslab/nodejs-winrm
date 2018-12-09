
const http = require('http');
const xml2jsparser = require('xml2js').parseString;

module.exports.sendHttp = async function (_data, _host, _port, _path, _auth) {
    console.log("In sendHttp()..STARTS")
    var xmlRequest = _data;
    var options = {
        host: _host,
        port: _port,
        path: _path,
        method: 'POST',
        headers: {
            'Authorization': _auth,
            'Content-Type': 'application/soap+xml;charset=UTF-8',
            'User-Agent': 'NodeJS WinRM Client',
            'Content-Length': xmlRequest.length
        },
    };
    console.log(options)
    console.log(xmlRequest)
    return new Promise((resolve, reject) => {
        var req = http.request(options, (res) => {
            if (res.statusCode < 200 || res.statusCode > 299) {
                reject(new Error('Failed to process the request, status Code: ', res.statusCode));
            }
            res.setEncoding('utf8');
            res.on('data', (data) => {
                console.log(data);
                xml2jsparser(data, (err, result) => {
                    if (err) {
                        reject(new Error('Data Parsing error'))
                    }
                    resolve(result);
                });

            });

        });
        req.on('error', (err) => {
            console.log("error", err)
            reject(err);
        });
        if (xmlRequest) {
            req.write(xmlRequest);
        }
        req.end();
    });
}
