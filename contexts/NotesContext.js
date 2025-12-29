'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AuthContext } from './AuthContext';

export const NotesContext = createContext({
    notes: {}, // Map of bookId -> note string
    refreshNotes: async () => { },
    getNote: (bookId) => null,
});

export const NotesProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [notes, setNotes] = useState({});
    const supabase = createClient();

    const fetchNotes = async () => {
        if (!user) {
            setNotes({});
            return;
        }

        try {
            const { data, error } = await supabase
                .from('book_notes')
                .select('book_id, note')
                .eq('user_id', user.id);

            if (error) throw error;

            const notesMap = {};
            data.forEach(item => {
                notesMap[item.book_id] = item.note;
            });
            setNotes(notesMap);
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [user]);

    const getNote = (bookId) => notes[bookId] || null;

    return (
        <NotesContext.Provider value={{ notes, refreshNotes: fetchNotes, getNote }}>
            {children}
        </NotesContext.Provider>
    );
};
