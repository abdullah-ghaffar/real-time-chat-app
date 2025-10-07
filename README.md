# Real-Time Chat Application 🚀

A full-stack, real-time chat application built with Node.js, Express, PostgreSQL, and WebSockets. This project demonstrates a complete authentication system, secure API, and a real-time messaging pipeline.



## Table of Contents
1.  [About The Project](#about-the-project)
2.  [Tech Stack](#tech-stack)
3.  [Features](#features)
4.  [Getting Started](#getting-started)
    * [Prerequisites](#prerequisites)
    * [Installation](#installation)
5.  [API Endpoints](#api-endpoints)
6.  [Real-Time Events](#real-time-events)
7.  [License](#license)

## About The Project

This project is a comprehensive chat application backend with a simple frontend for demonstration. The core objective is to showcase a professional, scalable, and secure architecture for real-world applications involving real-time communication.

---

## Tech Stack

Here are the key technologies used to build this application:

* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL
* **Real-time Communication:** Socket.IO
* **Authentication:** JSON Web Tokens (JWT)
* **Security:** bcrypt.js (for password hashing), CORS
* **Environment Variables:** dotenv

---

## Features

* ✅ Secure User Authentication (Signup & Login)
* 🔐 JWT-based Authorization for protected routes
* 🔑 Secure Password Hashing with bcrypt
* 💬 Ability to start 1-on-1 conversations
* 📨 Send & Receive messages in real-time
* 📜 View complete chat history for a conversation
* ⚙️ Professional Git workflow with `main` and `develop` branches

---

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have the following installed on your machine:
* Node.js ([Download](https://nodejs.org/))
* PostgreSQL ([Download](https://www.postgresql.org/download/))
* Git ([Download](https://git-scm.com/downloads))

### Installation

1.  **Create a Parent Folder:**
    First, create a parent folder anywhere on your computer where you want to store the project, and open your terminal inside that folder.
    ```sh
    # Windows Example:
    C:\Users\YourName> mkdir my-workspace
    C:\Users\YourName> cd my-workspace
    ```
    You are now inside the `my-workspace` folder.

2.  **Clone the Repository:**
    Inside this parent folder, clone the project from GitHub. This will create a new folder called `real-time-chat-app`.
    ```sh
    # You are now in C:\Users\YourName\my-workspace
    git clone https://github.com/abdullah-ghaffar/real-time-chat-app.git
    ```

3.  **Go Inside the Project Folder (Most Important Step):**
    You now need to move into the new folder that `git clone` created. All future commands will be run from inside this folder.
    ```sh
    # You are now in C:\Users\YourName\my-workspace
    cd real-time-chat-app
    ```
    Your terminal prompt should now look something like `C:\Users\YourName\my-workspace\real-time-chat-app>`.

4.  **Install NPM Packages:**
    Inside this project folder, run the `npm install` command. It will read the `package.json` file and install the necessary packages into a `node_modules` folder.
    ```sh
    # You are now in C:\Users\YourName\my-workspace\real-time-chat-app
    npm install
    ```

5.  **Set up the Database:**
    * Create a new, empty database in PostgreSQL (e.g., `chat_app_db`).
    * Run the SQL queries (provided in the project documentation) to create the `users`, `conversations`, `participants`, and `messages` tables within that database.

6.  **Set up Environment Variables (`.env` file):**
    * Inside the project folder (`real-time-chat-app`), create a new file named `.env`.
    * Copy the details below into that file and fill in your actual database credentials:
        ```env
        DB_USER=your_database_user
        DB_HOST=localhost
        DB_DATABASE=chat_app_db
        DB_PASSWORD=your_database_password
        DB_PORT=5432
        JWT_SECRET=your_super_secret_random_string
        ```

7.  **Run the Server:**
    Finally, start the server from inside the project folder.
    ```sh
    # You are now in C:\Users\YourName\my-workspace\real-time-chat-app
    node server.js
    ```
    Your server will start running on `http://localhost:3000`.

---

## API Endpoints

The following are the available REST API routes:

| Method | Endpoint                             | Description                       | Protected |
| :----- | :----------------------------------- | :-------------------------------- | :-------- |
| `POST` | `/auth/signup`                       | Register a new user               | No        |
| `POST` | `/auth/login`                        | Log in a user and get a JWT       | No        |
| `POST` | `/api/conversations`                 | Start a new conversation          | Yes       |
| `POST` | `/api/messages`                      | Send a message to a conversation  | Yes       |
| `GET`  | `/api/conversations/:id/messages`    | Get all messages for a conversation | Yes       |

---

## Real-Time Events

The Socket.IO server listens for and emits the following events:

| Event Name          | Action                          | Payload         |
| :------------------ | :------------------------------ | :-------------- |
| `join_conversation` | Client joins a conversation room | `conversationId`|
| `receive_message`   | Server sends a new message to clients | `messageObject` |

---

## License

Distributed under the MIT License.
