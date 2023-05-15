import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Page from './models/page';

const app = express()
dotenv.config()
const port = process.env.PORT || 3000

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(', ') ?? []

app.use(cors({
  origin: allowedOrigins,
}))

app.use(express.json())

// mongoose
mongoose.connect(process.env.DATABASE_URL ?? "")
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to yearbook database!'));

app.get('/page/:id', (req, res) => {
  const _id = req.params.id
  Page.findById(_id).then(page => {
    if (!page) {
      return res.status(404).json({ message: 'Cannot find page' })
    }
    res.send(page)
  }).catch(e => {
    res.status(500).send(e)
  })
})


app.post('/page', (req, res) => {
  const { canvas } = req.body
  const page = new Page({ canvas })

  page.save().then(() => {
    res.status(201).send(page)
  }).catch(e => {
    res.status(400).send(e)
  })
})

// UPDATE A YEARBOOK (with query string for ID, and JSON for canvas)
// "signing a yearbook" corresponds to updating the canvas of a page
// updateOne won't send back the updated page
app.patch('/page/:id', (req, res) => {
  const _id = req.params.id;

  Page.updateOne({ _id }, req.body).then((page) => {
      if (!page) {
          return res.status(404).send()
      }
      res.status(200).send()
  }).catch(() => {
      res.status(500).send()
  })
})

app.listen(port, () => {
  console.log(`Yearbook app listening on port ${port}`)
})
