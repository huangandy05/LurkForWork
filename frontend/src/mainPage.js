import { BACKEND_PORT } from './config.js';
import { loadPage, fetchGetUserData } from './helpers.js';
import { showPopup, makePopupHeader, errorOrSuccessPopup } from './popup.js';
import { loadProfileScreen } from './profile.js';

// Set in localstorage to use across js files
localStorage.setItem("token", JSON.stringify(null));
localStorage.setItem("authID", JSON.stringify(null));

// Global Variables
let startIndex = 0;
let loading = false;
let allowNotifs = false;
let currPostIds = [];
let disconnected = false;
let cached = false;

//////////////////////////////
///// 2.2.1 Basic Feed ///////
//////////////////////////////

export function showFeedStart() {
	// Whenever feed is accessed, reset watchEmail input to hidden and empty
	const watchEmailInput = document.getElementById("watch-email-input");
	watchEmailInput.style.display = "none";
	watchEmailInput.value = "";

	// If offline, then show latest cached feed
	if (disconnected) {
		if (document.getElementById("main-page").style.display !== "none") {
			cached = true;
		}
		showFeed(0);
		return;
	}

	// Remove previous job posts
	Array.from(document.getElementsByClassName("job-post")).forEach((jobPost) => {
		jobPost.remove();
	});

	startIndex = 0;
	showFeed(startIndex);
}

// Main function to show feed.
function showFeed(startIndexNum) {
	loadPage("main-page");
	// Get the job feed
	const init = {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': localStorage.getItem("token")
		}
	}
	fetch(`http://localhost:${BACKEND_PORT}/job/feed?start=${startIndexNum}`, init)
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				// Cache in local storage if most recent feed
				if (startIndexNum === 0) {
					localStorage.setItem(JSON.parse(localStorage.getItem("authID")), JSON.stringify(data));
				}
				for (const jobPost of data) {
					if (!currPostIds.includes(jobPost.id)) currPostIds.push(jobPost.id);
					generatePost(jobPost);
				}
			}
		}).catch(() => {
			if (!cached) loadCachedFeed();
			else errorOrSuccessPopup("You are offline, please connect to Internet and refresh.", false);
		})
}

// Changes iso date to DD/MM/YYYY format
function isoToNormalDate(date) {
	return `${date.substring(8, 10)}/${date.substring(5, 7)}/${date.substring(0, 4)}`;
}

/**
 * @param {Date} date object
 * @returns {string} date string according to spec:
 * If the job was posted today (in the last 24 hours), it should display how 
 * many hours and minutes ago it was posted 
 * If the job was posted more than 24 hours ago, it should just display the 
 * date DD/MM/YYYY that it was posted
 */
function jobPostCreateDate(date) {
	const isoDate = new Date(date);
	const nowDate = new Date();
	const timeSince = nowDate.getTime() - isoDate.getTime();
	const hoursSince = Math.floor(timeSince / (1000 * 60 * 60));

	if (hoursSince < 24) {
		const minutesSince = Math.floor(timeSince / (1000 * 60) % 60);
		return hoursSince === 0 ? `${minutesSince} min ago` : `${hoursSince} hrs ${minutesSince} min ago`;
	}
	else {
		return isoToNormalDate(date);
	}
}

/**
 * Generates a singular job post on main feed including the creator's name, date 
 * posted, post content, like and comment bar and comment section
 */
