jest.mock("../../../bot/constants/systemMessage", () => ({
    systemMessage: "SYS",
}));
const { createOptions } = require("../../../bot/utils/createOptions");

test("createOptions accepts object-like message (stringified) and empty images", () => {
    const obj = { foo: "bar" };
    const opts = createOptions("KEY", obj, []);
    const body = JSON.parse(opts.body);
    // The implementation stores the object as-is in the message content
    expect(body.messages[1].content[0].text).toEqual(obj);
});
