// shared-models/src/common/config/database.config.ts
export const databaseConfig = {
  uri:
    process.env.DATABASE_URI ||
    "mongodb://admin:Banco123*@localhost:27018/bancodb?authSource=admin",
};
