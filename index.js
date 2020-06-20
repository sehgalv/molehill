const mysqlx = require('@mysql/xdevapi');

const config = {
    password: 'rootpass',
    user: 'root',
    host: 'localhost',
    port: 33060,
    schema: 'molehill_test'
};

mysqlx.getSession(config)
    .then(session => {
        console.log(session.inspect()); 
    });
