/**
 * Creates a downloadable text file with the specified content and filename.
 *
 * @param {string} text - The content to be included in the text file.
 * @param {string} filename - The name of the file (without extension) to be downloaded/saved.
 */
export function createDownload(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = filename + '.txt';
    link.href = window.URL.createObjectURL(blob);
    link.click();
    window.URL.revokeObjectURL(link.href);
}