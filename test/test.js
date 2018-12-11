var winrm = require('../index.js');

async function performTest() {
    try {
        //var result = await winrm.shell('mkdir D:\\winrmtest001', '10.xxx.xxx.xxx', 5985, 'username', 'password');
        var result = await winrm.shell('ipconfig /all', '10.xxx.xxx.xxx', 5985, 'username', 'password');
        console.log(result);
    } catch (error) {
        console.error(`Exception Occurred: ${error}`);
    }
}

performTest();