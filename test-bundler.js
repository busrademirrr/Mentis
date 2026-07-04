const http = require('http');

http.get('http://localhost:8081/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const match = data.match(/<script src="([^"]+)"/);
        if(match) {
            console.log('Bundle URL:', match[1]);
            http.get('http://localhost:8081' + match[1], (res2) => {
                console.log('Bundle Status:', res2.statusCode);
                let bundleData = '';
                res2.on('data', chunk => bundleData += chunk);
                res2.on('end', () => {
                    if (res2.statusCode !== 200) {
                        console.log('ERROR JSON:', bundleData);
                    } else {
                        console.log('Bundle loaded successfully.');
                    }
                });
            });
        }
    });
});
