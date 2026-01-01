const { escapeHtml } = require("./escapeHtml");

const redactSecrets = (income) => {
    if (!income) return income;

    return String(income)
        .replace(/(api[_-]?key\s*[:=]\s*)([^\s"'`]+)/gi, "$1[REDACTED]")
        .replace(
            /(authorization\s*[:=]\s*bearer\s+)([^\s"'`]+)/gi,
            "$1[REDACTED]"
        )
        .replace(/(token\s*[:=]\s*)([^\s"'`]+)/gi, "$1[REDACTED]");
};

const safeJson = (obj) => {
    try {
        return JSON.stringify(
            obj,
            (k, v) => {
                if (typeof v === "string") return redactSecrets(v);
                return v;
            },
            2
        );
    } catch {
        return String(obj);
    }
};

const formatErrorForClubs = (err, context = {}) => {
    const name = err?.name || "Error";
    const message = err?.message || String(err || "");
    const stack = err?.stack || "";

    return (
        `❌ <b>خطا رخ داد</b>\n\n` +
        `<b>نوع:</b> ${escapeHtml(name)}\n` +
        `<b>پیام:</b> ${escapeHtml(redactSecrets(message))}\n\n` +
        `<b>Stack:</b>\n<pre>${escapeHtml(
            redactSecrets(stack || "(no stack)")
        )}</pre>\n\n` +
        `<b>Context:</b>\n<pre>${escapeHtml(safeJson(context))}</pre>`
    );
};

module.exports = { formatErrorForClubs };
