import mysql from "mysql2/promise";

const connexion = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DB,
  port: process.env.DB_PORT,
  waitForConnections: true,
  // connectionLimit: 10,
  // queueLimit: 0,
});

// connexion.connect(function (err) {
//   if (err) {
//     console.error("error connecting: " + err.stack);
//     return;
//   }

//   console.log("connected as id " + connexion.threadId);
// });

// DB_CONNECTION=mysql
// DB_HOST=sentora.panel.nethub.ma
// DB_PORT=3306
// DB_DATABASE=zadmin_parc
// DB_USERNAME=parctest
// DB_PASSWORD=u6yhyjumy9a3uru2

// 54.37.90.81

export default connexion;
