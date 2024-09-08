import { FileT } from "../types";

const tagForm = document.querySelector('form');
const tagInput = tagForm?.querySelector('input');
export let tags: Set<string> = new Set();

tagForm?.addEventListener('submit', async function (e: any) {
    e.preventDefault();

    if (!tagInput?.value || tags.has(tagInput?.value)) return;
    
    tags.add(tagInput.value);
    updateTagbar();
    search();
});

const tagbar = document.getElementById('tagbar');
function updateTagbar() {
    if (!tagbar) return;
    tagbar.innerHTML = '';
    tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.innerText = tag;
        tagElement.classList.add('tag-item');
        tagElement.addEventListener('click', () => {
            tags.delete(tag);
            updateTagbar();
            search();
        });
        tagbar?.appendChild(tagElement);
    });
}

const itemContainer = document.getElementById('item-container');
async function search() {
    if (!itemContainer) return;
    itemContainer.innerHTML = '';
    
    const tagList = Array.from(tags);
    const result: FileT[] = await window.db.search(tagList);

    console.log('search result: ', JSON.stringify(result, null, 2));

    result.forEach((file: FileT) => {
        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');
        fileItem.innerHTML = `
            <div>${file.name}</div>
            <div>${file.path}</div>
            <div>${file.lastModified}</div>
        `;
        itemContainer.appendChild(fileItem);
    })
}



const dropzone = document.getElementById('dropzone');
dropzone?.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer)
        event.dataTransfer.dropEffect = 'copy';
});
dropzone?.addEventListener('drop', async (e) => {
    try {
        e.preventDefault();
        e.stopPropagation();
    
        if (!e.dataTransfer || !window.utils) return;
        const files = Array.from(e.dataTransfer.files).map(window.utils.getFilePath);

        window.utils.dropFiles(files, Array.from(tags));
    } catch (error: any) {
        alert('Cannot drop file: ' + error.message);
    }
});