const uuidv5 = require('uuid/v5');

module.exports.getSoapHeaderRequest = function (_params) {
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
                "#": "http://schemas.microsoft.com/wbem/wsman/1/windows/shell/cmd"
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