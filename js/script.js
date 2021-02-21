const URL = "https://www.reddit.com/r/acturnips/new/.json";

$(document).ready(function () {
    $("#input-price").keypress(function (e) {
        if (e.keyCode == 13)
            $("#price-button").click();
    });
});

function validateInput() {
    let price = document.getElementById("input-price").value;
    if (isValidInteger(price)) {
        processPosts(parseInt(price));
        document.getElementById("input-price").blur();
    } else {
        alert("This is not a valid number.");
    }
    document.getElementById("input-price").value = "";
}

function isValidInteger(input) {
    if (!isNaN(input) && Number.isInteger(parseFloat(input)) && input > 0) {
        return true;
    }
    return false;
}

function getTokens(text) {
    let noPunct = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s{2,}/g, " ");
    return noPunct.split(" ");
}

function identifyPrice(title) {
    let tokens = getTokens(title);
    let possibleNums = [];

    for (let token of tokens) {
        if (isValidInteger(token)) {
            possibleNums.push(parseInt(token));
        }
    }

    if (possibleNums.length === 1) {
        return possibleNums[0];
    } else if (possibleNums.length !== 0) {
        return Math.max(...possibleNums);
    }
    return -1;
}

function makePostBlock(title, price, subreddit, link, user, time) {
    let block = `
    <div class="round-block padding-extra">
        <div class="tag-container ">
            <div class="tag yellow">
                <strong>${price} Bells</strong>
            </div>
            <div class="tag blue">
                ${time}
            </div>
            <a class="tag teal button"
                href="${link}"
                target="_blank"><span style="color: #E2FDF5;">Visit Post &#10132;</span>
            </a>
        </div><br>
        <h3 class="margin-none text-align-left">${title}</h3>
        <p class="margin-none text-align-left">${user} in ${subreddit}</p>
    </div>
    `;
    return block;
}

function processPosts(minPrice) {
    let info = getJson(URL);
    let validPostCount = 0;

    $("#post-board").html("");
    for (let listing of info.data.children) {
        let post = listing.data;

        let title = post.title;
        let price = identifyPrice(title);

        if (price > minPrice) {
            validPostCount++;
            let subreddit = post.subreddit_name_prefixed;
            let link = "https://www.reddit.com" + post.permalink;
            let user = post.author;
            let time = getTimeAgo(post.created_utc);

            let block = makePostBlock(title, price, subreddit, link, user, time);
            $("#post-board").append(block);
        }
    }
    let postCountAlert = "Posts found: " + validPostCount;
    document.getElementById("post-count").innerHTML = postCountAlert;
    alert(postCountAlert);
}

function getTimeAgo(ts) {
    let currentDate = new Date();
    let nowTs = Math.floor(currentDate.getTime() / 1000);
    let seconds = nowTs - ts;

    let timeValue = 0;
    // Days ago
    if (seconds > 24 * 3600) {
        timeValue = Math.floor(seconds / (24 * 3600));
        if (timeValue == 1) {
            return "1 day ago";
        }
        return timeValue + " days ago";
    }
    // Hours ago
    if (seconds > 3600) {
        timeValue = Math.floor(seconds / 3600);
        if (timeValue == 1) {
            return "1 hour ago";
        }
        return timeValue + " hours ago";
    }
    // Minutes ago
    if (seconds > 60) {
        timeValue = Math.floor(seconds / 60);
        if (timeValue == 1) {
            return "1 minute ago";
        }
        return timeValue + " minutes ago";
    }
    // Seconds ago
    if (seconds == 1) {
        return "1 second ago";
    }
    return seconds + " seconds ago";
}

function getJson(url) {
    var result;
    $.ajax({
        url: url,
        dataType: 'json',
        async: false,
        success: function (data) {
            result = data;
        }
    });
    return result;
}
