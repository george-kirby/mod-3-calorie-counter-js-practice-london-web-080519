// your code here, it may be worth it to ensure this file only runs AFTER the dom has loaded.


// API and requests

function get(url) {
    return fetch(url)
    .then(response => response.json())
}

function post(url, entryData) {
    return fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            accept: "application/json"
        },
        body: JSON.stringify(entryData)
    })
    .then(response => response.json())
}

function patch(url, entryData) {
    return fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            accept: "application/json"
        },
        body: JSON.stringify(entryData)
    })
    .then(response => response.json())
}

function destroy(url) {
    return fetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            accept: "application/json"
        }
    })
    .then(response => response.json()) 
}

const API = {get, post, patch, destroy}

// CONSTANTS

const CALORIE_ENTRIES_URL = "http://localhost:3000/api/v1/calorie_entries/"

// bmr calculator & results

const bmrCalculatorForm = document.querySelector("form#bmr-calculator")

const bmrResultDiv = document.querySelector("div#bmr-calculation-result")

const lowerRangeSpan = document.querySelector("span#lower-bmr-range")
const higherRangeSpan = document.querySelector("span#higher-bmr-range")

const progressBar = document.querySelector("progress.uk-progress")

// new entry

const newEntryForm = document.querySelector("form#new-calorie-form")

// existing entries

const caloriesList = document.querySelector("ul#calories-list")

// edit form

const editEntryFormContainer = document.querySelector("div#edit-form-container")
const editEntryForm = document.querySelector("form#edit-calorie-form")
editEntryForm.setAttribute("custom-id", 0)
editEntryForm.addEventListener("submit", () => handleEditEntrySubmission(event))


// for dev, might leave in
const progressP = document.querySelector("p#progress-p") 





// CALCULATING BMR

bmrCalculatorForm.addEventListener("submit", () => handleBmrCalculation(event))

function handleBmrCalculation(event) {
    event.preventDefault()
    let form = event.target
    let weight = form.weight.value
    let height = form.height.value
    let age = form.age.value
    let lowerRange = (655 + (4.35*weight) + (4.7*height) - (4.7*age))
    let higherRange = (66 + (6.23*weight) + (12.7*height) - (6.8*age))

    lowerRangeSpan.innerText = lowerRange
    higherRangeSpan.innerText = higherRange
    progressBar.max = Math.round((lowerRange + higherRange) / 2)

    updateProgressP()

    // form.reset()
    
}

// RENDERING EXISTING CALORIE ENTRIES

// function to render new entry card

renderCalorieEntry = (entry) => {
    let li = document.createElement("li")
    li.className = "calories-list-item"
    li.id = `calorie-entry-${entry.id}`

    let gridDiv = document.createElement("div")
    gridDiv.className = "uk-grid"
    li.append(gridDiv)

    let kcalDiv = document.createElement("div")
    kcalDiv.className = "uk-width-1-6"
    gridDiv.append(kcalDiv)
    let kcalStrong = document.createElement("strong")
    kcalStrong.innerText = entry.calorie
    let kcalSpan = document.createElement("span")
    kcalSpan.innerText = "kcal"
    kcalDiv.append(kcalStrong, document.createElement("br"), kcalSpan)

    let noteDiv = document.createElement("div")
    noteDiv.className = "uk-width-4-5"
    gridDiv.append(noteDiv)
    let noteEm = document.createElement("em")
    noteEm.className = "uk-text-meta"
    noteEm.innerText = entry.note
    noteDiv.append(noteEm)

    let menuDiv = document.createElement("div")
    menuDiv.className = "list-item-menu"
    li.append(menuDiv)
    let editButton = document.createElement("a")
    editButton.className = "edit-button"
    editButton.setAttribute("uk-icon", "icon: pencil")
    editButton.setAttribute("uk-toggle", "target: #edit-form-container")
    editButton.addEventListener("click", () => prePopulateEditEntryForm(entry))
    let deleteButton = document.createElement("a")
    deleteButton.className = "delete-button"
    deleteButton.setAttribute("uk-icon", "icon: trash")
    deleteButton.addEventListener("click", () => destroyEntry(entry.id))
    menuDiv.append(editButton, deleteButton)

    return li
}

