const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcrypt');
const mysql2 = require('mysql2/promise');
const cookieParser = require('cookie-parser');
const auth = require('./middleware/auth')
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io')
const path = require('path');
const fs = require('fs')
const app = express();
const multer = require('multer')
const server = http.createServer(app);
const dotenv = require('dotenv');
dotenv.config();


const io = new Server(server);

app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const staticPath = path.join(__dirname, "public")
app.use(express.static(staticPath))

const dbOptions = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
};

const sessionStore = new MySQLStore(dbOptions);

app.use(session({
    secret: '1234',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 10000 * 60 * 60, // 1 hour
        httpOnly: true, // Prevents JavaScript from accessing the cookie
        secure: false, // Set to true if using HTTPS
        sameSite: "lax" // Allows sending cookies across different domains
    }
}));

app.use(auth);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/images/"); // Save files in the "uploads" directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});

const upload = multer({ storage });

app.get("/check", async (req, res) => {
    try {
        if (req.session && req.session.userId) {
                    const connection = await mysql2.createConnection(dbOptions);
                    const [result] = await connection.query(`select * from user where user_id = ${req.session.userId}`)
                    connection.end();
                    return res.json({username: result[0].username})
        }else {
            return res.status(400);
        }
    }
    catch (e) {
        console.log(e)
    }
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const connection = await mysql2.createConnection(dbOptions);
        await connection.execute('INSERT INTO user (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(200).send("Register Success.")
    } catch (err) {
        res.status(500).send("Internal Server Error.")
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const connection = await mysql2.createConnection(dbOptions);
        const [rows] = await connection.execute('SELECT * FROM user WHERE username = ?', [username]);

        if (rows.length > 0) {
            const match = await bcrypt.compare(password, rows[0].password);
            if (match) {
                req.session.userId = rows[0].user_id;  // Store session data

                req.session.save(err => {  // Ensure session is saved
                    if (err) {
                        res.status(500).send("Internal Server Error.")
                    }
                    res.json({ username: username });
                });
            } else {
                res.status(401).send("Forbidden")
            }
        } else {
            res.status(404).send("Not Found.")
        }
    } catch (err) {
        res.status(500).send("Internal Server Error.")
    }
});


app.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
                res.status(500).send("Internal Server Error.");
            }
            res.clearCookie('connect.sid').send("Logout Success.");
        });
    } else {
        res.status(400).send("Logout Failed.");
    }
});

app.get("/api/item", async (req, res) => {
    try {
        const connection = await mysql2.createConnection(dbOptions);

        const [result] = await connection.query("select * from inventory");

        res.json(result);

    } catch (err) {
        console.log(err)
        return res.status(500).send("Internal Server Error.")
    }
});

app.post("/api/item", upload.single("image"), async (req, res) => {

    const { item_id, item_name, description, category, price, quantity } = req.body;
    const image_url = req.file ? `images/${req.file.filename}` : "images/Food Icons.gif";

    try {
        const connection = await mysql2.createConnection(dbOptions);

        const [result] = await connection.execute(`insert into inventory (item_id, item_name, image_url, description, category, price, quantity) values (?, ?, ?, ?, ?, ?, ?)`, [item_id, item_name, image_url, description, category, price, quantity]);

        return res.json({ item_id, item_name, image_url, description, quantity, category, price });

    } catch (err) {
        console.log(err)
        return res.status(500).send("Internal Server Error.")
    }
});

app.put("/api/item", upload.single("image"), async (req, res) => {

    const { item_id, item_name, description, category, price, quantity, image_url } = req.body;
    const image_url_new = req.file ? `images/${req.file.filename}` : null;

    try {
        const connection = await mysql2.createConnection(dbOptions);

        if (image_url_new && req.file) {

            const imagePath = path.join(staticPath, image_url)

            if (fs.existsSync(imagePath) && image_url != "images/Food Icons.gif") {
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.log("Failed to delete the file.")
                    }
                })
            }
            else {
                console.log(imagePath + " does not exists.")
            }

            const [result] = await connection.execute(`update inventory set item_name = ?, image_url = ?, description = ?, category = ?, price = ?, quantity = ? where item_id = ?`, [item_name, image_url_new, description, category, price, quantity, item_id]);
            return res.json({ item_id, item_name, image_url: image_url_new, description, quantity, category, price });
        }
        else {
            const [result] = await connection.execute(`update inventory set item_name = ?, description = ?, category = ?, price = ?, quantity = ? where item_id = ?`, [item_name, description, category, price, quantity, item_id]);
            return res.json({ item_id, item_name, image_url, description, quantity, category, price });
        }

    } catch (err) {
        console.log(err)
        return res.status(500).send("Internal Server Error.")
    }
});

