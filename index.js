let winrm_create_shell = require('./src/create-shell.js');
let winrm_execute_cmd = require('./src/execute-command.js');
let winrm_receive_output = require('./src/receive-output.js');
let winrm_delete_shell = require('./src/delete-shell.js');

async function shell(_command, _host, _port, _path, _username, _password) {
    console.log("In run()..")
    var auth = 'Basic ' + Buffer.from(_username + ':' + _password, 'utf8').toString('base64');
    var params = {
        host: _host,
        port: _port,
        path: _path,
    };
    params['auth'] = auth;
    var shellId = await winrm_create_shell.doCreateShell(params);
    params['shellId'] = shellId;
    console.log("====================ShellId===============: ", shellId);

    params['command'] = _command;
    var commandId = await winrm_execute_cmd.doExecuteCommand(params);
    console.log("=================Command ID===============: ", commandId);

    params['commandId'] = commandId;
    var output = await winrm_receive_output.doReceiveOutput(params);
    console.log("=================Output===============: ", output);

    var cleanup = await winrm_delete_shell.doDeleteShell(params);
    console.log("=================CleanUp===============: ", cleanup);
}

module.exports = {
    shell: shell
};