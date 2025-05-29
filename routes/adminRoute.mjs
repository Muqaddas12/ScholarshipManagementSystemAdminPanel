import express from "express";
import verifyToken from "../middleware/auth.mjs";
import fs from 'fs'
import path from "path";
import multer from 'multer';
import { connect, disconnect, getDb } from '../database.js';
const adminRoute = express.Router();
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Set a unique filename
  }
});

// Multer file filter (only allow PDFs)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

adminRoute.get('/homepage', verifyToken, async (req, res) => {
  try {
    const email = req.user.email;
      await connect();
    const db = getDb();

const collection = await db.collection('StudentsApplications')

    const total = await collection.countDocuments();
    const pending = await collection.countDocuments({ status: 'pending' });
    const accepted = await collection.countDocuments({ status: 'accepted' });
    const rejected = await collection.countDocuments({ status: 'rejected' });
console.log(pending,accepted,rejected)
    res.render('Homepage', {
      title: 'Homepage',
      email,
      total,
      pending,
      accepted,
      rejected
    });
  } catch (err) {
    console.error('Error fetching application counts:', err);
    res.status(500).send('Internal Server Error');
  }
});

adminRoute.post('/upload', async (req, res, next) => {
  console.log('Upload request received');

  upload.single('pdfFile')(req, res, async (err) => {
    if (err) {
      const msg = err instanceof multer.MulterError ? 'File upload error: ' + err.message : 'Unexpected file upload error';
      return res.redirect('/admin/upload?msg=' + encodeURIComponent(msg));
    }

    if (req.file) {
      const { studentName, rollNumber, graduationYear, department, course } = req.body;

      try {
        await connect();
        const db = getDb();
        const collection = db.collection('StudentsApplications');

        const existingStudent = await collection.findOne({ rollNumber });

        if (existingStudent) {
          if (existingStudent.status === 'rejected') {
            // Delete the old file
            const oldFilePath = existingStudent.file?.path;
            if (oldFilePath) {
              fs.unlink(oldFilePath, (unlinkErr) => {
                if (unlinkErr) console.error('Failed to delete old file:', unlinkErr);
              });
            }

            // Update with new file info
            await collection.updateOne(
              { rollNumber },
              {
                $set: {
                  studentName,
                  graduationYear,
                  department,
                  course,
                  status: 'pending',
                  file: {
                    filename: req.file.filename,
                    path: req.file.path,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                  },
                },
              }
            );

            console.log('Rejected student resubmitted application and file updated.');
            return res.redirect('/admin/upload?msg=' + encodeURIComponent('Previous rejected application updated successfully.'));
          } else {
            // Not rejected — delete the new upload
            fs.unlink(req.file.path, (unlinkErr) => {
              if (unlinkErr) console.error('Failed to delete uploaded file:', unlinkErr);
            });

            return res.redirect('/admin/upload?msg=' + encodeURIComponent('Student with this roll number already exists.'));
          }
        }

        // New application
        await collection.insertOne({
          studentName,
          rollNumber,
          graduationYear,
          department,
          course,
          status: 'pending',
          file: {
            filename: req.file.filename,
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size,
          },
        });

        console.log('File and user data inserted into database');
        return res.redirect('/admin/upload?msg=' + encodeURIComponent('File uploaded and data saved successfully.'));
      } catch (error) {
        console.error('Database error:', error);

        // Delete uploaded file if DB error
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Failed to delete file:', unlinkErr);
        });

        return res.redirect('/admin/upload?msg=' + encodeURIComponent('Failed to upload file.'));
      } finally {
        await disconnect();
      }
    }

    return res.redirect('/admin/upload?msg=' + encodeURIComponent('Please upload a valid file.'));
  });
});

adminRoute.get('/upload',(req,res)=>{
  return res.render('UploadApplication',{title:'uploadapplication'})
})

adminRoute.get('/applications',verifyToken, async (req, res) => {
  const status = req.query.status; // "pending", "accepted", or "rejected"

  try {
    await connect();
    const db = getDb();

    const filter = status ? { status } : {}; // Filter only if status is provided
    const applications = await db.collection('StudentsApplications').find(filter).toArray();

    return res.render('applications', {
      title: 'User Applications',
      applications,
      currentStatus: status || 'all'
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).send('Error fetching applications');
  } finally {
    await disconnect();
  }
});
import { ObjectId } from "mongodb";

// Accept application
adminRoute.post('/applications/:id/accept', async (req, res) => {
  try {
    await connect();
    const db = getDb();
    await db.collection('StudentsApplications').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'accepted' } }
    );
    res.redirect('/admin/applications');
  } finally {
    await disconnect();
  }
});

// Reject application
adminRoute.post('/applications/:id/reject', async (req, res) => {
  try {
    await connect();
    const db = getDb();
    await db.collection('StudentsApplications').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'rejected' } }
    );
    res.redirect('/admin/applications');
  } finally {
    await disconnect();
  }
});



adminRoute.get('/logout',verifyToken, (req, res) => {

  res.clearCookie('token'); 
  res.redirect('/login');   
});


adminRoute.get('/status/:rollNumber', async (req, res) => {
  const { rollNumber } = req.params;

  try {
    await connect();
    const db = getDb();

    const student = await db.collection('StudentsApplications').findOne({ rollNumber });
console.log(student)
    if (!student) {
      return res.status(404).json({ status: 'not_found', message: 'No application found.' });
    }

    return res.json({ status: student.status });
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  } finally {
    await disconnect();
  }
});


export default adminRoute;