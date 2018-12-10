let winrm_create_shell = require('./src/create-shell.js');
let winrm_execute_cmd = require('./src/execute-command.js');
let winrm_receive_output = require('./src/receive-output.js');
let winrm_delete_shell = require('./src/delete-shell.js');

async function shell(_command, _host, _port, _username, _password) {
    var auth = 'Basic ' + Buffer.from(_username + ':' + _password, 'utf8').toString('base64');
    var params = {
        host: _host,
        port: _port,
        path: '/wsman',
    };
    params['auth'] = auth;
    var shellId = await winrm_create_shell.doCreateShell(params);
    params['shellId'] = shellId;

    params['command'] = _command;
    var commandId = await winrm_execute_cmd.doExecuteCommand(params);

    params['commandId'] = commandId;
    var output = await winrm_receive_output.doReceiveOutput(params);
    console.log(output)

    var cleanup = await winrm_delete_shell.doDeleteShell(params);

    return output
}

module.exports = {
    shell: shell
};