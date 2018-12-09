var winrm = require('../index.js');

console.log("hi")
winrm.shell('mkdir D:\\winrmtest001', '10.xxx.xxx.xxx', 5985, '/wsman', 'username', password);