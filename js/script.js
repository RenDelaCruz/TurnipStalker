const URL_AC = "https://www.reddit.com/r/acturnips/new/.json";
const URL_EX = "https://www.reddit.com/r/TurnipExchange/new/.json"
const URL_NH = "https://www.reddit.com/r/ACNHTurnips/new/.json";

// Pressing enter on input box simulates a click
$("#input-price").keypress(function (e) {
    if (e.keyCode == 13)
        $("#price-button").click();
});

// Scroll to top if #top-button clicked
$("#top-button").click(function () {
    scrollTo("#top");
});

// Toggle slide for each post
$(document).on("click", "div[id^='post-']", function () {
    var num = this.id.split('-')[1];
    scrollTo('#post-' + num);

    if ($('#arrow-' + num).text()) {
        $('#arrow-' + num).text(function () {
            return $('#arrow-' + num).text() == "▼" ? "▲" : "▼";
        });
        $('#content-' + num).slideToggle("slow");
    }
});

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

function isPositiveInteger(input) {
    return Number.isInteger(parseFloat(input)) && input >= 0;
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
        let max = Math.max(...possibleNums);
        if (max >= 90) {
            return max;
        }
    }
    return inferSpelledOutPrice(tokens);
}

function inferSpelledOutPrice(tokens) {
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
            if (possibleDigits.length > currentMax.length) {
                currentMax = possibleDigits;
            }
            possibleDigits = [];
            prevPushedIndex = -1;
        }
    }

    if (possibleDigits.length > currentMax.length) {
        currentMax = possibleDigits;
    }

    if ((currentMax.length === 3 || currentMax.length === 2) && currentMax.every(function (e) { return e < 10 })) {
        return parseInt(currentMax.join(""));
    }
    return -1;
}

function convertWrittenToNumber(token) {
    if (isPositiveInteger(token)) {
        return parseInt(token);
    }

    let num = -1;
    if (token == "one") {
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

const SC_OFF = "&lt;!-- SC_OFF --&gt;";
const SC_ON = "&lt;!-- SC_ON --&gt;";

function makePostBlock(post, idNum) {
    let content = post.content;
    let imageIndicator = "";

    if (content.includes("reddit.com/gallery/")) {
        imageIndicator = `<i class="far fa-image"></i>`;
    } else if (content.includes(".redd.it") || content.includes("//imgur.com/")) {
        let index = content.indexOf("https://");

        let imgLink = content.substring(index);
        if (content.includes("//imgur.com/")) {
            let indexImgur = content.indexOf("imgur.com");
            imgLink = "http://i." + content.substring(indexImgur) + ".png";
        }
        //content = content.substring(0, index);
        content = `<br><img src="${imgLink}" alt="${post.content}" width="100%" height="auto" class="center"></img>`;
        imageIndicator = `<i class="far fa-image"></i>`;
    }

    let arrow = "▼";
    if (!content) {
        content = "<small>No Text</small>";
        arrow = "";
    }

    if (!imageIndicator) {
        content = "";
    }

    let htmlContent = post.htmlContent;
    if (htmlContent) {
        let offIndex = htmlContent.indexOf(SC_OFF) + SC_OFF.length;
        let onIndex = htmlContent.indexOf(SC_ON);

        htmlContent = htmlContent.substring(offIndex, onIndex);
        htmlContent = htmlDecode(htmlContent);
    } else {
        htmlContent = "";
    }

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
            <span style="float: right; font-size: 1.1rem;">${imageIndicator}</span></p>
        <div id="content-${idNum}" class="panel wrap-break">
            <hr>
            ${htmlContent}
            ${content}
        </div>
    </div>
    `;
    return block;
}

function isCheckboxActive() {
    return $("#recent-check").is(":checked");
}

function combineJson(...urls) {
    let combinedInfo = [];

    for (let url of urls) {
        let info = getJson(url);
        combinedInfo.push(...info.data.children);
    }
    return combinedInfo;
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

function htmlDecode(input) {
    var e = document.createElement('div');
    e.innerHTML = input;
    return e.childNodes[0].nodeValue;
}

function alertPostCount(count) {
    let postCountAlert = "Posts found: " + count;
    $("#post-count").html(postCountAlert);
    alert(postCountAlert);
}

function scrollTo(id) {
    $("html, body").animate({
        scrollTop: $(id).offset().top
    }, 1000);
}

function processPosts(minPrice) {
    let info = combineJson(URL_AC, URL_EX, URL_NH);
    let validPosts = [];

    for (let record of info) {
        let listing = record.data;

        let price = identifyPrice(listing.title);
        if (price >= minPrice) {
            if ((isCheckboxActive() && isHoursLessThan(listing.created_utc, 3)) || !isCheckboxActive()) {
                let post = new Post(listing, price);
                validPosts.push(post)
                validPosts.sort(function (a, b) {
                    return b.timestamp - a.timestamp;
                });
            }
        } else if (price === -1) {
            console.log(`Unable to find price for: \n\t${listing.title}\n\t${"https://www.reddit.com" + listing.permalink}`);
        }
    }
    alertPostCount(validPosts.length);
    scrollTo("#post-count");
    populatePostBoard(validPosts);
}

function getJson(url) {
    let result;
    $.ajax({
        url: url,
        dataType: "json",
        async: false,
        success: function (data) {
            result = data;
        }
    });
    return result;
}

function formatComments(numComments) {
    return numComments + (numComments === 1 ? " comment" : " comments");
}

function Post(listing, price, timeString) {
    this.title = listing.title;
    this.price = price;
    this.subreddit = listing.subreddit_name_prefixed;
    this.link = "https://www.reddit.com" + listing.permalink;
    this.user = listing.author;
    this.comments = formatComments(listing.num_comments);
    this.content = (listing.selftext) ? (listing.selftext) : (listing.url_overridden_by_dest) ? (listing.url_overridden_by_dest) : "";
    this.timestamp = listing.created_utc;
    this.timeString = getTimeAgo(this.timestamp);
    this.htmlContent = listing.selftext_html;
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

    let timeValue = 0;
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

//Get the button:
mybutton = document.getElementById("top-button");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () { scrollFunction() };

function scrollFunction() {
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        mybutton.style.display = "block";
    } else {
        mybutton.style.display = "none";
    }
}
