const http = require('http');
const js2xmlparser = require('js2xmlparser');
const uuidv5 = require('uuid/v5');
const xml2jsparser = require('xml2js').parseString;

let winrm_receive_output = require('./src/receive-output.js');
let winrm_delete_shell = require('./src/delete-shell.js');

function getSoapHeaderRequest(_params) {
    if (!_params['message_id']) _params['message_id'] = uuidv5.URL;
    if (!_params['resource_uri']) _params['resource_uri'] = null;

    var header = {
        "@": {
            "xmlns:s": "http://www.w3.org/2003/05/soap-envelope",
            "xmlns:wsa": "http://schemas.xmlsoap.org/ws/2004/08/addressing",
            "xmlns:wsman": "http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd",

            "xmlns:p": "http://schemas.microsoft.com/wbem/wsman/1/wsman.xsd",
            "xmlns:rsp": "http://schemas.microsoft.com/wbem/wsman/1/windows/shell"
        },
        "s:Header": {
            "wsa:To": "http://windows-host:5985/wsman",

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
        },
    }

    return header;
}

function constructOpenShellRequest(_params) {
    var res = getSoapHeaderRequest({
        "resource_uri": "http://schemas.microsoft.com/wbem/wsman/1/windows/shell/cmd",
        "action": "http://schemas.xmlsoap.org/ws/2004/09/transfer/Create"
    });

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
    res['s:Body'] = {
        "rsp:Shell": [{
            "rsp:InputStreams": "stdin",
            "rsp:OutputStreams": "stderr stdout"
        }]
    };
    return js2xmlparser.parse('s:Envelope', res);

}

function constructRunCommandRequest(_params) {
    var res = getSoapHeaderRequest({
        "resource_uri": "http://schemas.microsoft.com/wbem/wsman/1/windows/shell/cmd",
        "action": "http://schemas.microsoft.com/wbem/wsman/1/windows/shell/Command"
    });

    res['s:Header']['wsman:OptionSet'] = [];
    res['s:Header']['wsman:OptionSet'].push({
        "wsman:Option": [{
                "@": {
                    "Name": "WINRS_CONSOLEMODE_STDIN"
                },
                "#": "TRUE"
            },
            {
                "@": {
                    "Name": "WINRS_SKIP_CMD_SHELL"
                },
                "#": "FALSE"
            }
        ]
    });
    res['s:Header']['wsman:SelectorSet'] = [];
    res['s:Header']['wsman:SelectorSet'].push({
        "wsman:Selector": [{
            "@": {
                "Name": "ShellId"
            },
            "#": _params.shellid
        }]
    });
    res['s:Body'] = {
        "rsp:CommandLine": {
            "rsp:Command": _params.command
        }
    };
    return js2xmlparser.parse('s:Envelope', res);

}

async function doOpenShell(_params) {
    console.log("In doOpenShell()..STARTS")
    var req = constructOpenShellRequest(_params);
    console.log(req);

    var result = await sendHttp(req, _params.host, _params.port, _params.path, _params.auth);
    console.log("SHELL RESULT: ", result)
    //Parse the response and return the shell id

    if (result['s:Envelope']['s:Body'][0]['s:Fault']) {
        return new Error(result['s:Envelope']['s:Body'][0]['s:Fault'][0]['s:Code'][0]['s:Subcode'][0]['s:Value'][0]);
    } else {
        var shellid = result['s:Envelope']['s:Body'][0]['rsp:Shell'][0]['rsp:ShellId'][0];
        return shellid;
    }
}

async function doRunCommand(_params) {
    console.log("In doOpenShell()..STARTS")
    var req = constructRunCommandRequest(_params);
    console.log(".....RUN COMMAND REQUEST........",req);

    var result = await sendHttp(req, _params.host, _params.port, _params.path, _params.auth);
    console.log(".....RUN COMMAND RESULT.......: ", result)


    if (result['s:Envelope']['s:Body'][0]['s:Fault']) {
        //TODO Handle Error Scenario
    } else {
        var commandid = result['s:Envelope']['s:Body'][0]['rsp:CommandResponse'][0]['rsp:CommandId'][0];
        return commandid;
    }


}
//TODO Delete Shell
// TODO Command Results

async function sendHttp(_data, _host, _port, _path, _auth) {
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

async function shell(_command, _host, _port, _path, _username, _password) {
    console.log("In run()..")
    var auth = 'Basic ' + Buffer.from(_username + ':' + _password, 'utf8').toString('base64');
    var params = {
        host: _host,
        port: _port,
        path: _path,
    };
    params['auth'] = auth;
    var shellId = await doOpenShell(params);
    params['shellid'] = shellId;
    console.log("====================ShellId===============: ", shellId);

    params['command'] = _command;
    var commandId = await doRunCommand(params);
    console.log("=================Command ID===============: ", commandId);

    var output = await winrm_receive_output.doReceiveOutput( params );
    console.log("=================Output===============: ", output);

    var cleanup = await winrm_delete_shell.doDeleteShell( params );
    console.log("=================CleanUp===============: ", cleanup);
}

module.exports = {
    shell: shell
};