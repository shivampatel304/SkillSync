import express from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const secret = process.env.JWT_SECRET || "fallbackSecret";
app.use(express.json());
// app.use("/auth", authRoutes);

app.get('/home', (req, res) => {
  res.status(200).json('Welcome, your app is working well');
})

app.post('/in', async(req,res) => {
  const {name} = req.body;

  res.status(200).json(name);
})


app.post('/signup', async(req, res): Promise<any> =>{
  try{
    const {email, password, name} = req.body;

    const existingUser = await prisma.user.findUnique({ where: {email}});
    if(existingUser){  
      return res.status(400).json({ message: 'User already exists'})
    }

    const hashedPassword = await bcrypt.hash(password,10);

    const user = await prisma.user.create({
      data:{email,password: hashedPassword,name}
    });

    const token = jwt.sign({id:user.id}, secret);
    return res.status(201).json({token});
  }catch(error){
    console.error(error);
    return res.status(500).json({message:'Internal server error'})
  }
});

app.post('/login', async (req, res): Promise<any> => {
  try{
    const {email, password} = req.body;

    const existingUser = await prisma.user.findUnique({where: {email}});
    if(!existingUser){
      return res.status(401).json({ message: "User already existed"});
    }

    const isValidPassword = await bcrypt.compare(password, existingUser.password);

    if(!isValidPassword){
      return res.status(401).json({ message: "Invalid Credentials"})
    }

    const token = jwt.sign({ id: existingUser.id}, secret);

    return res.status(200).json({token});
  }catch (error){
    return res.status(500).json({message: 'Internal server error'});
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app