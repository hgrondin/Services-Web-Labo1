let contentScrollPosition = 0;
Init_UI();
let selectedCategory = "";

function Init_UI() {
    renderBookmarks();
    $('#createBookmark').on("click", async function () {
        saveContentScrollPosition();
        renderCreateBookmarkForm();
    });
    $('#abort').on("click", async function () {
        renderBookmarks();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
}
function renderAbout() {
    saveContentScrollPosition();
    eraseContent();
    $("#createBookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de favoris</h2>
                <hr>
                <p>
                    Application de gestion de favoris pour le laboratoire 1 du cours de Services Web.
                </p>
                <p>
                    Auteur: Henri Grondin
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2024
                </p>
            </div>
        `))
}
async function renderBookmarks() {
    let categories = [];
    showWaitingGif();
    $("#actionTitle").text("Liste des favoris");
    $("#createBookmark").show();
    $("#abort").hide();
    let bookmarks = await API_GetBookmarks();
    eraseContent();
    if (bookmarks !== null) {
        bookmarks.forEach(bookmark => {
            if (!categories.includes(bookmark.Category)){
                categories.push(bookmark.Category);
            }
            if (selectedCategory === "" || selectedCategory === bookmark.Category){
                $("#content").append(renderBookmark(bookmark));
            }
        });
        restoreContentScrollPosition();
        // Attached click events on command icons
        $(".editCmd").on("click", function () {
            saveContentScrollPosition();
            renderEditBookmarkForm(parseInt($(this).attr("editBookmarkId")));
        });
        $(".deleteCmd").on("click", function () {
            saveContentScrollPosition();
            renderDeleteBookmarkForm(parseInt($(this).attr("deleteBookmarkId")));
        });
        updateDropDownMenu(categories);
    } else {
        renderError("Service introuvable");
    }
}
function showWaitingGif() {
    $("#content").empty();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
function renderError(message) {
    eraseContent();
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}
function renderCreateBookmarkForm() {
    renderBookmarkForm();
}
async function renderEditBookmarkForm(id) {
    showWaitingGif();
    let bookmark = await API_GetBookmark(id);
    if (bookmark !== null)
        renderBookmarkForm(bookmark);
    else
        renderError("Favori introuvable!");
}
async function renderDeleteBookmarkForm(id) {
    showWaitingGif();
    $("#createBookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("Retrait");
    let bookmark = await API_GetBookmark(id);
    eraseContent();
    if (bookmark !== null) {
        $("#content").append(`
        <div class="bookmarkDeleteForm">
            <h4>Effacer le favori suivant?</h4>
            <br>
            
            <div class="bookmarkContainer noselect">
                <div class="bookmarkLayout">
                    <div>
                        <a href="${bookmark.Url}" target="_blank"><img src=${getFavicon(bookmark.Url)} style="width: 28px; margin-top: -5px; margin-right: 5px;"/></a>
                        <span class="bookmarkTitle">${bookmark.Title}</span>
                    </div>
                    <span class="bookmarkCategory">${bookmark.Category}</span>
                </div>
            </div>
                <br>
            
                <input type="button" value="Effacer" id="deleteBookmark" class="btn btn-primary">
                <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
        $('#deleteBookmark').on("click", async function () {
            showWaitingGif();
            let result = await API_DeleteBookmark(bookmark.Id);
            if (result)
                renderBookmarks();
            else
                renderError("Une erreur est survenue!");
        });
        $('#cancel').on("click", function () {
            renderBookmarks();
        });
    } else {
        renderError("Favori introuvable!");
    }
}
function newBookmark() {
    bookmark = {};
    bookmark.Id = 0;
    bookmark.Title = "";
    bookmark.Url = "";
    bookmark.Category = "";
    return bookmark;
}
function renderBookmarkForm(bookmark = null) {
    $("#createBookmark").hide();
    $("#abort").show();
    eraseContent();
    let create = bookmark == null;
    if (create) bookmark = newBookmark();
    $("#actionTitle").text(create ? "Création" : "Modification");
    let siteFavicon = create ? `<img src="bookmark-logo.svg" class="appLogoForm" alt=""/>` : 
                                `<a href="${bookmark.Url}" target="_blank"><img src="${getFavicon(bookmark.Url)}" class="appLogoForm" alt=""/></a>`;
    $("#content").append(`
        <form class="form" id="bookmarkForm">
            ${siteFavicon}

            <input type="hidden" name="Id" value="${bookmark.Id}"/>

            <label for="Title" class="form-label" style="font-weight: bold;">Titre </label>
            <input 
                class="form-control Alpha"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal" 
                value="${bookmark.Title}"
            />
            <label for="Url" class="form-label" style="font-weight: bold;">Url </label>
            <input
                class="form-control Url"
                name="Url"
                id="Url"
                placeholder="Url"
                required
                RequireMessage="Veuillez entrer un Url" 
                InvalidMessage="Veuillez entrer un Url valide"
                value="${bookmark.Url}" 
            />
            <label for="Category" class="form-label" style="font-weight: bold;">Catégorie </label>
            <input 
                class="form-control Category"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                RequireMessage="Veuillez entrer une catégorie" 
                InvalidMessage="Veuillez entrer une catégorie valide"
                value="${bookmark.Category}"
            />
            <hr>
            <input type="submit" value="Enregistrer" id="saveBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initFormValidation();
    $('#bookmarkForm').on("submit", async function (event) {
        event.preventDefault();
        let bookmark = getFormData($("#bookmarkForm"));
        bookmark.Id = parseInt(bookmark.Id);
        showWaitingGif();
        let result = await API_SaveBookmark(bookmark, create);
        if (result)
            renderBookmarks();
        else
            renderError("Une erreur est survenue!");
    });
    $('#cancel').on("click", function () {
        renderBookmarks();
    });
}
function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}
function renderBookmark(bookmark) {
    return $(`
     <div class="bookmarkRow" bookmark_id=${bookmark.Id}">
        <div class="bookmarkContainer noselect">
            <div class="bookmarkLayout">
                <div>
                    <a href="${bookmark.Url}" target="_blank"><img src=${getFavicon(bookmark.Url)} style="width: 28px; margin-top: -5px; margin-right: 5px;"/></a>
                    <span class="bookmarkTitle">${bookmark.Title}</span>
                </div>
                <span class="bookmarkCategory">${bookmark.Category}</span>
            </div>
            <div class="bookmarkCommandPanel">
                <span class="editCmd cmdIcon fa fa-pencil" editBookmarkId="${bookmark.Id}" title="Modifier ${bookmark.Title}"></span>
                <span class="deleteCmd cmdIcon fa fa-trash" deleteBookmarkId="${bookmark.Id}" title="Effacer ${bookmark.Title}"></span>
            </div>
        </div>
    </div>           
    `);
}
function updateDropDownMenu(categories) {
    let DDMenu = $("#DDMenu");
    let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
    DDMenu.empty();
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
        <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
        `));
    DDMenu.append($(`<div class="dropdown-divider"></div>`));
    categories.forEach(category => {
        selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout category" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
            </div>
        `));
    })
    DDMenu.append($(`<div class="dropdown-divider"></div> `));
    DDMenu.append($(`
            <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
            </div>
        `));
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
    $('#allCatCmd').on("click", function () {
        selectedCategory = "";
        renderBookmarks();
    });
    $('.category').on("click", function () {
        selectedCategory = $(this).text().trim();
        renderBookmarks();
    });
}
function getFavicon(url){
    return `http://www.google.com/s2/favicons?sz=64&domain=${url}`;
}