// render all intake cards

getAndRenderEntryCards = () => {
    API.get(CALORIE_ENTRIES_URL)
    .then(calorieEntries => {
        calorieEntries.forEach(entry => {
            progressBar.value += entry.calorie
            caloriesList.append(renderCalorieEntry(entry))
        })
    })
    .then(() => {
        progressBar.value = updateProgressBarValue()
        updateProgressP()
    })
}

// RECORDING NEW CALORIE INTAKE

newEntryForm.addEventListener("submit", () => handleNewEntrySubmission(event))

function handleNewEntrySubmission(event) {
    event.preventDefault()
    let form = event.target
    let calorie = form.calorie.value
    let note = form.note.value
    let entryData = {api_v1_calorie_entry: {calorie, note}}
    console.log(entryData)
    API.post(CALORIE_ENTRIES_URL, entryData)
    .then(response => renderLatest(response))
    form.reset()

    progressBar.value += parseInt(calorie)

    // handle errors
}

// render entry just submitted

makeElTransparent = el => {
    el.removeAttribute("style")
}

renderLatest = (entry) => {
    // add color effect: green then fading to normal after 2 secs
    let newLi = renderCalorieEntry(entry)
    caloriesList.insertBefore(newLi, caloriesList.firstChild)
    progressBar.value = updateProgressBarValue()
    updateProgressP()
    if (entry.calorie < 200) {
        newLi.style.backgroundColor = "lightGreen" // either this line or the one below works
        // newLi.setAttribute("style", "background-color: lightGreen;")
    } else if (entry.calorie >= 200 && entry.calorie <= 600) {
        newLi.style.backgroundColor = "orange"
    } else {
        newLi.style.backgroundColor = "#e8361e"
    }
    window.setTimeout(() => makeElTransparent(newLi), 2000)
}

// EDIT ENTRY

function prePopulateEditEntryForm(entry) {
    editEntryForm.reset()
    editEntryForm.calorie.value = entry.calorie
    editEntryForm.note.value = entry.note
    editEntryForm.customId = entry.id
}

function handleEditEntrySubmission(event) {
    event.preventDefault()
    let form = event.target
    let entryId = form.customId
    console.log("entry form submitted!")
    let calorie = form.calorie.value
    let note = form.note.value
    let entryData = {api_v1_calorie_entry: {calorie, note}}
    console.log(entryData)
    editEntryFormContainer.removeAttribute("style")
    editEntryFormContainer.className = "uk-modal"
    API.patch(CALORIE_ENTRIES_URL+`${entryId}`, entryData)
    .then(entry => {
        let liToDestroy = document.querySelector(`li#calorie-entry-${entry.id}`)
        liToDestroy.remove()
        renderLatest(entry)
    })
}

// DESTROY ENTRY

function destroyEntry(entry_id) {
    API.destroy(`${CALORIE_ENTRIES_URL}${entry_id}`)
    .then(entry => {
        let liToDestroy = document.querySelector(`li#calorie-entry-${entry.id}`)
        liToDestroy.remove()
        progressBar.value = updateProgressBarValue()
        updateProgressP()
    })
    // remove from page
}

// UPDATE PROGRESS BAR

updateProgressBarValue = () => {
    let value = 0
    let caloriesListItems = caloriesList.querySelectorAll("li.calories-list-item")
    caloriesListItems.forEach(entry => {
        let kcalStrong = entry.querySelector("div.uk-grid div strong")
        value += parseInt(kcalStrong.innerText)
    });
    return value
}

// OTHER

// for dev, might leave in
updateProgressP = () => { 
    progressP.innerText = `${progressBar.value} / ${progressBar.max}`
}

// wait until DOMContentLoaded
document.addEventListener("DOMContentLoaded", getAndRenderEntryCards)