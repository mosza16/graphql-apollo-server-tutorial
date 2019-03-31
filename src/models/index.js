import Sequelize from 'sequelize';

let sequelize;

if(process.env.DATABASE_URL){
    sequelize = new Sequelize(
        process.env.DATABASE_URL,
        {
            dialect: 'postgres',
            pool: {
                max: 10,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        },
    );
} else {
    sequelize = new Sequelize(
        process.env.TEST_DATABASE || process.env.DATABASE,
        process.env.DATABASE_USER,
        process.env.DATABASE_PASSWORD,
        {
            host: process.env.DATABASE_HOST,
            port: process.env.DATABASE_PORT,
            dialect: 'postgres',
            pool: {
                max: 10,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        },
    );
}

const models = {
    User: sequelize.import('./user'),
    Message: sequelize.import('./message'),
};
  
Object.keys(models).forEach(key => {
    if ('associate' in models[key]) {
      models[key].associate(models);
    }
});
  
export { sequelize };
  
export default models;