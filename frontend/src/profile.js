import { BACKEND_PORT } from './config.js';
import { fileToDataUrl, loadPage, isValidEmail, isValidName, fetchGetUserData, createInputDom } from './helpers.js';
import { showPopup, makePopupHeader, errorOrSuccessPopup } from './popup.js';
import { createJobContent } from './mainPage.js';
import { updateJob, deleteJob } from './jobs.js';

////////////////////////////////////////
///// 2.4.1 Viewing Other Profiles /////
////////////////////////////////////////

export function loadProfileScreen(userId) {
	fetchGetUserData(userId).then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			if (parseInt(userId) === JSON.parse(localStorage.getItem("authID"))) {
				generateProfile(data, true);
			} else {
				generateProfile(data, false);
			}
		}
	}).catch(() => {
		errorOrSuccessPopup("You are offline, please connect to Internet and refresh.", false);
	})
}

/**
 * Generates a user profile including their profile picture, email, watchers,
 * watch button and posted jobs 
 * @param {data} userData
 * @param {Boolean} if isOwnProfile, update profile, create new job and update and
 * delete job buttons also appear 
 */
function generateProfile(userData, isOwnProfile) {
	loadPage("profile-page");

	const updateProfileDiv = document.getElementById("update-profile-div");
	if (isOwnProfile) updateProfileDiv.style.display = "";
	else updateProfileDiv.style.display = "none";

	document.getElementById("profile-name").innerText = userData.name;
	document.getElementById("profile-email").innerText = userData.email;

	let profileImg = document.getElementById("profile-img");
	// BONUS: Sets a default image if no inputted user image
	if (userData.image === undefined) {
		profileImg.src = "images/defaultprofile.jpg";
	}
	else {
		profileImg.src = userData.image;
	}

	// Removes previous page load number of watchers 
	let profileInfo = document.getElementById("profile-info");
	let numWatchers = document.getElementById("profile-num-watchers");
	profileInfo.removeChild(numWatchers);

	// Creates clickable number of watchers
	let newNumWatchers = document.createElement("span");
	newNumWatchers.setAttribute("class", "watchers-span hover-underline");
	newNumWatchers.setAttribute("id", "profile-num-watchers");
	newNumWatchers.innerText = `${userData.watcheeUserIds.length} watcher(s)`;
	// Opens a popup with a list of watchers when clicked
	newNumWatchers.addEventListener("click", () => displayWatchers(userData.watcheeUserIds));
	profileInfo.appendChild(newNumWatchers);

	// Removes previous page load watch button
	let watchButton = document.getElementById("watch-button");
	if (watchButton !== null) {
		profileInfo.removeChild(watchButton);
	}

	// Add button to watch/unwatch
	let newWatchButton = document.createElement("button");
	newWatchButton.setAttribute("id", "watch-button");
	// Checks if user is currently watching and creates watch button accordingly
	const isWatched = userData.watcheeUserIds.some((watcher) => watcher === JSON.parse(localStorage.getItem("authID")));
	if (isWatched) {
		newWatchButton.innerText = "✔️ Watching";
		newWatchButton.setAttribute("watching", "")
	}
	else {
		newWatchButton.innerText = "➕ Watch";
		newWatchButton.removeAttribute("watching")
	}
	newWatchButton.addEventListener("click", () => watchUser(userData.email, "watch-button"));
	profileInfo.appendChild(newWatchButton);

	// Create a new job button
	if (isOwnProfile) {
		document.getElementById("create-job-container").style.display = "block";
	} else {
		document.getElementById("create-job-container").style.display = "None";
	}

	// Generates jobs
	// Removes previous load job postings first
	Array.from(document.getElementsByClassName("job-post")).forEach((jobPost) => {
		jobPost.remove();
	});

	// Loops through all jobs posted by user and creates a new job content post 
	// for each, containing an image, title, starting date and description
	userData.jobs.forEach((jobPost) => {
		const jobContainer = document.createElement("div");
		jobContainer.setAttribute("class", "job-post");

		// DOM for update and delete job buttons
		if (isOwnProfile) {
			const editJobButtonsFather = document.createElement("div");
			editJobButtonsFather.setAttribute("class", "edit-job-buttons-father");
			const editJobButtons = document.createElement("div");
			editJobButtons.setAttribute("class", "edit-job-buttons");

			const jobUpdateBtn = document.createElement("button");
			jobUpdateBtn.setAttribute("class", "small-media-button");
			jobUpdateBtn.innerText = "Update";
			// Update job popup
			jobUpdateBtn.addEventListener("click", () => updateJob(jobPost));

			const jobDeleteBtn = document.createElement("button");
			jobDeleteBtn.setAttribute("class", "small-media-button");
			jobDeleteBtn.innerText = "Delete";
			// Delete job popup
			jobDeleteBtn.addEventListener("click", () => deleteJob(jobPost.id));

			editJobButtons.appendChild(jobUpdateBtn);
			editJobButtons.appendChild(jobDeleteBtn);
			editJobButtonsFather.appendChild(editJobButtons);
			jobContainer.appendChild(editJobButtonsFather);
		}
		const jobContent = createJobContent(jobPost);
		jobContainer.appendChild(jobContent);

		document.getElementById("profile-page").appendChild(jobContainer);
	});
}

// Show watchers popup
function displayWatchers(watcheeIds) {
	const popupContent = showPopup();
	popupContent.appendChild(makePopupHeader("Watchers ", "fa-solid fa-eye"));

	for (const id of watcheeIds) {
		const user = document.createElement("span");
		user.setAttribute("class", "watcher hover-underline");
		// Each name links to their profile
		user.addEventListener("click", () => {
			loadProfileScreen(id);
			document.getElementById("generic-popup").style.display = "None";
		});
		fetchGetUserData(id).then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				user.innerText = data.name;
			}
		})
		popupContent.appendChild(user);
	}
}

