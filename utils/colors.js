// Elegant Pastel Colors for Notes
export const NOTE_COLORS = [
    '#fbf8cc', // Lemon Chiffon
    '#fde4cf', // Champagne
    '#ffcfd2', // Pale Pink
    '#f1c0e8', // Pink Lace
    '#cfbaf0', // Mauve
    '#a3c4f3', // Baby Blue Eyes
    '#90dbf4', // Non Photo Blue
    '#8eecf5', // Electric Blue
    '#98f5e1', // Aquamarine
    '#b9fbc0', // Celadon
];

export const getRandomElegantColor = () => {
    return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
};

export const getNoteColor = (noteId) => {
    // Deterministic color based on the note content/id hash to avoid flashing colors
    if (!noteId) return NOTE_COLORS[0];
    let hash = 0;
    for (let i = 0; i < noteId.length; i++) {
        hash = noteId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % NOTE_COLORS.length;
    return NOTE_COLORS[index];
};
