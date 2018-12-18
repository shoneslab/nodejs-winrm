const js2xmlparser = require('js2xmlparser');
let winrm_soap_req = require('./base-request.js');
let winrm_http_req = require('./http.js');

function constructRunCommandRequest(_params) {
    var res = winrm_soap_req.getSoapHeaderRequest({
        'action': 'http://schemas.microsoft.com/wbem/wsman/1/windows/shell/Command',
        'shellId': _params.shellId
    });

    res['s:Header']['wsman:OptionSet'] = [];
    res['s:Header']['wsman:OptionSet'].push({
        'wsman:Option': [{
                '@': {
                    'Name': 'WINRS_CONSOLEMODE_STDIN'
                },
                '#': 'TRUE'
            },
            {
                '@': {
                    'Name': 'WINRS_SKIP_CMD_SHELL'
                },
                '#': 'FALSE'
            }
        ]
    });
    res['s:Body'] = {
        'rsp:CommandLine': {
            'rsp:Command': _params.command
        }
    };
    return js2xmlparser.parse('s:Envelope', res);
}

function constructReceiveOutputRequest(_params) {
    var res = winrm_soap_req.getSoapHeaderRequest({
        'action': 'http://schemas.microsoft.com/wbem/wsman/1/windows/shell/Receive',
        'shellId': _params.shellId
    });

    res['s:Body'] = {
        'rsp:Receive': {
            'rsp:DesiredStream': {
                '@': {
                    'CommandId': _params.commandId
                },
                '#': 'stdout stderr'
            }
        }
    };
    return js2xmlparser.parse('s:Envelope', res);
}

module.exports.doExecuteCommand = async function (_params) {
    var req = constructRunCommandRequest(_params);

    var result = await winrm_http_req.sendHttp(req, _params.host, _params.port, _params.path, _params.auth);

    if (result['s:Envelope']['s:Body'][0]['s:Fault']) {
        return new Error(result['s:Envelope']['s:Body'][0]['s:Fault'][0]['s:Code'][0]['s:Subcode'][0]['s:Value'][0]);
    } else {
        var commandId = result['s:Envelope']['s:Body'][0]['rsp:CommandResponse'][0]['rsp:CommandId'][0];
        return commandId;
    }
};

function generatePowershellCommand(_params) {
    var args = [];
    args.unshift(
        'powershell.exe',
        '-NoProfile',
        '-NonInteractive',
        '-NoLogo',
        '-ExecutionPolicy', 'Bypass',
        '-InputFormat', 'Text',
        '-Command', '"& {',
        _params.command,
        '}"'
    );
    return args.join(' ');
}

module.exports.doExecutePowershell = async function (_params) {
    _params['command'] = generatePowershellCommand(_params);
    this.doExecuteCommand(_params);
};

module.exports.doReceiveOutput = async function (_params) {
    var req = constructReceiveOutputRequest(_params);

    var result = await winrm_http_req.sendHttp(req, _params.host, _params.port, _params.path, _params.auth);

    if (result['s:Envelope']['s:Body'][0]['s:Fault']) {
        return new Error(result['s:Envelope']['s:Body'][0]['s:Fault'][0]['s:Code'][0]['s:Subcode'][0]['s:Value'][0]);
    } else {
        var successOutput = '',
            failedOutput = '';
        if (result['s:Envelope']['s:Body'][0]['rsp:ReceiveResponse'][0]['rsp:Stream']) {
            for (let stream of result['s:Envelope']['s:Body'][0]['rsp:ReceiveResponse'][0]['rsp:Stream']) {
                if (stream['$'].Name == 'stdout' && !stream['$'].hasOwnProperty('End')) {
                    successOutput += new Buffer(stream['_'], 'base64').toString('ascii');
                }
                if (stream['$'].Name == 'stderr' && !stream['$'].hasOwnProperty('End')) {
                    failedOutput += new Buffer(stream['_'], 'base64').toString('ascii');
                }
            }
        }
        if (successOutput) {
            return successOutput.trim();
        }
        return failedOutput.trim();
    }
};