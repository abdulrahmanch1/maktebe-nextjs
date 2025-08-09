const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  cover: { type: String },
  pages: { type: Number, required: true },
  publishYear: { type: Number, required: true },
  language: { type: String, required: true },
  pdfFile: { type: String },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      text: { type: String, required: true },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      createdAt: { type: Date, default: Date.now },
    },
  ],
  keywords: [{ type: String }],
  favoriteCount: { type: Number, default: 0 },
  readCount: { type: Number, default: 0 },
});

export default mongoose.models.Book || mongoose.model('Book', bookSchema);
