import { BACKEND_PORT } from './config.js';
import { loadPage, isValidEmail, isValidName, initPost } from './helpers.js';
import { errorOrSuccessPopup } from './popup.js';

//////////////////////////////
///// 2.1.2 Registration /////
//////////////////////////////

const regoForm = document.forms.rego_form;

document.getElementById("btn-signin").addEventListener("click", (event) => {
    event.preventDefault();
    loadPage("login-screen");
});

// Register account
document.getElementById("btn-register").addEventListener("click", (event) => {
    event.preventDefault();

    let regoEmail = regoForm.rego_email.value;
    let regoName = regoForm.rego_name.value;
    let regoPw = regoForm.rego_pw.value;
    let regoConfirmPw = regoForm.rego_confirm_pw.value;

    if (!isValidEmail(regoEmail)) {
        errorOrSuccessPopup("Please enter a valid email.", false);
        return;
    }

    if (!isValidName(regoName)) {
        errorOrSuccessPopup("Please enter a valid name. Names must contain only letters and spaces.", false);
        return;
    }

    if (!regoPw) {
        errorOrSuccessPopup("Please enter a password.", false)
        return;
    }

    if (regoPw !== regoConfirmPw) {
        errorOrSuccessPopup("Please ensure passwords match.", false)
        return;
    }

    const requestBody = {
        "email": regoEmail,
        "password": regoPw,
        "name": regoName
    }
    fetch(`http://localhost:${BACKEND_PORT}/auth/register`, initPost(requestBody))
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                errorOrSuccessPopup("Email address already taken. Please enter a different email.", false);
            } else {
                errorOrSuccessPopup("Registration successful! Please log in.", true);
                // Load login after successful registration
                loadPage("login-screen");
            }
        });
});
