const express = require('express')
const axios = require('axios')
const redis = require('redis')
const responseTime = require('response-time')

const {promisify} = require('util')



//calling api using response time request
const app = express ()
app.use(responseTime())

//build redis client cache using promisify module 
//main temp for cache '127.0.0.1:6379' 
const client = redis.createClient({
    host: '127.0.0.1',
    port: 6379,
})

//converting a function with call backs to a function with promise
const GET_ASYNC = promisify(client.get).bind(client)
const SET_ASYNC = promisify(client.set).bind(client)



app.get('/products', async (req,res,next) => {

    //cache respond and reply
    try 
    {
        const reply = await GET_ASYNC('products')
        if(reply){
            console.log('successfully cache')
            res.send(JSON.parse(reply))
            return
        }
        const respond = await axios.get('https://fakestoreapi.com/products')

        //set function ready for catcge
        const saveResult = await SET_ASYNC('products', JSON.stringify(respond.data), 'EX', 6)
        console.log('data cached',saveResult)
        res.send(respond.data)
    }catch(err){
    res.send(err.message)
}
})

app.get('/users/:product_user', async (req,res,next) => {
    try{
        const {product_user} = req.params
        const reply = await GET_ASYNC(product_user)

        if(reply){
            console.log('cached successfully')
            res.send(JSON.parse(reply))
            return
        }
     
        const repo = await axios.get(`https://fakestoreapi.com/users/${product_user}`)
        const saveResult = await SET_ASYNC(product_user, JSON.stringify(repo.data), 'EX',5)
        console.log('data cached', saveResult)
        res.send(repo.data)
}catch(err){
    res.send(err.message)
}
}
)

app.listen(3000, () => console.log('running on port 3000'))