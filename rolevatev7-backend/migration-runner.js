const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ['dist/src/**/*.entity.js'],
  migrations: ['dist/src/migrations/*.js'],
  synchronize: false,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runMigrations() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');
    
    await AppDataSource.runMigrations();
    console.log('Migrations have been run successfully!');
    
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

runMigrations();
