const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const objectsToCsv = require("objects-to-csv");

//Function to push data scraped to csv file

async function createCsvFile(data) {
    let csv = new objectsToCsv(data);
    await csv.toDisk("./esri.csv");
}

// Function for scraping product details

async function scrapeProductList(page) {
    await page.goto("https://support.esri.com/en/other-resources/product-life-cycle");
    const html = await page.content();
    const $ = cheerio.load(html);
    const results = $("div.category-subheading-links > a").map((index, element) => {
        const productName = $(element).text();
        const productUrl = $(element).attr("href");
        return {productName, productUrl};
    }).get();
    return results;
}

// Function for scraping product lifecycle dates

async function scrapeLifeCycle(results, page) {
    const lifeCycleData = [];
    for(var i=0; i < results.length; i++) {
        const cosntUrl = "https://support.esri.com/";
        await page.goto(cosntUrl + results[i].productUrl);
        const html = await page.content();
        const $ = cheerio.load(html);
        function formatDate(dateString) {
            if(dateString === ""){
                return "";
            }
            if(dateString === "-") {
                return "";
            }
            let dateArray = dateString.split(" ");
            let date = new Date(dateString);
            let month = date.getMonth() + 1;
            let day = dateArray[1].replace(",","");
            let year = dateArray[2];
            return (year + "-" + (((month <= 9) ? ('0' + month) : month)) + "-" + day);
        }
        function formatDatePeriod(dateString) {
            if(dateString === ""){
                return "";
            }
            if(dateString === "-") {
                return "";
            }
            let slicedDate = dateString.slice(11);
            let date = new Date(slicedDate);
            let dateArray = slicedDate.split(" ");
            let month = date.getMonth() + 1;
            let year = dateArray[1];
            function daysInMonth (mm, yyyy) {
                return new Date(yyyy, mm, 0).getDate();
            }
            let day = daysInMonth(month, year);
            return (year + "-" + (((month <= 9) ? ('0' + month) : month)) + "-" + day);
        }
        const tableElement = $("div.comparison-chart-table > table > tbody > tr");
        for(var j=0; j < tableElement.length; j++){
            const productNameElement = $("div.product-category > a#L3SelectedItem");
            const versionElement = $(tableElement).find("td:nth-child(1)");
            const releaseDateElement = $(tableElement).find("td:nth-child(2)");
            // const generalAvailabilityElement = $(tableElement).find("td:nth-child(3)");
            const extendedSupportElement = $(tableElement).find("td:nth-child(4)");
            const matureSupportElement = $(tableElement).find("td:nth-child(5)");
            const retiredElement = $(tableElement).find("td:nth-child(6)");


            const source_publisher = "ESRI";
            const source_product = $(productNameElement).attr("title");
            const source_full_version = $(versionElement[j]).text();
            const source_availability = formatDate($(releaseDateElement[j]).text());
            // const generalAvailability = formatDatePeriod($(generalAvailabilityElement[j]).text());
            const source_end_of_support = formatDatePeriod($(extendedSupportElement[j]).text());
            const source_end_of_extended_support = formatDatePeriod($(matureSupportElement[j]).text());
            const source_end_of_life = formatDate($(retiredElement[j]).text());
            lifeCycleData.push({source_publisher, source_product, source_full_version, source_availability,
                source_end_of_support, source_end_of_extended_support, source_end_of_life});
        }
        await sleep(2500);
    }
    return lifeCycleData;
}

// Function for timeout before another http(s) request 

async function sleep(milliseconds){
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

//Main Function

async function main() {
    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();
    const results = await scrapeProductList(page);
    const productLifeCycle = await scrapeLifeCycle(results, page);
    console.log(productLifeCycle);
}

main();