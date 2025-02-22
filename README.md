# Do Task Server

"Do Task" Server is the backend for the "Do Task" task management application. It provides authentication, task management, and real-time data persistence using Express.js, MongoDB, and JWT authentication.

## 🚀 Frontend Github Repository & Live Project 
🔗 [Frontend Repository](https://do-task-atiq.web.app/)  
🔗 [Live Projec](https://do-task-atiq.web.app/)  


## 🚀 Features

- User Authentication using JWT
- CRUD Operations for managing tasks
- CORS Enabled for secure cross-origin requests
- Environment Variables for secure configuration
- Deployed on Vercel for easy scalability

## 🛠 Technologies Used

- **Node.js**
- **Express.js**
- **MongoDB (Native Driver)**
- **JWT (jsonwebtoken)**
- **CORS**
- **dotenv**

## 📌 Installation

### Clone the repository:
```sh
git clone https://github.com/yourusername/dotask-server.git
cd dotask-server
```

### Install dependencies:
```sh
npm install
```

### Create a `.env` file in the root directory and add the following:
```ini
MONGO_URI="your-mongodb-connection-string"
ACCESS_SECRET="your-secret-key"
```

### Run the server locally:
```sh
npm start
```

## 📡 API Endpoints

### Authentication

- **POST** `/jwt` – return a JWT token.
- **POST** `/users` – Register and Authenticate user and return a JWT token.
- **PUT** `/users/:email` – Update a user.

### Task Management

- **POST** `/tasks` – Add a new task.
- **GET** `/tasks` – Retrieve all tasks.
- **PUT** `/tasks/:id` – Update a task.
- **DELETE** `/tasks/:id` – Delete a task.

## 🚀 Deployment

The server is deployed on **Vercel**. You can deploy your own instance by running:
```sh
vercel
```

## 📜 License  

This project is licensed under the **MIT License**.  


## Contact

If you have any questions or suggestions, feel free to contact me at [itsatiqur28@gmail.com].
