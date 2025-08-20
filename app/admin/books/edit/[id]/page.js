import { createClient } from "@/utils/supabase/server";
import { notFound } from 'next/navigation';
import EditBookFormClient from "./EditBookFormClient"; // New client component

async function getBookData(id) {
  const supabase = await createClient();
  const { data: book, error } = await supabase
    .from('books')
    .select('*') // Select all book data
    .eq('id', id)
    .single();

  if (error || !book) {
    console.error("Error fetching book for edit:", error);
    return null;
  }
  return book;
}

const EditBookPage = async (props) => {
  const params = await props.params; // Await params
  const { id } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.role !== 'admin') {
    // Redirect or show unauthorized message
    // For now, just show a message
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Unauthorized Access</h1>
        <p>You must be an admin to edit books.</p>
      </div>
    );
  }

  const book = await getBookData(id);

  if (!book) {
    notFound();
  }

  return <EditBookFormClient initialBook={book} />;
};

export default EditBookPage;