function generatePost(jobPost) {
	// Create Container for job post
	const jobContainer = document.createElement("div");
	jobContainer.setAttribute("class", "job-post");
	jobContainer.setAttribute("id", `jobPost${jobPost.id}`);

	// Creates job creator name
	const creatorSpan = document.createElement("span");
	creatorSpan.setAttribute("class", "hover-underline");
	creatorSpan.addEventListener("click", () => loadProfileScreen(jobPost.creatorId));
	fetchGetUserData(jobPost.creatorId).then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			// Links the creator's name to their profile
			creatorSpan.innerText = data.name;
			localStorage.setItem(`id: ${jobPost.id}`, data.name);
		}
	});
	jobContainer.appendChild(creatorSpan);

	// Formats the date the job was posted
	const jobDateDiv = document.createElement("div");
	const jobDate = document.createElement("p");
	jobDate.innerText = jobPostCreateDate(jobPost.createdAt);
	jobDate.style.color = "grey";
	jobDateDiv.appendChild(jobDate);
	jobContainer.appendChild(jobDateDiv);

	const jobContent = createJobContent(jobPost);
	jobContainer.appendChild(jobContent);

	// Likes and comments bar DOM
	const likeCommentBar = document.createElement("div");
	likeCommentBar.setAttribute("class", "likes-comments-bar");

	const likesDiv = document.createElement("div");
	likesDiv.setAttribute("class", "likes");

	const likeSpan = document.createElement("span");
	// Checks if post has been liked by current user and sets like icon accordingly
	const isLiked = jobPost.likes.some((user) => user.userId === JSON.parse(localStorage.getItem("authID")));
	const likeIcon = document.createElement("i");
	if (isLiked) {
		likeIcon.setAttribute("class", "fa-solid fa-thumbs-up");
		likeSpan.setAttribute("liked", "");
	}
	else {
		likeIcon.setAttribute("class", "fa-regular fa-thumbs-up");
		likeSpan.removeAttribute("liked");
	}
	likeSpan.appendChild(likeIcon);
	likeSpan.setAttribute("id", `${JSON.parse(localStorage.getItem("authID"))}${jobPost.id}`);
	// When like icon span is clicked, like post
	likeSpan.addEventListener("click", () => likePost(jobPost.id, `${JSON.parse(localStorage.getItem("authID"))}${jobPost.id}`, likeIcon));

	const numLikes = document.createElement("p");
	numLikes.setAttribute("id", `numLikes${jobPost.id}`)
	numLikes.innerText = `  ${jobPost.likes.length} likes`
	numLikes.setAttribute("class", "hover-underline");

	const likeSection = document.createElement("div");
	likeSection.setAttribute("id", `likes${jobPost.id}`);
	generateLikes(likeSection, jobPost.likes);
	// When number of likes is clicked, display names of who liked
	numLikes.addEventListener("click", () => displayLikes(likeSection));

	likesDiv.appendChild(likeSpan);
	likesDiv.appendChild(numLikes);
	likesDiv.style.marginTop = "8px";

	const numComments = document.createElement("p");
	numComments.setAttribute("id", `numComments${jobPost.id}`);
	numComments.innerText = `${jobPost.comments.length} comments`;

	likeCommentBar.appendChild(likesDiv);
	likeCommentBar.appendChild(numComments);
	jobContainer.appendChild(likeCommentBar);

	// Comments section DOM
	const commentSection = document.createElement("div");
	commentSection.setAttribute("id", `comments${jobPost.id}`);
	// Comments displayed chronologically downwards under job post
	generateComments(commentSection, jobPost.comments);
	jobContainer.appendChild(commentSection);

	// Posting comments displayed under previous comments
	const postCommentDiv = document.createElement("div");
	postCommentDiv.setAttribute("class", "post-comment-div");

	const postCommentInput = document.createElement("input");
	postCommentInput.setAttribute("placeholder", "Add a comment...");
	postCommentInput.setAttribute("class", "comment-input");
	// Post comment when "Enter" key is pressed
	postCommentInput.addEventListener("keypress", (event) => {
		if (event.key === "Enter") {
			// Disallow empty comments
			if (!postCommentInput.value) return;

			const requestBody = {
				"id": jobPost.id,
				"comment": postCommentInput.value
			}
			fetch(`http://localhost:${BACKEND_PORT}/job/comment`, {
				method: "POST",
				headers: {
					'Content-Type': 'application/json',
					'Authorization': localStorage.getItem("token"),
				},
				body: JSON.stringify(requestBody)
			})
				.then(response => response.json())
				.then(data => {
					if (data.error) {
						alert(data.error);
					} else {
						postCommentInput.value = "";
					}
				}).catch(() => {
					errorOrSuccessPopup("You are offline, please connect to Internet and refresh.", false);
				});
		}
	});
	postCommentDiv.appendChild(postCommentInput);
	jobContainer.appendChild(postCommentDiv);

	document.getElementById("main-page").appendChild(jobContainer);
}

