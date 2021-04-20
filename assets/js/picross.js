//TODO: BUG: Try adding and removing items a few times. You get ERROR_1
const ROW = "row";
const COL = "col";

//O: Filled space.
//X: Unfilled space.
const O = "o";
const X = "x";
const UNKNOWN = "?";

const SUCCESS = "success";
const SUCCESS_AND_PROGRESS = "successAndProgress";
const FAILURE = "failure";


const ERROR_1 = "The number you entered is too large to fit in that row/column."
const ERROR_2 = "That row/column has already reached the maximum number of blocks it can fit."
const ERROR_3 = "You've entered an incorrectly configured puzzle. It is not solveable."
const ERROR_4 = "You did not enter a valid number."
const ERROR_5 = "You have inserted an invalid file. Try checking the formating."
const ERROR_6 = "There is an unequal number of rows and columns in the file you inserted."

var gridSize;
var itemSize = 20;
var grid;

var mainLayout;

var colParentContainer;
var colNumbersListContainer;
var colButtonsContainer;

var rowParentContainer;
var rowNumbersListContainer;
var rowButtonsContainer;

var messagePopupContainer;
var messagePopupMessage;
var messagePopupClose;

var userInputContainer;
var userInputBeginButton;
var userInputAddFile;
var spinner;

var toggleAlternateSolutionsButton;

var itemStyle;

var numbersDataLists;

var completeSolutions = [];

function onLoad(){
    //Element definition.

    mainLayout = document.getElementById("main-layout");
    grid = document.getElementById("grid-container");

    rowParentContainer = document.getElementById("row-container");
    rowNumbersListContainer = document.getElementById("row-numbers");
    rowButtonsContainer = document.getElementById("row-buttons");

    colParentContainer = document.getElementById("column-container");
    colNumbersListContainer = document.getElementById("column-numbers");
    colButtonsContainer = document.getElementById("column-buttons");

    messagePopupContainer = document.getElementById("message-popup");
    messagePopupMessage = document.getElementById("message-popup-message");
    messagePopupClose = document.getElementById("message-popup-close");

    userInputBeginButton = document.getElementById("user-input-begin-button");
    userInputGridSizeInput = document.getElementById("user-input-grid-size-input")
    userInputGridSizeButton = document.getElementById("user-input-grid-size-button");
    userInputAddFile = document.getElementById("user-input-add-file-button");

    spinner = document.getElementById("spinner");

    toggleAlternateSolutionsButton = document.getElementById("toggle-alternate-solutions");
    var viewingSolution = 0;

    itemStyle = document.createElement('style'); 
    itemStyle.innerHTML = "";
    document.body.appendChild(itemStyle);

    //User input construction.

    userInputGridSizeInput.value = 10;

    userInputGridSizeInput.addEventListener("keypress", (event) => {
        if (!isNumber(event.key))
        {
            event.preventDefault();
        }
    });

    userInputAddFile.addEventListener("change", (event) => {
        try {
            var file = event.target.files[0];
            var reader = new FileReader();
            reader.addEventListener('load', (event) => {
                var text = event.target.result;
                try {
                    var data = text.match(/[^\r\n]+/g);
                    if ((data.length % 2) != 0) {
                        displayMessagePopup(ERROR_5);
                    } else {
                        var newGridSize = data.length / 2;
                        initGrid(newGridSize);
                        for (let i = 0; i < data.length; i++){
                            var numbers = data[i].split(',');
                            for (let j = 0; j < numbers.length; j++){
                                if (numbers[i] == "0") {
                                    break;
                                }
                                if (i >= newGridSize){
                                    addNumber(ROW, i - newGridSize, numbers[j]);
                                } else {
                                    addNumber(COL, i, numbers[j]);
                                }
                            }
                        }
                    }
                } catch(err) {
                    console.log(err);
                }
            });
          
            reader.readAsText(file, "UTF-8");
        } catch (err) {
            console.log(err);
            displayMessagePopup(ERROR_5);
        }
    })

    userInputGridSizeInput.addEventListener("keyup", (event) => {
        if (event.code === 'Enter') {
            toggleAlternateSolutionsButton.style.visibility = "hidden";
            var input = event.target.value;
            if (!isNumber(input)){
                displayMessagePopup(ERROR_4);
            } else if (input != ""){
                initGrid(parseInt(input));
            }
        }
    });

    userInputGridSizeButton.addEventListener("click", () => {
        toggleAlternateSolutionsButton.style.visibility = "hidden";
        var input = userInputGridSizeInput.value;
        if (!isNumber(input)){
            displayMessagePopup(ERROR_4);
        } else if (input != ""){
            initGrid(parseInt(input));
        }
    })

    userInputBeginButton.addEventListener('click', () => {
        console.log("inputbutton clicked");
        userInputBeginButton.style.visibility = "hidden";
        spinner.style.visibility = "visible";
        toggleAlternateSolutionsButton.style.visibility = "hidden";
        
        var worker = new Worker("/assets/js/algorithm.js");
        worker.postMessage({numbersDataLists: numbersDataLists,
        gridSize: gridSize});

        worker.onmessage = (e) => {
            completeSolutions = e.data;
            if (completeSolutions.length > 0){
                updateGridDOM(completeSolutions[0].gridData);
            }
            else {
                displayMessagePopup(ERROR_3);
            }
        
            userInputBeginButton.style.visibility = "visible";
            spinner.style.visibility = "hidden";
        
            if (completeSolutions.length > 1) {
                toggleAlternateSolutionsButton.style.visibility = "visible";
            }
        }
    })

    messagePopupClose.addEventListener('click', () => {
        messagePopupContainer.style.visibility = "hidden";
    });

    toggleAlternateSolutionsButton.addEventListener('click', () => {
        viewingSolution = (viewingSolution + 1) % completeSolutions.length;
        updateGridDOM(completeSolutions[viewingSolution].gridData);
    })
 
    initGrid(10);
}

