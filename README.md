# nodejs-winrm

[![npm version](https://badge.fury.io/js/nodejs-winrm.svg)](https://badge.fury.io/js/nodejs-winrm)
[![Build Status](https://travis-ci.org/shoneslab/nodejs-winrm.svg?branch=master)](https://travis-ci.org/shoneslab/nodejs-winrm)

nodejs-winrm is a NodeJS client to access WinRM (Windows Remote Management) SOAP web service. It allows to execute commands on target windows machines.
Please visit [Microsoft's WinRM site](http://msdn.microsoft.com/en-us/library/aa384426.aspx) for WINRM details.

## Supported NodeJS Versions

## Supported WinRM Versions

As of now Winrm Version 1 is tested.

## Install

On the remote host, a PowerShell prompt, using the __Run as Administrator__ option and paste in the following lines:

```
winrm quickconfig
y
winrm set winrm/config/service/Auth '@{Basic="true"}'
winrm set winrm/config/service '@{AllowUnencrypted="true"}'
winrm set winrm/config/winrs '@{MaxMemoryPerShellMB="1024"}'
```
On the client side where NodeJS is installed

`npm install nodejs-winrm`

## Example
```
var winrm = require('nodejs-winrm');
winrm.runCommand('mkdir D:\\winrmtest001', '10.xxx.xxx.xxx', 5985, 'username', 'password');
winrm.runCommand('ipconfig /all', '10.xxx.xxx.xxx', 5985, 'username', 'password');
```
## Testing

`npm test`

## Maintainers
* Shone Jacob (https://github.com/shoneslab)

## Credits
* https://github.com/jacobludriks/winrmjs
