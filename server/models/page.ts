import mongoose from "mongoose";

const pageSchema = new mongoose.Schema({
  canvas: {
    type: Object,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  pin: {
    type: String,
    required: true,
  },
});

const Page = mongoose.model("Page", pageSchema);

export default Page;