function initGrid(newGridSize){
    numbersDataLists = {
        row: [],
        col: []
    }
    gridSize = newGridSize;

    //Math.ceil(gridSize / 2) is the maximum number of numbers a column or row can have. This should be
    //a variable along with gridSize but I can't think of a name for it lol. maxNumOfNumbers?

    //Generate data structures
    for (i = 0; i < gridSize; i++){
        rowNumbersListContainer.innerHTML = "";
        rowButtonsContainer.innerHTML = "";
        colNumbersListContainer.innerHTML = "";
        colButtonsContainer.innerHTML = "";
        numbersDataLists.row.push(new NumbersData());
        numbersDataLists.col.push(new NumbersData());
        for (let j = 0; j < Math.ceil(gridSize / 2); j++) {
            numbersDataLists.row[i].numbers.push(0);
            numbersDataLists.col[i].numbers.push(0);
        }
        numbersDataLists.col[i].numFreeSpaces = gridSize;
        numbersDataLists.row[i].numFreeSpaces = gridSize;
    }

    //Grid construction
    grid.innerHTML = "";
    for (let i = 0; i < gridSize; i++){
        for (let j = 0; j < gridSize; j++){
            var gridItem = document.createElement("div");
            gridItem.className = "grid-item";
            gridItem.id = `grid-${i},${j}`
            grid.appendChild(gridItem);
        }
    }

    grid.style.gridTemplateColumns = `repeat(${gridSize}, ${itemSize}px)`;

    //Row/col input constructor

    mainLayout.style.gridTemplateColumns = `${(Math.ceil(gridSize / 2) + 1)*itemSize}px ${gridSize * itemSize}px`
    mainLayout.style.gridTemplateColumns = `${(Math.ceil(gridSize / 2) + 1)*itemSize}px ${gridSize * itemSize}px`

    rowParentContainer.style.width = `${(Math.ceil(gridSize / 2) + 1)*itemSize}px`;

    rowNumbersListContainer.style.width = `calc(100% - ${itemSize}px)`;
    rowNumbersListContainer.style.gridTemplateRows = `repeat(${gridSize}, ${itemSize}px)`;

    rowButtonsContainer.style.width = `${itemSize}px`;
    rowButtonsContainer.style.gridTemplateRows = `repeat(${gridSize}, ${itemSize}px)`;

    colParentContainer.style.height = `${(Math.ceil(gridSize / 2) + 1)*itemSize}px`;

    colNumbersListContainer.style.height = `calc(100% - ${itemSize}px)`;
    colNumbersListContainer.style.gridTemplateColumns = `repeat(${gridSize}, ${itemSize}px)`;
    
    colButtonsContainer.style.height = `${itemSize}px`;
    colButtonsContainer.style.gridTemplateColumns = `repeat(${gridSize}, ${itemSize}px)`;

   for (let i = 0; i < gridSize; i++) {
        var childElements = generateChildElements(ROW, i);
        rowButtonsContainer.appendChild(childElements.buttonElement);
        rowNumbersListContainer.appendChild(childElements.numbersListElement);

        childElements = generateChildElements(COL, i);
        colButtonsContainer.appendChild(childElements.buttonElement);
        colNumbersListContainer.appendChild(childElements.numbersListElement);
    }


    updateStyleSheet();

    //debugAddStickmanUnsolveable();

}

