//count: The number of numbers in row/col.
//numbers: The numbers themselves;
//numFreeSpaces: The number of empty tiles once the numbers are applied as blocks to the row/column.
//possibilitySpace: The positioning of the free spaces, this is what is permuted over.
//convertedPossibilitySpace: the possibilitySpace converted into a readable format to apply to the visual grid.
class NumbersData {
    constructor() {
        this.count = 0;
        this.numbers = [];
        this.numFreeSpaces = 0;
        this.possibilitySpace = [];
        this.convertedPossibilitySpace = [];
    }

    //Generate every permutation of the rows. This should be done first and then we can cross them off as we go.
    generatePossibilitySpace(gridSize) {
        if (this.numFreeSpaces == gridSize){
            this.convertedPossibilitySpace.push([]);
            for (let i = 0; i < gridSize; i++){
                this.convertedPossibilitySpace[0].push(X);
            }
        } else {
            this.numFreeSpaces += 1;
            var initialPossibilitySpace = [0]
            for (let i = 0; i < this.count; i++) {
                initialPossibilitySpace.push(0);
            }
            this.recursiveGeneratePossibilitySpace(initialPossibilitySpace, this.numFreeSpaces, 0);
            this.convertPossibilitySpace();
        }
    }

    recursiveGeneratePossibilitySpace(iteration, numLeftToDistribute, lastAddedPosition) {
        if (numLeftToDistribute == 0) {
            // console.log("found for:")
            // console.log(this.numbers);
            // console.log(iteration);
            this.possibilitySpace.push(iteration);
        }
        else {
            for (let i = lastAddedPosition; i < iteration.length; i++){
                let next = [...iteration];
                next[i] += 1;
                this.recursiveGeneratePossibilitySpace(next, numLeftToDistribute - 1, i);
            };
        }
    }

    convertPossibilitySpace() {
        for (let i = 0; i < this.possibilitySpace.length; i++){
            var newPossibility = [];
            for (let j = 0; j < this.possibilitySpace[i].length; j++){
                for (let k = 0; k < this.possibilitySpace[i][j]; k++){
                    newPossibility.push(X);
                }
                
                if (j < (this.possibilitySpace[i].length - 1)) {
                    for (let k = 0; k < this.numbers[j]; k++){
                        newPossibility.push(O);
                    }
                    if (j < (this.possibilitySpace[i].length - 2)) {
                        newPossibility.push(X);
                    }
                }
                
            }
            this.convertedPossibilitySpace.push(newPossibility);
        }
    }
}
