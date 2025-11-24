<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <!-- <meta name="viewport" content="width=device-width, initial-scale=1.0"> -->
    <link rel="stylesheet" href="./style.css">
    <link rel="stylesheet" href="./styleBlocks.css">
    <link rel="stylesheet" href="./stylePrint.css">

    <link rel="shortcut icon" href="./src/img/favicon.ico" type="image/x-icon">
    <title>Editor Online</title>
</head>

<body>

    <div class="container">
        <!-- Herramientas -->
        <div class="toolsTop">
            <div class="title">
                <img src="./src/icons/reader.svg">
                <h3>Editor online</h3>
            </div>
            <div class="toolbar">
                <input type="text" id="filenameInput" placeholder="Nombre del archivo" value="Documento sin título">
                <span class="separator">|</span>
                <button id="btnBold" title="Negrita"><b>B</b></button>
                <button id="btnItalic" title="Cursiva"><i>I</i></button>
                <button id="btnUnderline" title="Subrayado"><u>U</u></button>
                <button id="btnLink" title="Insertar Enlace">A</button>
                <span class="separator">|</span>
                <button id="btnAlignLeft" title="Alinear Izquierda">Izq</button>
                <button id="btnAlignCenter" title="Alinear Centro">Cent</button>
                <button id="btnAlignRight" title="Alinear Derecha">Der</button>
                <button id="btnAlignJustify" title="Justificar">Just</button>
                <span class="separator">|</span>
                <button id="btnOrderedList" title="Lista Numerada">1</button>
                <button id="btnUnorderedList" title="Viñetas">•</button>
                <span class="separator">|</span>
                <button id="btnSpellcheck" title="Corrector Ortográfico (Español)" style="width: auto; padding: 5px 10px;">ABC ✓</button>
            </div>
            <div class="copy">
                <p>//DevEstrada</p>
                <p>v1.1</p>
            </div>
        </div>

        <!-- Herramientas laterales | Bloques-->
        <div class="toolsGeneral">
            <h3>Bloques</h3>

            <div class="blocks">
                <div class="block" id="titleHeader">
                    <span>Encabezado</span>
                </div>
                <div class="block" id="title">
                    <span>Título</span>
                </div>
                <div class="block" id="subtitle">
                    <span>Subtítulo</span>
                </div>
                <div class="block" id="paragraph">
                    <span>Párrafo</span>
                </div>
                <div class="block" id="code">
                    <span>Código</span>
                </div>
                <div class="block" id="image">
                    <span>Imagen</span>
                </div>

                <div class="block" id="note">
                    <img src="./src/icons/create.svg">
                    <span>Nota</span>
                </div>

                <div class="block" id="warning">
                    <img src="./src/icons/warning.svg">
                    <span>Advertencia</span>
                </div>

            </div>

            <span class="separator"><span></span></span>

            <div class="actions">
                <button id="btnSave" class="btnAction"><img src="./src/icons/save.svg"><span>Guardar</span></button>
                <button id="btnOpen" class="btnAction"><img src="./src/icons/file.svg"><span>Abrir</span></button>
                <input type="file" id="fileInput" accept=".html" style="display: none;">
            </div>

            <button onclick="window.print()" class="btnExportar"><img src="./src/icons/doc.svg"><span>Exportar a PDF</span></button>

        </div>

        <!-- Editor -->
        <div class="editor">
            <div class="addBtn top">
                <button id="addPageTop"><img src="./src/icons/addCircle.svg"><span></span></button>
            </div>

            <div id="pagesContainer">
                <div class="page" id="documento"></div>
            </div>

            <div class="addBtn bottom">
                <button id="addPageBottom"><img src="./src/icons/addCircle.svg"><span></span></button>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="./app.js"></script>
</body>

</html>