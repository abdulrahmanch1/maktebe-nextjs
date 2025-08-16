import { errorMessages } from '@/constants/errorMessages';

export const validateRegister = (data) => {
  const errors = {};
  if (!data.username) errors.username = errorMessages.REQUIRED_USERNAME;
  if (!data.email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email)) errors.email = errorMessages.INVALID_EMAIL;
  if (!data.password || data.password.length < 8 || !/[A-Z]/.test(data.password) || !/[a-z]/.test(data.password) || !/[0-9]/.test(data.password) || !/[^A-Za-z0-9]/.test(data.password)) errors.password = errorMessages.PASSWORD_POLICY;
  return errors;
};

export const validateLogin = (data) => {
  const errors = {};
  if (!data.email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email)) errors.email = errorMessages.INVALID_EMAIL;
  if (!data.password) errors.password = errorMessages.REQUIRED_PASSWORD;
  return errors;
};

export const validateBook = (data) => {
  const errors = {};
  if (!data.title) errors.title = errorMessages.REQUIRED_TITLE;
  if (!data.author) errors.author = errorMessages.REQUIRED_AUTHOR;
  if (!data.category) errors.category = errorMessages.REQUIRED_CATEGORY;
  if (!data.description) errors.description = errorMessages.REQUIRED_DESCRIPTION;
  if (!data.pages || isNaN(data.pages)) errors.pages = errorMessages.INVALID_PAGES;
  if (!data.publishYear || isNaN(data.publishYear)) errors.publishYear = errorMessages.INVALID_PUBLISH_YEAR;
  if (!data.language) errors.language = errorMessages.REQUIRED_LANGUAGE;
  return errors;
};

export const validateBookUpdate = (data) => {
  const errors = {};
  if (data.title !== undefined && !data.title) errors.title = errorMessages.REQUIRED_TITLE;
  if (data.author !== undefined && !data.author) errors.author = errorMessages.REQUIRED_AUTHOR;
  if (data.category !== undefined && !data.category) errors.category = errorMessages.REQUIRED_CATEGORY;
  if (data.description !== undefined && !data.description) errors.description = errorMessages.REQUIRED_DESCRIPTION;
  if (data.pages !== undefined && isNaN(data.pages)) errors.pages = errorMessages.INVALID_PAGES;
  if (data.publishYear !== undefined && isNaN(data.publishYear)) errors.publishYear = errorMessages.INVALID_PUBLISH_YEAR;
  if (data.language !== undefined && !data.language) errors.language = errorMessages.REQUIRED_LANGUAGE;
  return errors;
};

export const validateComment = (data) => {
  const errors = {};
  if (!data.text) errors.text = errorMessages.REQUIRED_COMMENT_TEXT;
  return errors;
};

export const validateUserUpdate = (data) => {
  const errors = {};
  if (data.username !== undefined && !data.username) errors.username = errorMessages.REQUIRED_USERNAME;
  if (data.email !== undefined && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email)) errors.email = errorMessages.INVALID_EMAIL;
  if (data.password !== undefined && (data.password.length < 8 || !/[A-Z]/.test(data.password) || !/[a-z]/.test(data.password) || !/[0-9]/.test(data.password) || !/[^A-Za-z0-9]/.test(data.password))) errors.password = errorMessages.PASSWORD_POLICY;
  return errors;
};

const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && uuidRegex.test(uuid);
};

export const validateFavorite = (data) => {
  const errors = {};
  if (!data.bookId) {
    errors.bookId = errorMessages.REQUIRED_BOOK_ID;
  } else if (!isValidUUID(data.bookId)) {
    errors.bookId = errorMessages.INVALID_BOOK_ID;
  }
  return errors;
};

export const validateReadingList = (data) => {
  const errors = {};
  if (!data.bookId) {
    errors.bookId = errorMessages.REQUIRED_BOOK_ID;
  } else if (!isValidUUID(data.bookId)) {
    errors.bookId = errorMessages.INVALID_BOOK_ID;
  }
  return errors;
};

export const validateReadingStatus = (data) => {
  const errors = {};
  if (typeof data.read !== 'boolean') errors.read = errorMessages.INVALID_READ_STATUS;
  return errors;
};

// Removed validateMongoId as it's specific to MongoDB ObjectIDs.
// For Supabase, IDs are typically UUIDs or integers.
// You might need a new validation function for UUIDs if strict validation is required.

export const validateContactMessage = (data) => {
  const errors = {};
  if (!data.subject) errors.subject = errorMessages.REQUIRED_SUBJECT;
  if (!data.message) errors.message = errorMessages.REQUIRED_MESSAGE;
  if (!data.email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email)) errors.email = errorMessages.INVALID_EMAIL;
  return errors;
};
