// Function for formatting Date String to yyyy-mm-dd

function formatDate(dateString) {
    if(dateString === ""){
        return "";
    }
    let dateArray = dateString.split(" ");
    let date = new Date(dateString);
    let month = date.getMonth() + 1;
    let day = dateArray[1].replace(",","");
    let year = dateArray[2];
    return (year + "-" + 
            (((month <= 9) ? ('0' + month) : month)) + "-" + 
            day);
}

// Function for formatting Date range or period String to yyyy-mm-dd

function formatDatePeriod(dateString) {
    if(dateString === ""){
        return "";
    }
    let slicedDate = dateString.slice(11);
    if(slicedDate === "Until Next Release"){
        return "";
    } else {
        let date = new Date(slicedDate);
    let dateArray = slicedDate.split(" ");
    let month = date.getMonth() + 1;
    let year = dateArray[1];
    function daysInMonth (mm, yyyy) {
        return new Date(yyyy, mm, 0).getDate();
    }
    let day = daysInMonth(month, year);
    return (year + "-" + 
            (((month <= 9) ? ('0' + month) : month)) + "-" +
            day);
    } 
}

// test inputs & outputs

let relDate = "July 28, 2020";
let exSupDate = "Jun 2021 - Until Next Release";
let exSupDate1 = "Jul 2015 - Jun 2017";
let exSupDate2 = "May 2016 - Jan 2018";
let retdDate = "March 01, 2025";
let emptyDate = "";

console.log(formatDatePeriod(exSupDate));
console.log(formatDatePeriod(exSupDate1));
console.log(formatDatePeriod(exSupDate2));
