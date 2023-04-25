const expree = require('express');
const cors = require('cors');
const app = expree();
require('dotenv').config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(expree.json())


app.get('/', (req, res) => {
    res.json({ status: true, message: 'Secure shop server is running' })
});



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


        app.get('/users', async (req, res) => {
            try {

                const result = await userCollection.find({}).toArray();
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

        app.get('/product/:id', async (req, res) => {
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

        app.get('/card-product/:id', async (req, res) => {
            try {
                const id = req.params.id;
                console.log(id)
                const find = { _id: new ObjectId(id) }
                const result = await cardCollection.findOne(find);
                console.log(result)
                res.json({ status: true, data: result })

            }
            catch {
                res.json({ status: false, message: "findn't product collection" })
            }
        });
        app.get('/card-products/:email', async (req, res) => {
            try {
                const email = req?.params?.email;
                console.log(email)
                if (email) {
                    const result = await cardCollection.find({ email }).toArray();
                    console.log(result)
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
        app.post('/add-product', async (req, res) => {
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
        app.post('/add-to-card', async (req, res) => {
            try {
                const product = req.body;
                const { model } = product
                const findProduct = await cardCollection.findOne({ model, });
                console.log(findProduct)
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
    }
    catch (error) {
        console.log(error)
    }
}
run().catch(e => console.log(e));


app.listen(port, () => {
    console.log('Secure shop Server is running', port)
});