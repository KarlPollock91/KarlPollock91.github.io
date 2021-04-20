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
}
