import mongoose from 'mongoose'

const pageSchema = new mongoose.Schema({
    canvas: {
        type: Object,
        required: true,
    },
})

const Page = mongoose.model('Page', pageSchema);

export default Page;

