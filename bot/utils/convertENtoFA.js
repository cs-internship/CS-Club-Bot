const convertENtoFA = (input) => {
    if (input === null) return "";

    const map = {
        0: "۰",
        1: "۱",
        2: "۲",
        3: "۳",
        4: "۴",
        5: "۵",
        6: "۶",
        7: "۷",
        8: "۸",
        9: "۹",
    };

    return input.toString().replace(/[0-9]/g, (d) => map[d]);
};

module.exports = { convertENtoFA };