// Creates actual job content including image, title, starting date and description
export function createJobContent(jobPost) {
	const jobContent = document.createElement("div");
	jobContent.setAttribute("class", "job-content");

	const jobImg = document.createElement("img");
	jobImg.setAttribute("class", "job-img");
	jobImg.src = jobPost.image;
	jobContent.appendChild(jobImg);

	const jobText = document.createElement("div");
	jobText.style.flex = "1";
	const jobTitle = document.createElement("h5");
	jobTitle.innerText = `${jobPost.title}`;
	jobText.appendChild(jobTitle);

	const brNode = document.createElement("br");
	jobText.appendChild(brNode);

	// Job start date processed in format DD/MM/YYYY
	const jobStartDate = document.createElement("div");
	jobStartDate.innerText = `Start: ${isoToNormalDate(jobPost.start)}`;;
	jobText.appendChild(jobStartDate);

	const brNode2 = document.createElement("br");
	jobText.appendChild(brNode2);

	const jobDescription = document.createElement("p");
	jobDescription.innerText = jobPost.description;
	jobText.appendChild(jobDescription);
	jobContent.appendChild(jobText);

	return jobContent;
}

////////////////////////////////////////
///// 2.3.1 Show Likes on a job ////////
////////////////////////////////////////

function generateLikes(likeSection, likeData) {
	for (const userInfo of likeData) {
		const user = document.createElement("span");
		user.setAttribute("class", "liked-user hover-underline");
		user.addEventListener("click", () => {
			loadProfileScreen(userInfo.userId);
			document.getElementById("generic-popup").style.display = "None";
		});
		user.innerText = `${userInfo.userName} (${userInfo.userEmail})`
		likeSection.appendChild(user);
	}
}

// All users who have liked a post displayed in a popup
function displayLikes(likeSection) {
	const popupContent = showPopup();
	popupContent.appendChild(makePopupHeader("Likes ", "fa-solid fa-thumbs-up"));
	popupContent.appendChild(likeSection);
}

////////////////////////////////////////
///// 2.3.2 Show comments on a job /////
////////////////////////////////////////

function generateComments(commentSection, comments) {
	for (const commentInfo of comments) {
		const comment = document.createElement("div");
		comment.setAttribute("class", "comment");

		const commentUser = document.createElement("span");
		commentUser.innerText = commentInfo.userName;
		commentUser.setAttribute("class", "hover-underline");
		// Comment names link to user profiles
		commentUser.addEventListener("click", () => loadProfileScreen(commentInfo.userId));
		comment.appendChild(commentUser);

		const commentContent = document.createElement("span");
		commentContent.setAttribute("class", "comment-content");
		commentContent.innerText = `: ${commentInfo.comment}`
		comment.appendChild(commentContent);
		commentSection.appendChild(comment);
	}
}

////////////////////////////////////////
///// 2.3.3 Liking a job ///////////////
////////////////////////////////////////

function likePost(postID, spanId, likeIcon) {
	const likeSpan = document.getElementById(spanId);
	const isLiked = likeSpan.hasAttribute("liked");

	const requestBody = {
		"id": postID,
		"turnon": !isLiked,
	}

	fetch(`http://localhost:${BACKEND_PORT}/job/like`, {
		method: "PUT",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': localStorage.getItem("token")
		},
		body: JSON.stringify(requestBody),
	})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				// Update like icon fill on click
				if (isLiked) {
					likeSpan.removeAttribute("liked");
					likeIcon.setAttribute("class", "fa-regular fa-thumbs-up");
				}
				else {
					likeSpan.setAttribute("liked", "");
					likeIcon.setAttribute("class", "fa-solid fa-thumbs-up");
				}
			}
		}).catch(() => {
			errorOrSuccessPopup("You are offline, please connect to Internet and refresh.", false);
		})
}

///////////////////////////////////////////
///// 2.6.1 Infinite Scroll ///////////////
///////////////////////////////////////////

