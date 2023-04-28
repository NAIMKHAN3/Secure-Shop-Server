const expree = require('express');
const cors = require('cors');
const app = expree();
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(cors());
app.use(expree.json())

app.get('/', (req, res) => {
    res.json({ status: true, message: 'Secure shop server is running' })
});


function verifyJWT(req, res, next) {
    const authHeader = req.headers?.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1]
    console.log(token)
    jwt.verify(token, process.env.TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        console.log(decoded);
    })

    next();
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ujhfrio.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1, strict: true, deprecationErrors: true,
    }
});

async function run() {
    try {

        const userCollection = client.db("secure-shop").collection("users");
        const productCollection = client.db("secure-shop").collection("products");
        const cardCollection = client.db("secure-shop").collection("card");
        const paymentCollection = client.db("secure-shop").collection("payment");


        app.get('/users', async (req, res) => {
            try {

                const result = await userCollection.find({}).toArray();
                res.json({ status: true, data: result })

            }
            catch {
                res.json({ status: false, message: "findn't user collection" })
            }
        })
        app.get('/user/:email', async (req, res) => {
            try {
                const email = req.params.email;
                console.log(email)
                const result = await userCollection.findOne({ email });
                res.json({ status: true, data: result })

            }
            catch {
                res.json({ status: false, message: "findn't user collection" })
            }
        })

        app.get('/products', async (req, res) => {
            try {

                const result = await productCollection.find({}).toArray();
                res.json({ status: true, data: result })

            }
            catch {
                res.json({ status: false, message: "findn't products collection" })
            }
        });

        app.get('/product/:id', verifyJWT, async (req, res) => {
            try {
                const id = req.params.id;
                const find = { _id: new ObjectId(id) }
                const result = await productCollection.findOne(find);
                res.json({ status: true, data: result })

            }
            catch {
                res.json({ status: false, message: "findn't product collection" })
            }
        });

        app.get('/card-product/:id', verifyJWT, async (req, res) => {
            try {
                const id = req.params.id;
                const find = { _id: new ObjectId(id) }
                const result = await cardCollection.findOne(find);
                res.json({ status: true, data: result })

            }
            catch {
                res.json({ status: false, message: "findn't product collection" })
            }
        });
        app.get('/card-products/:email', verifyJWT, async (req, res) => {
            try {
                const email = req?.params?.email;
                if (email) {
                    const result = await cardCollection.find({ email }).toArray();
                    res.json({ status: true, data: result })
                } else {
                    res.json({ status: false, message: "Please login your account" })
                }
            }
            catch {
                res.json({ status: false, message: "findn't product collection" })
            }
        })

        app.post('/register', async (req, res) => {
            try {
                const user = req.body;
                const token = jwt.sign(user.email, process.env.TOKEN)
                const findUser = await userCollection.findOne({ email: user.email });
                if (findUser) {
                    return res.json({ status: false, message: "user already added by database", token: token })
                }
                const result = await userCollection.insertOne(user);
                res.json({ status: true, data: result, token: token })
            }

            catch {
                res.json({ status: false, message: "user added failed" })
            }
        });
        app.post('/add-product', verifyJWT, async (req, res) => {
            try {
                const product = req.body;
                if (product) {
                    const result = await productCollection.insertOne(product);
                    res.json({ status: true, data: result })
                }
            }
            catch {
                res.json({ status: false, message: "Product added failed please try again" })
            }
        });
        app.post('/add-to-card', verifyJWT, async (req, res) => {
            try {
                const product = req.body;
                const { model } = product
                const findProduct = await cardCollection.findOne({ model, });
                if (findProduct) {
                    return res.json({ status: false, message: "Product already added by card" })
                }
                if (product) {
                    const result = await cardCollection.insertOne(product);
                    return res.json({ status: true, data: result })
                }
            }
            catch {
                res.json({ status: false, message: "Product added failed please try again" })
            }
        });

        app.post("/create-payment-intent", verifyJWT, async (req, res) => {
            const product = req.body;
            console.log(product)
            const amount = parseFloat(product.totalAmount) * 100;
            console.log(amount)
            if (product && amount) {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount,
                    currency: "bdt",
                    "payment_method_types": [
                        "card"
                    ]
                });
                return res.send({
                    clientSecret: paymentIntent.client_secret,
                });
            }

            res.send({ status: false, message: "amount not found" })
        });

        app.post('/payment-info', verifyJWT, async (req, res) => {
            try {
                const info = req.body;
                const result = await paymentCollection.insertOne(info);
                res.send(result)
            }
            catch {
                res.send({ status: false, massage: 'payment info not added a database' })
            }
        })
    }
    catch (error) {
        console.log(error)
    }
}
run().catch(e => console.log(e));


app.listen(port, () => {
    console.log('Secure shop Server is running', port)
});