import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// MySQL Database Connection
export const db = await mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
});

// Test database connection
export const testConnection = async () => {
  try {
    const [rows] = await db.query("SELECT 1");
    console.log("MySQL database connected successfully");
    return true;
  } catch (error) {
    console.error("MySQL database connection failed:", error);
    return false;
  }
};

export default db;
