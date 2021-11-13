const fs = require('fs');
const https = require('https');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const log = require("../../utils/LoggerUtils").log;
const { Iterator } = require('../../utils/Iterator.js');
let LifecyclePlugin = require('../../plugins-core/LifecyclePlugin.js')
var plugin = new LifecyclePlugin('ESRI.','ESRI',run);
plugin.register();
// var formatDate = function (dateString) {
//   // YYYY-MM-DD
//   var returnDate = dateString;
//   if (!/[0-9]{4}-[0-9]{2}-[0-9]{2}/g.test(dateString)) {
//     returnDate = '';
//   }
//   return returnDate;
// }
let browser ;
var intervalHandle ;
var dataPushIntervalHandle;
async function run() {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    var results = await scrapeProductList(page);
    //results = results.splice(0,10);
    
    var itr = new Iterator(results);
    var toPushList = [];
    var counter = 0;
    intervalHandle = setInterval( () => {
      async function _core() {
        if (itr.hasNext()) {
          
          processedLcList = await processLink(itr.next(), page)
          counter ++;
          if(counter % 5 === 0)
          plugin.setStats({'progress' : processedLcList.length, progressMessage : "Procesing " + counter + " of " + results.length + " links."})
          toPushList.push(...processedLcList);
        } else {
          clearInterval(intervalHandle);
          dataPushIntervalHandle = setInterval(() => {
            if (counter === results.length) {
              clearInterval(dataPushIntervalHandle);
              plugin.setExtractedLifeycleList(toPushList, function() { browser.close()});
            } else {
              plugin.setStats({'progress' : counter, progressMessage : "In progress " + counter +  " of " + results.length }, true);
            }
          }, 1100);
        }
      }
      _core();
    }
    ,20000)
    
}
// Function for scraping product details
async function scrapeProductList(page) {
    await page.goto("https://support.esri.com/en/other-resources/product-life-cycle");
    const html = await page.content();
    const $ = cheerio.load(html);
    plugin.setStats({'progress' : 'Started gathering links'});
    const results = $("div.category-subheading-links > a").map((index, element) => {
        const productName = $(element).text();
        const productUrl = $(element).attr("href");
        plugin.setStats({'progress' : 'Extracting link for ' + index}, true);
        return {productName, productUrl};
    }).get();
    return results;
}
// Function for scraping product lifecycle dates
// async function scrapeLifeCycle(results, page) {
//     const lifeCycleData = [];
//     results = results.slice(0,10);
//     console.log(results.length);
//     processLink(lifeCycleData)
//     return lifeCycleData;
// }
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

