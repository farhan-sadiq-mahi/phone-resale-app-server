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
const productsCollection = client.db('HandPhoneStore').collection('products');




//verify seller middleware 
async function verifySeller(req, res, next) {
    const { email } = req.query;
    if (!email) {
        return res.status(403).send({
            message: 'Forbidden access.'
        })
    }
    const query = { email };
    const user = await usersCollection.findOne(query);
    const userRole = user?.role;
    if (userRole !== 'seller') {
        return res.send({
            message: 'You are not a seller.'
        })
    }
    next();
}
//verify admin middleware 
async function verifyAdmin(req, res, next) {
    const { email } = req.query;
    if (!email) {
        return res.status(403).send({
            message: 'Forbidden access.'
        })
    }
    const query = { email };
    const user = await usersCollection.findOne(query);
    const userRole = user?.role;
    if (userRole !== 'admin') {
        return res.send({
            message: 'You are not an admin.'
        })
    }
    next();
}

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

//add users to the database
app.put('/setuser', async (req, res) => {
    try {
        const user = req.body;
        const option = { upsert: true };
        const filter = { email: user.email }
        const userDoc = {
            $set: {
                email: user.email,
                img: user.img,
                name: user.name,
                role: user.role
            }
        }
        const result = await usersCollection.updateOne(filter, userDoc, option);
        console.log(result)
        res.send(result);

    } catch (error) {
        console.log(error);
    }
})

//get the items of specific category
app.get('/category/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = { category: id }
        const result = await productsCollection.find(query).toArray();
        res.send(result)
    } catch (error) {
        console.log(error)
    }
})

//verify role api
app.get('/getrole', async (req, res) => {
    try {
        const { email } = req.query;
        const query = { email }
        const user = await usersCollection.findOne(query);
        const userRole = user.role;
        res.send({
            userRole
        })
    } catch (error) {
        console.log(error)
    }
})



// isVerified seller
app.get('/sellerVerified', verifySeller, async (req, res) => {
    try {
        const { email } = req.query;
        const query = { email }
        const user = await usersCollection.findOne(query);
        const isVerified = user.isVerified;
        if (isVerified) {
            res.send({
                isVerified: true
            })
        }
        else {
            res.send({
                isVerified: false
            })
        }

    } catch (error) {
        console.log(error)
    }
})


//add product
app.post('/addproduct', verifySeller, async (req, res) => {
    try {
        const productData = req.body;
        const result = await productsCollection.insertOne(productData);
        res.send(result);

    } catch (error) {
        console.log(error)
    }
})





//my products
app.get('/myproducts', verifySeller, async (req, res) => {
    try {
        const { email } = req.query;
        const products = await productsCollection.find({ sellerEmail: email }).toArray();
        res.send({
            products
        })
    } catch (error) {
        console.log(error)
    }
})

//delete my products
app.delete('/deletemyproduct', verifySeller, async (req, res) => {
    try {
        const { email, id } = req.query;
        const query = { _id: ObjectId(id), sellerEmail: email }
        const result = await productsCollection.deleteOne(query);
        res.send(result)

    } catch (error) {
        console.log(error)
    }

})

//make products advertised

app.get('/advertised', verifySeller, async (req, res) => {
    try {
        const id = req.query;
        const filter = { _id: ObjectId(id) }
        const option = { upsert: true }
        const updatedDoc = {
            $set: {
                advertised: true
            }
        }
        const updatedProduct = await productsCollection.updateOne(filter, updatedDoc, option);
        res.send(updatedProduct);
    } catch (error) {
        console.log(error)
    }
})

// get all advertised products
app.get('/advertisedproducts', async (req, res) => {
    try {
        const query = { advertised: true }
        const result = await productsCollection.find(query).toArray();
        res.send(result);
    } catch (error) {

    }
})

//get all sellers api 
app.get('/getallsellers', verifyAdmin, async (req, res) => {
    try {
        const query = { role: "seller" }
        const result = await usersCollection.find(query).toArray();
        res.send(result)
    } catch (error) {
        console.log(error);
    }
})
//get all buyers api 
app.get('/getallbuyers', verifyAdmin, async (req, res) => {
    try {
        const query = { role: "buyer" }
        const result = await usersCollection.find(query).toArray();
        res.send(result)
    } catch (error) {
        console.log(error);
    }
})

//delete user api 
app.delete('/deleteuser', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.query;
        const query = { _id: ObjectId(id) }
        const result = await usersCollection.deleteOne(query);
        res.send(result);
    } catch (error) {

    }
})

//make products reported

app.get('/reportedproduct', async (req, res) => {
    try {
        const id = req.query;
        const filter = { _id: ObjectId(id) }
        const option = { upsert: true }
        const updatedDoc = {
            $set: {
                isReported: true
            }
        }
        const updatedProduct = await productsCollection.updateOne(filter, updatedDoc, option);
        res.send(updatedProduct);
    } catch (error) {
        console.log(error)
    }
})


app.get('/', (req, res) => {
    res.send('Hello form the server')
})
app.listen(port, () => {
    console.log('server is running on', port)
})