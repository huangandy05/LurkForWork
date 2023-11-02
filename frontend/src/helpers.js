import { BACKEND_PORT } from './config.js';

/**
 * Given a js file object representing a jpg or png image, such as one taken
 * from a html file input element, return a promise which resolves to the file
 * data as a data url.
 * More info:
 *   https://developer.mozilla.org/en-US/docs/Web/API/File
 *   https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 * 
 * Example Usage:
 *   const file = document.querySelector('input[type="file"]').files[0];
 *   console.log(fileToDataUrl(file));
 * @param {File} file The file to be read.
 * @return {Promise<string>} Promise which resolves to the file as a data url.
 */
export function fileToDataUrl(file) {
    const validFileTypes = ['image/jpeg', 'image/png', 'image/jpg']
    const valid = validFileTypes.find(type => type === file.type);
    // Bad data, let's walk away.
    if (!valid) {
        throw Error('provided file is not a png, jpg or jpeg image.');
    }

    const reader = new FileReader();
    const dataUrlPromise = new Promise((resolve, reject) => {
        reader.onerror = reject;
        reader.onload = () => resolve(reader.result);
    });
    reader.readAsDataURL(file);
    return dataUrlPromise;
}

// Input the page id from html and hide all other pages
export function loadPage(pageId) {
    Array.from(document.getElementsByClassName("page")).forEach(page => {
        page.style.display = "none";
    });
    if (pageId === "main-page") {
        document.getElementById("nav-home-button").style.color = "rgb(102, 52, 127)";
    }
    else {
        document.getElementById("nav-home-button").style.color = "var(--color-text)";
    }
    if (pageId === "profile-page") {
        document.getElementById("nav-profile-button").style.color = "rgb(102, 52, 127)";
    }
    else {
        document.getElementById("nav-profile-button").style.color = "var(--color-text)";
    }

    const navBar = document.getElementById("nav");
    const logoSpan = document.getElementById("login-logo-span");
    // Do not display nav bar for login and registration screens
    if (pageId === "login-screen" || pageId === "rego-screen") {
        navBar.style.display = "none";
        logoSpan.style.display = "block";
    }
    else {
        navBar.style.display = "";
        logoSpan.style.display = "none";
    }
    document.getElementById(pageId).style.display = "";
}

export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function isValidName(name) {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name);
}

export function initPost(requestBody) {
    return {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    }
}

export function fetchGetUserData(user) {
    return fetch(`http://localhost:${BACKEND_PORT}/user?userId=${user}`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem("token")
        }
    })
        .then(response => response.json())
}

export function createInputDom(inputId, inputPlaceholder, inputType, inputAccept) {
    const newInput = document.createElement("input");
    newInput.setAttribute("id", inputId);
    newInput.setAttribute("placeholder", inputPlaceholder);
    newInput.setAttribute("type", inputType);
    newInput.setAttribute("accept", inputAccept);
    return newInput;
}