async function processLink(currentResult, page) {
    var lifeCycleData = [];
    const cosntUrl = "https://support.esri.com/";
    var prodUrl = currentResult.productUrl;
    await page.goto(cosntUrl + prodUrl);
    const html = await page.content();
    const $ = cheerio.load(html);
    plugin.setStats({'progress' : 'Processing link ' + prodUrl}, true);
    const tableElement = $("div.comparison-chart-table > table > tbody > tr");
    const tableHeaderElement = $("div.comparison-chart-table > table > thead > tr");
    const columnLength = $(tableHeaderElement).find("th").length;
    if(columnLength === 7){
      for(var j=0; j < tableElement.length; j++){
        const productNameElement = $("div.product-category > a#L3SelectedItem");
        const versionElement = $(tableElement).find("td:nth-child(1)");
        const releaseDateElement = $(tableElement).find("td:nth-child(2)");
        const generalAvailabilityElement = $(tableElement).find("td:nth-child(3)");
        const extendedSupportElement = $(tableElement).find("td:nth-child(4)");
        // const matureSupportElement = $(tableElement).find("td:nth-child(5)");
        const retiredElement = $(tableElement).find("td:nth-child(6)");
        const source_publisher = "ESRI";
        const source_product = $(productNameElement).attr("title");
        const source_full_version = $(versionElement[j]).text();
        const source_availability = formatDate($(releaseDateElement[j]).text());
        // const generalAvailability = formatDatePeriod($(generalAvailabilityElement[j]).text());
        const source_end_of_support = formatDatePeriod($(generalAvailabilityElement[j]).text());
        const source_end_of_extended_support = formatDatePeriod($(extendedSupportElement[j]).text());
        const source_end_of_life = formatDate($(retiredElement[j]).text());
        const concatenated_source = source_publisher + source_product + source_full_version;
        lifeCycleData.push({
          concatenated_source : concatenated_source,
          source_publisher : source_publisher, 
          source_product : source_product, 
          source_full_version : source_full_version, 
          source_availability : source_availability,
          source_end_of_support : source_end_of_support, 
          source_end_of_extended_support : source_end_of_extended_support, 
          source_end_of_life : source_end_of_life,
        });
      }
    } else if(columnLength === 6){
      for(var j=0; j < tableElement.length; j++){
        const productNameElement = $("div.product-category > a#L3SelectedItem");
        const versionElement = $(tableElement).find("td:nth-child(1)");
        const releaseDateElement = $(tableElement).find("td:nth-child(2)");
        const generalAvailabilityElement = $(tableElement).find("td:nth-child(3)");
        // const extendedSupportElement = $(tableElement).find("td:nth-child(4)");
        const matureSupportElement = $(tableElement).find("td:nth-child(4)");
        const retiredElement = $(tableElement).find("td:nth-child(5)");
        const source_publisher = "ESRI";
        const source_product = $(productNameElement).attr("title");
        const source_full_version = $(versionElement[j]).text();
        const source_availability = formatDate($(releaseDateElement[j]).text());
        // const generalAvailability = formatDatePeriod($(generalAvailabilityElement[j]).text());
        const source_end_of_support = formatDatePeriod($(generalAvailabilityElement[j]).text());
        const source_end_of_extended_support = formatDatePeriod($(matureSupportElement[j]).text());
        const source_end_of_life = formatDate($(retiredElement[j]).text());
        const concatenated_source = source_publisher + source_product + source_full_version;
        lifeCycleData.push({
          concatenated_source : concatenated_source,
          source_publisher : source_publisher, 
          source_product : source_product, 
          source_full_version : source_full_version, 
          source_availability : source_availability,
          source_end_of_support : source_end_of_support, 
          source_end_of_extended_support : source_end_of_extended_support, 
          source_end_of_life : source_end_of_life,
        });
      }
    } else if(columnLength === 5){
      for(var j=0; j < tableElement.length; j++){
        const productNameElement = $("div.product-category > a#L3SelectedItem");
        const versionElement = $(tableElement).find("td:nth-child(1)");
        const releaseDateElement = $(tableElement).find("td:nth-child(2)");
        const generalAvailabilityElement = $(tableElement).find("td:nth-child(3)");
        // const extendedSupportElement = $(tableElement).find("td:nth-child(4)");
        // const matureSupportElement = $(tableElement).find("td:nth-child(4)");
        const retiredElement = $(tableElement).find("td:nth-child(4)");
        const source_publisher = "ESRI";
        const source_product = $(productNameElement).attr("title");
        const source_full_version = $(versionElement[j]).text();
        const source_availability = formatDate($(releaseDateElement[j]).text());
        // const generalAvailability = formatDatePeriod($(generalAvailabilityElement[j]).text());
        const source_end_of_support = formatDatePeriod($(generalAvailabilityElement[j]).text());
        // const source_end_of_extended_support = formatDatePeriod($(matureSupportElement[j]).text());
        const source_end_of_life = formatDate($(retiredElement[j]).text());
        const concatenated_source = source_publisher + source_product + source_full_version;
        lifeCycleData.push({
          concatenated_source : concatenated_source,
          source_publisher : source_publisher, 
          source_product : source_product, 
          source_full_version : source_full_version, 
          source_availability :source_availability,
          source_end_of_support : source_end_of_support, 
          source_end_of_life : source_end_of_life,
        });
      }
    }else if(columnLength === 0){
      continue;
    }
    return lifeCycleData;
}
async function sleep(milliseconds){
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

exports[plugin.exportName] = plugin;