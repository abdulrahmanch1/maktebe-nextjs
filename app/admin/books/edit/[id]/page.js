import { createClient } from "@/utils/supabase/server";
import { notFound } from 'next/navigation';
import EditBookFormClient from "./EditBookFormClient";

async function getBookData(id) {
  const supabase = await createClient();
  const { data: book, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !book) {
    console.error("Error fetching book for edit:", error);
    return null;
  }
  return book;
}

const EditBookPage = async (props) => {
  const params = await props.params;
  const { id } = params;
  const supabase = await createClient();
  
  // 1. Get the authenticated user
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Unauthorized Access</h1>
        <p>You must be logged in to view this page.</p>
      </div>
    );
  }

  // 2. Get the user's profile to check their role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .single();

  // 3. Check for admin role
  if (profileError || profile?.role !== 'admin') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Unauthorized Access</h1>
        <p>You must be an admin to edit books.</p>
      </div>
    );
  }

  // 4. If admin, proceed to fetch book data
  const book = await getBookData(id);

  if (!book) {
    notFound();
  }

  return <EditBookFormClient initialBook={book} />;
};

export default EditBookPage;