import { FileT } from "../types";

const tagForm = document.querySelector('form');
const tagInput = tagForm?.querySelector('input');

export let tags: Set<string> = new Set();

//Searchbar setter
tagForm?.addEventListener('submit', async function (e: any) {
    e.preventDefault();

    if (!tagInput.value) {
        search();
        return;        
    }
    
    if (tags.has(tagInput?.value)) return;
    
    tags.add(tagInput.value);
    updateTagbar();
    search();

    tagInput.value = '';
});


// Tagbar setter
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

//main container setter
const itemContainer = document.getElementById('item-container');
async function search() {
    if (!itemContainer) return;
    itemContainer.innerHTML = '';
    
    const tagList = Array.from(tags);
    const result: FileT[] = await window.utils.search(tagList);

    // console.log('search result: ', JSON.stringify(result, null, 2));

    result.forEach(renderFileItem)
}
function renderFileItem(file: FileT) {
    const fileItem = document.createElement('div');
    fileItem.classList.add('file-item');

    const fileItemContent = document.createElement('div');
    fileItemContent.classList.add('file-item-content');
    fileItemContent.innerHTML = `
        <div>${file.name}</div>
        <div>${file.lastModified}</div>
        `;
    fileItemContent.addEventListener('click', async () => {
        window.utils.openPath(file.path).then((response: string) => {
            if (response) {
                console.log('File opened: ', response);
            }
        });
    });
    fileItem.appendChild(fileItemContent);
    fileItem.appendChild(getFileItemOptionButton(file));
    itemContainer.appendChild(fileItem);
}
const fileItemOptionPopover = document.getElementById('file-item-option-popover') as any;
function getFileItemOptionButton(file: FileT): HTMLButtonElement {
    const button = document.createElement('button');
    button.innerText = 'O';
    // button.popoverTargetElement = fileItemOptionPopover;
    button.addEventListener('click', async () => {
        fileItemOptionPopover.togglePopover();
        await setFileItemOptionPopover(file);
    });
    return button;
}
async function setFileItemOptionPopover(file: FileT) {
    const tags = await window.db.getTagsByFileId(file.id);

    //check whether file exists in folder or not. If not, delete it.
    
    fileItemOptionPopover.innerHTML = `
        <p>File Name: ${file.name}</p>
        <p>File Path: ${file.path}</p>
        <p>File Last Modified: ${file.lastModified}</p>
        <p>Tags: ${tags.map(tag => tag.name).join(', ')}</p>
    `
    const button = document.createElement('button');
    button.innerText = 'Delete';
    button.addEventListener('click', async () => {
        deleteFile(file);
        fileItemOptionPopover.togglePopover();
        search();
    });
    fileItemOptionPopover.appendChild(button);
}
async function deleteFile(file: FileT) {
    window.utils.deleteFile(file);
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

        search();
    } catch (error: any) {
        alert('Cannot drop file: ' + error.message);
    }
});