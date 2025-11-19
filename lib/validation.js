import { z } from 'zod';

export const validateRegister = (data) => {
  const errors = {};
  if (!data.username) errors.username = 'اسم المستخدم مطلوب.';
  if (!data.email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email)) errors.email = 'البريد الإلكتروني غير صالح.';
  if (!data.password || data.password.length < 8 || !/[A-Z]/.test(data.password) || !/[a-z]/.test(data.password) || !/[0-9]/.test(data.password) || !/[^A-Za-z0-9]/.test(data.password)) errors.password = 'يجب أن تكون كلمة المرور 8 أحرف على الأقل وتحتوي على حرف كبير وحرف صغير ورقم ورمز خاص.';
  return errors;
};

export const validateLogin = (data) => {
  const errors = {};
  if (!data.email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email)) errors.email = 'البريد الإلكتروني غير صالح';
  if (!data.password) errors.password = 'كلمة المرور مطلوبة.';
  return errors;
};

const bookSchema = z.object({
  title: z.string({ required_error: 'العنوان مطلوب.' }).min(1, { message: 'العنوان مطلوب.' }),
  author: z.string({ required_error: 'المؤلف مطلوب.' }).min(1, { message: 'المؤلف مطلوب.' }),
  category: z.string({ required_error: 'التصنيف مطلوب.' }).min(1, { message: 'التصنيف مطلوب.' }),
  description: z.string({ required_error: 'الوصف مطلوب.' }).min(1, { message: 'الوصف مطلوب.' }),
  pages: z.number({ required_error: 'عدد الصفحات يجب أن يكون رقمًا.', invalid_type_error: 'عدد الصفحات يجب أن يكون رقمًا.' }),
  publishYear: z.number({ required_error: 'سنة التأليف يجب أن تكون رقمًا.', invalid_type_error: 'سنة التأليف يجب أن تكون رقمًا.' }),
  language: z.string({ required_error: 'اللغة مطلوبة.' }).min(1, { message: 'اللغة مطلوبة.' }),
}).passthrough();

export const validateBook = (data) => {
  const result = bookSchema.safeParse(data);
  if (result.success) {
    return {}; // No errors
  } else {
    const errors = {};
    for (const issue of result.error.issues) {
      // Map the error to the first path segment
      if (issue.path.length > 0) {
        errors[issue.path[0]] = issue.message;
      }
    }
    return errors;
  }
};

const bookUpdateSchema = bookSchema.partial();

export const validateBookUpdate = (data) => {
  const result = bookUpdateSchema.safeParse(data);
  if (result.success) {
    return {}; // No errors
  } else {
    const errors = {};
    for (const issue of result.error.issues) {
      // Map the error to the first path segment
      if (issue.path.length > 0) {
        errors[issue.path[0]] = issue.message;
      }
    }
    return errors;
  }
};

export const validateComment = (data) => {
  const errors = {};
  if (!data.text) errors.text = 'نص التعليق لا يمكن أن يكون فارغًا.';
  return errors;
};

export const validateUserUpdate = (data) => {
  const errors = {};
  if (data.username !== undefined && !data.username) errors.username = 'اسم المستخدم لا يمكن أن يكون فارغًا.';
  if (data.email !== undefined && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email)) errors.email = 'البريد الإلكتروني غير صالح.';
  if (data.password !== undefined && (data.password.length < 8 || !/[A-Z]/.test(data.password) || !/[a-z]/.test(data.password) || !/[0-9]/.test(data.password) || !/[^A-Za-z0-9]/.test(data.password))) errors.password = 'يجب أن تكون كلمة المرور 8 أحرف على الأقل وتحتوي على حرف كبير وحرف صغير ورقم ورمز خاص.';
  return errors;
};

export const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && uuidRegex.test(uuid);
};

export const validateFavorite = (data) => {
  const errors = {};
  if (!data.bookId) {
    errors.bookId = 'معرف الكتاب مطلوب.';
  } else if (!isValidUUID(data.bookId)) {
    errors.bookId = 'معرف الكتاب غير صالح.';
  }
  return errors;
};

export const validateReadingList = (data) => {
  const errors = {};
  if (!data.bookId) {
    errors.bookId = 'معرف الكتاب مطلوب.';
  } else if (!isValidUUID(data.bookId)) {
    errors.bookId = 'معرف الكتاب غير صالح.';
  }
  return errors;
};

export const validateReadingStatus = (data) => {
  const errors = {};
  if (typeof data.read !== 'boolean') errors.read = 'حالة القراءة يجب أن تكون قيمة منطقية (true/false).';
  return errors;
};

// Removed validateMongoId as it's specific to MongoDB ObjectIDs.
// For Supabase, IDs are typically UUIDs or integers.
// You might need a new validation function for UUIDs if strict validation is required.

export const validateContactMessage = (data) => {
  const errors = {};
  if (!data.subject) errors.subject = 'الموضوع مطلوب.';
  if (!data.message) errors.message = 'الرسالة مطلوبة.';
  if (!data.email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email)) errors.email = 'البريد الإلكتروني غير صالح.';
  return errors;
};