app.delete("/api/item", async (req, res) => {

    const { item_id, image_url } = req.body;

    try {
        const connection = await mysql2.createConnection(dbOptions);

        const [result] = await connection.execute(`delete from inventory where item_id = ?`, [item_id]);

        const imagePath = path.join(staticPath, image_url)

        if (fs.existsSync(imagePath)) {
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.log("Failed to delete the file.")
                }
            })
        }
        else {
            console.log(imagePath + " does not exists.")
        }

        return res.json(result);

    } catch (err) {
        console.log(err)
        return res.status(500).send("Internal Server Error.")
    }
});

app.get("/api/order", async (req, res) => {

    try {
        const connection = await mysql2.createConnection(dbOptions);

        const [orders] = await connection.execute(`select * from orders`);

        const finalOrders = [];

        for (let order of orders) {
            const [items] = await connection.execute(`select oi.item_id, oi.count, i.item_name, i.price from order_item oi JOIN inventory i on oi.item_id = i.item_id where oi.order_id = ?`, [order.order_id]);
            order.items = items;
            finalOrders.push(order)
        }

        return res.json(finalOrders);

    } catch (err) {
        console.log(err)
        return res.status(500).send("Internal Server Error.")
    }
});

app.post("/api/order", async (req, res) => {

    const order = req.body;

    try {
        const connection = await mysql2.createConnection(dbOptions);

        await connection.execute(`insert into orders ( order_id, timestamp, order_type, order_status, payment_type, note, address, table_num, mobile_num, customer_name, from_counter, total ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [order.order_id, order.timestamp, order.order_type, order.order_status, order.payment_type, order.note, order.address, order.table_num, order.mobile_num, order.customer_name, order.from_counter, order.total]);

        for (let item of order.items) {
            await connection.execute(`insert into order_item (order_id, item_id, count) values (?, ?, ?)`, [order.order_id, item.item_id, item.count])
            await connection.execute(`update inventory set quantity = quantity - ? where item_id = ?`, [item.count, item.item_id])
        }

        io.emit("order", JSON.stringify(order));

        return res.send("Order Placed.");

    } catch (err) {
        console.log(err)
        return res.status(500).send("Internal Server Error.")
    }
});

app.put("/api/order", async (req, res) => {

    const order = req.body;

    try {
        const connection = await mysql2.createConnection(dbOptions);

        await connection.execute(`update orders set order_status = "complete" where order_id = ?`, [order.order_id]);

        return res.json({ ...order, order_status: "complete" });

    } catch (err) {
        console.log(err)
        return res.status(500).send("Internal Server Error.")
    }
});

const { generateOrderPDF } = require('./pdfGenerator');
const { threadId } = require('worker_threads');

app.get('/api/order/:orderId/pdf', async (req, res) => {
    const { orderId } = req.params;

    try {
        const connection = await mysql2.createConnection(dbOptions);

        // Fetch order details
        const [orders] = await connection.execute(`SELECT * FROM orders WHERE order_id = ?`, [orderId]);
        if (orders.length === 0) {
            return res.status(404).send("Order not found.");
        }
        const order = orders[0];

        // Fetch order items
        const [items] = await connection.execute(`SELECT oi.item_id, oi.count, i.item_name, i.price FROM order_item oi JOIN inventory i ON oi.item_id = i.item_id WHERE oi.order_id = ?`, [orderId]);
        order.items = items;

        // Generate PDF
        const pdfPath = path.join(__dirname, 'public', 'pdfs', `order_${orderId}.pdf`);
        if (!fs.existsSync(path.dirname(pdfPath))) {
            fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
        }
        generateOrderPDF(order, pdfPath);

        // Send PDF file
        res.download(pdfPath, `order_${orderId}.pdf`);
    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error.");
    }
});

app.get(/^(?:\/admin).*$/, (req, res) => {
    res.sendFile(path.join(staticPath, "dist", "index.html"))
    // res.send("admin")
})

app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, "customer", "index.html"))
});


const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
