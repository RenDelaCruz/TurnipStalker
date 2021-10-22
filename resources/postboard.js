/*
 * File: postboard.js
 * Author: Ren Dela Cruz
 * Date: 2021
 * Handles functions related to updating the post board
 */

const URL_AC = "https://www.reddit.com/r/acturnips/new/.json";
const URL_EX = "https://www.reddit.com/r/TurnipExchange/new/.json";
const URL_NH = "https://www.reddit.com/r/ACNHTurnips/new/.json";

// For decoding JSON body response
const SC_OFF = "<!-- SC_OFF -->";
const SC_ON = "<!-- SC_ON -->";

const imageLinkPrefixes = ['https://preview.redd.it', 'imgur.com/'];

let intervals = [];

// Checks if valid input
function validateInput(refresh = false) {
    let price = $("#input-price").val();
    if (isPositiveInteger(price)) {
        resetTimer();

        if (refresh) {
            //alert("Refreshing search every 60 seconds.")
            startSearch(price, refresh);
            intervals.push(setInterval(function () { startSearch(price, refresh); }, 60000));
        } else {
            startSearch(price, refresh)
        }
    } else {
        alert("This is not a valid price.");
    }
    //$("#input-price").val("");
}

function resetTimer() {
    intervals.forEach((interval) => {
        clearInterval(interval);
    });
    document.getElementById("refresher").innerHTML = "";
}

function startSearch(price, refresh) {
    // Main processing function to output posts
    if (refresh) {
        intervals.push(countDown(60));
    }
    console.clear();
    processPosts(parseInt(price), refresh);
    $("#input-price").blur();
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

    if (possibleNums.length === 1 && validPriceRange(possibleNums[0]) >= 90 && possibleNums[0] <= 660) {
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
    if (token == "zero" || token == "oh" || token == "o") {
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

function generateImageTag(content, linkPrefix, title) {
    let imgIndex1 = content.indexOf(linkPrefix);
    let imgIndex2 = content.substring(imgIndex1).indexOf('"') + imgIndex1;
    let imagePreview = content.substring(imgIndex1, imgIndex2);

    if (linkPrefix === 'imgur.com/') {
        imagePreview = "https://i." + imagePreview + ".png";
    }
    return `<br><img src=${imagePreview} alt="${title}" width="100%" height="auto" class="center">`;
}

function makePostBlock(post, idNum) {
    let content = post.content;
    let imageURL = post.imageURL;
    let imageIndicator = false;

    if (content) {
        content = decodeHtml(content);
        let offIndex = content.indexOf(SC_OFF) + SC_OFF.length;
        let onIndex = content.indexOf(SC_ON);
        content = content.substring(offIndex, onIndex);

        for (let linkPrefix of imageLinkPrefixes) {
            if (content.includes(linkPrefix)) {
                imageIndicator = true;
                content += generateImageTag(content, linkPrefix, post.title);
            }
        }
    } else {
        content = "";
    }

    if (["/r/", "/comments/"].some(e => imageURL.includes(e))) {
        content += `X-post: <a href="https://www.reddit.com${imageURL}" target="_blank">${imageURL}</a>`;
        post.price = identifyPrice(imageURL);
    } else if (!imageURL.includes("/gallery/") && ["i.redd.it", "i.imgur.com"].some(e => imageURL.includes(e))) {
        imageIndicator = true;
        content += `<br><img src="${imageURL}" alt="${post.title}" width="100%" height="auto" class="center">`;
    } else if (imageURL) {
        content += `<a href="${imageURL} target="_blank">${imageURL}</a>`;
    }

    let block = `
    <div class="round-block padding-extra active-hover" id="post-${idNum}">
        <div class="tag-container">
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
            <span id="arrow-${idNum}" style="float: right; font-size: 0.9rem">${(content ? "▼" : "")}</span>
            <span style="float: right; font-size: 1rem;">${(imageIndicator ? `<i class="far fa-image"></i>` : "")}</span></p>
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

function processPosts(minPrice, refresh) {
    let info = combineJson(URL_AC, URL_EX, URL_NH);
    let validPosts = [];

    let validCount = 0;
    let unreadableCount = 0;

    for (let record of info) {
        let listing = record.data;

        let timeLimit = getTimeMenuSelection();
        if (timeLimit == -1 || (isHoursLessThan(listing.created_utc, timeLimit))) {
            let price = identifyPrice(listing.title);
            if (price === -1) {
                price = "???";
                console.log(`Unable to find price for: \n\t${listing.title}\n\t${"https://www.reddit.com" + listing.permalink}`);
            }

            if (price === "???" || (price >= minPrice && price >= 90)) {
                if (price === "???") {
                    unreadableCount++;
                } else {
                    validCount++;
                }

                let post = new Post(listing, price);
                validPosts.push(post)
                validPosts.sort(function (a, b) {
                    return b.timestamp - a.timestamp;
                });
            } else {
                console.log(`Invalid price found for: \n\t${listing.title}\n\t${"https://www.reddit.com" + listing.permalink}`);
            }
        }
    }
    alertPostCount(validCount, unreadableCount, refresh);
    scrollTo("#refresher");
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