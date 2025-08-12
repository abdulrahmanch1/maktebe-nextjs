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
  if (data.email !== undefined && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email)) errors.email = 'البريد الإلكتروني غير صالح.';
  if (data.password !== undefined && (data.password.length < 8 || !/[A-Z]/.test(data.password) || !/[a-z]/.test(data.password) || !/[0-9]/.test(data.password) || !/[^A-Za-z0-9]/.test(data.password))) errors.password = 'يجب أن تكون كلمة المرور 8 أحرف على الأقل وتحتوي على حرف كبير وحرف صغير ورقم ورمز خاص.';
  return errors;
};

const isValidUUID = (uuid) => {
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