window.addEventListener("scroll", () => {
	const mainPage = document.getElementById("main-page");
	if (mainPage.style.display === "" && navigator.onLine) {
		const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
		if (scrollTop + clientHeight >= scrollHeight && !loading && !disconnected) {
			loading = true;
			startIndex += 5;
			showFeed(startIndex);
			loading = false;
		}
	}
});

///////////////////////////////////////////
///// 2.6.2 Live Update ///////////////////
///////////////////////////////////////////

setInterval(liveUpdate, 500);

function liveUpdate() {
	// Check the user is logged in
	if (JSON.parse(localStorage.getItem("authID")) === null) {
		return;
	}

	fetch(`http://localhost:${BACKEND_PORT}/job/feed?start=0`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': localStorage.getItem("token")
		}
	})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				disconnected = false;
				cached = false;
				for (const jobPost of data) {
					liveUpdateJobPost(jobPost);
				}
			}
		}).catch(() => {
			disconnected = true;
		})
}

function liveUpdateJobPost(jobPostData) {
	// Check job Post exists - if doesn't - send push notif
	if (document.getElementById(`jobPost${jobPostData.id}`) === null) {
		pushNotifs();
		return;
	}

	// Update number of likes
	let numLikes = document.getElementById(`numLikes${jobPostData.id}`);
	numLikes.innerText = ` ${jobPostData.likes.length} likes`;

	// Update number of comments
	let numComments = document.getElementById(`numComments${jobPostData.id}`);
	numComments.innerText = `${jobPostData.comments.length} comments`;

	// Update comments
	const commentSection = document.getElementById(`comments${jobPostData.id}`);
	commentSection.textContent = "";
	generateComments(commentSection, jobPostData.comments);

	// Update Likes
	const likeSection = document.getElementById(`likes${jobPostData.id}`);
	if (likeSection === null) return;
	likeSection.textContent = "";
	generateLikes(likeSection, jobPostData.likes);
}

///////////////////////////////////////////
///// 2.6.3 Push Notifs ///////////////////
///////////////////////////////////////////

// Function to toggle notifs
document.getElementById("nav-toggle-notifs").addEventListener("click", () => {
	if (allowNotifs) {
		allowNotifs = false;
		document.getElementById("bell-icon").setAttribute("class", "fa-regular fa-bell-slash");
	} else {
		allowNotifs = true;
		document.getElementById("bell-icon").setAttribute("class", "fa-solid fa-bell");
	}
})

function pushNotifs() {
	// Check if user has turned on notifs
	if (!allowNotifs) return;

	// Fetch last 5 job posts
	fetch(`http://localhost:${BACKEND_PORT}/job/feed?start=0`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': localStorage.getItem("token")
		}
	})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				for (const jobPost of data) {
					if (!currPostIds.includes(jobPost.id)) {
						currPostIds.push(jobPost.id);
						// If you want to customise, chuck in data as argument

						newNotifPopup(jobPost);
					}
				}
			}
		})
}

document.getElementById("notif-close-span").addEventListener("click", () => {
	document.getElementById("notif-popup").style.display = "none";
});

document.getElementById("refresh-main-page").addEventListener("click", () => {
	document.getElementById("notif-popup").style.display = "none";
	showFeedStart();
});

function newNotifPopup(jobPost) {
	const notifPopup = document.getElementById("notif-popup");
	notifPopup.style.display = "block";
	const notifPopupContent = document.getElementById("notif-popup-content");
	let notifTextDiv = document.createElement("div");
	notifTextDiv.setAttribute("class", "notif-text-div")

	fetchGetUserData(jobPost.creatorId).then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			notifTextDiv.innerText = `${data.name} has posted a job: ${jobPost.title} starting ${isoToNormalDate(jobPost.start)}`;
			notifPopupContent.appendChild(notifTextDiv);
		}
	});
}

///////////////////////////////////////////
///// 2.7.1 Static feed offline access/////
///////////////////////////////////////////

function loadCachedFeed() {
	const dataString = localStorage.getItem(JSON.parse(localStorage.getItem("authID")));
	let data = JSON.parse(dataString);
	for (const jobPost of data) {
		generatePostCached(jobPost);
	}
	cached = true;
}

