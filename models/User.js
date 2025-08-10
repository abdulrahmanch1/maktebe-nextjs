// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//     lowercase: true,
//   },
//   password: {
//     type: String,
//     required: true,
//     select: false, // Don't return password by default
//   },
//   role: {
//     type: String,
//     enum: ['user', 'admin'],
//     default: 'user',
//   },
//   isVerified: {
//     type: Boolean,
//     default: false,
//   },
//   verificationToken: String,
//   verificationTokenExpires: Date,
//   profilePicture: {
//     type: String,
//     default: '/imgs/user.jpg',
//   },
//   favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
//   readingList: [
//     {
//       book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
//       read: { type: Boolean, default: false },
//       addedAt: { type: Date, default: Date.now },
//     },
//   ],
// }, { timestamps: true });

// // Hash password before saving
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) {
//     next();
//   }
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

// // Match user entered password to hashed password in database
// userSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// export default mongoose.models.User || mongoose.model('User', userSchema);

// TODO: Replace with Supabase equivalent for User model
// This file previously defined the Mongoose schema for the User model.
// You will need to define your User table schema in Supabase
// and create functions/methods to interact with it.