////////////////////////////////////////
///// 2.4.3 Updating your profile  /////
////////////////////////////////////////

/**
 * On click, creates a popup with name, profile picture, email, password and 
 * confirm password inputs.
 */
const updateProfileBtn = document.getElementById("update-profile-btn");
updateProfileBtn.addEventListener("click", () => {
	const popupContent = showPopup();
	popupContent.appendChild(makePopupHeader("Update Profile ", "fa-solid fa-user"));

	const inputDiv = document.createElement("div");
	inputDiv.setAttribute("class", "popup-input-content");

	inputDiv.appendChild(createInputDom("update-profile-name", "Name"));
	// fileToDataUrl function only takes png and jpg
	inputDiv.appendChild(createInputDom("update-profile-picture", undefined, "file", "image/png, image/jpeg"));
	inputDiv.appendChild(createInputDom("update-profile-email", "Email"));
	inputDiv.appendChild(createInputDom("update-profile-password", "Password", "password"));
	inputDiv.appendChild(createInputDom("update-profile-confirm-password", "Confirm password", "password"));

	let updateProfileSubmitButton = document.createElement("button");
	updateProfileSubmitButton.innerText = "Submit";
	updateProfileSubmitButton.setAttribute("class", "btn-submit");
	inputDiv.appendChild(updateProfileSubmitButton);
	updateProfileSubmitButton.addEventListener("click", setUpdateProfileSubmitButton);

	popupContent.appendChild(inputDiv);

	// Pre-fills name and email inputs for user convenience
	fetchGetUserData(JSON.parse(localStorage.getItem("authID"))).then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			document.getElementById("update-profile-name").value = data.name;
			document.getElementById("update-profile-email").value = data.email;
		}
	})
});

function fetchPutUserData(requestBody) {
	fetch(`http://localhost:${BACKEND_PORT}/user`, {
		method: "PUT",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': localStorage.getItem("token")
		},
		body: JSON.stringify(requestBody)
	})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				// Close popup
				document.getElementById("generic-popup").style.display = "None";
				const popupContent = showPopup();
				let popupHeader = makePopupHeader("Profile update successful ", "fa-solid fa-check");
				popupHeader.style.color = "green";
				popupContent.appendChild(popupHeader);
			}
		})
}

function setUpdateProfileSubmitButton() {
	const name = document.getElementById("update-profile-name").value;
	const imgFile = document.querySelector("#update-profile-picture").files[0];
	const email = document.getElementById("update-profile-email").value;
	const password = document.getElementById("update-profile-password").value;
	const confirmPassword = document.getElementById("update-profile-confirm-password").value;

	if (!isValidEmail(email)) {
        errorOrSuccessPopup("Please enter a valid email.", false);
        return;
    }

    if (!isValidName(name)) {
        errorOrSuccessPopup("Please enter a valid name. Names must contain only letters and spaces.", false);
        return;
    }

	// Check passwords are the same
	if (password !== confirmPassword) {
		errorOrSuccessPopup("Please ensure passwords match.", false);
		return;
	}

	let requestBody = {
		"name": name,
		"password": password
	};

	fetchGetUserData(JSON.parse(localStorage.getItem("authID"))).then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			if (email !== data.email) {
				fetchPutUserData({ "email": email });
			}
		}
	});

	if (imgFile) {
		fileToDataUrl(imgFile).then((img) => {
			Object.assign(requestBody, { "image": img });
			fetchPutUserData(requestBody);
		});
	}
	else {
		fetchPutUserData(requestBody);
	}
}

////////////////////////////////////////
///// 2.4.4 Watching/Unwatching  ///////
////////////////////////////////////////

// Watch Button
function watchUserFetchPut(requestBody) {
	return fetch(`http://localhost:${BACKEND_PORT}/user/watch`, {
		method: "PUT",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': localStorage.getItem("token")
		},
		body: JSON.stringify(requestBody)
	})
		.then(response => response.json());
}


function watchUser(email, buttonId) {
	const watchButton = document.getElementById(buttonId);
	const isWatched = watchButton.hasAttribute("watching");
	const requestBody = {
		"email": email,
		"turnon": !isWatched
	}

	watchUserFetchPut(requestBody).then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			if (isWatched) {
				watchButton.removeAttribute("watching");
				watchButton.innerText = "➕ Watch";
			}
			else {
				watchButton.setAttribute("watching", "");
				watchButton.innerText = "✔️ Watching";
			}
		}
	})
}

// Button to watch by entering email address
const watchEmailButton = document.getElementById("watch-email-button");
const watchEmailInput = document.getElementById("watch-email-input");

watchEmailButton.addEventListener("click", () => {
	watchEmailInput.style.display === "inline" ? watchEmailInput.style.display = "none" :
		watchEmailInput.style.display = "inline";
});

watchEmailInput.addEventListener("keydown", (e) => {
	if (e.key === "Enter") {
		const requestBody = {
			"email": watchEmailInput.value,
			"turnon": true
		}
		watchUserFetchPut(requestBody).then(data => {
			if (data.error) {
				errorOrSuccessPopup("Please ensure inputted email belongs to an account.", false);
			}
			else {
				errorOrSuccessPopup(`Now watching ${watchEmailInput.value}!`, true);
				watchEmailInput.value = "";
			}
		}).catch(() => {
			errorOrSuccessPopup("You are offline, please connect to Internet and refresh.", false);
		});
	}
});
