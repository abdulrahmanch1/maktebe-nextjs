import AuthorProfileClient from "@/app/author/[id]/AuthorProfileClient";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

// Force dynamic since we fetch fresh data
export const dynamic = 'force-dynamic';

async function getAuthorData(id) {
    const supabase = await createClient();

    // Fetch author
    const { data: author, error: authorError } = await supabase
        .from('authors')
        .select('*')
        .eq('id', id)
        .single();

    if (authorError || !author) {
        return { author: null, books: [] };
    }

    // Fetch books by author name (legacy structure support)
    const { data: books, error: booksError } = await supabase
        .from('books')
        .select('*')
        .eq('status', 'approved')
        .eq('author', author.name)
        .order('created_at', { ascending: false });

    return {
        author,
        books: books || []
    };
}

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const { author } = await getAuthorData(resolvedParams.id);
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dar-alqurra.com';

    if (!author) {
        return {
            title: 'المؤلف غير موجود | دار القرّاء',
            description: 'المؤلف الذي تبحث عنه غير موجود.',
            robots: { index: false, follow: true },
        };
    }

    const description = author.bio
        ? `${author.bio.substring(0, 160)}...`
        : `تصفح كتب ومؤلفات ${author.name} في مكتبة دار القرّاء. سيرته الذاتية، حياته، وأهم إنجازاته.`;

    const keywords = [
        author.name,
        'كتب',
        'مؤلفات',
        'سيرة ذاتية',
        author.birth_place,
        author.residence_place
    ].filter(Boolean);

    const imageUrl = author.image_url
        ? `${siteUrl}/api/image-proxy?url=${encodeURIComponent(author.image_url)}`
        : `${siteUrl}/imgs/default_author.png`;

    // JSON-LD for AI Understanding (Person Schema)
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: author.name,
        description: author.bio,
        image: imageUrl,
        url: `${siteUrl}/author/${resolvedParams.id}`,
        birthDate: author.birth_date,
        deathDate: author.death_date,
        birthPlace: {
            '@type': 'Place',
            name: author.birth_place
        },
        homeLocation: {
            '@type': 'Place',
            name: author.residence_place
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${siteUrl}/author/${resolvedParams.id}`
        },
        jobTitle: "Writer", // Default for authors
        worksFor: {
            '@type': 'Organization',
            name: 'دار القرّاء'
        }
    };

    return {
        title: `${author.name} - كتب وسيرة ذاتية | دار القرّاء`,
        description: description,
        keywords: keywords,
        openGraph: {
            title: `${author.name} | دار القرّاء`,
            description: description,
            type: 'profile',
            url: `${siteUrl}/author/${resolvedParams.id}`,
            images: [
                {
                    url: imageUrl,
                    width: 800,
                    height: 800,
                    alt: author.name,
                }
            ],
        },
        other: {
            'application/ld+json': JSON.stringify(jsonLd),
        },
    };
}

const AuthorProfilePage = async ({ params }) => {
    const resolvedParams = await params;
    const { author, books } = await getAuthorData(resolvedParams.id);

    if (!author) {
        notFound();
    }

    return <AuthorProfileClient author={author} books={books} />;
};

export default AuthorProfilePage;
