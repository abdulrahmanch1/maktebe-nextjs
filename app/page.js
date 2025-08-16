import HomePageClient from "./HomePageClient";
import { createClient } from "@/utils/supabase/server";

async function getBooks(page = 1, limit = 10) {
  const supabase = createClient();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not defined. Please set it in your environment variables.');
  }

  const url = `${baseUrl}/api/books?page=${page}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error('Error fetching books:', res.statusText);
    return [];
  }
  const data = await res.json();
  return data;
}

async function getCategories() {
  const supabase = createClient();
  const { data, error } = await supabase.from('books').select('category', { distinct: true });
  if (error) {
    console.error('Error fetching categories:', error);
    return ["الكل"];
  }
  const categories = data.map(item => item.category);
  return ["الكل", ...categories];
}


const HomePage = async () => {
  const defaultPage = 1;
  const defaultLimit = 10; // Or whatever default limit you want

  const initialBooks = await getBooks(defaultPage, defaultLimit);
  const initialCategories = await getCategories();

  return <HomePageClient
    initialBooks={initialBooks}
    initialCategories={initialCategories}
    defaultPage={defaultPage}
    defaultLimit={defaultLimit}
  />;
};

export default HomePage;
