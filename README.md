https://khana-khajana-eayz.onrender.com

Here’s a clean `README.md` you can copy-paste and adjust if needed:

````markdown
# Project Setup and Usage

This project provides a customer panel and an admin panel running on **Node.js** with a database backend.

---

## 1. Database Setup

1. Create a new database in your SQL server (e.g. MySQL).
2. Import the schema:
   - Run **`database.sql`** to create all tables.
3. Insert initial data:
   - Run **`insert.sql`** to populate the tables with sample/required data.

> Make sure your database connection details in the project (e.g. `.env` or config file) match your local database credentials.

---

## 2. Install Dependencies

In the project root folder, install all required Node.js packages:

```bash
npm install
````

This will install all dependencies listed in `package.json`.

---

## 3. Run the Server

Start the server so it runs on **port 8080**.

Example (depending on how your project is configured):

```bash
node server.js
# or
npm start
```

Ensure that the application is listening on:
`http://localhost:8080`

---

## 4. Register a User (via Postman)

Use **Postman** (or any API client) to create a new user.

* **Method:** `POST`
* **URL:** `http://localhost:8080/register`
* **Body type:** `raw` → `JSON`

**Sample JSON body:**

```json
{
  "username": "your_username",
  "password": "your_pswd"
}
```

Send the request and confirm the user is created successfully.

---

## 5. Access the Panels

### Customer Panel

Open your browser and go to:

```text
http://localhost:8080
```

This is the **customer panel**.

### Admin Panel

Open:

```text
http://localhost:8080/admin
```

This is the **admin panel**.

Log in using the **username** and **password** you registered via the `/register` API.

---

## 6. Notes

* Make sure the database server is running **before** starting the Node.js server.
* If port **8080** is already in use, stop the other service or change the port in your project configuration.
* If you face login or registration issues, check:

  * Database connection settings
  * Console logs of the Node.js server
  * That `database.sql` and `insert.sql` were executed correctly.

```

If you want, I can also customize the title and add a short “Project Description” section based on what your app does.
```




* Summary *


first make db and tables from database.sql file provided in code
insert data in db from insert.sql file available in code

do npm i an d install all pacakage
run on 8080 port and from postman hit 
post : localhost:8080/register
json: {
{
  "username" : "your_username", 
  "password" : "your_pswd"
}

then go through on local host://8080 for customer pannel
and /admin for admin pannel and login through your username and password 
}


make a readme file in english
