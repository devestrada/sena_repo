document.addEventListener("DOMContentLoaded", () => {
    const pagesContainer = document.getElementById("pagesContainer");
    const sidebarBlocks = document.querySelectorAll(".blocks .block");
    
    // ===== Estado Global =====
    const State = {
        isSpellcheckEnabled: true,
        pageMarginBottom: 2.54 * 37.79, // Convertir cm a px aprox (96px/2.54)
        isPaginating: false
    };

    // ====================================================================
    // ====== FUNCIONES DE BLOQUE =========================================
    // ====================================================================

    function setupBlockInteractivity(block) {
        // 1. Botón de eliminación (Singleton)
        if (!block.querySelector(".delete-block-btn")) {
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "✕";
            deleteBtn.className = "delete-block-btn";
            deleteBtn.title = "Eliminar bloque";
            deleteBtn.onclick = () => {
                const page = block.closest('.page');
                block.remove();
                if (page) requestPagination(page);
            };
            block.appendChild(deleteBtn);
        }

        // 2. Hacer reordenable
        makeReorderable(block);

        // 3. Resize de imágenes
        if (block.classList.contains("figure-block")) {
            const imgWrapper = block.querySelector(".figure-img-wrapper");
            const img = block.querySelector("img");
            if (imgWrapper && img) makeImageResizable(imgWrapper, img);
        }

        // 4. Input listener para auto-paginación
        const content = block.querySelector(".block-content");
        if (content) {
            content.addEventListener("input", () => {
                const page = block.closest(".page");
                if (page) requestPagination(page);
            });
        }
    }

    function createBlockElement(id, initialHTML = "") {
        const newBlock = document.createElement("div");
        newBlock.id = id;
        newBlock.classList.add("placed-block");
        
        const contentDiv = document.createElement("div");
        contentDiv.classList.add("block-content");
        contentDiv.contentEditable = "true";
        contentDiv.lang = "es";
        contentDiv.spellcheck = State.isSpellcheckEnabled;
        
        // Limpiar HTML de botones de la sidebar si existen
        const temp = document.createElement("div");
        temp.innerHTML = initialHTML;
        const btn = temp.querySelector(".add-block-btn");
        if (btn) btn.remove();
        
        contentDiv.innerHTML = temp.innerHTML || "Escribe aquí...";
        newBlock.appendChild(contentDiv);

        return newBlock;
    }

    // ====================================================================
    // ====== LÓGICA DE PÁGINAS Y PAGINACIÓN ==============================
    // ====================================================================

    function createPage() {
        const newPage = document.createElement("div");
        newPage.classList.add("page");
        
        const numDiv = document.createElement("div");
        numDiv.className = "page-number";
        newPage.appendChild(numDiv);

        makePageInteractive(newPage);
        return newPage;
    }

    function requestPagination(page) {
        if (State.isPaginating) return;
        State.isPaginating = true;
        window.requestAnimationFrame(() => {
            checkAndPaginate(page);
            updatePageNumbers();
            State.isPaginating = false;
        });
    }

    function checkAndPaginate(page) {
        if (!page) return;

        const pageRect = page.getBoundingClientRect();
        const style = window.getComputedStyle(page);
        const maxContentBottom = pageRect.height - parseFloat(style.paddingBottom);

        const blocks = [...page.querySelectorAll(".placed-block")];
        let overflowIndex = -1;

        for (let i = 0; i < blocks.length; i++) {
            const blockRect = blocks[i].getBoundingClientRect();
            if ((blockRect.bottom - pageRect.top) > maxContentBottom + 2) {
                overflowIndex = i;
                break;
            }
        }

        if (overflowIndex !== -1) {
            let nextPage = page.nextElementSibling;
            if (!nextPage || !nextPage.classList.contains("page")) {
                nextPage = createPage();
                pagesContainer.appendChild(nextPage);
            }

            const frag = document.createDocumentFragment();
            
            // Si el bloque desbordado es texto y es el único, intentar dividirlo
            if (overflowIndex === 0 && blocks[0].id !== 'image') {
                const splitResult = splitTextBlock(blocks[0], maxContentBottom, pageRect.top);
                if (splitResult) {
                    frag.appendChild(splitResult);
                    setupBlockInteractivity(splitResult);
                }
            }

            // Mover el resto de bloques
            for (let i = overflowIndex + (frag.firstChild ? 1 : 0); i < blocks.length; i++) {
                frag.appendChild(blocks[i]);
            }

            nextPage.prepend(frag);
            checkAndPaginate(nextPage);
        }
    }

    function splitTextBlock(block, maxBottom, pageTop) {
        const content = block.querySelector(".block-content");
        if (!content || block.id === "code") return null; // No dividir bloques de código

        const nodes = [...content.childNodes];
        let splitNodeIdx = -1;
        let charIdx = -1;

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            let nodeBottom = 0;

            if (node.nodeType === Node.ELEMENT_NODE) {
                nodeBottom = node.getBoundingClientRect().bottom - pageTop;
            } else {
                const range = document.createRange();
                range.selectNode(node);
                nodeBottom = range.getBoundingClientRect().bottom - pageTop;
            }

            if (nodeBottom > maxBottom) {
                splitNodeIdx = i;
                break;
            }
        }

        if (splitNodeIdx === -1) return null;

        const newNode = block.cloneNode(false);
        const newContent = content.cloneNode(false);
        newNode.appendChild(newContent);

        const toMove = nodes.slice(splitNodeIdx);
        toMove.forEach(n => newContent.appendChild(n));

        return newNode;
    }

    // ====================================================================
    // ====== EVENTOS DE INTERFAZ =========================================
    // ====================================================================

    function makePageInteractive(page) {
        page.addEventListener("dragover", e => {
            e.preventDefault();
            const dragging = document.querySelector(".dragging");
            if (!dragging) return;

            const afterElement = getDragAfterElement(page, e.clientY);
            if (afterElement == null) {
                page.appendChild(dragging);
            } else {
                page.insertBefore(dragging, afterElement);
            }
        });

        page.addEventListener("drop", e => {
            e.preventDefault();
            const dragging = document.querySelector(".dragging");
            if (dragging) {
                requestPagination(page);
                return;
            }

            const data = e.dataTransfer.getData("block-id");
            const html = e.dataTransfer.getData("block-html");
            if (!data) return;

            if (data === "image") {
                createEmptyAPAImageBlock(page);
            } else {
                const newBlock = createBlockElement(data, html);
                page.appendChild(newBlock);
                setupBlockInteractivity(newBlock);
                requestPagination(page);
            }
        });
    }

    function getDragAfterElement(container, y) {
        const elements = [...container.querySelectorAll(".placed-block:not(.dragging)")];
        return elements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function makeReorderable(block) {
        block.setAttribute("draggable", "true");
        block.addEventListener("dragstart", (e) => {
            block.classList.add("dragging");
            e.dataTransfer.setData("text/plain", ""); // Requerido por Firefox
        });
        block.addEventListener("dragend", () => {
            block.classList.remove("dragging");
            const page = block.closest(".page");
            if (page) requestPagination(page);
        });
    }

    // Inicializar Sidebar
    sidebarBlocks.forEach(sb => {
        sb.setAttribute("draggable", "true");
        sb.addEventListener("dragstart", e => {
            e.dataTransfer.setData("block-id", sb.id);
            e.dataTransfer.setData("block-html", sb.innerHTML);
        });

        const addBtn = sb.querySelector(".add-block-btn");
        if (addBtn) {
            addBtn.addEventListener("click", () => {
                const pages = pagesContainer.querySelectorAll(".page");
                const targetPage = pages[pages.length - 1] || createPage();
                if (!targetPage.parentNode) pagesContainer.appendChild(targetPage);

                if (sb.id === "image") {
                    createEmptyAPAImageBlock(targetPage);
                } else {
                    const newBlock = createBlockElement(sb.id, sb.innerHTML);
                    targetPage.appendChild(newBlock);
                    setupBlockInteractivity(newBlock);
                    requestPagination(targetPage);
                }
            });
        }
    });

    // ====================================================================
    // ====== UTILIDADES ADICIONALES ======================================
    // ====================================================================

    function updatePageNumbers() {
        const pages = pagesContainer.querySelectorAll(".page");
        pages.forEach((p, i) => {
            const num = p.querySelector(".page-number");
            if (num) num.textContent = i + 1;
        });
    }

    // Inicialización
    const initialPage = pagesContainer.querySelector(".page");
    if (initialPage) makePageInteractive(initialPage);
    updatePageNumbers();

    // Toolbar (Ejemplo simplificado de uno)
    document.getElementById("btnBold")?.addEventListener("click", () => document.execCommand("bold"));
});