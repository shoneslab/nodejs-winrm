let shell = require('./src/shell.js');
let command = require('./src/command.js');

module.exports = {
    shell: shell,
    command: command
};

module.exports.runCommand = async function (_command, _host, _username, _password, _port) {
    try {
        var auth = 'Basic ' + Buffer.from(_username + ':' + _password, 'utf8').toString('base64');
        var params = {
            host: _host,
            port: _port,
            path: '/wsman',
        };
        params['auth'] = auth;
        var shellId = await shell.doCreateShell(params);
        params['shellId'] = shellId;
    
        params['command'] = _command;
        var commandId = await command.doExecuteCommand(params);
    
        params['commandId'] = commandId;
        var output = await command.doReceiveOutput(params);
    
        await shell.doDeleteShell(params);
    
        return output;
    } catch (error) {
        console.log('error', error);
        return error;
    }   
   
};

