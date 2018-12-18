# nodejs-winrm

[![npm version](https://badge.fury.io/js/nodejs-winrm.svg)](https://badge.fury.io/js/nodejs-winrm)
[![Build Status](https://travis-ci.org/shoneslab/nodejs-winrm.svg?branch=master)](https://travis-ci.org/shoneslab/nodejs-winrm)

nodejs-winrm is a NodeJS client to access WinRM (Windows Remote Management) SOAP web service. It allows to execute commands on target windows machines.
Please visit [Microsoft's WinRM site](http://msdn.microsoft.com/en-us/library/aa384426.aspx) for WINRM details.

## Supported NodeJS Versions

Tested on NodeJS Version > 8.11

## Supported WinRM Versions

As of now Winrm Version 3 is tested.

```
> winrm id

IdentifyResponse
    ProtocolVersion = http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd
    ProductVendor = Microsoft Corporation
    ProductVersion = OS: 10.0.xxxx SP: 0.0 Stack: 3.0
```

## Install

On the remote host, a PowerShell prompt, using the __Run as Administrator__ option and paste in the following lines:

```
> winrm quickconfig
y
> winrm set winrm/config/service/Auth '@{Basic="true"}'
> winrm set winrm/config/service '@{AllowUnencrypted="true"}'
> winrm set winrm/config/winrs '@{MaxMemoryPerShellMB="1024"}'
```
On the client side where NodeJS is installed

`npm install nodejs-winrm`

## Examples

### Run a Single Command 
```
var winrm = require('nodejs-winrm');
winrm.runCommand('mkdir D:\\winrmtest001', '10.xxx.xxx.xxx', 'username', 'password', 5985);
winrm.runCommand('ipconfig /all', '10.xxx.xxx.xxx', 'username', 'password', 5985);
```
### Run multiple Commands (Advanced)
```
var winrm = require('nodejs-winrm');

var userName = 'userName';
var password = 'password';
var _host = '10.xxx.xxx.xxx';
var _port = 5985;

var auth = 'Basic' + Buffer.from(userName + ":" + password, 'utf8').toString('base64');
var params = {
    host: _host,
    port: _port,
    path: '/wsman'
};
params['auth'] = auth;

//Get the Shell ID
params['shellId']= await winrm.shell.doCreateShell(params);

// Execute Command1
params['command'] = 'ipaddress /all';
params['commandId'] = await winrm.command.doExecuteCommand(params);
var result1= await winrm.command.doReceiveOutput(params);

// Execute Command2
params['command'] = 'mkdir D:\\winrmtest001';
params['commandId'] = await winrm.command.doExecuteCommand(params);
var result2= await winrm.command.doReceiveOutput(params);

// Close the Shell
await winrm.shell.doDeleteShell(params);

```


## Testing

`npm test`

## Maintainers
* Shone Jacob (https://github.com/shoneslab)

## Credits
* https://github.com/jacobludriks/winrmjs
