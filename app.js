const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require('multer');
const path = require('path');
const app = express();
const secret_key = "Oshayer";
const port = 5000;

app.use(express.json());

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");










mongoose
  .connect("mongodb://127.0.0.1:27017/File_Sharing", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

app.get("/",(req,res) => {
  res.render("index");
})

app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/login", (req, res) => {
  res.render("login");
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email:{
    type : String,
    required : true,
  },
});


const fileSchema = new mongoose.Schema({
  filename:{
    type : String,
    required : true,
  },
  size : Number,

})

const User = mongoose.model("User", userSchema);
const File = mongoose.model("File",fileSchema);

app.post("/register", async (req, res) => {
  const { username, password,email } = req.body;

  try {
    const existUser = await User.findOne({ username });
    if (existUser) {
      return res.status(409).json({ error: "Username already taken" });
    }
    const hashedpassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedpassword,
      email,
    });
    await newUser.save();

    const token = jwt.sign({ username:username }, secret_key, {
      expiresIn: "1h",
    });
    //res.json({ token });
    //res.send("Hello");
    res.send("Registration successful")
  } catch (error) {
    res.status(500).json({ error: "An error occured" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid username" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid Password" });
    }
    const token = jwt.sign({ username:username }, secret_key, {
      expiresIn: "1h",
    });

    res.cookie("oshayerJWT", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 10000000),
    });

    //res.json({token});
    res.redirect(`/profile/${user.username}`);

    

   
    
  } catch (error) {
    res.status(500).json({ error: "An Error Occured ???" });
  }
});

// app.get('/protected',(req,res) => {
//     const token = req.headers.authorization;
//     if(!token){
//         return res.status(401).json({error : "No token given"});

//     }
//     jwt.verify(token,'secret_key',(error,decodec) => {
//         if(error){
//             return res.status(401).json({error: "Invalid Token"});
//         }
//         res.json({message :  "Access Granted"});
//     })
// })
// const checkLogin = (req,res,next)=>{
//   const {authorization} = req.headers;
//   try{
//     const token = authorization.split(' ')[1];
//     const decoded = jwt.verify(token,secret_key);
//     const {username} = decoded;
//     req.username = username;
//     next();

//   }
//   catch{
//     next("Authentication failure");

//   }

// }

// const checkLogin = (req,res,next)=>{
//   const authorization = req.cookies.token;
//   try{
//     const decoded = jwt.verify(authorization,secret_key);
//     const{username} = decoded;
//     req.username = username;
//     next();
//     res.send("Hello ???");

//   }
//   catch{
//     next("Authorization failed")
//   }
// }

function verifyToken(req, res, next) {
  const authorization = req.cookies.oshayerJWT;

  if(!authorization){
    return res.send("LOgin failed");
  }
  try{
    const decodedToken = jwt.verify(authorization,secret_key);
    req.username = decodedToken;
    next();


  }
  catch(error){
    return res.send("server error");


  }

  
}

// Protected route - profile




// app.get("/overview/:username", async(req, res) => {
  

//   //res.json({ message: "Profile accessed successfully Hello boi" });

//   const{username,password} = req.body;
//   const user = await User.findOne({ username:req.params.username });

//   if(user){
//     res.render("profile",{user:user})
//   }
//   else{
//     res.send("failed")
//   }



  

//   //res.render("profile");

  
  
// });

app.get("/profile/:username",verifyToken, async(req, res) => {
  

  //res.json({ message: "Profile accessed successfully Hello boi" });

  const{username,password} = req.params;
  const user = await User.findOne({ username});

  if(user){
    res.render("profile",{user:user})
  }
  else{
    res.send("failed")
  }



  

  //res.render("profile");

  
  
});

// Route to render the file upload page
app.get("/myuploads",(req,res) =>{
  res.render("myuploads");
})



// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    // Rename the file to avoid overwriting
    const uniqueSuffix = Date.now() + '-' + 1000;
    const extension = path.extname(file.originalname);
    const filename = file.originalname
    cb(null, filename);
  },
});




// Create the multer instance with the storage options
const upload = multer({ storage });



// Set up the route for file upload
app.post('/upload', upload.single('file'), async (req, res) => {

  const filename = req.file.filename;
  const size = req.file.size;


  const fileMetadata = new File({
    filename,
    size,

  });

  try{
    await fileMetadata.save();
    res.send("File Uploaded successfully")

  }catch(err){
    res.status(500).send("Failed to  upload file");

  }







});




app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
