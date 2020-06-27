const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')

var admin = require("firebase-admin");
var serviceAccount = require("./blog.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://blog-6bd71.firebaseio.com"
});
dbref = admin.firestore();

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.post('/login',(req,res)=>{
    dbref.collection('users')
    .where('email','==',req.body.email)
    .where('password','==',req.body.password)
    .get()
    .then(snapshot => {
        if(snapshot.size)
        {
            snapshot.forEach(snap => {
                res.json({
                    msg:true,
                    id:snap.id,
                    data : snap.data()})
            })
        }
        else{
            res.json({
                msg : false
            })
        }
        return null;
    })
    .catch(err => {
        res.json({
            err
        })
    })
})

app.post('/signup',async (req,res) => {
  
    const usernameCheck = new Promise((resolve,reject) => {
        dbref.collection('users')
        .where('username','==',req.body.username)
        .get()
        .then(snapshot =>{
            if(snapshot.exists)
            {
                resolve('false')
            }
            else
            {
                resolve('true')
            }
        })
        .catch(err =>{
            reject(err)
        })
    })

    const emailCheck = new Promise((resolve,reject) => {
        dbref.collection('users')
        .where('email','==',req.body.email)
        .get()
        .then(snapshot =>{
            if(snapshot.exists)
            {
                resolve('false')
            }
            else
            {
                resolve('true')
            }
        })
        .catch(err =>{
            reject(err)
        })
    })

    if(req.body.password !== undefined){
        Promise.all([usernameCheck,emailCheck])
        .then(messages => {
            if(messages[0] === 'false')
            {
                res.json({
                    msg : "Username already exists"
                })
            }
            else if(messages[1] === 'false')
            {
                res.json({
                    msg : "Email already exists"
                })
            }
            else{
                dbref.collection('users').add(req.body)
                .then(doc => {
                    res.json({
                        msg: "The user was added successfully",
                        id : doc.id
                    })
                })
                .catch(err => {
                    res.json({
                        err
                    })
                })
            }
        })
        .catch(messages => {
            console.log(messages)
        })
    }
    else{
        res.json({
            msg : "Password Field is empty"
        })
    }
})

app.post('/getName', (req,res) => {

    if(req.body.userId != "")
    {
        dbref.collection('users').doc(req.body.userId)
        .get()
        .then(snapshot => {
            if(snapshot.exists)
            {
                res.json({
                    msg : true,
                    userId : snapshot.data().username
                })
            }
            else{
                res.json({
                    msg : false,
                    reason : "Username not found"
                })
            }
        })
        .catch(err => {
            res.json({
                err
            })
        })
    }
    else{
        res.json({
            reason : "userId field is empty"
        })
    }
})

app.post("/setContent", (req,res) => {

    dbref.collection('users').doc(req.body.userId)
    .get()
    .then(snapshot => {
        if(snapshot.exists)
        {
            if(snapshot.data().text === undefined)
            {
                textData = [];
                textData.push(req.body.textData)
                dbref.collection('users').doc(req.body.userId).update({text : JSON.stringify(textData)});
            }
            else{
                var textData = JSON.parse(snapshot.data().text);
                textData.push(req.body.textData);
                dbref.collection('users').doc(req.body.userId).update({text : JSON.stringify(textData)});
            }
            res.json({
                msg : "Submission added successfully"
            })
        }
        else{
            res.json({
                msg : "userId not found"
            })
        }
    })
    .catch(err => {
        res.json({
            err
        })
    })

})

app.post('/getContent', (req,res) => {

    dbref.collection('users')
    .doc(req.body.userId)
    .get()
    .then(snapshot =>{ 
        if(snapshot.exists)
        {
            if(snapshot.data().text !== undefined)
            {
                var textData = JSON.parse(snapshot.data().text);
                res.json({
                    textlist : textData
                })
            }
            else{
                res.json({
                    msg: "No submissions found"
                })
            }
        }
        else{
            res.json({
                msg : "userId not found"
            })
        }
        res.end('ok');
    })
})

app.post('/profile',(req,res)=>{

    dbref.collection('users')
    .doc(req.body.userId)
    .get()
    .then(snapshot => {
        if(snapshot.exists)
        {
            res.json(snapshot.data())
        }
        else{
            res.json({
                msg : "userId not found"
            })
        }
    })
})
var PORT = 9000 || process.env.PORT

app.listen(PORT, ()=>{
    console.log('The server is running @ ' + PORT);
})