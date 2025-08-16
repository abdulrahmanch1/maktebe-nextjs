import HomePageClient from "./HomePageClient";
import { createClient } from "@/utils/supabase/server";

async function getBooks() {
  const supabase = createClient();
  const { data, error } = await supabase.from('books').select('*');
  if (error) {
    console.error('Error fetching books:', error);
    return [];
  }
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
  const initialBooks = await getBooks();
  const initialCategories = await getCategories();

  return <HomePageClient initialBooks={initialBooks} initialCategories={initialCategories} />;
};

export default HomePage;