function updateStyleSheet() {
var gridItems = document.querySelectorAll('.grid-item');
gridItems.forEach(element => {
    element.style.width = `${itemSize}px`;
    element.style.height = `${itemSize}px`;

})

var addNumberButtons = document.querySelectorAll('.add-number-button');
addNumberButtons.forEach(element => {
    element.style.width = `${itemSize}px`;
    element.style.height = `${itemSize}px`;

})

var colNumberLists = document.querySelectorAll('.col-number-list');
colNumberLists.forEach(element => {
    element.style.gridTemplateRows = `repeat(${Math.ceil(gridSize / 2)}, ${itemSize}px)`
    element.style.width = `${itemSize}px`;
})

var rowNumberLists = document.querySelectorAll('.row-number-list');
rowNumberLists.forEach(element => {
    element.style.gridTemplateColumns = `repeat(${Math.ceil(gridSize / 2)}, ${itemSize}px)`
    element.style.height = `${itemSize}px`;
})

var numbers = document.querySelectorAll('.number');
numbers.forEach(element => {
    element.style.width = `${itemSize}px`;
    element.style.height = `${itemSize}px`;

})
}

//Generates the children elements for the side bar including the add number buttons, the add number list divs and the number div.
//existingElement: boolean that says whether or not the row/col list is being created from scratch, or updated to match new
//size requirements.
function generateChildElements(colOrRow, index) {
    var buttonElement = document.createElement("div");

    buttonElement.className = "add-number-button";
    buttonElement.id = `${colOrRow}-button-${index}`;

    var icon = document.createElement("i");

    icon.className = "fas fa-plus"

    buttonElement.appendChild(icon);

    buttonElement.addEventListener('click', () => {
        openInput(colOrRow, index);
    });

    var numbersListElement = document.createElement("div");
    numbersListElement.className = `${colOrRow}-number-list`;
    numbersListElement.id = `${colOrRow}-number-list-${index}`;

    for (let i = 0; i < Math.ceil(gridSize / 2); i++){
        var numberDiv = document.createElement("div");
        numberDiv.className = "number";
        numberDiv.id = `${colOrRow}-num-${index},${i}`
        numberDiv.addEventListener('click', () => {
            var numZeroes = Math.ceil(gridSize / 2) - numbersDataLists[colOrRow][index].count;
            removeNumber(colOrRow, index, i - numZeroes);
        })
        numbersListElement.appendChild(numberDiv);
    }

    return {
        buttonElement: buttonElement,
        numbersListElement: numbersListElement
    }
}

//The + button is clicked and the user is prompted to enter a number
function openInput(colOrRow, index) {
    if (isThereRoom(numbersDataLists[colOrRow][index])){
        addNumber(colOrRow, index, "-1");
    } else {
        displayMessagePopup(ERROR_2)
    }
}

//Check to see if the list can support a new object
function isThereRoom(list) {
    
    if (list.count < list.numbers.length){
        return true;
    } else {
        return false;
    }
}

//Add a number to the board.
//colOrRow: "row" or "col"
//index: Which rowNumberList/colNumberList to enter into
//number: Number to add to board.
function addNumber(colOrRow, index, number) {
    console.log("add number 2");
    var parsedNumber = parseInt(number);
    var updatedFreeSpace = numbersDataLists[colOrRow][index].numFreeSpaces;
    updatedFreeSpace -= (parsedNumber + 1);
    //Minus one because we add a free space at start of algorithm.
    if (updatedFreeSpace < -1){
        displayMessagePopup(ERROR_1);
    } else {
        console.log("add number 3");
        if (parsedNumber != -1){
            numbersDataLists[colOrRow][index].numFreeSpaces = updatedFreeSpace;
        }
        numbersDataLists[colOrRow][index].numbers[numbersDataLists[colOrRow][index].count] = parsedNumber;
        numbersDataLists[colOrRow][index].count += 1;

        updateNumbersDOM(colOrRow);
    }
}

