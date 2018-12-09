const js2xmlparser = require('js2xmlparser');
let winrm_soap_req = request('./base-request.js') 
let winrm_http_req = request('./http.js') 

function constructDeleteShellRequest(_params) {
    var res = winrm_soap_req.getSoapHeaderRequest({
        "resource_uri": "http://schemas.microsoft.com/wbem/wsman/1/windows/shell/cmd",
        "action": "http://schemas.xmlsoap.org/ws/2004/09/transfer/Delete"
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
    res['s:Body'] = { };
    return js2xmlparser.parse('s:Envelope', res);

}

module.exports.doDeleteShell = async function (_params) {
    console.log("In doReceiveOutput()..STARTS")
    var req = constructDeleteShellRequest(_params);
    console.log("doReceiveOutput REQUEST....: ",req);

    var result = await winrm_http_req.sendHttp(req, _params.host, _params.port, _params.path, _params.auth);
    console.log("doReceiveOutput RESULT: ", result)

    if (result['s:Envelope']['s:Body'][0]['s:Fault']) {
        return new Error(result['s:Envelope']['s:Body'][0]['s:Fault'][0]['s:Code'][0]['s:Subcode'][0]['s:Value'][0]);
    } else {
        //var output = result['s:Envelope']['s:Body'][0]['rsp:ReceiveResponse'][0]['rsp:Stream'];
        return 'success';
    }
}