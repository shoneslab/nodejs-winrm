const js2xmlparser = require('js2xmlparser');
let winrm_soap_req = require('./base-request.js');
let winrm_http_req = require('./http.js');

function constructReceiveOutputRequest(_params) {
    var res = winrm_soap_req.getSoapHeaderRequest({
        "action": "http://schemas.microsoft.com/wbem/wsman/1/windows/shell/Receive"
    });

    res['s:Header']['wsman:SelectorSet'] = [];
    res['s:Header']['wsman:SelectorSet'].push({
        "wsman:Selector": [{
            "@": {
                "Name": "ShellId"
            },
            "#": _params.shellId
        }]
    });
    res['s:Body'] = {
        "rsp:Receive": {
            "rsp:DesiredStream": {
                "@": {
                    "CommandId": _params.commandId
                },
                "#": "stdout stderr"
            }
        }
    };
    return js2xmlparser.parse('s:Envelope', res);
}

module.exports.doReceiveOutput = async function (_params) {
    var req = constructReceiveOutputRequest(_params);

    var result = await winrm_http_req.sendHttp(req, _params.host, _params.port, _params.path, _params.auth);

    if (result['s:Envelope']['s:Body'][0]['s:Fault']) {
        return new Error(result['s:Envelope']['s:Body'][0]['s:Fault'][0]['s:Code'][0]['s:Subcode'][0]['s:Value'][0]);
    } else {
        var output = '';
        for (let stream of result['s:Envelope']['s:Body'][0]['rsp:ReceiveResponse'][0]['rsp:Stream']) {
            if (stream['$'].Name == 'stdout' && !stream['$'].hasOwnProperty('End')) {
                output += new Buffer(stream['_'], 'base64').toString('ascii');
            }
        }
        return output;
    }
}