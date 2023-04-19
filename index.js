const expree = require('express');
const cors = require('cors');
const app = expree();
require('dotenv').config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(expree.json())


app.get('/', (req, res) => {
    res.json({ status: true, message: 'Secure shop server is running' })
});

app.listen(port, () => {
    console.log('Secure shop Server is running', port)
});