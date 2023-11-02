import { showFeedStart } from './mainPage.js';
import { loadProfileScreen } from './profile.js';
import { errorOrSuccessPopup } from './popup.js';
import { loadPage, fetchGetUserData } from './helpers.js';

// Global variables
let colorMode = true;

// Opens initial page in login screen
loadPage("login-screen");

// Initialise nav bar buttons
document.getElementById("nav-logo-span").addEventListener("click", () => {
	showFeedStart();
});
document.getElementById("nav-home-button").addEventListener("click", () => {
	showFeedStart();
});
document.getElementById("nav-profile-button").addEventListener("click", () => {
	loadProfileScreen(JSON.parse(localStorage.getItem("authID")));
});

///////////////////////////////////////////
///// 2.7.2 Fragment based URL routing/////
///////////////////////////////////////////

function handleHashChange() {
	// get the hash fragment from the URL
	const hash = window.location.hash;
	// remove the #
	const route = hash.slice(1);
	if (route === 'feed') {
		showFeedStart();
	}
	else if (route.slice(0, 8) === 'profile=') {
		// BONUS error popups on invalid hash inputs
		if (localStorage.getItem("token") !== "null") {
			const userId = route.split("=")[1];
			fetchGetUserData(userId).then(data => {
				if (data.error) {
					errorOrSuccessPopup("Please input a valid user id in the url", false);
				} else {
					loadProfileScreen(userId);
				}
			})
		}
		else {
			errorOrSuccessPopup("Please log in to view profiles", false);
		}
	}
	else if (route === 'register') {
		logout()
		loadPage("rego-screen");
	}
	else if (route === 'login' || route === '') {
		logout()
		loadPage("login-screen");
	}
}

window.addEventListener('hashchange', (event) => {
	event.preventDefault();
	handleHashChange();
});

// call the handleHashChange function once to handle the initial route
handleHashChange();

///////////////////////////////////////////
///// Bonus //////////////////////////////
///////////////////////////////////////////

// Logout button
function logout() {
	document.forms.login_form.login_email.value = "";
	document.forms.login_form.login_pw.value = "";
	localStorage.setItem("token", JSON.stringify(null));
	localStorage.setItem("authID", JSON.stringify(null));
	document.getElementById("generic-popup").style.display = "none";
}

const logoutButton = document.getElementById("nav-logout");
logoutButton.addEventListener("click", () => {
    logout();
    loadPage("login-screen");
});

// Dark mode
const toggleDarkButton = document.getElementById("nav-toggle-dark");

toggleDarkButton.addEventListener("click", () => {
	document.documentElement.classList.toggle("dark-mode")
	if (colorMode === true) {
		document.getElementById("dark-mode-sun").style.display = "inline-block";
		document.getElementById("dark-mode-moon").style.display = "none";
		colorMode = false;
	}
	else {
		document.getElementById("dark-mode-sun").style.display = "none";
		document.getElementById("dark-mode-moon").style.display = "inline-block";
		colorMode = true;
	}
});
