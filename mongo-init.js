db = db.getSiblingDB('pingpong');
db.createUser({ user: "app_user", pwd: "app_password", roles: [{ role: "readWrite", db: "pingpong" }] });
db.createCollection('users');
db.users.insertMany([{ name: "Player A", wins: 0 }, { name: "Player B", wins: 0 }]);
