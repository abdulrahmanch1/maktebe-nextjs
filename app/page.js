import HomePageClient from "./HomePageClient";
import { supabase } from "@/lib/supabase";

async function getBooks() {
  const { data, error } = await supabase.from('books').select('*');
  if (error) {
    console.error('Error fetching books:', error);
    return [];
  }
  return data;
}

async function getCategories() {
  const { data, error } = await supabase.from('books').select('category');
  if (error) {
    console.error('Error fetching categories:', error);
    return ["الكل"];
  }
  const uniqueCategories = ["الكل", ...new Set(data.map(item => item.category))];
  return uniqueCategories;
}


const HomePage = async () => {
  const initialBooks = await getBooks();
  const initialCategories = await getCategories();

  return <HomePageClient initialBooks={initialBooks} initialCategories={initialCategories} />;
};

export default HomePage;
