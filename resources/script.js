/*
 * File: script.js
 * Author: Ren Dela Cruz
 * Date: 2021
 * Handles general functionality
 */

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
    //scrollTo('#post-' + num);

    if ($('#arrow-' + num).text()) {
        $('#arrow-' + num).text(function () {
            return $('#arrow-' + num).text() == "▼" ? "▲" : "▼";
        });
        $('#content-' + num).slideToggle("slow");
    }
});

// Toggle fade for #top-button when scrolling down
$(window).scroll(function () {
    if ($("html, body").scrollTop() > 400) {
        $("#top-button").fadeIn(2000);
    } else {
        $("#top-button").fadeOut(1000);
    }
});

function decodeHtml(input) {
    let e = document.createElement('div');
    e.innerHTML = input;
    return e.childNodes[0].nodeValue;
}

function getTimeMenuSelection() {
    return $("#time-menu").val();
}

// Asynchronously retrieve JSON from URL
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

function combineJson(...urls) {
    let combinedInfo = [];

    for (let url of urls) {
        let info = getJson(url);
        combinedInfo.push(...info.data.children);
    }
    return combinedInfo;
}

function alertPostCount(validCount, unreadableCount, refresh) {
    let postCountAlert = `Posts found: ${validCount}<br>Unreadable posts: ${unreadableCount}`;
    $("#post-count").html(postCountAlert);

    // if (!refresh) {
    //     alert(`Posts found: ${validCount}\nUnreadable posts: ${unreadableCount}`);
    // }
}

function countDown(i) {
    let interval = setInterval(function () {
        let refresher = document.getElementById("refresher");
        refresher.innerHTML = `<b>Refreshing in ${i} second${i !== 1 ? "s" : ""} ...</b><br><br>`;
        i-- || clearInterval(interval);  //if i is 0, then stop the interval
    }, 1000);

    return interval
}

function scrollTo(id) {
    $("html, body").animate({
        scrollTop: $(id).offset().top - 20
    }, 1000);
}

function isPositiveInteger(input) {
    return Number.isInteger(parseFloat(input)) && input >= 0;
}
