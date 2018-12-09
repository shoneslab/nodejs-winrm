const js2xmlparser = require('js2xmlparser');
let winrm_soap_req = require('./base-request.js'); 
let winrm_http_req = require('./http.js'); 

function constructRunCommandRequest(_params) {
    var res = winrm_soap_req.getSoapHeaderRequest({
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
            "#": _params.shellId
        }]
    });
    res['s:Body'] = {
        "rsp:CommandLine": {
            "rsp:Command": _params.command
        }
    };
    return js2xmlparser.parse('s:Envelope', res);

}


module.export.doExecuteCommand = async function (_params) {
    console.log("In doExecuteCommand()..STARTS")
    var req = constructRunCommandRequest(_params);
    console.log(".....RUN COMMAND REQUEST........",req);

    var result = await winrm_http_req.sendHttp(req, _params.host, _params.port, _params.path, _params.auth);
    console.log(".....RUN COMMAND RESULT.......: ", result)


    if (result['s:Envelope']['s:Body'][0]['s:Fault']) {
        return new Error(result['s:Envelope']['s:Body'][0]['s:Fault'][0]['s:Code'][0]['s:Subcode'][0]['s:Value'][0]);
    } else {
        var commandId = result['s:Envelope']['s:Body'][0]['rsp:CommandResponse'][0]['rsp:CommandId'][0];
        return commandId;
    }


}