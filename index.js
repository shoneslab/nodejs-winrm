var http = require('http');
const js2xmlparser = require('js2xmlparser');
const uuidv5 = require('uuid/v5');

function getSoapHeaderRequest(_params) {
    if (!_params['message_id']) _params['message_id'] = uuidv5.URL;
    if (!_params['resource_uri']) _params['resource_uri'] = null;
    // s == env soap-envelope
    // wsa == a addressing
    // wsman == w wsman.wsd
    var header = {
        "@": {
            "xmlns:s": "http://www.w3.org/2003/05/soap-envelope",
            "xmlns:wsa": "http://schemas.xmlsoap.org/ws/2004/08/addressing",
            "xmlns:wsman": "http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd",

            "xmlns:p": "http://schemas.microsoft.com/wbem/wsman/1/wsman.xsd",
            "xmlns:rsp": "http://schemas.microsoft.com/wbem/wsman/1/windows/shell"
        },
        "s:Header": {
            "wsa:To": "http://localhost:5985/wsman",
        },
        "wsman:ResourceURI": {
            "@": {
                "mustUnderstand": "true"
            },
            "#": _params['resource_uri']
        },
        "wsa:ReplyTo": {
            "wsa:Address": {
                "@": {
                    "mustUnderstand": "true"
                },
                "#": "http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous"
            }
        },
        "wsman:MaxEnvelopeSize": {
            "@": {
                "mustUnderstand": "true"
            },
            "#": "153600"
        },
        "wsa:MessageID": "uuid:" + _params['message_id'],
        "wsman:Locale": {
            "@": {
                "mustUnderstand": "false",
                "xml:lang": "en-US"
            }
        },
        "wsman:OperationTimeout": "PT60S",
        "wsa:Action": {
            "@": {
                "mustUnderstand": "true"
            },
            "#": _params['action']
        }
    }

    return header;
    //_callback(header);
}

function constructOpenShellRequest(_params) {
    var res = getSoapHeaderRequest({
        "resource_uri": "http://schemas.microsoft.com/wbem/wsman/1/windows/shell/cmd",
        "action": "http://schemas.xmlsoap.org/ws/2004/09/transfer/Create"
    });

    res['env:Body'] = {
        "rsp:Shell": [{
            "rsp:InputStreams": "stdin",
            "rsp:OutputStreams": "stderr stdout"
        }]
    };
    res['s:Header']['wsman:OptionSet'] = [];
    res['s:Header']['wsman:OptionSet'].push({
        "wsman:Option": [{
                "@": {
                    "Name": "WINRS_NOPROFILE"
                },
                "#": "FALSE"
            },
            {
                "@": {
                    "Name": "WINRS_CODEPAGE"
                },
                "#": "437"
            }
        ]
    });
    return js2xmlparser.parse('s:Envelope', res);

}

async function doOpenShell(_params) {
    console.log("In doOpenShell()..STARTS")
    var req = constructOpenShellRequest(_params);
    console.log(req);

    var result = await sendHttp(req, _params.host, _params.port, _params.path, _params.auth);

    //Parse the response and return the shell id

    if (result['s:Envelope']['s:Body'][0]['s:Fault']) {
        return new Error(result['s:Envelope']['s:Body'][0]['s:Fault'][0]['s:Code'][0]['s:Subcode'][0]['s:Value'][0]);
    }
    else {
        var shellid = result['s:Envelope']['s:Body'][0]['rsp:Shell'][0]['rsp:ShellId'][0];
       // callback(null,shellid);
       return shellid;
    }
}

async function sendHttp(_data, _host, _port, _path, _auth) {
    console.log("In sendHttp()..STARTS")
    var xmlRequest = "";
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

    return new Promise((resolve, reject) => {
        var req = http.request(options, (res) => {
            if (res.statusCode < 200 || res.statusCode > 299) {
                reject(new Error('Failed to process the request, status Code: ', res.statusCode));
            }
            res.setEncoding('utf8');
            res.on('data', (data) => {
                console.log(data);
                resolve(data);
            });

        });
        req.on('error', (err) => {
            reject(err);
        });
        if (xmlRequest) {
            req.write(xmlRequest);
        }
        req.end();
    });
}

async function run(_command, _host, _port, _path, _username, _password) {
    console.log("In run()..")
    var auth = 'Basic ' + Buffer.from(_username + ':' + _password, 'utf8').toString('base64');
    var params = {
        host: _host,
        port: _port,
        path: _path, 
    };
    params['auth'] = auth;
    var shellId = await doOpenShell(params);
    console.log("ShellId: ", shellId);
}

module.exports = {
    run: run
};