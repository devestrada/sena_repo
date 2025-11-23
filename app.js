
document.addEventListener("DOMContentLoaded", () => {
    const blocks = document.querySelectorAll(".blocks .block");
    const pagesContainer = document.getElementById("pagesContainer");
    const addTopBtn = document.getElementById("addPageTop");
    const addBottomBtn = document.getElementById("addPageBottom");

    // ===== state =====
    let figureCounter = 1;

    // ====================================================================
    // ====== HELPER FUNCTIONS (Optimization) =============================
    // ====================================================================

    // Attach all necessary listeners to a block (Delete, Reorder, Resize)
    function setupBlockInteractivity(block) {
        // 1. Delete Button
        let deleteBtn = block.querySelector(".delete-block-btn");
        if (!deleteBtn) {
            deleteBtn = document.createElement("button");
            deleteBtn.textContent = "X";
            deleteBtn.className = "delete-block-btn";
            block.appendChild(deleteBtn);
        }

        // Remove old listeners by cloning
        const newBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newBtn, deleteBtn);

        newBtn.addEventListener("click", () => {
            block.remove();
            renumerarFiguras();
        });

        // 2. Reorder
        makeReorderable(block);

        // 3. Image Resize (if applicable)
        if (block.classList.contains("figure-block")) {
            const imgWrapper = block.querySelector(".figure-img-wrapper");
            const img = block.querySelector("img");
            if (imgWrapper && img) {
                makeImageResizable(imgWrapper, img);
            }
        }
    }

    // Create a standard text block from a template
    function createBlockElement(templateBlock) {
        const newBlock = document.createElement("div");
        newBlock.id = templateBlock.id; // Copy ID (e.g., 'paragraph')
        newBlock.classList.add("placed-block");
        newBlock.setAttribute("draggable", "true"); // Will be handled by makeReorderable
        newBlock.contentEditable = "false"; // Container NOT editable

        // Create content wrapper
        const contentDiv = document.createElement("div");
        contentDiv.classList.add("block-content");
        contentDiv.contentEditable = "true"; // Content IS editable
        contentDiv.innerHTML = templateBlock.innerHTML;
        
        newBlock.appendChild(contentDiv);
        
        return newBlock;
    }

    // ====================================================================
    // ====== PAGE & BLOCK LOGIC ==========================================
    // ====================================================================

    // === Función para crear una nueva página ===
    function createPage() {
        const newPage = document.createElement("div");
        newPage.classList.add("page");
        newPage.innerHTML = ""; // página en blanco
        
        const numDiv = document.createElement("div");
        numDiv.className = "page-number";
        newPage.appendChild(numDiv);

        makePageInteractive(newPage);
        return newPage;
    }

    // === Hacer interactiva la página: soltar y reordenar ===
    function makePageInteractive(page) {
        // permitir soltar bloques desde la barra lateral
        page.addEventListener("dragover", e => e.preventDefault());

        page.addEventListener("drop", e => {
            e.preventDefault();
            const dragging = document.querySelector(".dragging");

            // Si se está reordenando un bloque interno
            if (dragging) return;

            const blockHTML = e.dataTransfer.getData("text/plain");
            const temp = document.createElement("div");
            temp.innerHTML = blockHTML;
            const templateBlock = temp.firstElementChild;

            // Si no hay bloque válido, nada que hacer
            if (!templateBlock) return;

            // Si es el bloque "image" -> crear placeholder especializado
            if (templateBlock.id === "image") {
                createEmptyAPAImageBlock(templateBlock, page);
                return;
            }

            // Bloque normal
            const newBlock = createBlockElement(templateBlock);
            
            page.appendChild(newBlock);
            setupBlockInteractivity(newBlock);
        });

        // Reordenar dentro de la página
        page.addEventListener("dragover", e => {
            e.preventDefault();
            const dragging = document.querySelector(".dragging");
            if (!dragging) return;

            const afterElement = getDragAfterElement(page, e.clientY);
            const allBlocks = page.querySelectorAll(".placed-block");
            allBlocks.forEach(b => b.classList.remove("drag-over"));

            if (afterElement == null) {
                page.appendChild(dragging);
            } else {
                afterElement.classList.add("drag-over");
                page.insertBefore(dragging, afterElement);
            }
        });

        page.addEventListener("drop", e => {
            const allBlocks = page.querySelectorAll(".placed-block");
            allBlocks.forEach(b => b.classList.remove("drag-over"));
        });
    }

    // === Obtener el elemento tras la posición Y para inserción ===
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

    // === Hacer reordenable un bloque dentro de la página ===
    function makeReorderable(block) {
        block.setAttribute("draggable", "true");

        block.addEventListener("dragstart", e => {
            block.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
            try {
                e.dataTransfer.setData("text/plain", "");
            } catch (err) {}
        });

        block.addEventListener("dragend", () => {
            block.classList.remove("dragging");
            const allPages = document.querySelectorAll(".page");
            allPages.forEach(p => {
                p.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
            });
        });
    }

    // === Inicializar la primera página existente ===
    const firstPage = pagesContainer.querySelector(".page");
    if (firstPage) makePageInteractive(firstPage);

    // === Botones para agregar páginas ===
    if (addTopBtn) {
        addTopBtn.addEventListener("click", () => {
            const newPage = createPage();
            pagesContainer.insertBefore(newPage, pagesContainer.firstChild);
            updatePageNumbers();
        });
    }
    if (addBottomBtn) {
        addBottomBtn.addEventListener("click", () => {
            const newPage = createPage();
            pagesContainer.appendChild(newPage);
            updatePageNumbers();
        });
    }

    // === Habilitar arrastrar bloques desde la barra lateral ===
    blocks.forEach(block => {
        block.setAttribute("draggable", "true");
        block.addEventListener("dragstart", e => {
            e.dataTransfer.setData("text/plain", block.outerHTML);
        });
    });

    // ====================================================================
    // ====== FIGURE / IMAGE HANDLING =====================================
    // ====================================================================

    function renumerarFiguras() {
        const figuras = document.querySelectorAll(".figure-block");
        let contador = 1;
        figuras.forEach(figura => {
            const caption = figura.querySelector(".figure-caption");
            if (caption) {
                const userText = (caption.dataset.userText) ? caption.dataset.userText : null;
                if (!userText) {
                    caption.textContent = `Figura ${contador}. Descripción de la figura.`;
                } else {
                    caption.textContent = `Figura ${contador}. ${userText}`;
                    delete caption.dataset.userText;
                }
            }
            contador++;
        });
        figureCounter = contador;
    }

    document.addEventListener("focusout", (e) => {
        const cap = e.target.closest && e.target.closest(".figure-caption");
        if (!cap) return;
        const text = cap.textContent.trim();
        const parts = text.split(/\.\s+/);
        if (parts.length >= 2) {
            const remainder = parts.slice(1).join('. ');
            cap.dataset.userText = remainder;
        } else {
            cap.dataset.userText = "";
        }
    });

    function createEmptyAPAImageBlock(origBlock, page) {
        const figureContainer = document.createElement("div");
        figureContainer.classList.add("figure-block", "placed-block");
        figureContainer.setAttribute("contenteditable", "false");

        // Placeholder
        const placeholder = document.createElement("div");
        placeholder.className = "image-placeholder";
        placeholder.innerHTML = `<div">Selecciona una imagen</div>`;
        figureContainer.appendChild(placeholder);

        // Caption
        const caption = document.createElement("div");
        caption.classList.add("figure-caption");
        caption.textContent = `Figura ${figureCounter}. Descripción de la figura.`;
        caption.contentEditable = "true";
        figureContainer.appendChild(caption);

        page.appendChild(figureContainer);
        
        // Setup interactivity (adds delete btn, reorder, etc)
        setupBlockInteractivity(figureContainer);

        // File Input Logic
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.style.display = "none";
        document.body.appendChild(input);

        placeholder.addEventListener("click", () => input.click());

        input.addEventListener("change", () => {
            const file = input.files && input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                const imgWrapper = document.createElement("div");
                imgWrapper.classList.add("figure-img-wrapper");
                imgWrapper.style.display = "inline-block";
                imgWrapper.style.position = "relative";
                imgWrapper.style.maxWidth = "80%";

                const img = document.createElement("img");
                img.src = ev.target.result;
                img.style.display = "block";
                img.style.width = "100%";
                img.style.height = "auto";
                img.style.borderRadius = "6px";

                imgWrapper.appendChild(img);

                const handle = document.createElement("div");
                handle.className = "resize-handle";
                handle.title = "Arrastra para redimensionar";
                imgWrapper.appendChild(handle);

                figureContainer.insertBefore(imgWrapper, caption);
                placeholder.remove();

                makeImageResizable(imgWrapper, img);

                figureCounter++;
                renumerarFiguras();
            };
            reader.readAsDataURL(file);
        });

        const observer = new MutationObserver((mutations) => {
            if (!document.body.contains(figureContainer)) {
                if (input && input.parentNode) input.parentNode.removeChild(input);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function insertFigureFromPaste(src, page) {
        const figureContainer = document.createElement("div");
        figureContainer.classList.add("figure-block", "placed-block");
        figureContainer.setAttribute("contenteditable", "false");

        const imgWrapper = document.createElement("div");
        imgWrapper.classList.add("figure-img-wrapper");
        imgWrapper.style.display = "inline-block";
        imgWrapper.style.position = "relative";
        imgWrapper.style.maxWidth = "80%";

        const img = document.createElement("img");
        img.src = src;
        img.style.display = "block";
        img.style.width = "100%";
        img.style.height = "auto";
        img.style.borderRadius = "6px";

        imgWrapper.appendChild(img);

        const handle = document.createElement("div");
        handle.className = "resize-handle";
        handle.title = "Arrastra para redimensionar";
        imgWrapper.appendChild(handle);

        const caption = document.createElement("div");
        caption.classList.add("figure-caption");
        caption.contentEditable = "true";
        caption.textContent = `Figura ${figureCounter}. Descripción de la figura.`;

        figureContainer.appendChild(imgWrapper);
        figureContainer.appendChild(caption);

        page.appendChild(figureContainer);
        
        setupBlockInteractivity(figureContainer);
        makeImageResizable(imgWrapper, img);

        figureCounter++;
        renumerarFiguras();
    }

    function makeImageResizable(wrapper, img) {
        wrapper.style.position = wrapper.style.position || "relative";
        let handle = wrapper.querySelector(".resize-handle");
        if (!handle) {
            handle = document.createElement("div");
            handle.className = "resize-handle";
            wrapper.appendChild(handle);
        }

        wrapper.style.maxWidth = wrapper.style.maxWidth || "80%";

        let startX, startY, startWidth;

        function onMouseDown(e) {
            e.preventDefault();
            startX = e.clientX;
            startY = e.clientY;
            startWidth = wrapper.getBoundingClientRect().width;
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        }

        function onMouseMove(e) {
            const dx = e.clientX - startX;
            let newWidth = startWidth + dx;
            const pageWidth = wrapper.closest(".page") ? wrapper.closest(".page").getBoundingClientRect().width : window.innerWidth;
            if (newWidth > pageWidth * 0.95) newWidth = pageWidth * 0.95;
            if (newWidth < 50) newWidth = 50;

            const parentWidth = wrapper.parentElement.getBoundingClientRect().width;
            const percent = (newWidth / parentWidth) * 100;
            wrapper.style.width = percent + "%";
            img.style.width = "100%";
            img.style.height = "auto";
        }

        function onMouseUp() {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        }

        handle.addEventListener("mousedown", onMouseDown);

        handle.addEventListener("touchstart", (e) => {
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            startWidth = wrapper.getBoundingClientRect().width;
            document.addEventListener("touchmove", onTouchMove);
            document.addEventListener("touchend", onTouchEnd);
        }, { passive: false });

        function onTouchMove(e) {
            if (e.touches.length !== 1) return;
            const dx = e.touches[0].clientX - startX;
            let newWidth = startWidth + dx;
            const pageWidth = wrapper.closest(".page") ? wrapper.closest(".page").getBoundingClientRect().width : window.innerWidth;
            if (newWidth > pageWidth * 0.95) newWidth = pageWidth * 0.95;
            if (newWidth < 50) newWidth = 50;
            const parentWidth = wrapper.parentElement.getBoundingClientRect().width;
            const percent = (newWidth / parentWidth) * 100;
            wrapper.style.width = percent + "%";
            img.style.width = "100%";
            img.style.height = "auto";
            e.preventDefault();
        }

        function onTouchEnd() {
            document.removeEventListener("touchmove", onTouchMove);
            document.removeEventListener("touchend", onTouchEnd);
        }
    }

    document.addEventListener('paste', function(e) {
      const editor = e.target.closest('.editor, .page');
      if (!editor) return;

      const clipboard = e.clipboardData || window.clipboardData;
      if (!clipboard) return;

      const items = clipboard.items || [];
      for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type && item.type.indexOf("image") !== -1) {
              e.preventDefault();
              const file = item.getAsFile();
              const reader = new FileReader();
              reader.onload = ev => {
                  const page = editor.classList.contains("page") ? editor : editor.querySelector(".page") || editor;
                  insertFigureFromPaste(ev.target.result, page);
              };
              reader.readAsDataURL(file);
              return;
          }
      }

      e.preventDefault();
      const text = clipboard.getData('text/plain');
      document.execCommand('insertText', false, text);
    });

    function initializeCounters() {
        const figuras = document.querySelectorAll(".figure-block");
        if (figuras.length > 0) {
            figureCounter = figuras.length + 1;
        } else {
            figureCounter = 1;
        }
    }
    initializeCounters();

    function updatePageNumbers() {
        const pages = pagesContainer.querySelectorAll(".page");
        pages.forEach((page, index) => {
            let numDiv = page.querySelector(".page-number");
            if (!numDiv) {
                numDiv = document.createElement("div");
                numDiv.className = "page-number";
                page.appendChild(numDiv);
            }
            numDiv.textContent = index + 1;
        });
    }
    updatePageNumbers();

    // ====================================================================
    // ====== TOOLBAR FUNCTIONALITY =======================================
    // ====================================================================

    const btnBold = document.getElementById("btnBold");
    const btnItalic = document.getElementById("btnItalic");
    const btnUnderline = document.getElementById("btnUnderline");
    const btnAlignLeft = document.getElementById("btnAlignLeft");
    const btnAlignCenter = document.getElementById("btnAlignCenter");
    const btnAlignRight = document.getElementById("btnAlignRight");
    const btnAlignJustify = document.getElementById("btnAlignJustify");
    const btnOrderedList = document.getElementById("btnOrderedList");
    const btnUnorderedList = document.getElementById("btnUnorderedList");

    function execCmd(command) {
        document.execCommand(command, false, null);
    }

    if (btnBold) btnBold.addEventListener("click", () => execCmd("bold"));
    if (btnItalic) btnItalic.addEventListener("click", () => execCmd("italic"));
    if (btnUnderline) btnUnderline.addEventListener("click", () => execCmd("underline"));

    if (btnAlignLeft) btnAlignLeft.addEventListener("click", () => execCmd("justifyLeft"));
    if (btnAlignCenter) btnAlignCenter.addEventListener("click", () => execCmd("justifyCenter"));
    if (btnAlignRight) btnAlignRight.addEventListener("click", () => execCmd("justifyRight"));
    if (btnAlignJustify) btnAlignJustify.addEventListener("click", () => execCmd("justifyFull"));

    function execCmdInParagraph(command) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const block = range.commonAncestorContainer.nodeType === 1 
            ? range.commonAncestorContainer.closest('.placed-block') 
            : range.commonAncestorContainer.parentElement.closest('.placed-block');

        if (block && block.id === 'paragraph') {
            document.execCommand(command, false, null);
        }
    }

    if (btnOrderedList) btnOrderedList.addEventListener("click", () => execCmdInParagraph("insertOrderedList"));
    if (btnUnorderedList) btnUnorderedList.addEventListener("click", () => execCmdInParagraph("insertUnorderedList"));

    // ====================================================================
    // ====== SAVE / OPEN PROJECT FUNCTIONALITY ===========================
    // ====================================================================

    const btnSave = document.getElementById("btnSave");
    const btnOpen = document.getElementById("btnOpen");
    const fileInput = document.getElementById("fileInput");
    const filenameInput = document.getElementById("filenameInput");

    if (filenameInput) {
        filenameInput.addEventListener("input", (e) => {
            document.title = e.target.value || "Editor Online";
        });
    }

    if (btnSave) {
        btnSave.addEventListener("click", () => {
            const content = pagesContainer.innerHTML;
            const blob = new Blob([content], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            
            const filename = filenameInput && filenameInput.value.trim() !== "" 
                ? filenameInput.value 
                : "proyecto_editor";

            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    if (btnOpen) {
        btnOpen.addEventListener("click", () => {
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (filenameInput) {
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                filenameInput.value = nameWithoutExt;
                document.title = nameWithoutExt;
            }

            const reader = new FileReader();
            reader.onload = (ev) => {
                const content = ev.target.result;
                pagesContainer.innerHTML = content;
                rehydrateContent();
                fileInput.value = "";
            };
            reader.readAsText(file);
        });
    }

    // --- REHYDRATE (Re-attach listeners after loading) ---
    function rehydrateContent() {
        // 1. Re-attach page interactivity
        const pages = pagesContainer.querySelectorAll(".page");
        pages.forEach(page => {
            makePageInteractive(page);
        });

        // 2. Re-attach block interactivity
        const placedBlocks = pagesContainer.querySelectorAll(".placed-block");
        placedBlocks.forEach(block => {
            // MIGRATION: Convert old structure to new structure
            if (block.contentEditable === "true" && block.id !== "image") {
                block.contentEditable = "false";
                
                const contentDiv = document.createElement("div");
                contentDiv.classList.add("block-content");
                contentDiv.contentEditable = "true";
                
                // Remove old delete button if present (will be re-added by setupBlockInteractivity)
                let existingBtn = block.querySelector(".delete-block-btn");
                if (existingBtn) existingBtn.remove();
                
                // Move remaining content
                while (block.firstChild) {
                    contentDiv.appendChild(block.firstChild);
                }
                
                block.appendChild(contentDiv);
            }

            // Centralized setup
            setupBlockInteractivity(block);
        });

        // 3. Recalculate figure counter
        // 3. Recalculate figure counter
        initializeCounters();
        updatePageNumbers();
    }

});