function generatePostCached(jobPost) {
	// Create Container for job post
	const jobContainer = document.createElement("div");
	jobContainer.setAttribute("class", "job-post");
	jobContainer.setAttribute("id", `jobPost${jobPost.id}`);
	// User name 
	const creatorSpan = document.createElement("span");
	creatorSpan.setAttribute("class", "hover-underline");
	creatorSpan.addEventListener("click", () => errorOrSuccessPopup("You are offline, please connect to Internet and refresh.", false));

	creatorSpan.innerText = localStorage.getItem(`id: ${jobPost.id}`);

	// Job Post Date
	const jobDateDiv = document.createElement("div");
	const jobDate = document.createElement("p");
	jobDate.innerText = jobPostCreateDate(jobPost.createdAt);
	jobDate.style.color = "grey";
	jobDateDiv.appendChild(jobDate);

	jobContainer.appendChild(creatorSpan);
	jobContainer.appendChild(jobDateDiv);

	const jobContent = createJobContent(jobPost);
	jobContainer.appendChild(jobContent);

	// Likes and comments bar
	const likeCommentBar = document.createElement("div");
	likeCommentBar.setAttribute("class", "likes-comments-bar");

	const likesDiv = document.createElement("div");
	likesDiv.setAttribute("class", "likes");

	const likeSpan = document.createElement("span");
	// Check if post has been liked by current user
	const isLiked = jobPost.likes.some((user) => user.userId === JSON.parse(localStorage.getItem("authID")));
	const likeIcon = document.createElement("i");
	if (isLiked) {
		likeIcon.setAttribute("class", "fa-solid fa-thumbs-up");
		likeSpan.setAttribute("liked", "");
	}
	else {
		likeIcon.setAttribute("class", "fa-regular fa-thumbs-up");
		likeSpan.removeAttribute("liked");
	}
	likeSpan.appendChild(likeIcon);

	likeSpan.setAttribute("id", `${JSON.parse(localStorage.getItem("authID"))}${jobPost.id}`);
	likeSpan.addEventListener("click", () => errorOrSuccessPopup("You are offline, please connect to Internet and refresh.", false));

	// Number of likes
	const numLikes = document.createElement("p");
	numLikes.setAttribute("id", `numLikes${jobPost.id}`)
	numLikes.innerText = `  ${jobPost.likes.length} likes`
	numLikes.setAttribute("class", "hover-underline");

	// Like section
	const likeSection = document.createElement("div");
	likeSection.setAttribute("id", `likes${jobPost.id}`);
	generateLikes(likeSection, jobPost.likes);

	numLikes.addEventListener("click", () => errorOrSuccessPopup("You are offline, please connect to Internet and refresh.", false));

	likesDiv.appendChild(likeSpan);
	likesDiv.appendChild(numLikes);

	const numComments = document.createElement("p");
	numComments.setAttribute("id", `numComments${jobPost.id}`);
	numComments.innerText = `${jobPost.comments.length} comments`;

	likeCommentBar.appendChild(likesDiv);
	likeCommentBar.appendChild(numComments);
	jobContainer.appendChild(likeCommentBar);

	const commentSection = document.createElement("div");
	commentSection.setAttribute("id", `comments${jobPost.id}`);

	generateComments(commentSection, jobPost.comments);
	jobContainer.appendChild(commentSection);

	// Post comment
	const postCommentDiv = document.createElement("div");
	postCommentDiv.setAttribute("class", "post-comment-div");

	const postCommentInput = document.createElement("input");
	postCommentInput.setAttribute("placeholder", "Add a comment");
	postCommentInput.setAttribute("class", "comment-input");

	postCommentInput.addEventListener("keypress", (event) => {
		if (event.key === "Enter") {
			errorOrSuccessPopup("You are offline, please connect to Internet", false);
		}
	});

	postCommentDiv.appendChild(postCommentInput);
	jobContainer.appendChild(postCommentDiv);

	// Append to main page
	document.getElementById("main-page").appendChild(jobContainer);
}
