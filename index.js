const mysqlx = require('@mysql/xdevapi');

const config = {
    password: 'rootpass',
    user: 'root',
    host: 'localhost',
    port: 33060,
    schema: 'molehill_test'
};

// Reference for mysqlx lib: https://dev.mysql.com/doc/x-devapi-userguide/en/devapi-users-working-with-relational-tables.html
mysqlx.getSession(config)
    .then(session => {
        console.log(session.inspect()); 
        const molehillDB = session.getSchema('molehill_test');
        
        const productTable = molehillDB.getTable('walmart_test');

        // Insert SQL Table data
        productTable.insert(['walmart_id','weight','d1','d2','d3','category','title','url']).
            values(1, 100, 10, 12, 14, 'Test Category', 'My test prod', 'walmart.com/test-prod').execute();
    });