//Remove number from the board.
//index: the element of the list in col/row.
//elementIndex: index of element being clicked
//todo shit so you need to reverse engineer your fucky ui
function removeNumber(colOrRow, index, elementIndex) {
    console.log(`removing ${colOrRow}, ${index}, ${elementIndex}`);
    let number = numbersDataLists[colOrRow][index].numbers[elementIndex];
    console.log(numbersDataLists[colOrRow][index]);
    console.log(number);
    if (number != 0 && number != undefined){
        console.log("number is not 0");
        if (number != -1){
            numbersDataLists[colOrRow][index].numFreeSpaces += (number + 1);
        }
        numbersDataLists[colOrRow][index].numbers.splice(elementIndex, 1);
        numbersDataLists[colOrRow][index].numbers.push(0);
        numbersDataLists[colOrRow][index].count -= 1;
        updateNumbersDOM(colOrRow);
    }
}

//NOTE: This could be more efficient but you're dealing with such small data sets it doesn't matter if you update everything
//every time it needs to change.

function updateNumbersDOM(colOrRow) {
    var element;
    for (let i = 0; i < gridSize; i++){
        var numZeroes = Math.ceil(gridSize / 2) - numbersDataLists[colOrRow][i].count;
        for (let j = 0; j < numbersDataLists[colOrRow][i].count; j++) {
            element = document.getElementById(`${colOrRow}-num-${i},${j + numZeroes}`);
            if (numbersDataLists[colOrRow][i].numbers[j] != 0){
                if (numbersDataLists[colOrRow][i].numbers[j] == "-1") {
                    var inputBox = document.createElement("input");

                    inputBox.type = "text";
                    inputBox.id = "number-input";
                    inputBox.style.padding = "0px";
                    inputBox.style.margin = "0px";
                    inputBox.style.overflow = "hidden";
                    inputBox.style.height = `${itemSize}px`
                    inputBox.style.width = `${itemSize}px`
                    inputBox.style.textAlign = "center";
                    inputBox.addEventListener('blur', (event) =>{
                        event.target.remove();
                        removeNumber(colOrRow, i, j);
                    });
                    inputBox.addEventListener("keypress", (event) => {
                        console.log("keypress")
                        if (!isNumber(event.key))
                        {
                            event.preventDefault();
                        }
                    });
                    inputBox.addEventListener("keyup", (event) => {
                        console.log("pressed enter");
                        if (event.code === 'Enter') {
                            var input = event.target.value;
                            removeNumber(colOrRow, i, j);
                            if (!isNumber(input)){
                                displayMessagePopup(ERROR_4);
                            } else if (input != ""){
                                console.log("add number 1");
                                addNumber(colOrRow, i, input);
                            }
                        }
                    });

                    element.innerHTML = "";
                    element.appendChild(inputBox);
                    inputBox.focus();
                } else {
                    
                    element.innerHTML = numbersDataLists[colOrRow][i].numbers[j];
                }
            }
        }
        //And clear the zeroes
        for (let j = 0; j < numZeroes; j++){
            element = document.getElementById(`${colOrRow}-num-${i},${j}`);
            element.innerHTML = "";
        }
    }
}

//Checks if the number inputed is a valid number.
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

//Displays a message in a popup window.
function displayMessagePopup(message){
    messagePopupContainer.style.visibility = "visible";
    messagePopupContainer.focus();
    messagePopupMessage.innerHTML = message;
}

//Update the DOM with the current solution.
function updateGridDOM(gridData){
    for (let i = 0; i < gridSize; i++){
        for (let j = 0; j < gridSize; j++){
            var tile = document.getElementById(`grid-${i},${j}`);
            tile.style.backgroundColor = '#FFFFFF'
            if (tile.hasChildNodes()){
                tile.removeChild(tile.lastElementChild);
            }
            if (gridData[i][j] == O){
                tile.style.backgroundColor = '#696969'
            } else if (gridData[i][j] == X){
                var icon = document.createElement("i");

                icon.className = "fas fa-times"

                tile.appendChild(icon);
            }
        }
    }
}