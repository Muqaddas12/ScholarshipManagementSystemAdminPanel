import multer from "multer";
import path from "path";
import fs from 'fs'
// checking global uploads directory exists or not if not exists then create new uploads global directory
const uploadDir='uploads'
if(!fs.existsSync(uploadDir)){
    fs.mkdir(uploadDir,{recursive:true},err=>{
        if(err){
            cb(null,'error while creating directory')
        }
    })
}
const storage=multer.diskStorage({
    destination: (req, file, cb) => {
        const name=req.body.name
        const userDirectory=`uploads/${name}`
    if(!fs.existsSync(userDirectory)){
       fs.mkdir(userDirectory,{recursive:true},
        err=>{
            if(err){
                console.log('error')
                cb(null,'error while creating user directory ')
            }else{
                console.log('success')
                cb(null, userDirectory); 
            }
        }
       )
    }else{
        cb(new Error('user already uploaded file wait for action'))
    }
    },
    filename: (req, file, cb) => {
        console.log('filename')
        if (req.body.name) {
            const name = req.body.name;  // Get the 'name' from the request body
            const dicName= name + path.extname(file.originalname)
            cb(null,dicName);  // Set the filename to 'name.ext'
        } else {
            cb(new Error('File name is not provided'));  // Reject if 'name' is not provided
        }
       
    }

})
// Configure multer with storage and fileFilter options
const upload = multer({
    storage:storage ,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {  // Accept only PDF files
            cb(null, true);
        } else {
            cb(new Error('File type is not supported'));  // Reject non-PDF files
        }
    }
});

export default upload;