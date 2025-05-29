import express from 'express';
import adminLogin from '../controller/Authentication.js';

const authRoute=express.Router()


authRoute.get('/',(req,res)=>{
      const token = req.cookies.token;
      if(token){
        return res.redirect('/admin/homepage')
      }
   return res.render('Login',{title:'Login'})
})
authRoute.post('/',adminLogin)




export default authRoute