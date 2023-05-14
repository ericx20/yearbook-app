import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv'

dotenv.config();

const app: Express = express()
const port = process.env.PORT || 3000

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(', ') ?? []

console.log(allowedOrigins)

app.use(cors({
  origin: allowedOrigins,
}))

app.get('/', (req, res) => {
  res.send('Hi mom!')
})

app.listen(port, () => {
  console.log(`Yearbook app listening on port ${port}`)
})
