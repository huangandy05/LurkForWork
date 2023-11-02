import { BACKEND_PORT } from './config.js';
import { fileToDataUrl, createInputDom } from './helpers.js';
import { showPopup, makePopupHeader, errorOrSuccessPopup } from './popup.js';

////////////////////////////////////////
///// 2.5.1 Adding a job  //////////////
////////////////////////////////////////

const createJobBtn = document.getElementById("create-job-btn");
createJobBtn.addEventListener("click", () => {
	const popupContent = showPopup();
	popupContent.appendChild(makePopupHeader("Create Job ", "fa-solid fa-briefcase"));

	const inputDiv = document.createElement("div");
	inputDiv.setAttribute("class", "popup-input-content");

	const startDateInput = createInputDom("create-job-date-input", "Start date");
	startDateInput.addEventListener("focus", () => {
		startDateInput.type = "date";
	});
	inputDiv.appendChild(createInputDom("create-job-title-input", "Job title"));
	// Job images only takes jpgs as required by spec
	inputDiv.appendChild(createInputDom("create-job-img-input", undefined, "file", "image/jpeg"));
	inputDiv.appendChild(startDateInput);
	inputDiv.appendChild(createInputDom("create-job-description-input", "Job description"));

	let createJobSubmitButton = document.createElement("button");
	createJobSubmitButton.innerText = "Submit";
	createJobSubmitButton.setAttribute("class", "btn-submit");
	inputDiv.appendChild(createJobSubmitButton);
	const errorSpan = document.createElement("span");
	errorSpan.setAttribute("id", "create-job-error");
	inputDiv.appendChild(errorSpan);
	popupContent.appendChild(inputDiv);

	createJobSubmitButton.addEventListener("click", () => {
		const jobTitle = document.getElementById("create-job-title-input").value;
		const jobImgFile = document.querySelector('#create-job-img-input').files[0];
		const jobDescription = document.getElementById("create-job-description-input").value;

		// Check everything is non-empty
		if (!jobTitle || !startDateInput.value || !jobImgFile) {
			let errorText = "";
			if (!jobTitle) errorText = "Please enter a job title";
			else if (!startDateInput.value) errorText = "Please enter a start date";
			else errorText = "Please upload an image";
			errorSpan.innerText = errorText;
			return;
		}
		fileToDataUrl(jobImgFile).then((img) => {
			const requestBody = {
				"title": jobTitle,
				"image": img,
				"start": new Date(startDateInput.value).toISOString().substring(0, 10),
				"description": jobDescription
			}

			fetch(`http://localhost:${BACKEND_PORT}/job`, {
				method: "POST",
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
						document.getElementById("generic-popup").style.display = "None";
						// Popup on successful job creation
						const popupContent = showPopup();
						let popupHeader = makePopupHeader("Job creation successful ", "fa-solid fa-check");
						popupHeader.style.color = "green";
						popupContent.appendChild(popupHeader);
					}
				})
		});
	});
});


///////////////////////////////////////////
///// 2.5.1 Updating and deleting a job ///
///////////////////////////////////////////

// Add event listener to close button
export function updateJob(jobData) {
	const popupContent = showPopup();
	popupContent.appendChild(makePopupHeader("Update Job ", "fa-solid fa-briefcase"));

	const inputDiv = document.createElement("div");
	inputDiv.setAttribute("class", "popup-input-content");

	const titleInput = createInputDom("update-job-title-input", "Job title");
	const imgInput = createInputDom("update-job-img-input", undefined, "file", "image/jpeg");
	const startDateInput = createInputDom("update-job-date-input", "", "date");
	const descriptInput = createInputDom("update-job-description-input", "Job description");
	titleInput.value = jobData.title;
	// const prevDateValue = ;
	startDateInput.value = new Date(jobData.start).toISOString().substring(0, 10);
	descriptInput.value = jobData.description;

	inputDiv.appendChild(titleInput);
	inputDiv.appendChild(imgInput);
	inputDiv.appendChild(startDateInput);
	inputDiv.appendChild(descriptInput);

	let updateJobSubmitButton = document.createElement("button");
	updateJobSubmitButton.innerText = "Submit";
	updateJobSubmitButton.setAttribute("class", "btn-submit");
	inputDiv.appendChild(updateJobSubmitButton);

	popupContent.appendChild(inputDiv);

	updateJobSubmitButton.addEventListener("click", () => {
		let requestBody = {
			"id": jobData.id,
			"title": titleInput.value,
			"start": startDateInput.value,
			"description": descriptInput.value
		};

		if (imgInput.files[0]) {
			fileToDataUrl(imgInput.files[0]).then((img) => {
				Object.assign(requestBody, { "image": img });
				fetchPutJobData(requestBody);
			});
		}
		else {
			fetchPutJobData(requestBody);
		}
	});
}

function fetchPutJobData(requestBody) {
	fetch(`http://localhost:${BACKEND_PORT}/job`, {
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
				// document.getElementById("generic-popup").style.display = "None";
				const popupContent = showPopup();
				let popupHeader = makePopupHeader("Job update successful ", "fa-solid fa-check");
				popupHeader.style.color = "green";
				popupContent.appendChild(popupHeader);
			}
		})
}

export function deleteJob(jobId) {
	const requestBody = {
		"id": jobId
	}
	fetch(`http://localhost:${BACKEND_PORT}/job`, {
		method: "DELETE",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': localStorage.getItem("token")
		},
		body: JSON.stringify(requestBody)
	})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				errorOrSuccessPopup("Job already deleted.", false);
			}
			else {
				errorOrSuccessPopup("Successfully deleted job!", true);
			}
		})
}
