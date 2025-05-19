# Node Mongo CRUD API 🔍

A simple and beginner-friendly RESTful API built with **Node.js**, **Express**, and **MongoDB (Mongoose)**.  
This project demonstrates basic CRUD operations (Create, Read, Update, Delete) with a clear folder structure and middleware setup.

![mongoDB project](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEga7P9XPsZIoDdkrK7TerP5mNnFQMrPIs05CXtcodNvhf-AOZw2PdXn4lj0WIqisEZE6zVhsv1m2r7_D03FEHYuobrqTFV0xULl4Garn0J6RUfK2JeXPYFfJtPPZvjHXviDuoN9XX3fmfDcgzCKvYJjSPfcZb5JzRZIg-UaYH9wRMpRD0uXdSQnBlPjlYi1/s1306/Screenshot%202025-04-29%20at%2014.03.47.png)

## 🚀 Features

- Create, Read, Update, Delete (CRUD) functionality
- Express server
- MongoDB with Mongoose
- Middleware setup: body-parser, morgan, cors
- Nodemon for auto-reloading during development

---

## 📁 Project Structure
project-root/  
├── models/ # Mongoose schemas  
├── routes/ # Express routes  
├── controllers/ # Logic for each route  
├── server.js # Main server file  
├── .env # Environment variables  
└── package.json  

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/ouyniya/kickstart-nodejs-mongoDB-crud-api.git

# Go into the project directory
cd node-mongo-crud-api

# Install dependencies
npm install
```

## 🧪 Running the Server

```
# Start server in development mode (with nodemon)
npm start
```
Make sure MongoDB is running locally at mongodb://localhost:27017/crudDB or update the DB URI in .env


## 📦 Example .env file
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/crudDB
```


## 📡 API Endpoints

| Method | Endpoint         | Description        |
|--------|------------------|--------------------|
| GET    | `/api/product`     | Get all products      |
| POST   | `/api/product`     | Create a new product  |
| GET    | `/api/product/:id` | Get product by ID     |
| PUT    | `/api/product/:id` | Update product by ID  |
| DELETE | `/api/product/:id` | Delete product by ID  |


## 💡 License
This project is licensed under the MIT License.


## 🙋‍♀️ Author
Made with ❤️ by ouyniya  
Feel free to reach out or fork this project!


This project was developed with inspiration and guidance from the video by **รอยไถ พัฒนา**.  Watch the original tutorial here:
https://youtu.be/2O2o44Kzy4o?feature=shared


## 📌  How to step-by-step  

![tutorial](https://imgur.com/Cg2IyYp.jpeg)

🎁 installation: MongoDB: https://roadtodev-th.blogspot.com/2025/04/mongodb-installation-macos.html  
Ep.1 📔 https://roadtodev-th.blogspot.com/2025/04/mern-crud-ep1-server-nodejs-mongodb.html  
Ep.2 📂 https://roadtodev-th.blogspot.com/2025/04/mern-crud-ep2-model.html  