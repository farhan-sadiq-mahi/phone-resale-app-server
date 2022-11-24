const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

require('dotenv').config();


app.use(cors());
app.use(express.json());


// Mongodb details 
const uri = `mongodb+srv://${process.env.DB}:${process.env.DB_PASS}@cluster0.gaubth5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect()
        console.log('DB connected')

    } catch (error) {
        console.log(error)
    }
}
run();


const categoriesCollections = client.db('HandPhoneStore').collection('categories');
const usersCollection = client.db('HandPhoneStore').collection('users');


// get all the categories
app.get('/categories', async (req, res) => {
    try {
        const query = {};
        const result = await categoriesCollections.find(query).toArray();
        res.send(result);
    } catch (error) {
        console.log(error)
    }
})

app.post('/setuser', async (req, res) => {
    try {
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        res.send(result);


    } catch (error) {
        console.log(error);
    }
})


app.get('/', (req, res) => {
    res.send('Hello form the server')
})
app.listen(port, () => {
    console.log('server is running on', port)
})