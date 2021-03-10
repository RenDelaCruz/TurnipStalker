/*
 * File: postboard.js
 * Author: Ren Dela Cruz
 * Date: 2021
 * Handles functions related to updating the post board
 */


const URL_AC = "https://www.reddit.com/r/acturnips/new/.json";
const URL_EX = "https://www.reddit.com/r/TurnipExchange/new/.json";
const URL_NH = "https://www.reddit.com/r/ACNHTurnips/new/.json";

// Checks if valid input
function validateInput() {
    let price = $("#input-price").val();
    if (isPositiveInteger(price)) {
        // Main processing function to output posts
        processPosts(parseInt(price));
        $("#input-price").blur();
    } else {
        alert("This is not a valid price.");
    }
    $("#input-price").val("");
}

// Removes punctuation and returns split string
function getTokens(text) {
    // Word 'hundred' is removed for easier price inference
    let noPunct = text.replace(/[.,\/#!?$%\^&\*;:{}=\-_`~()\[\]]/g, " ").replace("hundred", " ");
    return noPunct.replace(/\s{2,}/g, " ").split(" ");
}

function identifyPrice(title) {
    let tokens = getTokens(title);
    let possibleNums = [];

    for (let token of tokens) {
        if (isPositiveInteger(token)) {
            possibleNums.push(parseInt(token));
        }
    }

    if (possibleNums.length === 1 && possibleNums[0] >= 90) {
        return possibleNums[0];
    } else if (possibleNums.length === 3 && possibleNums.every(function (e) { return e < 10 })) {
        return parseInt(possibleNums.join(""));
    } else if (possibleNums.length !== 0) {
        let currMax = -1;

        for (i = 0; i < possibleNums.length; i++) {
            if (validPriceRange(possibleNums[i]) && possibleNums[i] > currMax) {
                currMax = possibleNums[i];
            }
        }

        if (currMax !== -1) {
            return currMax;
        }
    }
    return inferSpelledOutPrice(tokens, true);
}

function validPriceRange(price) {
    return price >= 90 && price <= 660;
}

function inferSpelledOutPrice(tokens, firstPass) {
    let possibleDigits = [];
    let prevPushedIndex = -1;
    let currentMax = [];

    let num;
    for (let i = 0; i < tokens.length; i++) {
        num = convertWrittenToNumber(tokens[i]);
        if (num !== -1 && (possibleDigits.length === 0 || prevPushedIndex + 1 === i)) {
            possibleDigits.push(num);
            prevPushedIndex = i;
        } else {
            if (possibleDigits.length > currentMax.length && validPriceRange(parseInt(possibleDigits.join("")))) {
                currentMax = possibleDigits;
            }
            possibleDigits = [];
            prevPushedIndex = -1;
        }
    }

    if (possibleDigits.length > currentMax.length && validPriceRange(parseInt(possibleDigits.join("")))) {
        currentMax = possibleDigits;
    }

    if ((currentMax.length === 3 || currentMax.length === 2) && currentMax.every(function (e) { return e < 10 })) {
        return parseInt(currentMax.join(""));
    }

    if (firstPass) {
        tokens = tokens.join("").split("");
        return inferSpelledOutPrice(tokens, false)
    }
    return -1;
}

function convertWrittenToNumber(token) {
    if (isPositiveInteger(token)) {
        return parseInt(token);
    }

    token = token.toLowerCase();

    let num = -1;
    if (token == "zero") {
        num = 0;
    } else if (token == "one") {
        num = 1;
    } else if (token == "two" || token == "twenty") {
        num = 2;
    } else if (token == "three" || token == "thirty") {
        num = 3;
    } else if (token.includes("four")) {
        num = 4;
    } else if (token == "five" || token == "fifty") {
        num = 5;
    } else if (token.includes("six")) {
        num = 6;
    } else if (token.includes("seven")) {
        num = 7;
    } else if (token.includes("eight")) {
        num = 8;
    } else if (token.includes("nine")) {
        num = 9;
    }
    return num;
}

const SC_OFF = "<!-- SC_OFF -->";
const SC_ON = "<!-- SC_ON -->";

function makePostBlock(post, idNum) {
    let content = post.content;
    let imageURL = post.imageURL;
    let imageIndicator = false;

    if (content) {
        content = decodeHtml(content);
        let offIndex = content.indexOf(SC_OFF) + SC_OFF.length;
        let onIndex = content.indexOf(SC_ON);
        content = content.substring(offIndex, onIndex);

        if (content.includes('href="https://preview.redd.it')) {
            let imgIndex1 = content.indexOf('https://preview.redd.it');
            let imgIndex2 = content.substring(imgIndex1).indexOf('"') + imgIndex1;
            let imagePreview = content.substring(imgIndex1, imgIndex2);
            imageIndicator = true;
            content += `<br><img src=${imagePreview} alt="${post.title}" width="100%" height="auto" class="center">`;
        }
        if (content.includes('href="https://imgur.com')) {
            let imgIndex1 = content.indexOf('imgur.com/');
            let imgIndex2 = content.substring(imgIndex1).indexOf('"') + imgIndex1;
            let imagePreview = "https://i." + content.substring(imgIndex1, imgIndex2) + ".png";
            imageIndicator = true;
            content += `<br><img src=${imagePreview} alt="${post.title}" width="100%" height="auto" class="center">`;
        }
    } else {
        content = "";
    }

    if (imageURL && !imageURL.includes("/gallery/")) {
        imageIndicator = true;
        content += `<br><img src="${imageURL}" alt="${post.title}" width="100%" height="auto" class="center">`;
    } else if (imageURL.includes("/gallery/")) {
        content += imageURL;
    }

    let arrow = "▼";
    if (!content) {
        arrow = "";
    }

    let imageIcon = imageIndicator ? `<i class="far fa-image"></i>` : "";

    let block = `
    <div class="round-block padding-extra active-hover" id="post-${idNum}">
        <div class="tag-container ">
            <div class="tag yellow">
                <strong>${post.price} Bells</strong>
            </div>
            <div class="tag blue">
                ${post.timeString}
            </div>
            <a class="tag teal button"
                href="${post.link}"
                target="_blank"><span style="color: #E2FDF5;">Visit Post &#10132;</span>
            </a>
        </div><br>
        <h3 class="margin-none wrap-break">${post.title}</h3>
        <p class="margin-none wrap-break">${post.user} in ${post.subreddit}</p>
        <p class="margin-none wrap-break"><span style="font-size: small;">${post.comments}</span>
            <span id="arrow-${idNum}" style="float: right;">${arrow}</span>
            <span style="float: right; font-size: 1.1rem;">${imageIcon}</span></p>
        <div id="content-${idNum}" class="panel wrap-break">
            <hr>
            ${content}
        </div>
    </div>
    `;
    return block;
}

function populatePostBoard(postList) {
    let idNum = 1;

    $("#board").html("");
    for (post of postList) {
        let block = makePostBlock(post, idNum);
        $(block).hide().appendTo("#board")
            .css('opacity', 0)
            .slideDown(2000)
            .animate(
                { opacity: 1 },
                { queue: false, duration: 1300 }
            );
        idNum++;
    }
}

function processPosts(minPrice) {
    let info = combineJson(URL_AC, URL_EX, URL_NH);
    let validPosts = [];

    for (let record of info) {
        let listing = record.data;

        let price = identifyPrice(listing.title);
        if (price >= minPrice && price >= 90) {
            if ((isCheckboxActive() && isHoursLessThan(listing.created_utc, 2)) || !isCheckboxActive()) {
                let post = new Post(listing, price);
                validPosts.push(post)
                validPosts.sort(function (a, b) {
                    return b.timestamp - a.timestamp;
                });
            }
        } else if (price === -1) {
            console.log(`Unable to find price for: \n\t${listing.title}\n\t${"https://www.reddit.com" + listing.permalink}`);
        } else {
            console.log(`Invalid price found for: \n\t${listing.title}\n\t${"https://www.reddit.com" + listing.permalink}`);
        }
    }
    alertPostCount(validPosts.length);
    scrollTo("#post-count");
    populatePostBoard(validPosts);
}

function formatComments(numComments) {
    return numComments + (numComments === 1 ? " comment" : " comments");
}

function Post(listing, price) {
    this.title = listing.title;
    this.price = price;
    this.subreddit = listing.subreddit_name_prefixed;
    this.link = "https://www.reddit.com" + listing.permalink;
    this.user = listing.author;
    this.comments = formatComments(listing.num_comments);
    this.timestamp = listing.created_utc;
    this.timeString = getTimeAgo(this.timestamp);
    this.content = (listing.selftext_html) ? (listing.selftext_html) : "";
    this.imageURL = (listing.url_overridden_by_dest) ? (listing.url_overridden_by_dest) : "";
}

function getSecondsFromTimestamp(ts) {
    let current = new Date();
    let nowTs = Math.floor(current.getTime() / 1000);
    return nowTs - ts;
}

function isHoursLessThan(timestamp, hourLimit) {
    let seconds = getSecondsFromTimestamp(timestamp);
    let hours = seconds / 3600;
    return hours < hourLimit;
}

function getTimeAgo(ts) {
    let seconds = getSecondsFromTimestamp(ts);

    let timeValue;
    // Days ago
    if (seconds >= 24 * 3600) {
        timeValue = Math.floor(seconds / (24 * 3600));
        return timeValue + (timeValue === 1 ? " day" : " days") + " ago";
    }
    // Hours ago
    if (seconds >= 3600) {
        timeValue = Math.floor(seconds / 3600);
        return timeValue + (timeValue === 1 ? " hour" : " hours") + " ago";
    }
    // Minutes ago
    if (seconds >= 60) {
        timeValue = Math.floor(seconds / 60);
        return timeValue + (timeValue === 1 ? " minute" : " minutes") + " ago";
    }
    // Seconds ago
    return seconds + (seconds === 1 ? " second" : " seconds") + " ago";
}