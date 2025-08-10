export const validateRegister = (data) => {
  const errors = {};
  if (!data.username) errors.username = 'اسم المستخدم مطلوب.';
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'البريد الإلكتروني غير صالح.';
  if (!data.password || data.password.length < 6) errors.password = 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.';
  return errors;
};

export const validateLogin = (data) => {
  const errors = {};
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'البريد الإلكتروني غير صالح.';
  if (!data.password) errors.password = 'كلمة المرور مطلوبة.';
  return errors;
};

export const validateBook = (data) => {
  const errors = {};
  if (!data.title) errors.title = 'العنوان مطلوب.';
  if (!data.author) errors.author = 'المؤلف مطلوب.';
  if (!data.category) errors.category = 'التصنيف مطلوب.';
  if (!data.description) errors.description = 'الوصف مطلوب.';
  if (!data.pages || isNaN(data.pages)) errors.pages = 'عدد الصفحات يجب أن يكون رقمًا.';
  if (!data.publishYear || isNaN(data.publishYear)) errors.publishYear = 'سنة النشر يجب أن تكون رقمًا.';
  if (!data.language) errors.language = 'اللغة مطلوبة.';
  return errors;
};

export const validateComment = (data) => {
  const errors = {};
  if (!data.text) errors.text = 'نص التعليق لا يمكن أن يكون فارغًا.';
  return errors;
};

export const validateUserUpdate = (data) => {
  const errors = {};
  if (data.username !== undefined && !data.username) errors.username = 'اسم المستخدم لا يمكن أن يكون فارغًا.';
  if (data.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'البريد الإلكتروني غير صالح.';
  if (data.password !== undefined && data.password.length < 6) errors.password = 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.';
  return errors;
};

export const validateFavorite = (data) => {
  const errors = {};
  // Removed MongoDB ID validation. Supabase IDs are typically UUIDs.
  // A simple check for existence might be sufficient, or add UUID validation if needed.
  if (!data.bookId) errors.bookId = 'معرف الكتاب مطلوب.';
  return errors;
};

export const validateReadingList = (data) => {
  const errors = {};
  // Removed MongoDB ID validation. Supabase IDs are typically UUIDs.
  // A simple check for existence might be sufficient, or add UUID validation if needed.
  if (!data.bookId) errors.bookId = 'معرف الكتاب مطلوب.';
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
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'البريد الإلكتروني غير صالح.';
  return errors;
};