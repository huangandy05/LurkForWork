//////////////////////////////
///// 2.1.3 Error Popup //////
//////////////////////////////

// Create a generic popup
// Returns the popup content to append children to
export function showPopup() {
    const popup = document.getElementById("generic-popup");
    const popupContent = document.getElementById("generic-popup-content");
    const closePopupSpan = document.getElementById("generic-close-span");

    // Hide the popup when closed
    closePopupSpan.addEventListener('click', () => {
        popup.style.display = "None";
    });

    // Clear previous text from popup
    while (popupContent.childNodes.length > 2) {
        popupContent.removeChild(popupContent.lastChild);
    }
    popup.style.display = "block";
    return popupContent;
}

// Used for simple one line popups
// Returns an h3 element and an icon if requested
export function makePopupHeader(headerText, headerIconClass) {
    const popupHeader = document.createElement("h3");
    popupHeader.innerText = headerText;
    if (headerIconClass) {
        const popupHeaderIcon = document.createElement("i");
        popupHeaderIcon.setAttribute("class", headerIconClass);
        popupHeader.appendChild(popupHeaderIcon);
    }
    return popupHeader;
}

// Creates either an error or success popup with inputted message as text
export function errorOrSuccessPopup(message, success) {
    const popupContent = showPopup();
    const popupHeader = document.createElement("h3");
    const popupHeaderIcon = document.createElement("i");

    if (success) {
        popupHeader.innerText = "SUCCESS!";
        popupHeaderIcon.setAttribute("class", "fa-solid fa-check");
        popupHeader.style.color = "green";
    }
    else {
        popupHeader.innerText = "ERROR!";
        popupHeaderIcon.setAttribute("class", "fa-solid fa-triangle-exclamation");
        popupHeader.style.color = "rgb(155, 10, 10)";
    }
    popupContent.appendChild(popupHeader);
    popupContent.appendChild(popupHeaderIcon);
    const popupMessage = document.createElement("span");
    popupMessage.innerText = ` ${message}`;

    popupContent.appendChild(popupMessage);
}
