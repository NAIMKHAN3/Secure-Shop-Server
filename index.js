const expree = require('express');
const cors = require('cors');
const app = expree();
require('dotenv').config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

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


        app.get('/users', async (req, res) => {
            try {

                const result = await userCollection.find({}).toArray();
                res.json({ status: true, data: result })

            }
            catch {
                res.json({ status: false, message: "findn't user collection" })
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


    }
    catch (error) {
        console.log(error)
    }
}
run().catch(e => console.log(e));


app.listen(port, () => {
    console.log('Secure shop Server is running', port)
});