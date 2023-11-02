import { BACKEND_PORT } from './config.js';
import { loadPage, initPost } from './helpers.js';
import { errorOrSuccessPopup } from './popup.js';
import { showFeedStart } from './mainPage.js';

////////////////////////
///// 2.1.1 Login //////
////////////////////////

const loginForm = document.forms.login_form;

document.getElementById("btn-join").addEventListener("click", (event) => {
	event.preventDefault();
	loadPage("rego-screen");
})

document.getElementById("btn-login").addEventListener("click", (event) => {
	event.preventDefault();
	const loginEmail = loginForm.login_email.value;
	const loginPw = loginForm.login_pw.value;

	const requestBody = {
		"email": loginEmail,
		"password": loginPw
	}
	fetch(`http://localhost:${BACKEND_PORT}/auth/login`, initPost(requestBody))
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				errorOrSuccessPopup("Please enter a valid email or password.", false);
			}
			else {
				localStorage.setItem("token", data.token);
				localStorage.setItem("authID", JSON.stringify(data.userId));
				// Load main page after login
				showFeedStart();
			}
		});
});
