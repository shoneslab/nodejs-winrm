var winrm = require('../index.js');

async function performTest() {
    try {
        //var result = await winrm.runCommand('mkdir D:\\winrmtest001', '10.xxx.xxx.xxx', 5985, 'username', 'password');
        var result = await winrm.runCommand('ipconfig /all', '10.xxx.xxx.xxx', 'username', 'password', 5985);
        console.log(result);
    } catch (error) {
        console.error(`Exception Occurred: ${error}`);
    }
}

performTest();